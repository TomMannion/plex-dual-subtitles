"""
TTL Cache implementation with bounded size
"""

import time
import logging
from typing import Any, Dict, Optional, TypeVar, Generic
from collections import OrderedDict
from threading import Lock

logger = logging.getLogger(__name__)

T = TypeVar('T')


class TTLCache(Generic[T]):
    """
    Thread-safe TTL (Time To Live) cache with bounded size.

    Features:
    - Automatic expiration of entries after TTL
    - Maximum size limit with LRU eviction
    - Thread-safe operations

    Usage:
        cache = TTLCache[dict](ttl_seconds=300, max_size=1000)
        cache.set("key", {"data": "value"})
        value = cache.get("key")  # Returns None if expired
    """

    def __init__(
        self,
        ttl_seconds: int = 300,
        max_size: int = 1000,
        name: str = "cache"
    ):
        """
        Initialize the TTL cache.

        Args:
            ttl_seconds: Time to live for cache entries in seconds
            max_size: Maximum number of entries before LRU eviction
            name: Name for logging purposes
        """
        self._ttl = ttl_seconds
        self._max_size = max_size
        self._name = name
        self._cache: OrderedDict[str, Dict[str, Any]] = OrderedDict()
        self._lock = Lock()

    def get(self, key: str) -> Optional[T]:
        """
        Get a value from the cache.

        Args:
            key: Cache key

        Returns:
            Cached value if exists and not expired, None otherwise
        """
        with self._lock:
            if key not in self._cache:
                return None

            entry = self._cache[key]
            if time.time() - entry['timestamp'] > self._ttl:
                # Entry expired, remove it
                del self._cache[key]
                logger.debug(f"[{self._name}] Cache entry expired: {key[:20]}...")
                return None

            # Move to end (most recently used)
            self._cache.move_to_end(key)
            return entry['value']

    def set(self, key: str, value: T) -> None:
        """
        Set a value in the cache.

        Args:
            key: Cache key
            value: Value to cache
        """
        with self._lock:
            # Remove oldest entries if at capacity
            while len(self._cache) >= self._max_size:
                oldest_key = next(iter(self._cache))
                del self._cache[oldest_key]
                logger.debug(f"[{self._name}] Evicted oldest entry: {oldest_key[:20]}...")

            # Add or update entry
            self._cache[key] = {
                'value': value,
                'timestamp': time.time()
            }
            self._cache.move_to_end(key)

    def delete(self, key: str) -> bool:
        """
        Delete a value from the cache.

        Args:
            key: Cache key

        Returns:
            True if key existed and was deleted
        """
        with self._lock:
            if key in self._cache:
                del self._cache[key]
                return True
            return False

    def clear(self) -> None:
        """Clear all entries from the cache."""
        with self._lock:
            self._cache.clear()
            logger.debug(f"[{self._name}] Cache cleared")

    def cleanup_expired(self) -> int:
        """
        Remove all expired entries.

        Returns:
            Number of entries removed
        """
        with self._lock:
            now = time.time()
            expired_keys = [
                key for key, entry in self._cache.items()
                if now - entry['timestamp'] > self._ttl
            ]

            for key in expired_keys:
                del self._cache[key]

            if expired_keys:
                logger.debug(f"[{self._name}] Cleaned up {len(expired_keys)} expired entries")

            return len(expired_keys)

    @property
    def size(self) -> int:
        """Current number of entries in cache."""
        return len(self._cache)

    def stats(self) -> Dict[str, Any]:
        """
        Get cache statistics.

        Returns:
            Dict with cache stats
        """
        with self._lock:
            now = time.time()
            expired_count = sum(
                1 for entry in self._cache.values()
                if now - entry['timestamp'] > self._ttl
            )

            return {
                'name': self._name,
                'size': len(self._cache),
                'max_size': self._max_size,
                'ttl_seconds': self._ttl,
                'expired_entries': expired_count,
            }


# Pre-configured cache instances for common use cases
show_counts_cache: TTLCache[Dict[str, Any]] = TTLCache(
    ttl_seconds=300,  # 5 minutes
    max_size=500,
    name="show_counts"
)
