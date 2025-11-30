"""
TV Show routes
"""

import os
import logging
from pathlib import Path
from typing import Optional, List, Set
from fastapi import APIRouter, Depends, HTTPException

from dependencies import get_plex_token
from services.plex_service import plex_service
from utils.cache import show_counts_cache
from utils.language import extract_languages_from_filename

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/shows", tags=["shows"])


@router.get("/")
async def get_shows(
    token: str = Depends(get_plex_token),
    library: Optional[str] = None,
    limit: Optional[int] = None,
    fast_mode: bool = True,
    offset: int = 0
):
    """
    Get all TV shows from a library.

    Args:
        library: Optional library name to filter by
        limit: Optional limit on number of shows returned
        fast_mode: If True, skip expensive operations like episode/season counts
        offset: Pagination offset
    """
    try:
        shows = plex_service.get_all_shows(library, token)

        # Apply pagination
        total_count = len(shows)
        if offset:
            shows = shows[offset:]
        if limit:
            shows = shows[:limit]

        if fast_mode:
            # Fast mode: Return basic info only, no episode/season counts
            return {
                "count": total_count,
                "offset": offset,
                "shows": [
                    {
                        "id": show.ratingKey,
                        "title": show.title,
                        "year": show.year,
                        "thumb": plex_service.get_full_image_url(show.thumb, token),
                        "episode_count": 0,  # Placeholder, loaded separately
                        "season_count": 0,   # Placeholder, loaded separately
                        "summary": getattr(show, 'summary', '')[:200] if hasattr(show, 'summary') else ''
                    }
                    for show in shows
                ]
            }
        else:
            # Full mode: Include episode and season counts (slower)
            return {
                "count": total_count,
                "offset": offset,
                "shows": [
                    {
                        "id": show.ratingKey,
                        "title": show.title,
                        "year": show.year,
                        "thumb": plex_service.get_full_image_url(show.thumb, token),
                        "episode_count": len(show.episodes()),
                        "season_count": len(show.seasons())
                    }
                    for show in shows
                ]
            }
    except Exception as e:
        logger.error(f"Failed to get shows: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/with-languages")
async def get_shows_with_languages(
    token: str = Depends(get_plex_token),
    languages: Optional[str] = None,
    library: Optional[str] = None,
    limit: Optional[int] = None,
    offset: int = 0
):
    """
    Get TV shows filtered by subtitle languages.

    Args:
        languages: Comma-separated language codes (e.g., "en,zh")
        library: Optional library name
        limit: Optional limit on number of shows
        offset: Pagination offset
    """
    try:
        plex = plex_service.connect(token)
        shows = plex_service.get_all_shows(library, token)

        # Parse requested languages
        requested_languages: List[str] = []
        if languages:
            requested_languages = [lang.strip().lower() for lang in languages.split(',')]

        filtered_shows = []

        for show in shows:
            try:
                # Check if show has subtitle files for requested languages
                if not requested_languages or _has_subtitle_languages(show, requested_languages, plex):
                    show_data = {
                        "id": str(show.ratingKey),
                        "title": show.title,
                        "year": show.year,
                        "summary": show.summary,
                        "thumb": plex_service.get_full_image_url(show.thumb, token),
                        "art": plex_service.get_full_image_url(show.art, token),
                        "episode_count": len(show.episodes()) if not requested_languages else None,
                        "season_count": len(show.seasons()) if not requested_languages else None,
                        "available_languages": _get_show_subtitle_languages(show, plex) if requested_languages else []
                    }
                    filtered_shows.append(show_data)

            except Exception as e:
                logger.warning(f"Error processing show {show.title}: {e}")
                continue

        # Apply pagination
        if offset > 0:
            filtered_shows = filtered_shows[offset:]
        if limit:
            filtered_shows = filtered_shows[:limit]

        return {
            "count": len(filtered_shows),
            "shows": filtered_shows,
            "requested_languages": requested_languages
        }

    except Exception as e:
        logger.error(f"Failed to get shows with languages: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/{show_id}/counts")
async def get_show_counts(show_id: str, token: str = Depends(get_plex_token)):
    """
    Get episode and season counts for a specific show (with caching).
    """
    try:
        # Check cache first (use hash of token prefix for key)
        cache_key = f"counts_{show_id}_{hash(token[:10])}"
        cached = show_counts_cache.get(cache_key)
        if cached:
            return cached

        # Fetch from Plex if not in cache
        show = plex_service.get_show(show_id, token)
        result = {
            "id": show.ratingKey,
            "episode_count": len(show.episodes()),
            "season_count": len(show.seasons())
        }

        # Store in cache
        show_counts_cache.set(cache_key, result)

        return result
    except Exception as e:
        logger.error(f"Failed to get show counts for {show_id}: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/{show_id}")
async def get_show_detail(show_id: str, token: str = Depends(get_plex_token)):
    """
    Get detailed information about a specific show.
    """
    try:
        show = plex_service.get_show(show_id, token)

        # Get all episodes and check subtitle status
        # Note: show.episodes() returns lightweight objects without full stream data
        # We need to reload each episode to get embedded subtitle information
        episodes = show.episodes()
        episodes_with_subs = 0
        total_external_subs = 0
        total_embedded_subs = 0

        episode_list = []
        for episode in episodes:
            # Reload episode to get full stream data including embedded subtitles
            episode.reload()

            file_info = plex_service.get_episode_file_info(episode)
            if file_info:
                if file_info['has_subtitles']:
                    episodes_with_subs += 1
                total_external_subs += len(file_info.get('external_subtitles', []))
                total_embedded_subs += len(file_info.get('embedded_subtitles', []))

            episode_list.append(plex_service.format_episode_info(episode, token))

        return {
            "id": show.ratingKey,
            "title": show.title,
            "year": show.year,
            "summary": show.summary,
            "thumb": plex_service.get_full_image_url(show.thumb, token),
            "art": plex_service.get_full_image_url(show.art, token),
            "episode_count": len(episodes),
            "season_count": len(show.seasons()),
            "episodes_with_subtitles": episodes_with_subs,
            "subtitle_coverage": f"{(episodes_with_subs/len(episodes)*100):.1f}%" if episodes else "0%",
            "total_external_subtitles": total_external_subs,
            "total_embedded_subtitles": total_embedded_subs,
            "seasons": [
                {
                    "id": season.ratingKey,
                    "index": season.index,
                    "title": season.title,
                    "episode_count": len(season.episodes())
                }
                for season in show.seasons()
            ],
            "episodes": episode_list
        }
    except Exception as e:
        logger.error(f"Failed to get show detail for {show_id}: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# Helper functions (private to this module)

def _has_subtitle_languages(show, requested_languages: List[str], plex) -> bool:
    """Check if a show has subtitle files for all requested languages."""
    try:
        available_languages = _get_show_subtitle_languages(show, plex)
        available_codes = [lang.lower() for lang in available_languages]
        return all(lang in available_codes for lang in requested_languages)
    except Exception:
        return False


def _get_show_subtitle_languages(show, plex) -> List[str]:
    """Extract subtitle languages from a show's episodes."""
    languages: Set[str] = set()

    try:
        # Get first few episodes to sample subtitle languages (for performance)
        episodes = show.episodes()[:3]

        for episode in episodes:
            if not hasattr(episode, 'media') or not episode.media:
                continue

            for media in episode.media:
                for part in media.parts:
                    if hasattr(part, 'file') and part.file:
                        episode_dir = os.path.dirname(part.file)

                        try:
                            if os.path.exists(episode_dir):
                                subtitle_extensions = ('.srt', '.ass', '.vtt', '.sub', '.ssa')
                                subtitle_files = [
                                    f for f in os.listdir(episode_dir)
                                    if f.lower().endswith(subtitle_extensions)
                                ]

                                for filename in subtitle_files:
                                    detected_langs = extract_languages_from_filename(filename)
                                    languages.update(detected_langs)

                        except (OSError, PermissionError) as e:
                            logger.debug(f"Cannot access directory {episode_dir}: {e}")
                            continue

    except Exception as e:
        logger.warning(f"Error getting subtitle languages for {show.title}: {e}")

    return list(languages)
