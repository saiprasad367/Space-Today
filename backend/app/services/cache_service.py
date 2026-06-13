from __future__ import annotations

"""
Cache abstraction layer for Space Today API.

Design:
- CacheBackend is an abstract interface — swap MemoryCache ↔ RedisCache with zero router changes.
- All NASA responses are cached here with explicit keys and TTLs.
- Cache keys follow the pattern: {resource}:{param1}:{param2}
- TTLs are resource-specific to match NASA update frequency.

Cache Keys & TTL Strategy
─────────────────────────
  apod:{date}              → 86400s  (24h)  — APOD changes once daily
  neo:{start}:{end}        → 3600s   (1h)   — Asteroid data refreshed hourly
  mars:{rover}:{camera}:{sol} → 3600s (1h)  — Mars photos are static once uploaded
  events:{limit}           → 3600s   (1h)   — EONET events update ~hourly
  dashboard:{date}         → 1800s   (30m)  — Dashboard is a composite, refresh more often

Cache Hit Behaviour
───────────────────
  GET request arrives → check cache → HIT: return immediately (no NASA call)
                                    → MISS: call NASA → store result → return

Cache Invalidation
──────────────────
  TTL-based only (no explicit invalidation). APOD date keys naturally expire
  the next day. No manual purge mechanism is needed for this use case.
"""

import asyncio
import hashlib
import json
import logging
import time
from abc import ABC, abstractmethod
from typing import Any

logger = logging.getLogger(__name__)

# ─── TTL Constants (seconds) ──────────────────────────────────────────────────
TTL_APOD = 86_400       # 24 hours
TTL_ASTEROIDS = 3_600   # 1 hour
TTL_MARS = 3_600        # 1 hour
TTL_EVENTS = 3_600      # 1 hour
TTL_DASHBOARD = 1_800   # 30 minutes


# ─── Abstract Interface ───────────────────────────────────────────────────────

class CacheBackend(ABC):
    @abstractmethod
    async def get(self, key: str) -> Any | None: ...

    @abstractmethod
    async def set(self, key: str, value: Any, ttl: int) -> None: ...

    @abstractmethod
    async def delete(self, key: str) -> None: ...

    @abstractmethod
    async def ping(self) -> bool: ...


# ─── In-Memory Implementation (Development) ───────────────────────────────────

class MemoryCache(CacheBackend):
    """Thread-safe in-memory TTL cache. Used when REDIS_URL is not set."""

    def __init__(self) -> None:
        # key → (value_json, expires_at_epoch)
        self._store: dict[str, tuple[str, float]] = {}
        self._lock = asyncio.Lock()

    async def get(self, key: str) -> Any | None:
        async with self._lock:
            entry = self._store.get(key)
            if entry is None:
                logger.debug("Cache MISS: %s", key)
                return None
            value_json, expires_at = entry
            if time.monotonic() > expires_at:
                del self._store[key]
                logger.debug("Cache EXPIRED: %s", key)
                return None
            logger.debug("Cache HIT: %s", key)
            return json.loads(value_json)

    async def set(self, key: str, value: Any, ttl: int) -> None:
        async with self._lock:
            self._store[key] = (json.dumps(value), time.monotonic() + ttl)
            logger.debug("Cache SET: %s (ttl=%ds)", key, ttl)

    async def delete(self, key: str) -> None:
        async with self._lock:
            self._store.pop(key, None)

    async def ping(self) -> bool:
        return True


# ─── Redis Implementation (Production) ────────────────────────────────────────

class RedisCache(CacheBackend):
    """Redis-backed cache using async redis-py."""

    def __init__(self, redis_url: str) -> None:
        import redis.asyncio as aioredis
        self._client = aioredis.from_url(redis_url, decode_responses=True)

    async def get(self, key: str) -> Any | None:
        try:
            raw = await self._client.get(key)
            if raw is None:
                logger.debug("Cache MISS: %s", key)
                return None
            logger.debug("Cache HIT: %s", key)
            return json.loads(raw)
        except Exception as exc:
            logger.warning("Redis GET error for key %s: %s", key, exc)
            return None

    async def set(self, key: str, value: Any, ttl: int) -> None:
        try:
            await self._client.setex(key, ttl, json.dumps(value))
            logger.debug("Cache SET: %s (ttl=%ds)", key, ttl)
        except Exception as exc:
            logger.warning("Redis SET error for key %s: %s", key, exc)

    async def delete(self, key: str) -> None:
        try:
            await self._client.delete(key)
        except Exception as exc:
            logger.warning("Redis DEL error for key %s: %s", key, exc)

    async def ping(self) -> bool:
        try:
            return await self._client.ping()
        except Exception:
            return False

    async def close(self) -> None:
        await self._client.aclose()


# ─── Factory ──────────────────────────────────────────────────────────────────

def create_cache(redis_url: str = "") -> CacheBackend:
    """Return RedisCache if redis_url provided, else MemoryCache."""
    if redis_url:
        logger.info("Using Redis cache: %s", redis_url)
        return RedisCache(redis_url)
    logger.info("Using in-memory cache (set REDIS_URL for production)")
    return MemoryCache()
