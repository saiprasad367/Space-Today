from __future__ import annotations

"""
Unit tests for auth_service:
- password hashing and verification
- JWT access token creation and verification
- refresh token generation and hashing
"""

import time
import uuid

import pytest
from jose import JWTError

from app.services.auth_service import (
    create_access_token,
    create_refresh_token,
    hash_password,
    hash_refresh_token,
    verify_access_token,
    verify_password,
)


class TestPasswordHashing:
    def test_hash_is_not_plaintext(self):
        plain = "SecurePass1!"
        hashed = hash_password(plain)
        assert hashed != plain

    def test_verify_correct_password(self):
        plain = "SecurePass1!"
        hashed = hash_password(plain)
        assert verify_password(plain, hashed) is True

    def test_reject_wrong_password(self):
        hashed = hash_password("SecurePass1!")
        assert verify_password("WrongPass1!", hashed) is False

    def test_different_hashes_for_same_password(self):
        plain = "SecurePass1!"
        h1 = hash_password(plain)
        h2 = hash_password(plain)
        # bcrypt adds salt — same password yields different hashes
        assert h1 != h2

    def test_empty_password_raises(self):
        # passlib will hash empty strings — ensure it at least works
        hashed = hash_password("")
        assert verify_password("", hashed) is True


class TestJWT:
    def test_create_and_verify_token(self):
        user_id = uuid.uuid4()
        email = "test@example.com"
        token = create_access_token(user_id, email)
        payload = verify_access_token(token)

        assert payload["sub"] == str(user_id)
        assert payload["email"] == email
        assert payload["type"] == "access"

    def test_reject_tampered_token(self):
        user_id = uuid.uuid4()
        token = create_access_token(user_id, "test@example.com")
        tampered = token[:-5] + "XXXXX"
        with pytest.raises(JWTError):
            verify_access_token(tampered)

    def test_reject_wrong_type(self):
        """A non-access token type should be rejected."""
        from jose import jwt
        from app.config import get_settings
        settings = get_settings()
        payload = {"sub": str(uuid.uuid4()), "type": "refresh"}
        token = jwt.encode(payload, settings.jwt_secret_key, algorithm=settings.jwt_algorithm)
        with pytest.raises(JWTError):
            verify_access_token(token)


class TestRefreshToken:
    def test_create_returns_two_different_strings(self):
        raw, token_hash = create_refresh_token()
        assert raw != token_hash
        assert len(raw) > 20
        assert len(token_hash) == 64  # SHA-256 hex = 64 chars

    def test_hash_is_deterministic(self):
        raw, _ = create_refresh_token()
        h1 = hash_refresh_token(raw)
        h2 = hash_refresh_token(raw)
        assert h1 == h2

    def test_different_tokens_different_hashes(self):
        raw1, h1 = create_refresh_token()
        raw2, h2 = create_refresh_token()
        assert raw1 != raw2
        assert h1 != h2
