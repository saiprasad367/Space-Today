from __future__ import annotations

"""
Integration tests for NASA space endpoints.
All NASA API calls are mocked with respx — no real HTTP calls made.
"""

import pytest
import respx
from httpx import AsyncClient, Response

MOCK_APOD = {
    "title": "Tarantula Nebula",
    "date": "2026-06-12",
    "explanation": "A stunning nebula.",
    "url": "https://example.com/apod.jpg",
    "hdurl": "https://example.com/apod-hd.jpg",
    "media_type": "image",
    "copyright": "NASA",
    "service_version": "v1",
}

MOCK_NEO_RESPONSE = {
    "near_earth_objects": {
        "2026-06-12": [
            {
                "id": "12345",
                "name": "2026 KX1",
                "nasa_jpl_url": "http://ssd.jpl.nasa.gov/sbdb.cgi?sstr=12345",
                "is_potentially_hazardous_asteroid": True,
                "absolute_magnitude_h": 22.1,
                "estimated_diameter": {
                    "meters": {
                        "estimated_diameter_min": 100.0,
                        "estimated_diameter_max": 200.0,
                    }
                },
                "close_approach_data": [
                    {
                        "close_approach_date": "2026-06-12",
                        "relative_velocity": {"kilometers_per_second": "18.4"},
                        "miss_distance": {
                            "astronomical": "0.018",
                            "kilometers": "2693000",
                        },
                        "orbiting_body": "Earth",
                    }
                ],
            }
        ]
    }
}

MOCK_IMAGES_RESPONSE = {
    "collection": {
        "items": [
            {
                "data": [
                    {
                        "nasa_id": "PIA15106",
                        "title": "Head of Mast on Mars Rover Curiosity",
                        "date_created": "2011-11-28T18:22:34Z"
                    }
                ],
                "links": [
                    {
                        "href": "https://images-assets.nasa.gov/image/PIA15106/PIA15106~small.jpg"
                    }
                ]
            }
        ]
    }
}

MOCK_EONET_RESPONSE = {
    "events": [
        {
            "id": "EONET_1234",
            "title": "Wildfire - Alberta",
            "description": None,
            "link": "https://eonet.gsfc.nasa.gov/api/v3/events/EONET_1234",
            "closed": None,
            "categories": [{"id": "wildfires", "title": "Wildfires"}],
            "sources": [],
            "geometry": [
                {
                    "date": "2026-06-12T00:00:00Z",
                    "type": "Point",
                    "coordinates": [-115.5, 55.2],
                }
            ],
        }
    ]
}


import uuid

async def _signup_and_get_token(client: AsyncClient) -> str:
    email = f"space_{uuid.uuid4()}@test.com"
    resp = await client.post(
        "/auth/signup",
        json={"name": "Space Tester", "email": email, "password": "SecurePass1!"},
    )
    return resp.json()["access_token"]


class TestAPOD:
    @respx.mock
    async def test_apod_returns_normalized_data(self, client: AsyncClient):
        token = await _signup_and_get_token(client)

        respx.get("https://api.nasa.gov/planetary/apod").mock(
            return_value=Response(200, json=MOCK_APOD)
        )

        resp = await client.get(
            "/space/apod",
            headers={"Authorization": f"Bearer {token}"},
        )
        assert resp.status_code == 200
        data = resp.json()
        assert data["title"] == "Tarantula Nebula"
        assert data["date"] == "2026-06-12"
        assert "url" in data

    @respx.mock
    async def test_apod_with_date_param(self, client: AsyncClient):
        token = await _signup_and_get_token(client)

        respx.get("https://api.nasa.gov/planetary/apod").mock(
            return_value=Response(200, json={**MOCK_APOD, "date": "2026-06-01"})
        )

        resp = await client.get(
            "/space/apod?date=2026-06-01",
            headers={"Authorization": f"Bearer {token}"},
        )
        assert resp.status_code == 200

    async def test_apod_requires_auth(self, client: AsyncClient):
        resp = await client.get("/space/apod")
        assert resp.status_code == 401

    @respx.mock
    async def test_apod_fallback_on_failure(self, client: AsyncClient):
        from httpx import Response
        token = await _signup_and_get_token(client)

        # Mock specific date query to fail
        respx.get(
            "https://api.nasa.gov/planetary/apod",
            params={"date": "2026-06-13"}
        ).mock(return_value=Response(500))

        # Mock fallback query to succeed
        respx.get(
            "https://api.nasa.gov/planetary/apod"
        ).mock(return_value=Response(200, json=MOCK_APOD))

        resp = await client.get(
            "/space/apod?date=2026-06-13",
            headers={"Authorization": f"Bearer {token}"},
        )
        assert resp.status_code == 200
        data = resp.json()
        assert data["title"] == "Tarantula Nebula"
        assert data["date"] == "2026-06-12"


class TestAsteroids:
    @respx.mock
    async def test_asteroids_returns_list(self, client: AsyncClient):
        token = await _signup_and_get_token(client)

        respx.get("https://api.nasa.gov/neo/rest/v1/feed").mock(
            return_value=Response(200, json=MOCK_NEO_RESPONSE)
        )

        resp = await client.get(
            "/space/asteroids",
            headers={"Authorization": f"Bearer {token}"},
        )
        assert resp.status_code == 200
        data = resp.json()
        assert isinstance(data, list)
        assert len(data) == 1
        assert data[0]["name"] == "2026 KX1"
        assert data[0]["is_potentially_hazardous"] is True


class TestDashboard:
    @respx.mock
    async def test_dashboard_returns_all_sections(self, client: AsyncClient):
        token = await _signup_and_get_token(client)

        respx.get("https://api.nasa.gov/planetary/apod").mock(
            return_value=Response(200, json=MOCK_APOD)
        )
        respx.get("https://api.nasa.gov/neo/rest/v1/feed").mock(
            return_value=Response(200, json=MOCK_NEO_RESPONSE)
        )
        respx.get("https://images-api.nasa.gov/search").mock(
            return_value=Response(200, json=MOCK_IMAGES_RESPONSE)
        )
        respx.get("https://eonet.gsfc.nasa.gov/api/v3/events").mock(
            return_value=Response(200, json=MOCK_EONET_RESPONSE)
        )

        resp = await client.get(
            "/space/dashboard",
            headers={"Authorization": f"Bearer {token}"},
        )
        assert resp.status_code == 200
        data = resp.json()
        assert "apod" in data
        assert "asteroids" in data
        assert "mars_photos" in data
        assert "earth_events" in data

    @respx.mock
    async def test_dashboard_partial_failure_does_not_500(self, client: AsyncClient):
        """If one section fails, dashboard still returns 200 with error field."""
        token = await _signup_and_get_token(client)

        # APOD fails
        respx.get("https://api.nasa.gov/planetary/apod").mock(
            return_value=Response(500, json={"error": "NASA outage"})
        )
        respx.get("https://api.nasa.gov/neo/rest/v1/feed").mock(
            return_value=Response(200, json=MOCK_NEO_RESPONSE)
        )
        respx.get("https://images-api.nasa.gov/search").mock(
            return_value=Response(200, json=MOCK_IMAGES_RESPONSE)
        )
        respx.get("https://eonet.gsfc.nasa.gov/api/v3/events").mock(
            return_value=Response(200, json=MOCK_EONET_RESPONSE)
        )

        resp = await client.get(
            "/space/dashboard",
            headers={"Authorization": f"Bearer {token}"},
        )
        # Must be 200 even if APOD failed
        assert resp.status_code == 200
        data = resp.json()
        # The failed section has an error field
        assert "error" in data.get("apod", {})
