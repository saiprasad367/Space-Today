from __future__ import annotations

"""Integration tests for favorites endpoints."""

import pytest
from httpx import AsyncClient


import uuid

async def _auth_header(client: AsyncClient, email: str) -> dict:
    prefix = email.split("@")[0]
    unique_email = f"{prefix}_{uuid.uuid4()}@test.com"
    resp = await client.post(
        "/auth/signup",
        json={"name": "Fav Tester", "email": unique_email, "password": "SecurePass1!"},
    )
    token = resp.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}


class TestFavorites:
    async def test_add_favorite(self, client: AsyncClient):
        headers = await _auth_header(client, "fav_add@test.com")
        resp = await client.post(
            "/favorites",
            json={
                "item_type": "apod",
                "item_payload": {"title": "Test APOD", "date": "2026-06-12", "url": "https://example.com/img.jpg"},
            },
            headers=headers,
        )
        assert resp.status_code == 201
        data = resp.json()
        assert data["item_type"] == "apod"
        assert "id" in data

    async def test_list_favorites_empty(self, client: AsyncClient):
        headers = await _auth_header(client, "fav_empty@test.com")
        resp = await client.get("/favorites", headers=headers)
        assert resp.status_code == 200
        assert resp.json()["total"] == 0
        assert resp.json()["favorites"] == []

    async def test_list_favorites_after_add(self, client: AsyncClient):
        headers = await _auth_header(client, "fav_list@test.com")
        await client.post(
            "/favorites",
            json={"item_type": "asteroid", "item_payload": {"name": "2026 KX1", "hazard": True}},
            headers=headers,
        )
        resp = await client.get("/favorites", headers=headers)
        assert resp.status_code == 200
        assert resp.json()["total"] == 1

    async def test_delete_favorite(self, client: AsyncClient):
        headers = await _auth_header(client, "fav_delete@test.com")
        add = await client.post(
            "/favorites",
            json={"item_type": "mars_photo", "item_payload": {"img_src": "https://example.com/mars.jpg"}},
            headers=headers,
        )
        fav_id = add.json()["id"]

        del_resp = await client.delete(f"/favorites/{fav_id}", headers=headers)
        assert del_resp.status_code == 204

        # Verify deleted
        list_resp = await client.get("/favorites", headers=headers)
        assert list_resp.json()["total"] == 0

    async def test_cannot_delete_other_users_favorite(self, client: AsyncClient):
        headers_a = await _auth_header(client, "fav_owner@test.com")
        headers_b = await _auth_header(client, "fav_thief@test.com")

        add = await client.post(
            "/favorites",
            json={"item_type": "apod", "item_payload": {"title": "Mine"}},
            headers=headers_a,
        )
        fav_id = add.json()["id"]

        # User B tries to delete User A's favorite
        resp = await client.delete(f"/favorites/{fav_id}", headers=headers_b)
        assert resp.status_code == 404

    async def test_invalid_item_type_rejected(self, client: AsyncClient):
        headers = await _auth_header(client, "fav_invalid@test.com")
        resp = await client.post(
            "/favorites",
            json={"item_type": "invalid_type", "item_payload": {}},
            headers=headers,
        )
        assert resp.status_code == 422

    async def test_favorites_require_auth(self, client: AsyncClient):
        resp = await client.get("/favorites")
        assert resp.status_code == 401
