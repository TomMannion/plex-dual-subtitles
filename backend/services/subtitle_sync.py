"""
Subtitle synchronization utilities

Handles syncing subtitles to video or to each other using ffsubsync.
"""

import logging
import subprocess
import tempfile
from dataclasses import dataclass, field
from pathlib import Path
from typing import Dict, List, Optional, Tuple

import pysubs2

from .sync_plugins import sync_subtitles, SyncResult

logger = logging.getLogger(__name__)


@dataclass
class SyncReport:
    """Report of sync operation results"""
    attempted: bool = False
    successful: bool = False
    primary_synced: bool = False
    secondary_synced: bool = False
    method: Optional[str] = None
    error: Optional[str] = None


def sync_subtitles_hybrid(
    video_path: str,
    subtitle1_path: str,
    subtitle2_path: str,
    output1_path: str,
    output2_path: str,
    **kwargs
) -> Dict:
    """
    Hybrid sync: Primary subtitle to video, then secondary subtitle to synced primary.
    This is much faster as subtitle-to-subtitle sync takes < 1 second.

    Args:
        video_path: Path to video file
        subtitle1_path: Path to primary subtitle
        subtitle2_path: Path to secondary subtitle
        output1_path: Output path for synced primary
        output2_path: Output path for synced secondary

    Returns:
        Dict with success status and results for both subtitles
    """
    bulk_kwargs = {**kwargs, 'bulk_mode': True}

    try:
        logger.info("Step 1: Syncing primary subtitle to video...")

        # First sync PRIMARY subtitle to video
        result1 = sync_subtitles(
            reference_path=video_path,
            target_path=subtitle1_path,
            output_path=output1_path,
            video_path=video_path,
            **bulk_kwargs
        )

        if not result1.success:
            logger.warning(f"Primary sync failed: {result1.error}, trying fallback")
            result1_fallback = sync_with_ffsubsync(video_path, subtitle1_path, output1_path)
            result2_fallback = sync_with_ffsubsync(video_path, subtitle2_path, output2_path)
            return {
                'success': result1_fallback['success'] and result2_fallback['success'],
                'primary_result': result1_fallback,
                'secondary_result': result2_fallback,
                'method': 'ffsubsync-fallback-primary-failed'
            }

        logger.info("Primary subtitle synced successfully!")
        logger.info("Step 2: Syncing secondary subtitle to synced primary (fast)...")

        # Now sync SECONDARY subtitle to the already-synced PRIMARY
        result2 = sync_subtitles(
            reference_path=output1_path,  # Use synced primary as reference
            target_path=subtitle2_path,
            output_path=output2_path,
            **bulk_kwargs
        )

        if result2.success:
            logger.info("Secondary subtitle synced successfully (subtitle-to-subtitle)!")
            _fine_tune_alignment(output1_path, output2_path)
        else:
            logger.warning("Secondary subtitle-to-subtitle sync failed, trying video sync")
            result2 = sync_subtitles(
                reference_path=video_path,
                target_path=subtitle2_path,
                output_path=output2_path,
                **bulk_kwargs
            )

        return {
            'success': result1.success and result2.success,
            'primary_result': {
                'success': result1.success,
                'method': result1.method.value if result1.method else 'unknown',
                'error': result1.error
            },
            'secondary_result': {
                'success': result2.success,
                'method': result2.method.value if result2.method else 'unknown',
                'error': result2.error
            },
            'method': 'hybrid-primary-to-video-secondary-to-primary'
        }

    except Exception as e:
        logger.error(f"Hybrid sync failed: {e}")
        # Fallback to original method
        result1 = sync_with_ffsubsync(video_path, subtitle1_path, output1_path)
        result2 = sync_with_ffsubsync(video_path, subtitle2_path, output2_path)
        return {
            'success': result1['success'] and result2['success'],
            'primary_result': result1,
            'secondary_result': result2,
            'method': 'ffsubsync-fallback-error'
        }


def sync_with_ffsubsync(
    reference_path: str,
    target_path: str,
    output_path: str
) -> Dict:
    """
    Synchronize target subtitle file to reference using ffsubsync.

    Args:
        reference_path: Path to reference file (video or subtitle)
        target_path: Path to subtitle to sync
        output_path: Output path for synced subtitle

    Returns:
        Dict with success status and details
    """
    try:
        logger.info(f"Synchronizing {Path(target_path).name} to {Path(reference_path).name}...")

        # Check if ffsubsync is available
        try:
            result = subprocess.run(
                ['ffsubsync', '--version'],
                capture_output=True,
                text=True,
                timeout=10
            )
            if result.returncode != 0:
                return {
                    'success': False,
                    'error': 'ffsubsync not found. Please install with: pip install ffsubsync',
                    'fallback_available': True
                }
        except (subprocess.TimeoutExpired, FileNotFoundError):
            return {
                'success': False,
                'error': 'ffsubsync not available or not responding',
                'fallback_available': True
            }

        # Run ffsubsync
        cmd = [
            'ffsubsync',
            str(reference_path),
            '-i', str(target_path),
            '-o', str(output_path),
            '--max-offset-seconds', '60',
            '--no-fix-framerate'
        ]

        result = subprocess.run(cmd, capture_output=True, text=True, timeout=120)

        if result.returncode == 0:
            if Path(output_path).exists() and Path(output_path).stat().st_size > 0:
                logger.info(f"Successfully synchronized {Path(target_path).name}!")
                return {
                    'success': True,
                    'synchronized': True,
                    'output_path': output_path,
                    'method': 'ffsubsync'
                }
            else:
                return {
                    'success': False,
                    'error': 'ffsubsync completed but no output file created',
                    'fallback_available': True
                }
        else:
            error_msg = result.stderr.strip() if result.stderr else 'Unknown ffsubsync error'
            logger.warning(f"ffsubsync failed: {error_msg}")
            return {
                'success': False,
                'error': f'ffsubsync failed: {error_msg}',
                'fallback_available': True
            }

    except subprocess.TimeoutExpired:
        return {
            'success': False,
            'error': 'ffsubsync timed out (>120s)',
            'fallback_available': True
        }
    except Exception as e:
        return {
            'success': False,
            'error': f'Synchronization error: {str(e)}',
            'fallback_available': True
        }


def prepare_synced_subtitles(
    primary_path: str,
    secondary_path: str,
    video_path: Optional[str],
    enable_sync: bool
) -> Tuple[str, str, SyncReport]:
    """
    Prepare synced subtitle files for dual subtitle creation.

    Args:
        primary_path: Path to primary subtitle
        secondary_path: Path to secondary subtitle
        video_path: Optional video path for sync reference
        enable_sync: Whether to attempt synchronization

    Returns:
        Tuple of (actual_primary_path, actual_secondary_path, sync_report)
    """
    sync_report = SyncReport()
    actual_primary_path = primary_path
    actual_secondary_path = secondary_path

    if not enable_sync:
        return actual_primary_path, actual_secondary_path, sync_report

    if video_path and Path(video_path).exists():
        # Sync to video
        actual_primary_path, actual_secondary_path, sync_report = _sync_to_video(
            primary_path, secondary_path, video_path
        )
    elif enable_sync:
        # Fallback: sync secondary to primary
        actual_secondary_path, sync_report = _sync_subtitle_to_subtitle(
            primary_path, secondary_path
        )

    return actual_primary_path, actual_secondary_path, sync_report


def _sync_to_video(
    primary_path: str,
    secondary_path: str,
    video_path: str
) -> Tuple[str, str, SyncReport]:
    """Sync both subtitles to video using hybrid approach."""
    sync_report = SyncReport(attempted=True)
    actual_primary_path = primary_path
    actual_secondary_path = secondary_path

    try:
        # Create temp files
        with tempfile.NamedTemporaryFile(suffix='.srt', delete=False) as tmp1:
            temp_primary = tmp1.name
        with tempfile.NamedTemporaryFile(suffix='.srt', delete=False) as tmp2:
            temp_secondary = tmp2.name

        result = sync_subtitles_hybrid(
            video_path, primary_path, secondary_path,
            temp_primary, temp_secondary
        )

        if result['success']:
            if result['primary_result']['success']:
                actual_primary_path = temp_primary
                sync_report.primary_synced = True
            else:
                _safe_delete(temp_primary)

            if result['secondary_result']['success']:
                actual_secondary_path = temp_secondary
                sync_report.secondary_synced = True
            else:
                _safe_delete(temp_secondary)
        else:
            _safe_delete(temp_primary)
            _safe_delete(temp_secondary)

        sync_report.successful = sync_report.primary_synced or sync_report.secondary_synced
        sync_report.method = result.get('method')

    except Exception as e:
        sync_report.error = str(e)
        logger.error(f"Video synchronization failed: {e}")

    return actual_primary_path, actual_secondary_path, sync_report


def _sync_subtitle_to_subtitle(
    reference_path: str,
    target_path: str
) -> Tuple[str, SyncReport]:
    """Sync one subtitle to another (fallback when no video)."""
    sync_report = SyncReport(attempted=True)
    actual_path = target_path

    try:
        with tempfile.NamedTemporaryFile(suffix='.srt', delete=False) as tmp:
            temp_path = tmp.name

        result = sync_with_ffsubsync(reference_path, target_path, temp_path)

        if result['success']:
            actual_path = temp_path
            sync_report.secondary_synced = True
            sync_report.successful = True
            sync_report.method = 'ffsubsync-subtitle-to-subtitle'
            logger.info("Secondary subtitle synced to primary (fallback method)")
        else:
            sync_report.error = result.get('error')
            _safe_delete(temp_path)

    except Exception as e:
        sync_report.error = str(e)
        logger.error(f"Subtitle-to-subtitle sync failed: {e}")

    return actual_path, sync_report


def _fine_tune_alignment(primary_path: str, secondary_path: str) -> None:
    """Fine-tune alignment between synced subtitles."""
    try:
        primary_subs = pysubs2.load(primary_path)
        secondary_subs = pysubs2.load(secondary_path)

        if not primary_subs or not secondary_subs:
            return

        if len(primary_subs) == 0 or len(secondary_subs) == 0:
            return

        timing_diff = primary_subs[0].start - secondary_subs[0].start

        if abs(timing_diff) > 50:  # Only adjust if > 50ms difference
            logger.debug(f"Fine-tuning secondary timing by {timing_diff}ms")
            for line in secondary_subs:
                line.start = max(0, line.start + timing_diff)
                line.end = max(0, line.end + timing_diff)
            secondary_subs.save(secondary_path)

    except Exception as e:
        logger.debug(f"Fine-tuning failed (non-critical): {e}")


def _safe_delete(path: str) -> None:
    """Safely delete a file, logging any errors."""
    try:
        Path(path).unlink()
    except Exception as e:
        logger.debug(f"Failed to delete temp file {path}: {e}")


def cleanup_temp_files(paths: List[str], original_paths: List[str]) -> None:
    """Clean up temporary sync files that differ from originals."""
    for path, original in zip(paths, original_paths):
        if path != original:
            _safe_delete(path)
