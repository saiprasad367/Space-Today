from __future__ import annotations

import logging
from contextlib import asynccontextmanager
from datetime import datetime, timezone

from fastapi import FastAPI, HTTPException, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import ValidationError
from slowapi import _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded
from slowapi.middleware import SlowAPIMiddleware

from app.config import get_settings
from app.middleware.rate_limit import limiter
from app.routers import auth, favorites, space
from app.services.cache_service import create_cache
from app.services.nasa_service import close_http_client

# ─── Logging ──────────────────────────────────────────────────────────────────
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s | %(levelname)-8s | %(name)s | %(message)s",
)
logger = logging.getLogger(__name__)


# ─── Lifespan ─────────────────────────────────────────────────────────────────

@asynccontextmanager
async def lifespan(app: FastAPI):
    settings = get_settings()
    # Initialize cache
    app.state.cache = create_cache(settings.redis_url)
    logger.info("Space Today API starting up (env=%s)", settings.app_env)
    yield
    # Cleanup
    await close_http_client()
    if hasattr(app.state.cache, "close"):
        await app.state.cache.close()
    logger.info("Space Today API shutting down")


# ─── App ──────────────────────────────────────────────────────────────────────

def create_app() -> FastAPI:
    settings = get_settings()

    app = FastAPI(
        title="Space Today API",
        description=(
            "REST API aggregating NASA data: APOD, Near-Earth Objects, "
            "Mars Rover Photos, and EONET Earth Events. "
            "Provides JWT auth, intelligent caching, and user favorites."
        ),
        version="1.0.0",
        docs_url="/docs",
        redoc_url="/redoc",
        lifespan=lifespan,
    )

    # ── Rate limiting ──
    app.state.limiter = limiter
    app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)
    app.add_middleware(SlowAPIMiddleware)

    # ── CORS ──
    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.origins_list,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    # ── Routers ──
    app.include_router(auth.router)
    app.include_router(space.router)
    app.include_router(favorites.router)

    # ── Exception Handlers ──

    @app.exception_handler(HTTPException)
    async def http_exception_handler(request: Request, exc: HTTPException):
        detail = exc.detail
        if isinstance(detail, dict):
            body = {"error": detail}
        else:
            body = {"error": {"code": "HTTP_ERROR", "message": str(detail)}}
        return JSONResponse(status_code=exc.status_code, content=body)

    @app.exception_handler(ValidationError)
    async def validation_exception_handler(request: Request, exc: ValidationError):
        return JSONResponse(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            content={
                "error": {
                    "code": "VALIDATION_ERROR",
                    "message": "Request validation failed",
                    "details": exc.errors(),
                }
            },
        )

    @app.exception_handler(Exception)
    async def generic_exception_handler(request: Request, exc: Exception):
        logger.error("Unhandled exception: %s", exc, exc_info=True)
        return JSONResponse(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            content={"error": {"code": "INTERNAL_ERROR", "message": "An unexpected error occurred"}},
        )

    # ── Health Check ──

    @app.get("/health", tags=["health"])
    async def health_check(request: Request):
        cache_ok = await request.app.state.cache.ping()
        return {
            "status": "ok",
            "timestamp": datetime.now(tz=timezone.utc).isoformat(),
            "cache": "redis" if not isinstance(request.app.state.cache.__class__.__name__, str) else "memory",
            "cache_healthy": cache_ok,
        }

    return app


app = create_app()
