from fastapi.testclient import TestClient

from app.main import app

c = TestClient(app)


def test_attention_flags_keep_stage_and_guard_every_forward_move():
    token = c.post("/signup", json={
        "email": "workflow@b.co", "password": "REDACTED_LOCAL_CREDENTIAL", "first_name": "Ada", "last_name": "Lovelace",
    }).json()["token"]
    headers = {"Authorization": f"Bearer {token}"}
    board = c.post("/boards", json={"name": "Workflow"}, headers=headers).json()
    columns = {col["code"]: col["id"] for col in board["columns"]}
    task = c.post(f"/boards/{board['id']}/tasks", json={
        "title": "Review corrections", "column_id": columns["doing"],
    }, headers=headers).json()
    url = f"/tasks/{task['id']}"
    assert (task["is_blocked"], task["needs_human_review"]) == (False, False)

    for flag in ("is_blocked", "needs_human_review"):
        marked = c.patch(url, json={flag: True}, headers=headers).json()
        assert marked["column_id"] == columns["doing"] and marked[flag]
        for stage in ("code_review", "ready_for_qa", "done"):
            assert c.patch(url, json={"column_id": columns[stage]}, headers=headers).status_code == 409
        assert c.patch(url, json={"position": 0}, headers=headers).status_code == 200
        assert c.patch(url, json={"column_id": columns["todo"]}, headers=headers).status_code == 200
        assert c.patch(url, json={"column_id": columns["doing"]}, headers=headers).status_code == 409
        # A single update may clear the flag and advance, with the effective values validated.
        r = c.patch(url, json={flag: False, "column_id": columns["doing"]}, headers=headers)
        assert r.status_code == 200 and not r.json()[flag]
        assert c.patch(url, json={flag: None}, headers=headers).status_code == 422

    c.patch(url, json={"is_blocked": True, "needs_human_review": True}, headers=headers)
    assert c.patch(url, json={"is_blocked": False, "column_id": columns["done"]}, headers=headers).status_code == 409
    # The failed request must not persist its partial flag change.
    assert c.get(url, headers=headers).json()["is_blocked"]
    c.patch(url, json={"is_blocked": False, "needs_human_review": False}, headers=headers)
    for stage in ("code_review", "doing", "code_review", "ready_for_qa", "done"):
        assert c.patch(url, json={"column_id": columns[stage]}, headers=headers).status_code == 200
