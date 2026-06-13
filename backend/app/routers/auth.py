import uuid
from datetime import datetime
from typing import Any
from urllib.parse import urlencode

from fastapi import APIRouter, Depends, HTTPException, Request, status
from fastapi.concurrency import run_in_threadpool
from pydantic import BaseModel
from gotrue.helpers import generate_pkce_verifier, generate_pkce_challenge

from app.config import get_settings
from app.dependencies import get_current_user
from app.middleware.rate_limit import limiter
from app.schemas.auth import (
    AuthResponse,
    LoginRequest,
    RefreshRequest,
    SignupRequest,
    TokenResponse,
    UserResponse,
)
from app.supabase_client import get_supabase

router = APIRouter(prefix="/auth", tags=["auth"])


def _parse_created_at(created_at: Any) -> datetime:
    if isinstance(created_at, str):
        return datetime.fromisoformat(created_at.replace("Z", "+00:00"))
    return created_at



# ─── POST /auth/signup ────────────────────────────────────────────────────────

@router.post("/signup", response_model=AuthResponse, status_code=status.HTTP_201_CREATED)
@limiter.limit("5/minute")
async def signup(request: Request, body: SignupRequest):
    """Create a new user account via Supabase Auth."""
    try:
        supabase = get_supabase()
        
        # 1. Sign up user in Supabase Auth
        res = await run_in_threadpool(
            lambda: supabase.auth.sign_up({
                "email": body.email.lower(),
                "password": body.password,
                "options": {
                    "data": {
                        "name": body.name
                    }
                }
            })
        )
        
        if not res or not res.user:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail={"code": "SIGNUP_FAILED", "message": "Failed to create account"}
            )
            
        user_info = res.user
        session_info = res.session
        
        # 2. Sync user into public.users table in Supabase so favorites foreign key constraint passes
        await run_in_threadpool(
            lambda: supabase.table("users").upsert({
                "id": user_info.id,
                "name": body.name,
                "email": body.email.lower(),
                "hashed_password": "supabase-auth-managed"
            }).execute()
        )
        
        created_at_dt = _parse_created_at(user_info.created_at)
        
        return AuthResponse(
            user=UserResponse(
                id=uuid.UUID(user_info.id),
                name=body.name,
                email=user_info.email,
                created_at=created_at_dt
            ),
            access_token=session_info.access_token if session_info else "",
            refresh_token=session_info.refresh_token if session_info else "",
        )
    except Exception as e:
        err_msg = str(e)
        if "user already exists" in err_msg.lower():
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail={"code": "EMAIL_EXISTS", "message": "An account with this email already exists"}
            )
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={"code": "SIGNUP_FAILED", "message": err_msg}
        )


# ─── POST /auth/login ─────────────────────────────────────────────────────────

@router.post("/login", response_model=AuthResponse)
@limiter.limit("5/minute")
async def login(request: Request, body: LoginRequest):
    """Authenticate with email + password via Supabase Auth."""
    try:
        supabase = get_supabase()
        
        # 1. Authenticate with Supabase Auth
        res = await run_in_threadpool(
            lambda: supabase.auth.sign_in_with_password({
                "email": body.email.lower(),
                "password": body.password
            })
        )
        
        if not res or not res.session or not res.user:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail={"code": "INVALID_CREDENTIALS", "message": "Email or password is incorrect"}
            )
            
        user_info = res.user
        session_info = res.session
        name = user_info.user_metadata.get("name") or user_info.email.split("@")[0]
        
        # 2. Ensure user exists in public.users table (sync in case they were registered differently)
        await run_in_threadpool(
            lambda: supabase.table("users").upsert({
                "id": user_info.id,
                "name": name,
                "email": user_info.email.lower(),
                "hashed_password": "supabase-auth-managed"
            }).execute()
        )
        
        created_at_dt = _parse_created_at(user_info.created_at)
        
        return AuthResponse(
            user=UserResponse(
                id=uuid.UUID(user_info.id),
                name=name,
                email=user_info.email,
                created_at=created_at_dt
            ),
            access_token=session_info.access_token,
            refresh_token=session_info.refresh_token,
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail={"code": "INVALID_CREDENTIALS", "message": "Email or password is incorrect"}
        )


# ─── POST /auth/refresh ───────────────────────────────────────────────────────

@router.post("/refresh", response_model=TokenResponse)
@limiter.limit("20/minute")
async def refresh(request: Request, body: RefreshRequest):
    """Exchange a valid refresh token for a new access token via Supabase Auth."""
    try:
        supabase = get_supabase()
        res = await run_in_threadpool(
            lambda: supabase.auth.refresh_session(body.refresh_token)
        )
        
        if not res or not res.session:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail={"code": "REFRESH_FAILED", "message": "Failed to refresh session"}
            )
            
        return TokenResponse(
            access_token=res.session.access_token,
            refresh_token=res.session.refresh_token,
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail={"code": "REFRESH_FAILED", "message": f"Failed to refresh session: {str(e)}"}
        )


# ─── POST /auth/logout ────────────────────────────────────────────────────────

@router.post("/logout", status_code=status.HTTP_200_OK)
async def logout(body: RefreshRequest | None = None, current_user: UserResponse = Depends(get_current_user)):
    """Invalidate the session via Supabase Auth."""
    try:
        supabase = get_supabase()
        await run_in_threadpool(supabase.auth.sign_out)
    except Exception:
        pass
    return {"message": "Logged out successfully"}


# ─── GET /auth/me ─────────────────────────────────────────────────────────────

@router.get("/me", response_model=UserResponse)
async def me(current_user: UserResponse = Depends(get_current_user)):
    """Return the currently authenticated user's profile."""
    return current_user


# ─── Google OAuth ─────────────────────────────────────────────────────────────

class GoogleTokenRequest(BaseModel):
    code: str
    redirect_uri: str
    code_verifier: str | None = None


@router.get("/google/url")
async def google_auth_url(redirect_uri: str | None = None):
    """Return the Google OAuth consent URL pointing directly to Supabase Auth."""
    settings = get_settings()
    callback = redirect_uri or f"{settings.frontend_url}/auth/google/callback"
    
    # Generate PKCE verifier and challenge
    code_verifier = generate_pkce_verifier()
    code_challenge = generate_pkce_challenge(code_verifier)
    code_challenge_method = "s256"
    
    params = {
        "provider": "google",
        "redirect_to": callback,
        "code_challenge": code_challenge,
        "code_challenge_method": code_challenge_method,
    }
    query = urlencode(params)
    url = f"{settings.supabase_url}/auth/v1/authorize?{query}"
    
    return {"url": url, "code_verifier": code_verifier, "state": "none"}


@router.post("/google/token", response_model=AuthResponse)
@limiter.limit("10/minute")
async def google_token(request: Request, body: GoogleTokenRequest):
    """Exchange a Google authorization code for Space Today tokens via Supabase."""
    try:
        supabase = get_supabase()
        
        exchange_params = {
            "auth_code": body.code,
        }
        if body.code_verifier:
            exchange_params["code_verifier"] = body.code_verifier
            
        res = await run_in_threadpool(
            lambda: supabase.auth.exchange_code_for_session(exchange_params)
        )
        
        if not res or not res.session or not res.user:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail={"code": "GOOGLE_AUTH_FAILED", "message": "Failed to exchange Google code"}
            )
            
        user_info = res.user
        session_info = res.session
        name = user_info.user_metadata.get("name") or user_info.email.split("@")[0]
        
        # Sync user into public.users table
        await run_in_threadpool(
            lambda: supabase.table("users").upsert({
                "id": user_info.id,
                "name": name,
                "email": user_info.email.lower(),
                "hashed_password": "supabase-auth-managed"
            }).execute()
        )
        
        created_at_dt = _parse_created_at(user_info.created_at)
        
        return AuthResponse(
            user=UserResponse(
                id=uuid.UUID(user_info.id),
                name=name,
                email=user_info.email,
                created_at=created_at_dt
            ),
            access_token=session_info.access_token,
            refresh_token=session_info.refresh_token,
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={"code": "GOOGLE_AUTH_FAILED", "message": f"Google authentication failed: {str(e)}"}
        )
