"""
FastAPI dependency injection for authentication and common dependencies
"""

from typing import Optional
from fastapi import Request, HTTPException


def get_plex_token(request: Request) -> str:
    """
    Extract and validate Plex token from request headers.
    Raises 401 if token is missing.

    Usage:
        @app.get("/api/protected")
        async def protected_route(token: str = Depends(get_plex_token)):
            ...
    """
    token = request.headers.get("x-plex-token")
    if not token:
        raise HTTPException(
            status_code=401,
            detail="Plex authentication required. Please provide x-plex-token header."
        )
    return token


def get_optional_plex_token(request: Request) -> Optional[str]:
    """
    Extract Plex token from request headers without requiring it.
    Returns None if token is missing.

    Usage:
        @app.get("/api/status")
        async def status(token: Optional[str] = Depends(get_optional_plex_token)):
            ...
    """
    return request.headers.get("x-plex-token")
