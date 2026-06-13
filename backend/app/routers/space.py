from typing import Annotated, Any

from fastapi import APIRouter, Depends, Query, Request

from app.dependencies import get_current_user
from app.middleware.rate_limit import limiter
from app.models.user import User
from app.services import nasa_service
from app.services.cache_service import CacheBackend

router = APIRouter(prefix="/space", tags=["space"])


def _get_cache(request: Request) -> CacheBackend:
    return request.app.state.cache


# ─── GET /space/apod ─────────────────────────────────────────────────────────

@router.get("/apod")
@limiter.limit("100/minute")
async def get_apod(
    request: Request,
    date: Annotated[str | None, Query(description="Date in YYYY-MM-DD format")] = None,
    current_user: User = Depends(get_current_user),
) -> dict[str, Any]:
    """Astronomy Picture of the Day. Optionally specify a date."""
    cache = _get_cache(request)
    return await nasa_service.get_apod(cache, date)


# ─── GET /space/asteroids ─────────────────────────────────────────────────────

@router.get("/asteroids")
@limiter.limit("100/minute")
async def get_asteroids(
    request: Request,
    start_date: Annotated[str | None, Query(description="Start date YYYY-MM-DD")] = None,
    end_date: Annotated[str | None, Query(description="End date YYYY-MM-DD (max 7-day range)")] = None,
    current_user: User = Depends(get_current_user),
) -> list[dict[str, Any]]:
    """Near Earth Objects feed. Date range max 7 days."""
    cache = _get_cache(request)
    return await nasa_service.get_asteroids(cache, start_date, end_date)


# ─── GET /space/mars-photos ───────────────────────────────────────────────────

@router.get("/mars-photos")
@limiter.limit("100/minute")
async def get_mars_photos(
    request: Request,
    rover: Annotated[str, Query(description="Rover name: curiosity, perseverance, opportunity")] = "curiosity",
    camera: Annotated[str | None, Query(description="Camera abbreviation e.g. MAST, NAVCAM")] = None,
    sol: Annotated[int | None, Query(description="Martian sol (day) number")] = None,
    earth_date: Annotated[str | None, Query(description="Earth date YYYY-MM-DD")] = None,
    current_user: User = Depends(get_current_user),
) -> list[dict[str, Any]]:
    """Mars rover photos from NASA. Filter by rover, camera, and sol."""
    cache = _get_cache(request)
    return await nasa_service.get_mars_photos(cache, rover, camera, sol, earth_date)


# ─── GET /space/earth-events ──────────────────────────────────────────────────

@router.get("/earth-events")
@limiter.limit("100/minute")
async def get_earth_events(
    request: Request,
    limit: Annotated[int, Query(ge=1, le=200)] = 50,
    status: Annotated[str, Query(description="Event status: open, closed, all")] = "open",
    current_user: User = Depends(get_current_user),
) -> list[dict[str, Any]]:
    """EONET natural events from NASA (wildfires, storms, volcanoes, etc.)."""
    cache = _get_cache(request)
    return await nasa_service.get_earth_events(cache, limit, status)


# ─── GET /space/dashboard ─────────────────────────────────────────────────────

@router.get("/dashboard")
@limiter.limit("60/minute")
async def get_dashboard(
    request: Request,
    current_user: User = Depends(get_current_user),
) -> dict[str, Any]:
    """
    Aggregated view: APOD + Asteroids + Mars Photos + Earth Events.
    Fetched in parallel. Returns per-section errors on partial failures.
    Never returns HTTP 500 for individual section failures.
    """
    cache = _get_cache(request)
    return await nasa_service.get_dashboard(cache)
