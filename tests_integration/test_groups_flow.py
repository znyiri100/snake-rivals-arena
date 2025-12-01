import requests
import uuid
import time

BASE_URL = "http://localhost:8000/api"

def generate_user():
    unique_id = str(uuid.uuid4())[:8]
    return {
        "username": f"user_{unique_id}",
        "email": f"user_{unique_id}@example.com",
        "password": "password123"
    }

def test_groups_flow():
    print("Starting Groups Flow Test...")

    # 1. Signup User A with New Group "GroupA"
    user_a = generate_user()
    group_a_name = f"GroupA_{uuid.uuid4()}"
    print(f"\n1. Signing up {user_a['username']} with new group '{group_a_name}'...")
    
    resp = requests.post(f"{BASE_URL}/auth/signup", json={
        **user_a,
        "new_group_name": group_a_name
    })
    if resp.status_code != 200:
        print(f"Failed to signup User A: {resp.text}")
        return
    
    data_a = resp.json()
    token_a = data_a["token"]
    user_a_id = data_a["user"]["id"]
    groups_a = data_a["user"]["groups"]
    
    print(f"User A created. Groups: {groups_a}")
    assert len(groups_a) == 1
    assert groups_a[0]["name"] == group_a_name
    group_a_id = groups_a[0]["id"]

    # 2. Signup User B joining "GroupA"
    user_b = generate_user()
    print(f"\n2. Signing up {user_b['username']} joining existing group '{group_a_name}' ({group_a_id})...")
    
    resp = requests.post(f"{BASE_URL}/auth/signup", json={
        **user_b,
        "group_ids": [group_a_id]
    })
    if resp.status_code != 200:
        print(f"Failed to signup User B: {resp.text}")
        return

    data_b = resp.json()
    token_b = data_b["token"]
    groups_b = data_b["user"]["groups"]
    
    print(f"User B created. Groups: {groups_b}")
    assert len(groups_b) == 1
    assert groups_b[0]["id"] == group_a_id

    # 3. Signup User C with no group (should default to "other")
    user_c = generate_user()
    print(f"\n3. Signing up {user_c['username']} with no group (expecting 'other')...")
    
    resp = requests.post(f"{BASE_URL}/auth/signup", json={
        **user_c
    })
    if resp.status_code != 200:
        print(f"Failed to signup User C: {resp.text}")
        return

    data_c = resp.json()
    token_c = data_c["token"]
    groups_c = data_c["user"]["groups"]
    
    print(f"User C created. Groups: {groups_c}")
    assert len(groups_c) == 1
    assert groups_c[0]["name"] == "other"

    # 4. Submit Scores
    print("\n4. Submitting scores...")
    
    # User A: 100
    requests.post(f"{BASE_URL}/leaderboard", json={"score": 100, "gameMode": "passthrough"}, headers={"Authorization": f"Bearer {token_a}"})
    # User B: 200
    requests.post(f"{BASE_URL}/leaderboard", json={"score": 200, "gameMode": "passthrough"}, headers={"Authorization": f"Bearer {token_b}"})
    # User C: 300
    requests.post(f"{BASE_URL}/leaderboard", json={"score": 300, "gameMode": "passthrough"}, headers={"Authorization": f"Bearer {token_c}"})

    # 5. Check Leaderboard for Group A
    print(f"\n5. Checking Leaderboard for Group A ({group_a_id})...")
    resp = requests.get(f"{BASE_URL}/leaderboard", params={"group_id": group_a_id})
    lb_a = resp.json()
    print(f"Entries: {[e['username'] + ': ' + str(e['score']) for e in lb_a]}")
    
    usernames_a = [e['username'] for e in lb_a]
    assert user_a['username'] in usernames_a
    assert user_b['username'] in usernames_a
    assert user_c['username'] not in usernames_a
    print("SUCCESS: Group A leaderboard contains A and B, but not C.")

    # 6. Check Leaderboard for "other"
    print(f"\n6. Checking Leaderboard for 'other'...")
    # Get 'other' group ID first
    resp = requests.get(f"{BASE_URL}/auth/groups")
    groups = resp.json()
    other_group = next(g for g in groups if g["name"] == "other")
    other_group_id = other_group["id"]
    
    resp = requests.get(f"{BASE_URL}/leaderboard", params={"group_id": other_group_id})
    lb_other = resp.json()
    print(f"Entries: {[e['username'] + ': ' + str(e['score']) for e in lb_other]}")
    
    usernames_other = [e['username'] for e in lb_other]
    assert user_c['username'] in usernames_other
    assert user_a['username'] not in usernames_other
    print("SUCCESS: 'other' leaderboard contains C, but not A.")

    print("\nALL TESTS PASSED!")

if __name__ == "__main__":
    try:
        test_groups_flow()
    except Exception as e:
        print(f"\nTEST FAILED: {e}")
