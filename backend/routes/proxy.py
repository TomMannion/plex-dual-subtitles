"""
Plex image proxy routes
"""

import logging
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import Response

from dependencies import get_plex_token, get_optional_plex_token
from services.plex_service import plex_service

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/plex-proxy", tags=["proxy"])


@router.get("/{path:path}")
async def proxy_plex_image(
    path: str,
    token: Optional[str] = None,
    auth_token: Optional[str] = Depends(get_optional_plex_token)
):
    """
    Proxy Plex images through backend to handle authentication and server URL resolution.

    This endpoint allows the frontend to display Plex images without exposing
    the Plex token directly in image URLs.

    Args:
        path: The Plex image path (e.g., "library/metadata/12345/thumb/1234567890")
        token: Optional token in query param (fallback)
        auth_token: Token from headers (preferred)
    """
    # Try to get token from query param first, then headers
    effective_token = token or auth_token

    if not effective_token:
        raise HTTPException(status_code=401, detail="Plex authentication required")

    try:
        # Connect to Plex and get the proper server URL
        plex = plex_service.connect(effective_token)

        # Construct the full image URL
        image_url = f"{plex._baseurl}/{path}"

        # Try async HTTP client first, fallback to sync
        try:
            import httpx

            async with httpx.AsyncClient(timeout=10.0) as client:
                response = await client.get(image_url)

                if response.status_code == 200:
                    return Response(
                        content=response.content,
                        media_type=response.headers.get("content-type", "image/jpeg"),
                        headers={"Cache-Control": "max-age=3600"}
                    )
                else:
                    raise HTTPException(
                        status_code=response.status_code,
                        detail="Failed to fetch image from Plex"
                    )

        except ImportError:
            # Fallback to requests if httpx not available
            import requests

            response = requests.get(image_url, timeout=10)

            if response.status_code == 200:
                return Response(
                    content=response.content,
                    media_type=response.headers.get("content-type", "image/jpeg"),
                    headers={"Cache-Control": "max-age=3600"}
                )
            else:
                raise HTTPException(
                    status_code=response.status_code,
                    detail="Failed to fetch image from Plex"
                )

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error proxying Plex image: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to proxy image: {str(e)}")
