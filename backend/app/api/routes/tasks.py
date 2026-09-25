import sys

from urllib.parse import quote

from fastapi import APIRouter, Depends, Header, HTTPException, Request, Response
from sqlalchemy import select
from sqlalchemy.orm import Session

from ...crud import task as task_crud
from ...db.models import Attachment, Board, Subtask, User
from ...db.models import Task as TaskModel
from ...db.session import get_db
from ...schemas.task import Task, TaskFile, TaskIn, TaskPatch
from ..deps import current_user, member_board

router = APIRouter(tags=["tasks"])


def _check(db: Session, board: Board, data: dict) -> None:
    """Reject references that point outside the board."""
    if "column_id" in data and data["column_id"] not in {c.id for c in board.columns}:
        raise HTTPException(422, "column is not on this board")
    if data.get("assignee_id") is not None and data["assignee_id"] not in {m.id for m in board.members}:
        raise HTTPException(422, "assignee is not a board member")
    if data.get("epic_id") is not None:
        epic = db.get(TaskModel, data["epic_id"])
        if epic is None or epic.board_id != board.id or not epic.is_epic:
            raise HTTPException(422, "epic is not on this board")


def _subtasks(items: list[dict]) -> list[Subtask]:
    return [Subtask(position=i, **s) for i, s in enumerate(items)]


def add_task(db: Session, board: Board, user: User, data: dict) -> TaskModel:
    """Validate and insert a task from TaskIn-shaped `data`. Shared with accepting meeting suggestions."""
    _check(db, board, data)
    data["subtasks"] = _subtasks(data.get("subtasks") or [])
    return task_crud.create(db, board.id, data.pop("column_id"), user.id, data.pop("title"), **data)


def _task(db: Session, task_id: int, user: User) -> TaskModel:
    task = db.get(TaskModel, task_id)
    if task is None:
        raise HTTPException(404, "task not found")
    member_board(db, task.board_id, user)
    return task


@router.get("/boards/{board_id}/tasks", response_model=list[Task])
def list_tasks(board_id: int, db: Session = Depends(get_db), user: User = Depends(current_user)):
    member_board(db, board_id, user)
    return db.scalars(
        select(TaskModel).where(TaskModel.board_id == board_id).order_by(TaskModel.column_id, TaskModel.position)
    ).all()


@router.post("/boards/{board_id}/tasks", status_code=201, response_model=Task)
def create_task(board_id: int, body: TaskIn, db: Session = Depends(get_db), user: User = Depends(current_user)):
    return add_task(db, member_board(db, board_id, user), user, body.model_dump())


@router.get("/tasks/{task_id}", response_model=Task)
def get_task(task_id: int, db: Session = Depends(get_db), user: User = Depends(current_user)):
    return _task(db, task_id, user)


@router.patch("/tasks/{task_id}", response_model=Task)
def update_task(
    task_id: int, body: TaskPatch, db: Session = Depends(get_db), user: User = Depends(current_user)
):
    task = _task(db, task_id, user)
    data = body.model_dump(exclude_unset=True)
    _check(db, db.get(Board, task.board_id), data)

    column_id, position = data.pop("column_id", task.column_id), data.pop("position", None)
    if column_id != task.column_id or position is not None:
        # No position when changing column = bottom of the new column.
        task_crud.move(db, task, column_id, sys.maxsize if position is None else position)
    if "subtasks" in data:
        task.subtasks = _subtasks(data.pop("subtasks"))
    for k, v in data.items():
        setattr(task, k, v)
    db.commit()
    return task


@router.delete("/tasks/{task_id}", status_code=204)
def delete_task(task_id: int, db: Session = Depends(get_db), user: User = Depends(current_user)):
    db.delete(_task(db, task_id, user))
    db.commit()
    return Response(status_code=204)


MAX_FILE = 10 * 1024 * 1024


# The body is the raw file, so no multipart dependency: fetch(url, { body: file }).
@router.post("/tasks/{task_id}/files", status_code=201, response_model=TaskFile)
async def upload_file(
    task_id: int,
    name: str,
    request: Request,
    content_type: str = Header("application/octet-stream"),
    db: Session = Depends(get_db),
    user: User = Depends(current_user),
):
    _task(db, task_id, user)
    if int(request.headers.get("content-length") or 0) > MAX_FILE:
        raise HTTPException(413, "file is over 10 MB")
    data = await request.body()
    if len(data) > MAX_FILE:
        raise HTTPException(413, "file is over 10 MB")
    f = Attachment(
        task_id=task_id, name=name[:200] or "file", type=content_type, size=len(data), data=data, created_by_id=user.id
    )
    db.add(f)
    db.commit()
    return f


def _file(db: Session, file_id: int, user: User) -> Attachment:
    f = db.get(Attachment, file_id)
    if f is None:
        raise HTTPException(404, "file not found")
    _task(db, f.task_id, user)
    return f


@router.get("/files/{file_id}")
def download_file(file_id: int, db: Session = Depends(get_db), user: User = Depends(current_user)):
    f = _file(db, file_id, user)
    return Response(
        f.data,
        media_type=f.type,
        headers={"Content-Disposition": f"inline; filename*=UTF-8''{quote(f.name)}"},
    )


@router.delete("/files/{file_id}", status_code=204)
def delete_file(file_id: int, db: Session = Depends(get_db), user: User = Depends(current_user)):
    db.delete(_file(db, file_id, user))
    db.commit()
    return Response(status_code=204)
