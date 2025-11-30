"""
Episode routes
"""

import logging
from fastapi import APIRouter, Depends, HTTPException

from dependencies import get_plex_token
from services.plex_service import plex_service

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/episodes", tags=["episodes"])


@router.get("/{episode_id}")
async def get_episode_detail(episode_id: str, token: str = Depends(get_plex_token)):
    """
    Get detailed information about a specific episode.
    """
    try:
        plex = plex_service.connect(token)
        episode = plex.fetchItem(int(episode_id))
        return plex_service.format_episode_info(episode, token)
    except Exception as e:
        logger.error(f"Failed to get episode {episode_id}: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/{episode_id}/subtitles")
async def get_episode_subtitles(episode_id: str, token: str = Depends(get_plex_token)):
    """
    Get all subtitles (embedded and external) for an episode.
    """
    try:
        plex = plex_service.connect(token)
        episode = plex.fetchItem(int(episode_id))

        file_info = plex_service.get_episode_file_info(episode)

        if not file_info:
            return {
                "episode": f"S{episode.parentIndex:02d}E{episode.index:02d}: {episode.title}",
                "has_file": False,
                "subtitles": []
            }

        return {
            "episode": f"S{episode.parentIndex:02d}E{episode.index:02d}: {episode.title}",
            "file_path": file_info['file_path'],
            "has_subtitles": file_info['has_subtitles'],
            "embedded_subtitles": file_info['embedded_subtitles'],
            "external_subtitles": file_info['external_subtitles'],
            "naming_pattern": plex_service.get_episode_naming_pattern(episode)
        }
    except Exception as e:
        logger.error(f"Failed to get subtitles for episode {episode_id}: {e}")
        raise HTTPException(status_code=500, detail=str(e))


