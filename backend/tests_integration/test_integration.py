import pytest
from httpx import AsyncClient

@pytest.mark.asyncio
async def test_signup_login_flow(client: AsyncClient):
    # 1. Signup
    signup_payload = {
        "username": "integration_user",
        "email": "integration@example.com",
        "password": "securepassword"
    }
    response = await client.post("/auth/signup", json=signup_payload)
    assert response.status_code == 200
    data = response.json()
    assert data["success"] is True
    assert data["user"]["username"] == "integration_user"
    assert "token" in data
    
    # 2. Login
    login_payload = {
        "email": "integration@example.com",
        "password": "securepassword"
    }
    response = await client.post("/auth/login", json=login_payload)
    assert response.status_code == 200
    data = response.json()
    assert data["success"] is True
    token = data["token"]
    
    # 3. Get Me
    headers = {"Authorization": f"Bearer {token}"}
    response = await client.get("/auth/me", headers=headers)
    assert response.status_code == 200
    assert response.json()["email"] == "integration@example.com"

@pytest.mark.asyncio
async def test_leaderboard_flow(client: AsyncClient):
    # 1. Signup user
    signup_payload = {
        "username": "gamer1",
        "email": "gamer1@example.com",
        "password": "password"
    }
    response = await client.post("/auth/signup", json=signup_payload)
    token = response.json()["token"]
    headers = {"Authorization": f"Bearer {token}"}
    
    # 2. Submit Score
    score_payload = {
        "score": 500,
        "gameMode": "walls"
    }
    response = await client.post("/leaderboard", json=score_payload, headers=headers)
    assert response.status_code == 200
    
    # 3. Get Leaderboard
    response = await client.get("/leaderboard?gameMode=walls")
    assert response.status_code == 200
    entries = response.json()
    assert len(entries) > 0
    assert entries[0]["username"] == "gamer1"
    assert entries[0]["score"] == 500

@pytest.mark.asyncio
async def test_sessions_flow(client: AsyncClient):
    # 1. Get sessions (should be empty initially or whatever is in DB, but this is a fresh test DB)
    response = await client.get("/sessions")
    assert response.status_code == 200
    # Note: We don't have an endpoint to CREATE a session explicitly in the API yet, 
    # sessions are usually created via WebSocket or internal logic.
    # But we can verify the endpoint works.
    assert isinstance(response.json(), list)
