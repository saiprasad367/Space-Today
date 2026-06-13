from __future__ import annotations

"""
Integration tests: complete auth flow
signup → login → refresh → me → logout → verify revoked
"""

import pytest
from httpx import AsyncClient


VALID_USER = {
    "name": "Test Commander",
    "email": "commander@test.com",
    "password": "SecurePass1!",
}


class TestSignup:
    async def test_signup_success(self, client: AsyncClient):
        resp = await client.post("/auth/signup", json=VALID_USER)
        assert resp.status_code == 201
        data = resp.json()
        assert "access_token" in data
        assert "refresh_token" in data
        assert data["user"]["email"] == VALID_USER["email"]

    async def test_signup_duplicate_email(self, client: AsyncClient):
        await client.post("/auth/signup", json=VALID_USER)
        resp = await client.post("/auth/signup", json=VALID_USER)
        assert resp.status_code == 409
        assert resp.json()["error"]["code"] == "EMAIL_EXISTS"

    async def test_signup_weak_password(self, client: AsyncClient):
        resp = await client.post(
            "/auth/signup",
            json={"name": "Test", "email": "weak@test.com", "password": "weak"},
        )
        assert resp.status_code == 422

    async def test_signup_invalid_email(self, client: AsyncClient):
        resp = await client.post(
            "/auth/signup",
            json={"name": "Test", "email": "not-an-email", "password": "SecurePass1!"},
        )
        assert resp.status_code == 422


class TestLogin:
    async def test_login_success(self, client: AsyncClient):
        # Ensure user exists
        await client.post("/auth/signup", json={**VALID_USER, "email": "login_test@test.com"})
        resp = await client.post(
            "/auth/login",
            json={"email": "login_test@test.com", "password": VALID_USER["password"]},
        )
        assert resp.status_code == 200
        data = resp.json()
        assert "access_token" in data
        assert "refresh_token" in data

    async def test_login_wrong_password(self, client: AsyncClient):
        await client.post("/auth/signup", json={**VALID_USER, "email": "wrong_pw@test.com"})
        resp = await client.post(
            "/auth/login",
            json={"email": "wrong_pw@test.com", "password": "WrongPassword1!"},
        )
        assert resp.status_code == 401
        assert resp.json()["error"]["code"] == "INVALID_CREDENTIALS"

    async def test_login_nonexistent_user(self, client: AsyncClient):
        resp = await client.post(
            "/auth/login",
            json={"email": "ghost@test.com", "password": "SecurePass1!"},
        )
        assert resp.status_code == 401


class TestRefreshToken:
    async def test_refresh_success(self, client: AsyncClient):
        signup = await client.post(
            "/auth/signup", json={**VALID_USER, "email": "refresh_test@test.com"}
        )
        refresh_token = signup.json()["refresh_token"]

        resp = await client.post("/auth/refresh", json={"refresh_token": refresh_token})
        assert resp.status_code == 200
        data = resp.json()
        assert "access_token" in data
        assert "refresh_token" in data
        # New refresh token should be different
        assert data["refresh_token"] != refresh_token

    async def test_refresh_invalid_token(self, client: AsyncClient):
        resp = await client.post("/auth/refresh", json={"refresh_token": "fake_token"})
        assert resp.status_code == 401

    async def test_refresh_token_rotation(self, client: AsyncClient):
        """Old refresh token should not work after rotation."""
        signup = await client.post(
            "/auth/signup", json={**VALID_USER, "email": "rotation_test@test.com"}
        )
        old_refresh = signup.json()["refresh_token"]

        await client.post("/auth/refresh", json={"refresh_token": old_refresh})

        # Using old token again should fail
        resp2 = await client.post("/auth/refresh", json={"refresh_token": old_refresh})
        assert resp2.status_code == 401


class TestMe:
    async def test_me_returns_user(self, client: AsyncClient):
        signup = await client.post(
            "/auth/signup", json={**VALID_USER, "email": "me_test@test.com"}
        )
        access_token = signup.json()["access_token"]

        resp = await client.get(
            "/auth/me", headers={"Authorization": f"Bearer {access_token}"}
        )
        assert resp.status_code == 200
        assert resp.json()["email"] == "me_test@test.com"

    async def test_me_without_token_returns_401(self, client: AsyncClient):
        resp = await client.get("/auth/me")
        assert resp.status_code == 401


class TestLogout:
    async def test_logout_success(self, client: AsyncClient):
        signup = await client.post(
            "/auth/signup", json={**VALID_USER, "email": "logout_test@test.com"}
        )
        access_token = signup.json()["access_token"]
        refresh_token = signup.json()["refresh_token"]

        resp = await client.post(
            "/auth/logout",
            json={"refresh_token": refresh_token},
            headers={"Authorization": f"Bearer {access_token}"},
        )
        assert resp.status_code == 200

        # Refresh should fail now
        resp2 = await client.post("/auth/refresh", json={"refresh_token": refresh_token})
        assert resp2.status_code == 401


class TestGoogleOAuth:
    async def test_google_url_generation(self, client: AsyncClient):
        resp = await client.get("/auth/google/url?redirect_uri=http://localhost:8081/auth/google/callback")
        assert resp.status_code == 200
        data = resp.json()
        assert "url" in data
        assert "code_verifier" in data
        assert "code_challenge" in data["url"]

    async def test_google_token_exchange(self, client: AsyncClient):
        resp = await client.post(
            "/auth/google/token",
            json={
                "code": "mock_google_code",
                "redirect_uri": "http://localhost:8081/auth/google/callback",
                "code_verifier": "mock_verifier"
            }
        )
        assert resp.status_code == 200
        data = resp.json()
        assert "access_token" in data
        assert "refresh_token" in data
        assert data["user"]["email"] == "google_user@test.com"
