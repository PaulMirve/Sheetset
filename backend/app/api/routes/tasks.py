import sys

from urllib.parse import quote

from fastapi import APIRouter, Depends, Header, HTTPException, Request, Response
from sqlalchemy import select
from sqlalchemy.orm import Session

from ...crud import task as task_crud
from ...crud.task import add_task, blockers_on_board, check_refs_on_board, check_unblocked, subtasks_from
from ...db.models import Attachment, Board, User
from ...db.models import Task as TaskModel
from ...db.session import get_db
from ...schemas.task import Task, TaskFile, TaskIn, TaskPatch
from ..deps import current_user, member_board

router = APIRouter(tags=["tasks"])


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
    board = db.get(Board, task.board_id)
    check_refs_on_board(db, board, data)

    if "blocked_by" in data:
        task.blockers = blockers_on_board(db, board, data.pop("blocked_by"), task.id)
    column_id, position = data.pop("column_id", task.column_id), data.pop("position", None)
    if column_id != task.column_id:
        check_unblocked(board, task, column_id, data)
    if column_id != task.column_id or position is not None:
        # No position when changing column = bottom of the new column.
        task_crud.move(db, task, column_id, sys.maxsize if position is None else position)
    if "subtasks" in data:
        task.subtasks = subtasks_from(data.pop("subtasks"))
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


# Types a browser can show without running anything. Anything else (HTML, SVG, JS...) is sent as a
# download, so an uploaded file can't run script on the app's origin when someone opens it.
INLINE_TYPES = {"image/png", "image/jpeg", "image/gif", "image/webp", "application/pdf", "text/plain"}


@router.get("/files/{file_id}")
def download_file(file_id: int, db: Session = Depends(get_db), user: User = Depends(current_user)):
    f = _file(db, file_id, user)
    inline = f.type in INLINE_TYPES
    return Response(
        f.data,
        media_type=f.type if inline else "application/octet-stream",
        headers={
            "Content-Disposition": f"{'inline' if inline else 'attachment'}; filename*=UTF-8''{quote(f.name)}",
            "X-Content-Type-Options": "nosniff",
        },
    )


@router.delete("/files/{file_id}", status_code=204)
def delete_file(file_id: int, db: Session = Depends(get_db), user: User = Depends(current_user)):
    db.delete(_file(db, file_id, user))
    db.commit()
    return Response(status_code=204)
