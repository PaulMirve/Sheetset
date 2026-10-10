import os
import tempfile

os.environ["DB_PATH"] = os.path.join(tempfile.mkdtemp(), "test.db")

from fastapi.testclient import TestClient  # noqa: E402

from app.core import config  # noqa: E402
from app.db.models import Board, User  # noqa: E402
from app.db.session import SessionLocal  # noqa: E402
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
    "board": "LAUN",
    "attendees": ["Meet@b.co", "outsider@b.co"],
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


def auth(email):
    body = {"email": email, "password": "fixture-only-password-9284", "first_name": "Ada", "last_name": "Lovelace"}
    return {"Authorization": f"Bearer {c.post('/signup', json=body).json()['token']}"}


def test_meetings_flow():
    me, outsider, absent = auth("meet@b.co"), auth("outsider@b.co"), auth("absent@b.co")
    board = c.post("/boards", json={"name": "Launch"}, headers=me).json()
    bid = board["id"]
    assert board["key"] == "LAUN"

    assert c.post("/meetings", json=MEETING).status_code == 401
    assert c.post("/meetings", json=MEETING, headers={"X-API-Key": "wrong"}).status_code == 401
    for bad in (
        {**MEETING, "tasks": [{"title": ""}]},
        {**MEETING, "board": "NOPE"},
        {**MEETING, "attendees": []},
        {**MEETING, "url": "javascript:alert(1)"},
    ):
        assert c.post("/meetings", json=bad, headers=KEY).status_code == 422

    r = c.post("/meetings", json=MEETING, headers=KEY)
    assert r.status_code == 201
    mid = r.json()["id"]
    # Same external_id replaces instead of duplicating.
    r = c.post("/meetings", json={**MEETING, "summary": "Updated."}, headers=KEY)
    assert r.json()["id"] == mid

    assert c.get(f"/meetings?board_id={bid}").status_code == 401
    assert c.get(f"/meetings?board_id={bid}", headers=me).json() == [
        {"id": mid, "title": "Spring launch sync", "date": "2026-09-24", "time": "10:00", "platform": "Google Meet", "task_count": 2}
    ]

    m = c.get(f"/meetings/{mid}", headers=me).json()
    assert m["summary"] == "Updated."
    assert m["board_id"] == bid
    assert m["decisions"] == MEETING["decisions"]
    assert m["tasks"] == [{**t, "task_id": None} for t in MEETING["tasks"]]
    assert m["notes"][0] == {"t": None, "who": None, "text": None, "h": "Next steps"}
    assert c.get("/meetings/999", headers=me).status_code == 404

    # Attended but not on the board, or on the board but didn't attend: same 404 as a missing meeting.
    assert c.get(f"/meetings/{mid}", headers=outsider).status_code == 404
    assert c.get(f"/meetings?board_id={bid}", headers=outsider).status_code == 404
    assert c.delete(f"/meetings/{mid}/tasks/0", headers=outsider).status_code == 404
    with SessionLocal() as s:
        b = s.get(Board, bid)
        b.members += [s.query(User).filter_by(email="absent@b.co").one()]
        s.commit()
    assert c.get(f"/meetings?board_id={bid}", headers=absent).json() == []
    assert c.get(f"/meetings/{mid}", headers=absent).status_code == 404

    # Accepting only goes to the meeting's own board.
    other = c.post("/boards", json={"name": "Other"}, headers=me).json()
    accept = {"board_id": other["id"], "column_id": other["columns"][0]["id"]}
    assert c.post(f"/meetings/{mid}/tasks/0/accept", json=accept, headers=me).status_code == 422
    accept = {"board_id": bid, "column_id": board["columns"][0]["id"]}
    assert c.post(f"/meetings/{mid}/tasks/0/accept", json=accept, headers=me).status_code == 201


if __name__ == "__main__":
    test_meetings_flow()
    print("ok")
