from __future__ import annotations

import uuid
from datetime import datetime
from typing import Any

from pydantic import BaseModel, Field


class FavoriteCreate(BaseModel):
    item_type: str = Field(pattern="^(apod|asteroid|mars_photo|earth_event)$")
    item_payload: dict[str, Any]


class FavoriteResponse(BaseModel):
    id: uuid.UUID
    user_id: uuid.UUID
    item_type: str
    item_payload: dict[str, Any]
    saved_at: datetime

    model_config = {"from_attributes": True}


class FavoriteListResponse(BaseModel):
    favorites: list[FavoriteResponse]
    total: int
