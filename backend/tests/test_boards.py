import os
import tempfile

os.environ["DB_PATH"] = os.path.join(tempfile.mkdtemp(), "test.db")

from fastapi.testclient import TestClient  # noqa: E402

from app.main import app  # noqa: E402

c = TestClient(app)


def auth(email):
    body = {"email": email, "password": "REDACTED_LOCAL_CREDENTIAL", "first_name": "Ada", "last_name": "Lovelace"}
    return {"Authorization": f"Bearer {c.post('/signup', json=body).json()['token']}"}


def test_boards_flow():
    me, other = auth("boards@b.co"), auth("other@b.co")
    assert c.get("/boards").status_code == 401
    assert c.post("/boards", json={"name": "  "}, headers=me).status_code == 422

    b = c.post("/boards", json={"name": "Platform Launch", "shared": True}, headers=me).json()
    assert (b["key"], b["shared"]) == ("PLAT", True)
    assert [col["name"] for col in b["columns"]] == ["To do", "Doing", "Code review", "Ready for QA", "Done"]
    assert c.post("/boards", json={"name": "Platform"}, headers=me).json()["key"] == "PLAT2"
    assert c.post("/boards", json={"name": "✨"}, headers=me).json()["key"] == "B"

    assert len(c.get("/boards", headers=me).json()) == 3
    assert c.get("/boards", headers=other).json() == []
    assert c.get(f"/boards/{b['id']}", headers=other).status_code == 404
    assert c.patch(f"/boards/{b['id']}", json={"name": "Launch"}, headers=me).json()["name"] == "Launch"
    assert c.patch(f"/boards/{b['id']}", json={"name": None}, headers=me).status_code == 422

    # Workflow columns are fixed; retired operations cannot delete tasks.
    assert [col["code"] for col in b["columns"]] == ["todo", "doing", "code_review", "ready_for_qa", "done"]
    col = b["columns"][0]["id"]
    task = c.post(f"/boards/{b['id']}/tasks", json={"title": "t", "column_id": col}, headers=me).json()
    assert c.post(f"/boards/{b['id']}/columns", json={"name": "Review"}, headers=me).status_code == 404
    assert c.patch(f"/columns/{col}", json={"name": "QA", "position": 0}, headers=me).status_code == 404
    assert c.delete(f"/columns/{col}", headers=me).status_code == 404
    assert c.get(f"/tasks/{task['id']}", headers=me).status_code == 200
    assert c.get(f"/boards/{b['id']}", headers=me).json()["columns"] == b["columns"]

    assert c.delete(f"/boards/{b['id']}", headers=other).status_code == 404
    assert c.delete(f"/boards/{b['id']}", headers=me).status_code == 204
    assert c.get(f"/boards/{b['id']}", headers=me).status_code == 404


if __name__ == "__main__":
    test_boards_flow()
    print("ok")
