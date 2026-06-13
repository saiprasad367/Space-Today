from __future__ import annotations

"""
Unit tests for CacheBackend implementations:
- MemoryCache hit, miss, expiry
"""

import asyncio
import time

import pytest

from app.services.cache_service import MemoryCache


@pytest.fixture
def cache():
    return MemoryCache()


class TestMemoryCache:
    async def test_miss_returns_none(self, cache: MemoryCache):
        result = await cache.get("nonexistent_key")
        assert result is None

    async def test_set_and_get(self, cache: MemoryCache):
        await cache.set("key1", {"hello": "world"}, ttl=60)
        result = await cache.get("key1")
        assert result == {"hello": "world"}

    async def test_expired_returns_none(self, cache: MemoryCache):
        await cache.set("expiring", {"data": 1}, ttl=0)  # Expires immediately
        # Force time to advance by manipulating stored expiry
        async with cache._lock:
            key = "expiring"
            if key in cache._store:
                value_json, _ = cache._store[key]
                cache._store[key] = (value_json, time.monotonic() - 1)  # already expired
        result = await cache.get("expiring")
        assert result is None

    async def test_delete_removes_entry(self, cache: MemoryCache):
        await cache.set("delete_me", [1, 2, 3], ttl=60)
        await cache.delete("delete_me")
        result = await cache.get("delete_me")
        assert result is None

    async def test_delete_nonexistent_does_not_raise(self, cache: MemoryCache):
        await cache.delete("does_not_exist")  # Should not raise

    async def test_overwrite_existing(self, cache: MemoryCache):
        await cache.set("key", "original", ttl=60)
        await cache.set("key", "updated", ttl=60)
        result = await cache.get("key")
        assert result == "updated"

    async def test_stores_complex_types(self, cache: MemoryCache):
        data = {"list": [1, 2, 3], "nested": {"a": True, "b": None}}
        await cache.set("complex", data, ttl=60)
        result = await cache.get("complex")
        assert result == data

    async def test_ping_returns_true(self, cache: MemoryCache):
        assert await cache.ping() is True

    async def test_multiple_keys_independent(self, cache: MemoryCache):
        await cache.set("k1", "v1", ttl=60)
        await cache.set("k2", "v2", ttl=60)
        assert await cache.get("k1") == "v1"
        assert await cache.get("k2") == "v2"
