"""
API Routes for PlexDualSub backend

This module provides a function to register all API routers with the FastAPI app.
"""

from fastapi import FastAPI

from .health import router as health_router
from .libraries import router as libraries_router
from .shows import router as shows_router
from .movies import router as movies_router
from .episodes import router as episodes_router
from .subtitles import router as subtitles_router
from .proxy import router as proxy_router
from .jobs import router as jobs_router


def register_routes(app: FastAPI) -> None:
    """
    Register all API routers with the FastAPI application.

    Args:
        app: The FastAPI application instance
    """
    # Health/status routes (no prefix for root)
    app.include_router(health_router)

    # API routes
    app.include_router(libraries_router)
    app.include_router(shows_router)
    app.include_router(movies_router)
    app.include_router(episodes_router)
    app.include_router(subtitles_router)
    app.include_router(proxy_router)
    app.include_router(jobs_router)


__all__ = [
    "register_routes",
    "health_router",
    "libraries_router",
    "shows_router",
    "movies_router",
    "episodes_router",
    "subtitles_router",
    "proxy_router",
    "jobs_router",
]
