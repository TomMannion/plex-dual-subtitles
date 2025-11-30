"""
Library management routes
"""

import logging
from fastapi import APIRouter, Depends, HTTPException, Query

from dependencies import get_plex_token
from services.plex_service import plex_service

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/libraries", tags=["libraries"])


@router.get("/")
async def get_libraries(token: str = Depends(get_plex_token)):
    """
    Get all TV show and movie libraries from Plex server.

    Returns list of libraries with their key, title, uuid, type, and item count.
    """
    try:
        libraries = plex_service.get_all_libraries(token)
        return {"libraries": libraries}
    except Exception as e:
        logger.error(f"Failed to get libraries: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/recently-added")
async def get_recently_added(
    limit: int = Query(default=12, ge=1, le=50),
    token: str = Depends(get_plex_token)
):
    """
    Get recently added items across all libraries.

    Returns a mixed list of recently added episodes and movies,
    sorted by date added (newest first).
    """
    try:
        items = plex_service.get_recently_added(limit=limit, token=token)
        return {"items": items, "count": len(items)}
    except Exception as e:
        logger.error(f"Failed to get recently added: {e}")
        raise HTTPException(status_code=500, detail=str(e))
