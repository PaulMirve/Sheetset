"""SQLite claims serialize eligibility checks and the To do -> Doing move."""

import json
import sys
from datetime import datetime, timezone
from uuid import UUID, uuid4

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select, text
from sqlalchemy.orm import Session

from ...crud.task import check_unblocked, move
from ...db.models import Board, ExecutionEvent, Task, TaskExecution, User
from ...db.session import get_db
from ...schemas.execution import ClaimIn, Event, EventIn, Execution, FinishIn, StageIn
from ..deps import current_user, member_board

router = APIRouter(tags=["executions"])


def _lock(db: Session):
    # Auth's SELECT may have cached objects. Reserve the SQLite writer before loading
    # task state and discard cached objects so eligibility reflects committed state.
    db.execute(text("BEGIN IMMEDIATE"))
    db.expire_all()


def _task(db: Session, task_id: int, user: User):
    task = db.get(Task, task_id)
    if task is None:
        raise HTTPException(404, "task not found")
    board = member_board(db, task.board_id, user)
    return task, board


def _execution(db: Session, execution_id: str, user: User, *, owner=False):
    execution = db.get(TaskExecution, execution_id)
    if execution is None:
        raise HTTPException(404, "execution not found")
    task, board = _task(db, execution.task_id, user)
    if owner and execution.created_by_id != user.id:
        raise HTTPException(403, "execution belongs to another user")
    return execution, task, board


@router.post("/tasks/{task_id}/claim", response_model=Execution)
def claim(task_id: int, body: ClaimIn, db: Session = Depends(get_db), user: User = Depends(current_user)):
    _lock(db)
    task, board = _task(db, task_id, user)
    if board.id != body.expected_board_id:
        raise HTTPException(409, "task board changed")
    execution_id = str(body.execution_id)
    existing = db.get(TaskExecution, execution_id)
    if existing is not None:
        expected = (task.id, user.id, body.project, body.profile, body.developer, body.reviewer)
        actual = (existing.task_id, existing.created_by_id, existing.project,
                  existing.profile, existing.developer, existing.reviewer)
        if actual != expected:
            raise HTTPException(409, "execution ID already used with different claim")
        # An identical retry observes the original claim, even after completion.
        db.commit()
        return existing
    if db.scalar(select(TaskExecution.id).where(TaskExecution.active_task_id == task.id)):
        raise HTTPException(409, "task already claimed")
    columns = {c.code: c.id for c in board.columns}
    if task.is_epic or task.column_id != columns["todo"]:
        raise HTTPException(409, "only concrete To do tickets can be claimed")
    check_unblocked(board, task, columns["doing"])
    move(db, task, columns["doing"], sys.maxsize)
    execution = TaskExecution(id=execution_id, task_id=task.id, active_task_id=task.id,
                              created_by_id=user.id, project=body.project, profile=body.profile,
                              developer=body.developer, reviewer=body.reviewer, status="claimed")
    db.add(execution)
    db.flush()
    db.add(ExecutionEvent(id=str(uuid4()), execution_id=execution.id, kind="claimed",
                          payload={"from": "todo", "to": "doing"}))
    db.commit()
    return execution


@router.get("/tasks/{task_id}/executions", response_model=list[Execution])
def list_executions(task_id: int, db: Session = Depends(get_db), user: User = Depends(current_user)):
    _task(db, task_id, user)
    return db.scalars(select(TaskExecution).where(TaskExecution.task_id == task_id)
                      .order_by(TaskExecution.created_at, TaskExecution.id)).all()


@router.get("/executions/{execution_id}/events", response_model=list[Event])
def list_events(execution_id: UUID, db: Session = Depends(get_db), user: User = Depends(current_user)):
    _execution(db, str(execution_id), user)
    return db.scalars(select(ExecutionEvent).where(ExecutionEvent.execution_id == str(execution_id))
                      .order_by(ExecutionEvent.created_at, ExecutionEvent.id)).all()


@router.post("/executions/{execution_id}/events", response_model=Event)
def append_event(execution_id: UUID, body: EventIn, db: Session = Depends(get_db), user: User = Depends(current_user)):
    if len(json.dumps(body.payload).encode()) > 64 * 1024:
        raise HTTPException(413, "event payload exceeds 64 KB; attach large reports as files")
    _lock(db)
    execution, _, _ = _execution(db, str(execution_id), user, owner=True)
    previous = db.get(ExecutionEvent, str(body.event_id))
    if previous:
        if (previous.execution_id, previous.kind, previous.payload) != (execution.id, body.kind, body.payload):
            raise HTTPException(409, "event ID already used with different content")
        db.commit()
        return previous
    if execution.active_task_id is None:
        raise HTTPException(409, "execution is already finished")
    event = ExecutionEvent(id=str(body.event_id), execution_id=execution.id, kind=body.kind, payload=body.payload)
    execution.updated_at = datetime.now(timezone.utc)
    db.add(event)
    db.commit()
    return event


@router.post("/executions/{execution_id}/finish", response_model=Execution)
def finish(execution_id: UUID, body: FinishIn, db: Session = Depends(get_db), user: User = Depends(current_user)):
    _lock(db)
    execution, task, board = _execution(db, str(execution_id), user, owner=True)
    if execution.active_task_id is None:
        if execution.status != body.status:
            raise HTTPException(409, "execution finished with another outcome")
        db.commit()
        return execution
    if task.column_id != body.expected_column_id:
        raise HTTPException(409, "task changed manually; inspect before finishing")
    if body.status == "ready_for_qa":
        columns = {c.code: c.id for c in board.columns}
        if task.column_id != columns["code_review"]:
            raise HTTPException(409, "QA completion requires Code review")
        check_unblocked(board, task, columns["ready_for_qa"])
        move(db, task, columns["ready_for_qa"], sys.maxsize)
    else:
        # Keep cancellation/failure visible; never silently put unfinished work back in the queue.
        task.needs_human_review = True
    execution.status = body.status
    execution.active_task_id = None
    execution.finished_at = datetime.now(timezone.utc)
    db.add(ExecutionEvent(id=str(uuid4()), execution_id=execution.id, kind="finished", payload={"status": body.status}))
    db.commit()
    return execution


@router.post("/executions/{execution_id}/stage", response_model=Execution)
def stage(execution_id: UUID, body: StageIn, db: Session = Depends(get_db), user: User = Depends(current_user)):
    _lock(db)
    execution, task, board = _execution(db, str(execution_id), user, owner=True)
    if execution.active_task_id is None:
        raise HTTPException(409, "execution is already finished")
    columns = {c.code: c.id for c in board.columns}
    target = columns[body.stage]
    if task.column_id != body.expected_column_id:
        raise HTTPException(409, "task changed manually; inspect before continuing")
    if task.column_id not in {columns["doing"], columns["code_review"]}:
        raise HTTPException(409, "task is outside the execution workflow")
    if task.is_blocked or task.needs_human_review:
        raise HTTPException(409, "task requires human intervention")
    check_unblocked(board, task, target)
    move(db, task, target, sys.maxsize)
    execution.status = body.stage
    db.add(ExecutionEvent(id=str(uuid4()), execution_id=execution.id, kind="stage", payload={"stage": body.stage}))
    db.commit()
    return execution
