"""
FastAPI application factory for Plex Dual Subtitle Manager
"""

import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from utils.network import get_local_ip, get_cors_regex
from routes import register_routes

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    Application lifespan manager.

    Handles startup and shutdown events.
    """
    # Startup
    local_ip = get_local_ip()
    logger.info("Plex Dual Subtitle Manager starting up")
    logger.info(f"Server IP: {local_ip}")
    logger.info(f"API accessible at: http://{local_ip}:8000")
    logger.info(f"Frontend accessible at: http://{local_ip}:5173")
    logger.info("Plex authentication is handled per-request via frontend tokens")

    yield

    # Shutdown
    logger.info("Plex Dual Subtitle Manager shutting down")


def create_app() -> FastAPI:
    """
    Create and configure the FastAPI application.

    Returns:
        Configured FastAPI application instance
    """
    app = FastAPI(
        title="Plex Dual Subtitle Manager",
        description="Manage subtitles for your Plex TV shows",
        version="1.0.0",
        lifespan=lifespan
    )

    # Configure CORS
    _configure_cors(app)

    # Register all routes
    register_routes(app)

    return app


def _configure_cors(app: FastAPI) -> None:
    """
    Configure CORS middleware for local network access.

    Allows connections from:
    - localhost / 127.0.0.1
    - RFC 1918 private IP ranges
    - .local domain suffix
    """
    local_ip = get_local_ip()
    cors_regex = get_cors_regex()

    logger.info(f"CORS configured for local network (detected IP: {local_ip})")

    app.add_middleware(
        CORSMiddleware,
        allow_origin_regex=cors_regex,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )


# Create the app instance for uvicorn
app = create_app()
