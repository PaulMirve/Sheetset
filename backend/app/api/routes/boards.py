import re

from fastapi import APIRouter, Depends, HTTPException, Response
from sqlalchemy import select
from sqlalchemy.orm import Session

from ...db.models import Board as BoardModel
from ...db.models import Column as ColumnModel
from ...db.models import User
from ...db.session import get_db
from ...schemas.board import Board, BoardIn, BoardPatch, ColumnIn, ColumnPatch
from ..deps import current_user, member_board

router = APIRouter(tags=["boards"])

DEFAULT_COLUMNS = ["To do", "Doing", "Done"]


def _key(db: Session, name: str) -> str:
    """A free board key from the name: "Platform Launch" -> "PLAT", then "PLAT2", "PLAT3"..."""
    base = re.sub(r"[^A-Z0-9]", "", name.upper())[:4] or "B"
    key, n = base, 1
    while db.scalar(select(BoardModel.id).where(BoardModel.key == key)):
        n += 1
        key = f"{base}{n}"
    return key


def _saved(db: Session, board: BoardModel) -> BoardModel:
    db.commit()
    db.refresh(board)  # columns may have been reordered
    return board


def _column(db: Session, column_id: int, user: User) -> ColumnModel:
    col = db.get(ColumnModel, column_id)
    if col is None:
        raise HTTPException(404, "column not found")
    member_board(db, col.board_id, user)
    return col


@router.get("/boards", response_model=list[Board])
def list_boards(db: Session = Depends(get_db), user: User = Depends(current_user)):
    return db.scalars(
        select(BoardModel).where(BoardModel.members.any(User.id == user.id)).order_by(BoardModel.id)
    ).all()


@router.post("/boards", status_code=201, response_model=Board)
def create_board(body: BoardIn, db: Session = Depends(get_db), user: User = Depends(current_user)):
    board = BoardModel(
        key=_key(db, body.name),
        name=body.name,
        shared=body.shared,
        owner_id=user.id,
        members=[user],
        columns=[ColumnModel(name=n, position=i) for i, n in enumerate(DEFAULT_COLUMNS)],
    )
    db.add(board)
    return _saved(db, board)


@router.get("/boards/{board_id}", response_model=Board)
def get_board(board_id: int, db: Session = Depends(get_db), user: User = Depends(current_user)):
    return member_board(db, board_id, user)


@router.patch("/boards/{board_id}", response_model=Board)
def update_board(
    board_id: int, body: BoardPatch, db: Session = Depends(get_db), user: User = Depends(current_user)
):
    board = member_board(db, board_id, user)
    for k, v in body.model_dump(exclude_unset=True).items():
        setattr(board, k, v)
    return _saved(db, board)


@router.delete("/boards/{board_id}", status_code=204)
def delete_board(board_id: int, db: Session = Depends(get_db), user: User = Depends(current_user)):
    board = member_board(db, board_id, user)
    if board.owner_id != user.id:
        raise HTTPException(403, "only the owner can delete a board")
    db.delete(board)
    db.commit()
    return Response(status_code=204)


@router.post("/boards/{board_id}/columns", status_code=201, response_model=Board)
def create_column(
    board_id: int, body: ColumnIn, db: Session = Depends(get_db), user: User = Depends(current_user)
):
    board = member_board(db, board_id, user)
    board.columns.append(ColumnModel(name=body.name, position=len(board.columns)))
    return _saved(db, board)


@router.patch("/columns/{column_id}", response_model=Board)
def update_column(
    column_id: int, body: ColumnPatch, db: Session = Depends(get_db), user: User = Depends(current_user)
):
    col = _column(db, column_id, user)
    board = db.get(BoardModel, col.board_id)
    data = body.model_dump(exclude_unset=True)
    if "name" in data:
        col.name = data["name"]
    if "position" in data:
        cols = [c for c in board.columns if c.id != col.id]
        cols.insert(min(data["position"], len(cols)), col)
        for i, c in enumerate(cols):
            c.position = i
    return _saved(db, board)


@router.delete("/columns/{column_id}", response_model=Board)
def delete_column(column_id: int, db: Session = Depends(get_db), user: User = Depends(current_user)):
    """Deletes the column and its tasks. A board may end up with none."""
    col = _column(db, column_id, user)
    board = db.get(BoardModel, col.board_id)
    db.delete(col)
    db.flush()
    for i, c in enumerate(c for c in board.columns if c.id != col.id):
        c.position = i
    return _saved(db, board)
