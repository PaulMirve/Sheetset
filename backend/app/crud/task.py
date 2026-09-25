from sqlalchemy import func, select, update
from sqlalchemy.orm import Session

from ..db.models import Board, Task


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
