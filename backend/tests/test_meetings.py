import os
import tempfile

os.environ["DB_PATH"] = os.path.join(tempfile.mkdtemp(), "test.db")

from fastapi.testclient import TestClient  # noqa: E402

from app.core import config  # noqa: E402
from app.main import app  # noqa: E402

config.N8N_API_KEY = "n8n-test-key"
c = TestClient(app)
KEY = {"X-API-Key": "n8n-test-key"}

MEETING = {
    "external_id": "meet-xqt-launch-sync",
    "title": "Spring launch sync",
    "date": "2026-09-24",
    "time": "10:00",
    "duration": 42,
    "platform": "Google Meet",
    "url": "https://meet.google.com/xqt-launch-sync",
    "people": ["Paula Reyes", "Sam Taylor"],
    "notes": [
        {"h": "Next steps"},
        {"t": "00:27", "who": "Sam Taylor", "text": "Someone should draft the FAQ for the pricing change. I will take it."},
        {"t": "00:31", "who": "Paula Reyes", "text": "I will write the mapping for the two missing tiers."},
    ],
    "summary": "The team reviewed launch readiness.",
    "decisions": ["Launch email pushed by one week"],
    "tasks": [
        {"title": "Draft FAQ for the pricing change", "who": "Sam Taylor", "due": "2026-09-29", "label": "Content", "src": 1, "why": "Sam volunteered.", "description": "Customers will ask how pricing changes their plan."},
        {"title": "Map the two missing legacy tiers", "who": "Paula Reyes", "due": "2026-09-27", "label": "Engineering", "src": 2, "why": "Paula committed.", "description": ""},
    ],
}


def test_meetings_flow():
    assert c.post("/meetings", json=MEETING).status_code == 401
    assert c.post("/meetings", json=MEETING, headers={"X-API-Key": "wrong"}).status_code == 401
    bad = {**MEETING, "tasks": [{"title": ""}]}
    assert c.post("/meetings", json=bad, headers=KEY).status_code == 422

    r = c.post("/meetings", json=MEETING, headers=KEY)
    assert r.status_code == 201
    mid = r.json()["id"]
    # Same external_id replaces instead of duplicating.
    r = c.post("/meetings", json={**MEETING, "summary": "Updated."}, headers=KEY)
    assert r.json()["id"] == mid

    assert c.get("/meetings").status_code == 401
    signup = {"email": "meet@b.co", "password": "REDACTED_LOCAL_CREDENTIAL", "first_name": "Ada", "last_name": "Lovelace"}
    auth = {"Authorization": f"Bearer {c.post('/signup', json=signup).json()['token']}"}
    assert c.get("/meetings", headers=auth).json() == [
        {"id": mid, "title": "Spring launch sync", "date": "2026-09-24", "time": "10:00", "platform": "Google Meet", "task_count": 2}
    ]

    m = c.get(f"/meetings/{mid}", headers=auth).json()
    assert m["summary"] == "Updated."
    assert m["decisions"] == MEETING["decisions"]
    assert m["tasks"] == [{**t, "task_id": None} for t in MEETING["tasks"]]
    assert m["notes"][0] == {"t": None, "who": None, "text": None, "h": "Next steps"}
    assert c.get("/meetings/999", headers=auth).status_code == 404


if __name__ == "__main__":
    test_meetings_flow()
    print("ok")
