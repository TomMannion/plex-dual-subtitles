"""
Entry point for Plex Dual Subtitle Manager API

This module provides the main entry point for running the API server.
The actual application is configured in app.py.
"""

import logging
import os

from app import app
from utils.network import get_local_ip

# Re-export app for uvicorn
__all__ = ["app"]

logger = logging.getLogger(__name__)


if __name__ == "__main__":
    import uvicorn

    # Configuration from environment with sensible defaults
    host = os.getenv("API_HOST", "0.0.0.0")
    port = int(os.getenv("API_PORT", "8000"))
    reload = os.getenv("API_RELOAD", "false").lower() == "true"

    local_ip = get_local_ip()

    # Log startup information
    logger.info("=" * 60)
    logger.info("Plex Dual Subtitle Manager API")
    logger.info("=" * 60)
    logger.info("API accessible at:")
    logger.info(f"   - http://localhost:{port}")
    logger.info(f"   - http://127.0.0.1:{port}")
    logger.info(f"   - http://{local_ip}:{port}")
    logger.info("API Documentation:")
    logger.info(f"   - http://localhost:{port}/docs")
    logger.info(f"   - http://{local_ip}:{port}/docs")
    logger.info("=" * 60)

    # Run the server
    uvicorn.run("main:app", host=host, port=port, reload=reload)
