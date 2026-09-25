import os
import tempfile

os.environ["DB_PATH"] = os.path.join(tempfile.mkdtemp(), "test.db")

from fastapi.testclient import TestClient  # noqa: E402

from app.core import config  # noqa: E402
from app.db.models import Board, Column, User  # noqa: E402
from app.db.session import SessionLocal  # noqa: E402
from app.main import app  # noqa: E402

config.N8N_API_KEY = "n8n-test-key"
c = TestClient(app)


def auth(email):
    body = {"email": email, "password": "REDACTED_LOCAL_CREDENTIAL", "first_name": "Ada", "last_name": "Lovelace"}
    return {"Authorization": f"Bearer {c.post('/signup', json=body).json()['token']}"}


def test_tasks_flow():
    me, other = auth("tasks@b.co"), auth("other@b.co")
    with SessionLocal() as s:  # no board api yet
        u = s.query(User).filter_by(email="tasks@b.co").one()
        b = Board(key="APP", name="Launch", owner_id=u.id, members=[u])
        b.columns = [Column(name="To do", position=0), Column(name="Done", position=1)]
        s.add(b)
        s.commit()
        bid, todo, done, uid = b.id, b.columns[0].id, b.columns[1].id, u.id

    url = f"/boards/{bid}/tasks"
    assert c.get(url).status_code == 401
    assert c.get(url, headers=other).status_code == 404  # not a member
    assert c.post(url, json={"title": "x", "column_id": 999}, headers=me).status_code == 422
    assert c.post(url, json={"title": "x", "column_id": todo, "assignee_id": 999}, headers=me).status_code == 422

    new = lambda title, **kw: c.post(url, json={"title": title, "column_id": todo, **kw}, headers=me).json()  # noqa: E731
    a = new("A", subtasks=[{"title": "one"}], assignee_id=uid, due="2026-10-01")
    b_, c_ = new("B"), new("C")
    assert (a["number"], a["position"], c_["position"]) == (1, 0, 2)
    assert a["subtasks"][0]["title"] == "one" and not a["subtasks"][0]["done"]
    assert c.get(f"/tasks/{a['id']}", headers=other).status_code == 404

    # Reorder within a column, then move across.
    r = c.patch(f"/tasks/{c_['id']}", json={"position": 0}, headers=me)
    assert r.status_code == 200
    assert [t["title"] for t in c.get(url, headers=me).json()] == ["C", "A", "B"]
    r = c.patch(f"/tasks/{a['id']}", json={"column_id": done, "title": "A2", "due": None}, headers=me).json()
    assert (r["column_id"], r["position"], r["title"], r["due"]) == (done, 0, "A2", None)
    assert c.patch(f"/tasks/{a['id']}", json={"title": None}, headers=me).status_code == 422
    r = c.patch(f"/tasks/{a['id']}", json={"subtasks": [{"title": "two", "done": True}]}, headers=me).json()
    assert [(s["title"], s["done"]) for s in r["subtasks"]] == [("two", True)]

    # Epics must be epics on the same board.
    assert c.patch(f"/tasks/{a['id']}", json={"epic_id": b_["id"]}, headers=me).status_code == 422
    epic = new("Epic", is_epic=True)
    assert c.patch(f"/tasks/{a['id']}", json={"epic_id": epic["id"]}, headers=me).json()["epic_id"] == epic["id"]

    assert c.delete(f"/tasks/{b_['id']}", headers=me).status_code == 204
    assert c.get(f"/tasks/{b_['id']}", headers=me).status_code == 404

    # Suggested tasks: create, edit, delete, accept.
    meeting = {"external_id": "m1", "title": "Sync", "date": "2026-09-24", "summary": "s",
               "tasks": [{"title": "Draft FAQ", "due": "2026-09-29", "label": "Content", "why": "volunteered",
                          "description": "FAQ for the pricing change"}]}
    mid = c.post("/meetings", json=meeting, headers={"X-API-Key": "n8n-test-key"}).json()["id"]
    sug = f"/meetings/{mid}/tasks"
    assert c.post(sug, json={"title": "Extra"}).status_code == 401
    assert [t["title"] for t in c.post(sug, json={"title": "Extra"}, headers=me).json()] == ["Draft FAQ", "Extra"]
    assert c.put(f"{sug}/1", json={"title": "Extra2", "why": "w"}, headers=me).json()[1]["title"] == "Extra2"
    assert c.put(f"{sug}/9", json={"title": "x"}, headers=me).status_code == 404
    assert len(c.delete(f"{sug}/1", headers=me).json()) == 1

    acc = f"{sug}/0/accept"
    assert c.post(acc, json={"board_id": bid, "column_id": todo}, headers=other).status_code == 404
    r = c.post(acc, json={"board_id": bid, "column_id": todo, "label": "Docs"}, headers=me)
    assert r.status_code == 201
    t = r.json()
    assert (t["title"], t["due"], t["label"]) == ("Draft FAQ", "2026-09-29", "Docs")
    assert t["description"] == "FAQ for the pricing change"
    assert c.get(f"/meetings/{mid}", headers=me).json()["tasks"][0]["task_id"] == t["id"]
    assert c.post(acc, json={"board_id": bid, "column_id": todo}, headers=me).status_code == 409


if __name__ == "__main__":
    test_tasks_flow()
    print("ok")
