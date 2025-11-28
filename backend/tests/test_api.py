from fastapi.testclient import TestClient
from app.main import app
from app.db import db

client = TestClient(app)

def setup_module(module):
    # Reset db before tests if needed, but for now we rely on seeded data
    pass

def test_read_main():
    response = client.get("/")
    assert response.status_code == 200
    assert response.json() == {"message": "Welcome to Snake Rivals Arena API"}

def test_login_success():
    response = client.post("/auth/login", json={"email": "master@example.com", "password": "password123"})
    assert response.status_code == 200
    data = response.json()
    assert data["success"] is True
    assert "token" in data
    assert data["user"]["username"] == "SnakeMaster"

def test_login_failure():
    response = client.post("/auth/login", json={"email": "master@example.com", "password": "wrongpassword"})
    assert response.status_code == 401

def test_signup_success():
    response = client.post("/auth/signup", json={"username": "NewUser", "email": "new@example.com", "password": "password123"})
    assert response.status_code == 200
    data = response.json()
    assert data["success"] is True
    assert data["user"]["username"] == "NewUser"

def test_signup_existing_email():
    response = client.post("/auth/signup", json={"username": "SnakeMaster", "email": "master@example.com", "password": "password123"})
    assert response.status_code == 400

def test_get_leaderboard():
    response = client.get("/leaderboard")
    assert response.status_code == 200
    data = response.json()
    assert len(data) > 0
    assert data[0]["username"] == "SnakeMaster"

def test_submit_score_unauthorized():
    response = client.post("/leaderboard/", json={"score": 100, "gameMode": "walls"})
    assert response.status_code == 401

def test_submit_score_authorized():
    # Login first
    login_res = client.post("/auth/login", json={"email": "master@example.com", "password": "password123"})
    token = login_res.json()["token"]
    
    response = client.post(
        "/leaderboard/", 
        json={"score": 5000, "gameMode": "walls"},
        headers={"Authorization": f"Bearer {token}"}
    )
    assert response.status_code == 200
    
    # Verify score is in leaderboard
    lb_res = client.get("/leaderboard")
    data = lb_res.json()
    assert data[0]["score"] == 5000
    assert data[0]["username"] == "SnakeMaster"

def test_get_sessions():
    response = client.get("/sessions")
    assert response.status_code == 200
    data = response.json()
    assert len(data) > 0
    assert data[0]["isActive"] is True
