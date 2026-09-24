from sqlalchemy import update
from sqlalchemy.orm import Session

from ..db.models import Board, Task


def create(db: Session, board_id: int, column_id: int, created_by_id: int, title: str, **fields) -> Task:
    """Insert a task with the board's next public number (APP-<number>)."""
    number = db.scalar(
        update(Board)
        .where(Board.id == board_id)
        .values(next_task_number=Board.next_task_number + 1)
        .returning(Board.next_task_number - 1)
    )
    task = Task(
        board_id=board_id, number=number, column_id=column_id, created_by_id=created_by_id, title=title, **fields
    )
    db.add(task)
    db.commit()
    return task
