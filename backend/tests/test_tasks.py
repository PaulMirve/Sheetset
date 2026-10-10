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

    # Blockers: other tasks on the same board, replaced as a list, dropped when the blocker is deleted.
    assert c.patch(f"/tasks/{a['id']}", json={"blocked_by": [a["id"]]}, headers=me).status_code == 422
    assert c.patch(f"/tasks/{a['id']}", json={"blocked_by": [999]}, headers=me).status_code == 422
    r = c.patch(f"/tasks/{a['id']}", json={"blocked_by": [b_["id"], c_["id"]]}, headers=me).json()
    assert sorted(r["blocked_by"]) == sorted([b_["id"], c_["id"]])
    d = new("D", blocked_by=[c_["id"]])
    assert d["blocked_by"] == [c_["id"]]
    # Blocked: can't move right until the blocker is in the last column.
    r = c.patch(f"/tasks/{d['id']}", json={"column_id": done}, headers=me)
    assert (r.status_code, r.json()["detail"]) == (409, f"blocked by APP-{c_['number']}")
    assert c.patch(f"/tasks/{d['id']}", json={"position": 0}, headers=me).status_code == 200  # reorder is fine
    c.patch(f"/tasks/{c_['id']}", json={"column_id": done}, headers=me)
    assert c.patch(f"/tasks/{d['id']}", json={"column_id": done}, headers=me).status_code == 200
    assert c.patch(f"/tasks/{c_['id']}", json={"column_id": todo}, headers=me).status_code == 200  # moving back is fine

    assert c.delete(f"/tasks/{b_['id']}", headers=me).status_code == 204
    assert c.get(f"/tasks/{b_['id']}", headers=me).status_code == 404
    assert c.get(f"/tasks/{a['id']}", headers=me).json()["blocked_by"] == [c_["id"]]

    # Suggested tasks: create, edit, delete, accept.
    meeting = {"external_id": "m1", "title": "Sync", "date": "2026-09-24", "summary": "s",
               "board": "APP", "attendees": ["tasks@b.co", "other@b.co"],
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
    assert (t["source"]["meeting_id"], t["source"]["title"], t["source"]["date"]) == (mid, "Sync", "2026-09-24")
    assert c.get(f"/meetings/{mid}", headers=me).json()["tasks"][0]["task_id"] == t["id"]
    assert c.post(acc, json={"board_id": bid, "column_id": todo}, headers=me).status_code == 409
    # Deleting the task frees the suggestion to be added again.
    assert c.delete(f"/tasks/{t['id']}", headers=me).status_code == 204
    assert c.get(f"/meetings/{mid}", headers=me).json()["tasks"][0]["task_id"] is None
    t = c.post(acc, json={"board_id": bid, "column_id": todo}, headers=me).json()
    assert c.get(f"/meetings/{mid}", headers=me).json()["tasks"][0]["task_id"] == t["id"]

    # An attendee who isn't on the board can't see or accept it.
    assert c.get(f"/meetings/{mid}", headers=other).status_code == 404
    # Editing the suggestion keeps the link.
    assert c.put(f"{sug}/0", json={"title": "Draft FAQ v2"}, headers=me).json()[0]["task_id"] == t["id"]

    # Files: raw body upload, members only, 10 MB cap, gone with the task.
    files = f"/tasks/{t['id']}/files"
    png = {**me, "Content-Type": "image/png"}
    assert c.post(f"{files}?name=a.png", content=b"img", headers={**other, "Content-Type": "image/png"}).status_code == 404
    assert c.post(f"{files}?name=big.bin", content=b"x" * (10 * 1024 * 1024 + 1), headers=me).status_code == 413
    f = c.post(f"{files}?name=shot one.png", content=b"img", headers=png).json()
    assert (f["name"], f["type"], f["size"]) == ("shot one.png", "image/png", 3)
    assert [x["id"] for x in c.get(f"/tasks/{t['id']}", headers=me).json()["files"]] == [f["id"]]
    r = c.get(f"/files/{f['id']}", headers=me)
    assert (r.content, r.headers["content-type"]) == (b"img", "image/png")
    assert c.get(f"/files/{f['id']}", headers=other).status_code == 404
    # Anything that could run script comes back as a download, not as itself.
    html = c.post(f"{files}?name=x.html", content=b"<script>", headers={**me, "Content-Type": "text/html"}).json()
    r = c.get(f"/files/{html['id']}", headers=me)
    assert r.headers["content-type"] == "application/octet-stream"
    assert r.headers["content-disposition"].startswith("attachment")
    assert c.delete(f"/files/{html['id']}", headers=me).status_code == 204
    assert c.delete(f"/files/{f['id']}", headers=me).status_code == 204
    assert c.get(f"/tasks/{t['id']}", headers=me).json()["files"] == []


if __name__ == "__main__":
    test_tasks_flow()
    print("ok")
