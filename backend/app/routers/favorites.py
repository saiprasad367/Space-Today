import uuid
from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException, Request, status
from fastapi.concurrency import run_in_threadpool

from app.dependencies import get_current_user
from app.middleware.rate_limit import limiter
from app.schemas.auth import UserResponse
from app.schemas.favorites import FavoriteCreate, FavoriteListResponse, FavoriteResponse
from app.supabase_client import get_supabase

router = APIRouter(prefix="/favorites", tags=["favorites"])


# ─── POST /favorites ─────────────────────────────────────────────────────────

@router.post("", response_model=FavoriteResponse, status_code=status.HTTP_201_CREATED)
@limiter.limit("100/minute")
async def add_favorite(
    request: Request,
    body: FavoriteCreate,
    current_user: UserResponse = Depends(get_current_user),
):
    """Save a NASA item to the user's favorites in Supabase."""
    try:
        supabase = get_supabase()
        
        res = await run_in_threadpool(
            lambda: supabase.table("favorites").insert({
                "user_id": str(current_user.id),
                "item_type": body.item_type,
                "item_payload": body.item_payload,
            }).execute()
        )
        
        if not res or not res.data:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail={"code": "SAVE_FAILED", "message": "Failed to save favorite"}
            )
            
        fav_data = res.data[0]
        return FavoriteResponse(
            id=uuid.UUID(fav_data["id"]),
            user_id=uuid.UUID(fav_data["user_id"]),
            item_type=fav_data["item_type"],
            item_payload=fav_data["item_payload"],
            saved_at=datetime.fromisoformat(fav_data["saved_at"].replace("Z", "+00:00")),
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={"code": "SAVE_FAILED", "message": str(e)}
        )


# ─── GET /favorites ───────────────────────────────────────────────────────────

@router.get("", response_model=FavoriteListResponse)
@limiter.limit("100/minute")
async def list_favorites(
    request: Request,
    current_user: UserResponse = Depends(get_current_user),
):
    """Get all favorites for the authenticated user, newest first."""
    try:
        supabase = get_supabase()
        
        res = await run_in_threadpool(
            lambda: supabase.table("favorites")
            .select("*")
            .eq("user_id", str(current_user.id))
            .order("saved_at", desc=True)
            .execute()
        )
        
        favorites = res.data or []
        
        return FavoriteListResponse(
            favorites=[
                FavoriteResponse(
                    id=uuid.UUID(f["id"]),
                    user_id=uuid.UUID(f["user_id"]),
                    item_type=f["item_type"],
                    item_payload=f["item_payload"],
                    saved_at=datetime.fromisoformat(f["saved_at"].replace("Z", "+00:00")),
                )
                for f in favorites
            ],
            total=len(favorites),
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={"code": "FETCH_FAILED", "message": str(e)}
        )


@router.delete("/{favorite_id}", status_code=status.HTTP_204_NO_CONTENT)
@limiter.limit("100/minute")
async def delete_favorite(
    favorite_id: uuid.UUID,
    request: Request,
    current_user: UserResponse = Depends(get_current_user),
):
    """Remove a favorite. User can only delete their own favorites."""
    try:
        supabase = get_supabase()
        
        res = await run_in_threadpool(
            lambda: supabase.table("favorites")
            .delete()
            .eq("id", str(favorite_id))
            .eq("user_id", str(current_user.id))
            .execute()
        )
        
        if not res or not res.data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail={"code": "NOT_FOUND", "message": "Favorite not found"}
            )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"code": "NOT_FOUND", "message": "Favorite not found or not owned by user"}
        )
