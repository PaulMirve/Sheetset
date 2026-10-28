from fastapi import HTTPException
from sqlalchemy import func, select, update
from sqlalchemy.orm import Session

from ..db.models import Board, Criterion, Subtask, Task, User
from ..workflow import WORKFLOW_ORDER


def create(db: Session, board_id: int, column_id: int, created_by_id: int, title: str, **fields) -> Task:
    """Insert a task at the bottom of its column, with the board's next public number (APP-<number>)."""
    number = db.scalar(
        update(Board)
        .where(Board.id == board_id)
        .values(next_task_number=Board.next_task_number + 1)
        .returning(Board.next_task_number - 1)
    )
    fields.setdefault("position", db.scalar(select(func.count()).where(Task.column_id == column_id)))
    task = Task(
        board_id=board_id, number=number, column_id=column_id, created_by_id=created_by_id, title=title, **fields
    )
    db.add(task)
    db.commit()
    return task


def move(db: Session, task: Task, column_id: int, position: int) -> None:
    """Put `task` at `position` in `column_id` and renumber that column. The caller commits."""
    others = db.scalars(
        select(Task).where(Task.column_id == column_id, Task.id != task.id).order_by(Task.position)
    ).all()
    ordered = list(others)
    ordered.insert(min(position, len(ordered)), task)
    task.column_id = column_id
    for i, t in enumerate(ordered):
        t.position = i


def check_refs_on_board(db: Session, board: Board, data: dict) -> None:
    """Reject references that point outside the board."""
    if "column_id" in data and data["column_id"] not in {c.id for c in board.columns}:
        raise HTTPException(422, "column is not on this board")
    if data.get("assignee_id") is not None and data["assignee_id"] not in {m.id for m in board.members}:
        raise HTTPException(422, "assignee is not a board member")
    if data.get("epic_id") is not None:
        epic = db.get(Task, data["epic_id"])
        if epic is None or epic.board_id != board.id or not epic.is_epic:
            raise HTTPException(422, "epic is not on this board")


def blockers_on_board(db: Session, board: Board, ids: list[int], task_id: int | None = None) -> list[Task]:
    """Tasks on this board that block `task_id`. A task can't block itself."""
    tasks = db.scalars(select(Task).where(Task.id.in_(ids), Task.board_id == board.id)).all()
    if len(tasks) != len(set(ids)) or task_id in ids:
        raise HTTPException(422, "blocker is not another task on this board")
    # ponytail: no cycle check (A blocks B blocks A is allowed); add a graph walk if it confuses people.
    return list(tasks)


def check_unblocked(board: Board, task: Task, column_id: int, patch: dict | None = None) -> None:
    """Forward moves require cleared attention flags and completed dependencies."""
    order = {c.id: WORKFLOW_ORDER[c.code] for c in board.columns}
    if order[column_id] <= order[task.column_id]:
        return
    patch = patch or {}
    if patch.get("is_blocked", task.is_blocked):
        raise HTTPException(409, "task is blocked")
    if patch.get("needs_human_review", task.needs_human_review):
        raise HTTPException(409, "task needs human review")
    waiting = [b for b in task.blockers if b.column_id != board.done_column_id]
    if waiting:
        raise HTTPException(409, "blocked by " + ", ".join(f"{board.key}-{b.number}" for b in waiting))


def subtasks_from(items: list[dict], model=Subtask) -> list[Subtask]:
    return [model(position=i, **s) for i, s in enumerate(items)]


def criteria_from(items: list[dict]) -> list[Criterion]:
    return subtasks_from(items, Criterion)


def add_task(db: Session, board: Board, user: User, data: dict) -> Task:
    """Validate and insert a task from TaskIn-shaped `data`. Shared with accepting meeting suggestions."""
    check_refs_on_board(db, board, data)
    data["subtasks"] = subtasks_from(data.get("subtasks") or [])
    data["criteria"] = criteria_from(data.get("criteria") or [])
    data["blockers"] = blockers_on_board(db, board, data.pop("blocked_by", None) or [])
    return create(db, board.id, data.pop("column_id"), user.id, data.pop("title"), **data)
