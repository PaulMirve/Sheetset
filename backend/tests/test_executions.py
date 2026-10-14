import os
import tempfile
from uuid import uuid4

os.environ["DB_PATH"] = os.path.join(tempfile.mkdtemp(), "test.db")

from fastapi.testclient import TestClient  # noqa: E402
from sqlalchemy import select  # noqa: E402

from app.db.models import Board, User  # noqa: E402
from app.db.session import SessionLocal  # noqa: E402
from app.main import app  # noqa: E402

c = TestClient(app)


def auth(email):
    body = {"email": email, "password": "fixture-only-password-9284", "first_name": "Ada", "last_name": "Lovelace"}
    return {"Authorization": f"Bearer {c.post('/signup', json=body).json()['token']}"}


def setup(email="exec@b.co"):
    """A board with one To do task, claimed by a fresh execution and escalated to a human."""
    me = auth(email)
    board = c.post("/boards", json={"name": "Agents"}, headers=me).json()
    cols = {col["code"]: col["id"] for col in board["columns"]}
    task = c.post(f"/boards/{board['id']}/tasks", json={"title": "Ship it", "column_id": cols["todo"]},
                  headers=me).json()
    run = claim(task, board, me)
    escalated = c.post(f"/executions/{run}/finish", json={
        "status": "needs_human_review", "expected_column_id": cols["doing"],
    }, headers=me)
    assert escalated.status_code == 200 and escalated.json()["active_task_id"] is None
    return me, board, cols, task, run


def claim(task, board, headers):
    run = str(uuid4())
    r = c.post(f"/tasks/{task['id']}/claim", json={
        "execution_id": run, "project": "kanban", "profile": "personal",
        "developer": "claude", "reviewer": "codex", "expected_board_id": board["id"],
    }, headers=headers)
    assert r.status_code == 200, r.json()
    return run


def resume(run, task_id, headers, *, column, updated_at=None):
    """Resume as a person would after inspecting the task: with the column and updated_at they saw."""
    seen = c.get(f"/tasks/{task_id}", headers=headers).json()
    return c.post(f"/executions/{run}/resume", json={
        "expected_column_id": column,
        "expected_task_updated_at": updated_at or seen["updated_at"],
    }, headers=headers)


def test_resume_after_escalation_hands_the_task_back():
    me, _, cols, task, run = setup()
    url = f"/tasks/{task['id']}"
    escalated = c.get(url, headers=me).json()
    assert (escalated["column_id"], escalated["needs_human_review"]) == (cols["doing"], True)

    r = resume(run, task["id"], me, column=cols["doing"])
    assert r.status_code == 200, r.json()
    execution = r.json()
    assert (execution["status"], execution["active_task_id"], execution["finished_at"]) == ("doing", task["id"], None)
    after = c.get(url, headers=me).json()
    assert (after["column_id"], after["needs_human_review"]) == (cols["doing"], False)
    kinds = [e["kind"] for e in c.get(f"/executions/{run}/events", headers=me).json()]
    assert kinds == ["claimed", "finished", "resumed"]

    # A retry observes the resumed execution instead of failing or resuming twice.
    retry = resume(run, task["id"], me, column=cols["doing"])
    assert retry.status_code == 200 and retry.json()["status"] == "doing"
    assert [e["kind"] for e in c.get(f"/executions/{run}/events", headers=me).json()].count("resumed") == 1


def test_resume_refuses_a_stale_inspection():
    me, _, cols, task, run = setup()
    r = resume(run, task["id"], me, column=cols["doing"], updated_at="2000-01-01T00:00:00")
    assert r.status_code == 409 and "since recovery inspection" in r.json()["detail"]
    # The task moved since it was inspected.
    assert resume(run, task["id"], me, column=cols["code_review"]).status_code == 409
    c.patch(f"/tasks/{task['id']}", json={"column_id": cols["todo"]}, headers=me)
    assert resume(run, task["id"], me, column=cols["todo"]).status_code == 409
    # Nothing changed on the failed attempts.
    assert c.get(f"/tasks/{task['id']}", headers=me).json()["needs_human_review"]


def test_only_the_executions_owner_can_resume_it():
    me, board, cols, task, run = setup()
    teammate, stranger = auth("teammate@b.co"), auth("stranger@b.co")
    with SessionLocal() as db:
        b = db.get(Board, board["id"])
        # No API adds members yet; share the board directly.
        b.members.append(db.scalar(select(User).where(User.email == "teammate@b.co")))
        db.commit()

    r = resume(run, task["id"], teammate, column=cols["doing"])
    assert r.status_code == 403
    assert c.post(f"/executions/{run}/resume", json={
        "expected_column_id": cols["doing"], "expected_task_updated_at": "2000-01-01T00:00:00",
    }, headers=stranger).status_code == 404
    assert c.get(f"/tasks/{task['id']}", headers=me).json()["needs_human_review"]


def test_resume_refuses_when_another_execution_holds_the_task():
    me, board, cols, task, run = setup()
    url = f"/tasks/{task['id']}"
    # A human sends the task back to To do and a new run picks it up.
    c.patch(url, json={"needs_human_review": False, "column_id": cols["todo"]}, headers=me)
    other = claim(task, board, me)
    # It escalates again while the new run still holds it.
    c.patch(url, json={"needs_human_review": True}, headers=me)

    r = resume(run, task["id"], me, column=cols["doing"])
    assert r.status_code == 409 and "another execution" in r.json()["detail"]
    owners = [e["active_task_id"] for e in c.get(f"/tasks/{task['id']}/executions", headers=me).json()
              if e["id"] == other]
    assert owners == [task["id"]]


def test_resume_respects_attention_flags_and_dependencies():
    me, board, cols, task, run = setup()
    url = f"/tasks/{task['id']}"

    c.patch(url, json={"is_blocked": True}, headers=me)
    r = resume(run, task["id"], me, column=cols["doing"])
    assert r.status_code == 409 and r.json()["detail"] == "task is blocked"
    c.patch(url, json={"is_blocked": False}, headers=me)

    blocker = c.post(f"/boards/{board['id']}/tasks", json={"title": "Schema first", "column_id": cols["todo"]},
                     headers=me).json()
    c.patch(url, json={"blocked_by": [blocker["id"]]}, headers=me)
    r = resume(run, task["id"], me, column=cols["doing"])
    assert r.status_code == 409 and r.json()["detail"].startswith("blocked by")
    assert c.get(url, headers=me).json()["needs_human_review"]

    # Once the dependency is done, the escalated run can resume.
    for stage in ("doing", "code_review", "ready_for_qa", "done"):
        c.patch(f"/tasks/{blocker['id']}", json={"column_id": cols[stage]}, headers=me)
    assert resume(run, task["id"], me, column=cols["doing"]).status_code == 200


def test_only_escalated_executions_resume():
    me = auth("cancel@b.co")
    board = c.post("/boards", json={"name": "Agents"}, headers=me).json()
    cols = {col["code"]: col["id"] for col in board["columns"]}
    task = c.post(f"/boards/{board['id']}/tasks", json={"title": "t", "column_id": cols["todo"]},
                  headers=me).json()
    run = claim(task, board, me)

    # Still running, but a human flagged it: resuming must not clear the flag.
    c.patch(f"/tasks/{task['id']}", json={"needs_human_review": True}, headers=me)
    r = resume(run, task["id"], me, column=cols["doing"])
    assert r.status_code == 409 and "human intervention" in r.json()["detail"]

    # Cancelled runs stay cancelled.
    c.post(f"/executions/{run}/finish", json={"status": "cancelled", "expected_column_id": cols["doing"]},
           headers=me)
    r = resume(run, task["id"], me, column=cols["doing"])
    assert r.status_code == 409 and "only an escalated execution" in r.json()["detail"]
