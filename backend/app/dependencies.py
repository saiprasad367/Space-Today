import uuid
from datetime import datetime

from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from fastapi.concurrency import run_in_threadpool

from app.supabase_client import get_supabase
from app.schemas.auth import UserResponse

_bearer = HTTPBearer(auto_error=False)


async def get_current_user(
    credentials: HTTPAuthorizationCredentials | None = Depends(_bearer),
) -> UserResponse:
    """
    Dependency that validates the Bearer JWT using Supabase Auth and returns user info.
    Raises 401 if token is missing, invalid, or expired.
    """
    if credentials is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail={"code": "MISSING_TOKEN", "message": "Authentication required"},
        )

    try:
        supabase = get_supabase()
        # Call get_user with the access token JWT sent by the frontend
        res = await run_in_threadpool(supabase.auth.get_user, credentials.credentials)
        if not res or not res.user:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail={"code": "INVALID_TOKEN", "message": "Token is invalid or expired"},
            )

        user_info = res.user
        if isinstance(user_info.created_at, str):
            created_at_dt = datetime.fromisoformat(user_info.created_at.replace("Z", "+00:00"))
        else:
            created_at_dt = user_info.created_at

        return UserResponse(
            id=uuid.UUID(user_info.id),
            name=user_info.user_metadata.get("name", user_info.email.split("@")[0]),
            email=user_info.email,
            created_at=created_at_dt,
        )
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail={"code": "INVALID_TOKEN", "message": "Token is invalid or expired"},
        )

