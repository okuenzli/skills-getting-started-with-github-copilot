from fastapi.testclient import TestClient
from src.app import app, activities

client = TestClient(app)


def test_get_activities_returns_dict():
    resp = client.get("/activities")
    assert resp.status_code == 200
    data = resp.json()
    assert isinstance(data, dict)
    # Ensure known activity exists
    assert "Chess Club" in data


def test_signup_and_delete_participant():
    activity = "Chess Club"
    test_email = "testuser@example.com"

    # Ensure test email not present
    if test_email in activities[activity]["participants"]:
        activities[activity]["participants"].remove(test_email)

    # Signup
    resp = client.post(f"/activities/{activity}/signup?email={test_email}")
    assert resp.status_code == 200
    assert test_email in activities[activity]["participants"]

    # Signup again should fail (already signed up)
    resp2 = client.post(f"/activities/{activity}/signup?email={test_email}")
    assert resp2.status_code == 400

    # Delete participant
    del_resp = client.delete(f"/activities/{activity}/participants?email={test_email}")
    assert del_resp.status_code == 200
    assert test_email not in activities[activity]["participants"]

    # Delete again should return 404
    del_resp2 = client.delete(f"/activities/{activity}/participants?email={test_email}")
    assert del_resp2.status_code == 404