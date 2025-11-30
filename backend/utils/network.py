"""
Network utilities for IP detection and CORS validation
"""

import socket
import logging
from typing import List

logger = logging.getLogger(__name__)


def get_local_ip() -> str:
    """
    Get the local IP address of the machine.

    Uses a UDP socket connection to determine the outbound IP address.
    This doesn't actually send any data, just determines the route.

    Returns:
        str: Local IP address or "127.0.0.1" if detection fails
    """
    try:
        # Create a socket connection to determine local IP
        # This doesn't actually connect but helps determine the route
        with socket.socket(socket.AF_INET, socket.SOCK_DGRAM) as s:
            s.connect(("8.8.8.8", 80))
            local_ip = s.getsockname()[0]
            return local_ip
    except Exception as e:
        logger.warning(f"Failed to detect local IP: {e}")
        return "127.0.0.1"


def is_local_origin(origin: str) -> bool:
    """
    Check if an origin is from the local network.

    Validates against:
    - localhost / 127.0.0.1
    - RFC 1918 private ranges (192.168.x.x, 10.x.x.x, 172.16.x.x)
    - .local domain suffix

    Args:
        origin: The origin URL to check (e.g., "http://192.168.1.100:5173")

    Returns:
        bool: True if origin is from local network
    """
    if not origin:
        return False

    # Handle special case for file:// origins in development
    if origin == "null":
        logger.debug("Allowing 'null' origin (file:// or redirect)")
        return True

    try:
        # Extract host from origin URL
        if "://" in origin:
            host_part = origin.split("://")[1].split(":")[0].split("/")[0]

            # Check against allowed patterns
            is_local = (
                host_part in ["localhost", "127.0.0.1"] or
                host_part.startswith("192.168.") or
                host_part.startswith("10.") or
                _is_172_private(host_part) or
                host_part.endswith(".local")
            )

            return is_local

    except Exception as e:
        logger.warning(f"Failed to parse origin '{origin}': {e}")

    return False


def _is_172_private(host: str) -> bool:
    """
    Check if host is in the 172.16.0.0 - 172.31.255.255 private range.
    """
    if not host.startswith("172."):
        return False

    try:
        parts = host.split(".")
        if len(parts) >= 2:
            second_octet = int(parts[1])
            return 16 <= second_octet <= 31
    except (ValueError, IndexError):
        pass

    return False


def get_cors_origins(local_ip: str) -> List[str]:
    """
    Generate list of allowed CORS origins based on local IP.

    Args:
        local_ip: The detected local IP address

    Returns:
        List of allowed origin URLs
    """
    ports = [3000, 5173, 8080]
    hosts = ["localhost", "127.0.0.1", local_ip]

    origins = []
    for host in hosts:
        for port in ports:
            origins.append(f"http://{host}:{port}")

    return origins


def get_cors_regex() -> str:
    """
    Get regex pattern for CORS origin validation.

    Matches:
    - localhost
    - 127.0.0.1
    - 192.168.x.x
    - 10.x.x.x
    - 172.16-31.x.x
    - *.local

    Returns:
        Regex pattern string for FastAPI CORSMiddleware
    """
    return (
        r"^https?://"
        r"(localhost|127\.0\.0\.1|"
        r"192\.168\.\d+\.\d+|"
        r"10\.\d+\.\d+\.\d+|"
        r"172\.(1[6-9]|2[0-9]|3[01])\.\d+\.\d+|"
        r"[^.]+\.local)"
        r"(:\d+)?$"
    )
