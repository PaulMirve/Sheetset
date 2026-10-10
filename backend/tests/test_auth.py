import os
import tempfile

os.environ["DB_PATH"] = os.path.join(tempfile.mkdtemp(), "test.db")

from fastapi.testclient import TestClient  # noqa: E402

from app.main import app  # noqa: E402

c = TestClient(app)


SIGNUP = {"email": "a@b.co", "password": "fixture-only-password-9284", "first_name": "Ada", "last_name": "Lovelace"}


def test_auth_flow():
    assert c.post("/signup", json=SIGNUP).status_code == 201
    assert c.post("/signup", json=SIGNUP).status_code == 409
    assert c.post("/signup", json={**SIGNUP, "email": "c@b.co", "password": "short"}).status_code == 400
    assert c.post("/signup", json={**SIGNUP, "email": "d@b.co", "first_name": ""}).status_code == 422
    assert c.post("/login", json={"email": "a@b.co", "password": "wrongpass"}).status_code == 401
    token = c.post("/login", json={"email": "a@b.co", "password": "fixture-only-password-9284"}).json()["token"]
    me = c.get("/me", headers={"Authorization": f"Bearer {token}"}).json()
    assert me == {"id": 1, "email": "a@b.co", "first_name": "Ada", "last_name": "Lovelace", "is_active": True}
    assert c.get("/me", headers={"Authorization": f"Bearer {token}x"}).status_code == 401
    assert c.get("/me").status_code == 401

    from app.db.models import User
    from app.db.session import SessionLocal

    with SessionLocal() as s:
        s.get(User, 1).is_active = False
        s.commit()
    assert c.get("/me", headers={"Authorization": f"Bearer {token}"}).status_code == 403
    assert c.post("/login", json={"email": "a@b.co", "password": "fixture-only-password-9284"}).status_code == 403

    # Unknown emails fail like wrong passwords, and repeated failures get throttled.
    bad = {"email": "nobody@b.co", "password": "wrongpass"}
    codes = [c.post("/login", json=bad).status_code for _ in range(10)]
    assert codes[0] == 401 and codes[-1] == 429


if __name__ == "__main__":
    test_auth_flow()
    print("ok")
