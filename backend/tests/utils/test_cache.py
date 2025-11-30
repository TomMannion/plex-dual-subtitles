"""
Tests for utils/cache.py
"""

import time
import pytest
from utils.cache import TTLCache


class TestTTLCache:
    """Tests for TTLCache class."""

    def test_set_and_get(self):
        """Test basic set and get operations."""
        cache = TTLCache[str](ttl_seconds=60, max_size=10)
        cache.set("key1", "value1")

        assert cache.get("key1") == "value1"

    def test_get_nonexistent_key(self):
        """Test getting a key that doesn't exist."""
        cache = TTLCache[str](ttl_seconds=60, max_size=10)

        assert cache.get("nonexistent") is None

    def test_ttl_expiration(self):
        """Test that entries expire after TTL."""
        cache = TTLCache[str](ttl_seconds=1, max_size=10)
        cache.set("key1", "value1")

        # Should exist immediately
        assert cache.get("key1") == "value1"

        # Wait for expiration
        time.sleep(1.1)

        # Should be expired now
        assert cache.get("key1") is None

    def test_max_size_eviction(self):
        """Test that oldest entries are evicted when max size is reached."""
        cache = TTLCache[str](ttl_seconds=60, max_size=3)

        cache.set("key1", "value1")
        cache.set("key2", "value2")
        cache.set("key3", "value3")

        # All should exist
        assert cache.get("key1") == "value1"
        assert cache.get("key2") == "value2"
        assert cache.get("key3") == "value3"

        # Add a fourth entry - should evict key1 (oldest)
        cache.set("key4", "value4")

        assert cache.get("key1") is None  # Evicted
        assert cache.get("key2") == "value2"
        assert cache.get("key3") == "value3"
        assert cache.get("key4") == "value4"

    def test_lru_ordering(self):
        """Test that accessing an entry moves it to end (most recently used)."""
        cache = TTLCache[str](ttl_seconds=60, max_size=3)

        cache.set("key1", "value1")
        cache.set("key2", "value2")
        cache.set("key3", "value3")

        # Access key1 to make it most recently used
        cache.get("key1")

        # Add new entry - should evict key2 (now oldest)
        cache.set("key4", "value4")

        assert cache.get("key1") == "value1"  # Still exists (was accessed)
        assert cache.get("key2") is None  # Evicted
        assert cache.get("key3") == "value3"
        assert cache.get("key4") == "value4"

    def test_delete(self):
        """Test deleting an entry."""
        cache = TTLCache[str](ttl_seconds=60, max_size=10)
        cache.set("key1", "value1")

        assert cache.delete("key1") is True
        assert cache.get("key1") is None
        assert cache.delete("key1") is False  # Already deleted

    def test_clear(self):
        """Test clearing all entries."""
        cache = TTLCache[str](ttl_seconds=60, max_size=10)
        cache.set("key1", "value1")
        cache.set("key2", "value2")

        cache.clear()

        assert cache.get("key1") is None
        assert cache.get("key2") is None
        assert cache.size == 0

    def test_cleanup_expired(self):
        """Test cleanup of expired entries."""
        cache = TTLCache[str](ttl_seconds=1, max_size=10)
        cache.set("key1", "value1")
        cache.set("key2", "value2")

        # Wait for expiration
        time.sleep(1.1)

        # Add a new non-expired entry
        cache.set("key3", "value3")

        # Cleanup should remove expired entries
        removed = cache.cleanup_expired()

        assert removed == 2  # key1 and key2 expired
        assert cache.get("key3") == "value3"  # key3 still valid

    def test_size_property(self):
        """Test size property."""
        cache = TTLCache[str](ttl_seconds=60, max_size=10)

        assert cache.size == 0

        cache.set("key1", "value1")
        assert cache.size == 1

        cache.set("key2", "value2")
        assert cache.size == 2

        cache.delete("key1")
        assert cache.size == 1

    def test_stats(self):
        """Test stats method."""
        cache = TTLCache[str](ttl_seconds=60, max_size=10, name="test_cache")
        cache.set("key1", "value1")
        cache.set("key2", "value2")

        stats = cache.stats()

        assert stats['name'] == "test_cache"
        assert stats['size'] == 2
        assert stats['max_size'] == 10
        assert stats['ttl_seconds'] == 60
        assert stats['expired_entries'] == 0

    def test_update_existing_key(self):
        """Test updating an existing key."""
        cache = TTLCache[str](ttl_seconds=60, max_size=10)
        cache.set("key1", "value1")
        cache.set("key1", "updated_value")

        assert cache.get("key1") == "updated_value"
        assert cache.size == 1  # Still only one entry

    def test_typed_cache(self):
        """Test cache with specific types."""
        # Dict cache
        dict_cache = TTLCache[dict](ttl_seconds=60, max_size=10)
        dict_cache.set("key1", {"foo": "bar"})
        assert dict_cache.get("key1") == {"foo": "bar"}

        # Int cache
        int_cache = TTLCache[int](ttl_seconds=60, max_size=10)
        int_cache.set("key1", 42)
        assert int_cache.get("key1") == 42
