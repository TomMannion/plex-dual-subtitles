"""
Health and status check routes
"""

import logging
from typing import Optional
from fastapi import APIRouter, Depends

from dependencies import get_optional_plex_token
from services.plex_service import plex_service

logger = logging.getLogger(__name__)

router = APIRouter(tags=["health"])


@router.get("/")
async def root():
    """
    Root endpoint - provides API information and available endpoints.
    """
    return {
        "name": "Plex Dual Subtitle Manager",
        "status": "running",
        "endpoints": {
            "docs": "/docs",
            "shows": "/api/shows",
            "libraries": "/api/libraries",
            "jobs": "/api/jobs"
        }
    }


@router.get("/api/status")
async def get_status(token: Optional[str] = Depends(get_optional_plex_token)):
    """
    Check Plex connection status.

    Returns connection information and server details if connected.
    Does not require authentication but provides more info if token is present.
    """
    try:
        plex = plex_service.connect(token)
        return {
            "connected": True,
            "server_name": plex.friendlyName,
            "version": plex.version,
            "authenticated": bool(token)
        }
    except Exception as e:
        logger.warning(f"Plex connection check failed: {e}")
        return {
            "connected": False,
            "authenticated": bool(token),
            "error": str(e)
        }
