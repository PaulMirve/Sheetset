import os
import tempfile

os.environ["DB_PATH"] = os.path.join(tempfile.mkdtemp(), "test.db")

from fastapi.testclient import TestClient  # noqa: E402

from app.main import app  # noqa: E402

c = TestClient(app)


SIGNUP = {"email": "a@b.co", "password": "REDACTED_LOCAL_CREDENTIAL", "first_name": "Ada", "last_name": "Lovelace"}


def test_auth_flow():
    assert c.post("/signup", json=SIGNUP).status_code == 201
    assert c.post("/signup", json=SIGNUP).status_code == 409
    assert c.post("/signup", json={**SIGNUP, "email": "c@b.co", "password": "short"}).status_code == 400
    assert c.post("/signup", json={**SIGNUP, "email": "d@b.co", "first_name": ""}).status_code == 422
    assert c.post("/login", json={"email": "a@b.co", "password": "wrongpass"}).status_code == 401
    token = c.post("/login", json={"email": "a@b.co", "password": "REDACTED_LOCAL_CREDENTIAL"}).json()["token"]
    me = c.get("/me", headers={"Authorization": f"Bearer {token}"}).json()
    assert me == {"id": 1, "email": "a@b.co", "first_name": "Ada", "last_name": "Lovelace", "is_active": True}
    assert c.get("/me", headers={"Authorization": f"Bearer {token}x"}).status_code == 401
    assert c.get("/me").status_code == 401

    from app.db.session import db

    db.execute("UPDATE users SET is_active = 0 WHERE id = 1")
    db.commit()
    assert c.get("/me", headers={"Authorization": f"Bearer {token}"}).status_code == 403
    assert c.post("/login", json={"email": "a@b.co", "password": "REDACTED_LOCAL_CREDENTIAL"}).status_code == 403


if __name__ == "__main__":
    test_auth_flow()
    print("ok")
