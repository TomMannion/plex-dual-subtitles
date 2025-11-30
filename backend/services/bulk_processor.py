"""
Bulk subtitle processing for background jobs

Handles processing multiple episodes for dual subtitle creation.
"""

import logging
import time
import tempfile
from pathlib import Path
from typing import Callable, Dict, List, Optional, Tuple

from .subtitle_config import DualSubtitleConfig

logger = logging.getLogger(__name__)


def process_bulk_dual_subtitles(
    job_id: str,
    progress_callback: Callable[[Dict], None],
    show_id: str,
    show_title: str,
    primary_language: str,
    secondary_language: str,
    styling_config: Dict,
    **kwargs
) -> Dict:
    """
    Background job function for bulk dual subtitle processing.

    Args:
        job_id: Unique job identifier
        progress_callback: Function to report progress updates
        show_id: Plex show ID
        show_title: Show title for display
        primary_language: Primary subtitle language code
        secondary_language: Secondary subtitle language code
        styling_config: Styling configuration dict
        **kwargs: Additional options including plex_token

    Returns:
        Dict with results (successful, failed, skipped lists)
    """
    # Import here to avoid circular imports
    from .plex_service import plex_service
    from .subtitle_service import subtitle_service
    from .job_queue import job_queue

    # Initialize progress
    progress_callback({
        'current_step': 'Initializing',
        'current_item': 'Loading show data',
        'processed': 0,
        'total': 0,
        'details': {'show_title': show_title}
    })

    # Get Plex token
    token = kwargs.get('token') or kwargs.get('plex_token')
    logger.debug(f"Job {job_id} processing with token present: {bool(token)}")

    if not token:
        raise ValueError("No Plex authentication token provided")

    try:
        # Get show episodes
        show = plex_service.get_show(show_id, token)
        episodes = show.episodes()

        progress_callback({
            'current_step': 'Analyzing episodes',
            'current_item': f'Found {len(episodes)} episodes',
            'processed': 0,
            'total': len(episodes)
        })

        # Find episodes with both required languages
        valid_episodes = _find_valid_episodes(
            episodes, plex_service, primary_language, secondary_language
        )

        total_episodes = len(valid_episodes)
        progress_callback({
            'current_step': 'Processing episodes',
            'current_item': f'{total_episodes} episodes eligible for processing',
            'processed': 0,
            'total': total_episodes
        })

        results = {
            'successful': [],
            'failed': [],
            'skipped': []
        }

        episode_times: List[float] = []

        for i, (episode, cached_file_info) in enumerate(valid_episodes):
            # Check for cancellation
            if job_queue.is_job_cancelled(job_id):
                logger.info(f"Job {job_id} was cancelled")
                job_queue.mark_job_cancelled(job_id)
                raise Exception("Job was cancelled by user")

            episode_start = time.time()

            # Update progress with time estimate
            time_estimate = _calculate_time_estimate(episode_times, total_episodes - i)
            progress_callback({
                'current_step': 'Creating dual subtitles',
                'current_item': f"S{episode.parentIndex:02d}E{episode.index:02d}: {episode.title}",
                'processed': i,
                'total': total_episodes,
                'estimated_time_remaining': time_estimate,
                'details': {
                    'current_episode': f"S{episode.parentIndex:02d}E{episode.index:02d}"
                }
            })

            # Process episode (pass cached file_info to avoid redundant reload)
            result = _process_single_episode(
                episode, plex_service, subtitle_service,
                primary_language, secondary_language, styling_config,
                cached_file_info=cached_file_info
            )

            if result['status'] == 'success':
                results['successful'].append(result['data'])
            elif result['status'] == 'failed':
                results['failed'].append(result['data'])
            else:
                results['skipped'].append(result['data'])

            # Track timing
            episode_times.append(time.time() - episode_start)
            if len(episode_times) > 10:
                episode_times = episode_times[-10:]

        # Final progress
        progress_callback({
            'current_step': 'Completed',
            'current_item': f'Processed {total_episodes} episodes',
            'processed': total_episodes,
            'total': total_episodes,
            'estimated_time_remaining': '0s',
            'details': {
                'successful': len(results['successful']),
                'failed': len(results['failed']),
                'skipped': len(results['skipped'])
            }
        })

        return results

    except Exception as e:
        progress_callback({
            'current_step': 'Failed',
            'current_item': str(e),
            'processed': 0,
            'total': 0
        })
        raise


def _find_valid_episodes(
    episodes: List,
    plex_service,
    primary_language: str,
    secondary_language: str
) -> List[Tuple]:
    """
    Find episodes that have both required subtitle languages (external or embedded).

    Returns:
        List of tuples: (episode, file_info) to avoid redundant reload() calls later
    """
    valid = []

    for episode in episodes:
        try:
            # Reload episode to get full stream data including embedded subtitles
            episode.reload()
            file_info = plex_service.get_episode_file_info(episode)
            if not file_info:
                continue

            # Collect available languages from both external AND embedded subtitles
            available_langs = set()

            # Check external subtitles
            for sub in file_info.get('external_subtitles', []):
                lang = sub.get('language_code')
                if lang:
                    available_langs.add(lang)

            # Check embedded subtitles (note: uses 'languageCode' camelCase)
            for sub in file_info.get('embedded_subtitles', []):
                lang = sub.get('languageCode')
                if lang:
                    available_langs.add(lang)

            if primary_language in available_langs and secondary_language in available_langs:
                # Return tuple with cached file_info to avoid reload in processing
                valid.append((episode, file_info))

        except Exception as e:
            logger.warning(f"Error checking episode {episode.title}: {e}")

    return valid


def _get_subtitle_source(
    file_info: Dict,
    language: str,
    subtitle_service,
    video_path: str
) -> Tuple[Optional[str], Optional[str]]:
    """
    Get subtitle file path for a language, extracting embedded if necessary.

    Returns:
        Tuple of (file_path, temp_file_path or None if not temp)
    """
    # First, check external subtitles
    for sub in file_info.get('external_subtitles', []):
        if sub.get('language_code') == language:
            return (sub['file_path'], None)

    # If not found, check embedded subtitles and extract (note: uses 'languageCode' camelCase)
    for sub in file_info.get('embedded_subtitles', []):
        if sub.get('languageCode') == language:
            stream_index = sub.get('stream_index')
            codec = sub.get('codec', 'srt')

            # Determine output extension based on codec
            if codec.lower() in ['ass', 'ssa']:
                ext = '.ass'
            else:
                ext = '.srt'

            # Create temp file for extraction
            temp_file = tempfile.NamedTemporaryFile(
                suffix=ext,
                prefix=f'bulk_sub_{language}_',
                delete=False
            )
            temp_path = temp_file.name
            temp_file.close()

            # Extract the subtitle
            result = subtitle_service.extract_embedded_subtitle(
                video_path,
                stream_index,
                temp_path,
                codec
            )

            if result.get('success'):
                return (temp_path, temp_path)  # Return path twice - it's temp
            else:
                logger.warning(f"Failed to extract embedded subtitle: {result.get('error')}")
                # Clean up failed temp file
                try:
                    Path(temp_path).unlink()
                except Exception as e:
                    logger.debug(f"Failed to clean up temp file {temp_path}: {e}")

    return (None, None)


def _process_single_episode(
    episode,
    plex_service,
    subtitle_service,
    primary_language: str,
    secondary_language: str,
    styling_config: Dict,
    cached_file_info: Optional[Dict] = None
) -> Dict:
    """Process a single episode for dual subtitle creation."""
    temp_files = []  # Track temp files for cleanup

    try:
        # Use cached file_info if provided, otherwise reload (fallback for direct calls)
        if cached_file_info:
            file_info = cached_file_info
        else:
            episode.reload()
            file_info = plex_service.get_episode_file_info(episode)
        video_path = file_info['file_path']

        # Get primary subtitle (external or extracted embedded)
        primary_path, primary_temp = _get_subtitle_source(
            file_info, primary_language, subtitle_service, video_path
        )
        if primary_temp:
            temp_files.append(primary_temp)

        # Get secondary subtitle (external or extracted embedded)
        secondary_path, secondary_temp = _get_subtitle_source(
            file_info, secondary_language, subtitle_service, video_path
        )
        if secondary_temp:
            temp_files.append(secondary_temp)

        if not primary_path or not secondary_path:
            # Clean up any temp files
            for tf in temp_files:
                try:
                    Path(tf).unlink()
                except Exception as e:
                    logger.debug(f"Failed to clean up temp file {tf}: {e}")
            return {
                'status': 'skipped',
                'data': {
                    'episode_id': episode.ratingKey,
                    'episode_title': episode.title,
                    'reason': 'Missing required subtitle files'
                }
            }

        # Create config
        config = DualSubtitleConfig(
            primary_language=primary_language,
            secondary_language=secondary_language,
            enable_language_prefix=styling_config.get('enable_language_prefix', True),
            enable_sync=styling_config.get('enable_sync', False),
        )

        # Determine output path - always use SRT format with language codes
        base_name = plex_service.get_episode_naming_pattern(episode)
        output_filename = f"{base_name}.dual.{primary_language}-{secondary_language}.srt"
        output_path = Path(file_info['file_dir']) / output_filename

        # Create dual subtitle
        result = subtitle_service.create_dual_subtitle(
            primary_path,
            secondary_path,
            str(output_path),
            config,
            video_path=video_path,
            declared_primary_lang=primary_language,
            declared_secondary_lang=secondary_language,
        )

        # Clean up temp files
        for tf in temp_files:
            try:
                Path(tf).unlink()
            except Exception as e:
                logger.debug(f"Failed to clean up temp file {tf}: {e}")

        if result['success']:
            return {
                'status': 'success',
                'data': {
                    'episode_id': episode.ratingKey,
                    'episode_title': episode.title,
                    'output_file': output_filename,
                    'output_path': str(output_path),
                    'used_embedded': bool(temp_files)  # Track if we used embedded subs
                }
            }
        else:
            return {
                'status': 'failed',
                'data': {
                    'episode_id': episode.ratingKey,
                    'episode_title': episode.title,
                    'error': result.get('error', 'Unknown error')
                }
            }

    except Exception as e:
        # Clean up temp files on error
        for tf in temp_files:
            try:
                Path(tf).unlink()
            except Exception as cleanup_err:
                logger.debug(f"Failed to clean up temp file {tf}: {cleanup_err}")
        return {
            'status': 'failed',
            'data': {
                'episode_id': episode.ratingKey,
                'episode_title': episode.title,
                'error': str(e)
            }
        }


def _calculate_time_estimate(episode_times: List[float], remaining: int) -> str:
    """Calculate estimated time remaining."""
    if not episode_times:
        return "Calculating..."

    avg_time = sum(episode_times) / len(episode_times)
    estimated_seconds = remaining * avg_time

    if estimated_seconds > 60:
        return f"{int(estimated_seconds // 60)}m {int(estimated_seconds % 60)}s"
    return f"{int(estimated_seconds)}s"
