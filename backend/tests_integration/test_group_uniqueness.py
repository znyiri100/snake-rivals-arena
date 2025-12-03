import pytest

@pytest.mark.asyncio
async def test_username_uniqueness_per_group(client):
    # Create first user in group 'groupA'
    payload1 = {
        "username": "duplicate",
        "email": "user1@example.com",
        "password": "pass",
        "new_group_name": "groupA"
    }
    resp1 = await client.post("/auth/signup", json=payload1)
    assert resp1.status_code == 200

    # Create second user in a different group 'groupB' with same username -> should succeed
    payload2 = {
        "username": "duplicate",
        "email": "user2@example.com",
        "password": "pass",
        "new_group_name": "groupB"
    }
    resp2 = await client.post("/auth/signup", json=payload2)
    assert resp2.status_code == 200

    # Get groups to find groupA id
    groups_resp = await client.get("/auth/groups")
    assert groups_resp.status_code == 200
    groups = groups_resp.json()
    groupA = next((g for g in groups if g["name"] == "groupA"), None)
    assert groupA is not None
    groupA_id = groupA["id"]

    # Attempt to create another user with same username in groupA -> should fail
    payload3 = {
        "username": "duplicate",
        "email": "user3@example.com",
        "password": "pass",
        "group_ids": [groupA_id]
    }
    resp3 = await client.post("/auth/signup", json=payload3)
    assert resp3.status_code == 400
    assert "already exists in one of the selected groups" in resp3.json().get("detail", "")


@pytest.mark.asyncio
async def test_email_uniqueness_per_group(client):
    # Create first user in group 'groupX'
    payload1 = {
        "username": "userx1",
        "email": "sameemail@example.com",
        "password": "pass",
        "new_group_name": "groupX"
    }
    resp1 = await client.post("/auth/signup", json=payload1)
    assert resp1.status_code == 200

    # Create second user in different group 'groupY' with same email -> should succeed
    payload2 = {
        "username": "usery1",
        "email": "sameemail@example.com",
        "password": "pass",
        "new_group_name": "groupY"
    }
    resp2 = await client.post("/auth/signup", json=payload2)
    assert resp2.status_code == 200

    # Find groupX id
    groups_resp = await client.get("/auth/groups")
    groups = groups_resp.json()
    groupX = next((g for g in groups if g["name"] == "groupX"), None)
    assert groupX is not None
    groupX_id = groupX["id"]

    # Attempt to create another user with same email in groupX -> should fail
    payload3 = {
        "username": "userx2",
        "email": "sameemail@example.com",
        "password": "pass",
        "group_ids": [groupX_id]
    }
    resp3 = await client.post("/auth/signup", json=payload3)
    assert resp3.status_code == 400
    assert "already exists in one of the selected groups" in resp3.json().get("detail", "")
