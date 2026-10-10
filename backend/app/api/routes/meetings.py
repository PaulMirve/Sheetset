from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.orm import Session

from ...crud.task import add_task
from ...db.models import Board
from ...db.models import Meeting as MeetingModel
from ...db.models import Task as TaskModel
from ...db.models import User, board_members
from ...db.session import get_db
from ...schemas.meeting import Meeting, MeetingId, MeetingIn, MeetingSummary, SuggestedTask
from ...schemas.task import Accept, Task
from ..deps import current_user, member_board, n8n_key

router = APIRouter(prefix="/meetings", tags=["meetings"])


@router.post("", status_code=201, response_model=MeetingId, dependencies=[Depends(n8n_key)])
def ingest(body: MeetingIn, db: Session = Depends(get_db)):
    """n8n pushes one meeting's AI result. Re-posting the same external_id replaces it."""
    # ponytail: a re-post also replaces suggestion edits and accepted links; merge by title if n8n re-posts often.
    board = db.scalar(select(Board).where(Board.key == body.board))
    if board is None:
        raise HTTPException(422, "unknown board")
    m = db.scalar(select(MeetingModel).where(MeetingModel.external_id == body.external_id))
    if m is None:
        m = MeetingModel()
        db.add(m)
    data = body.model_dump(mode="json", exclude={"board"})
    data["suggestions"] = data.pop("tasks")
    data["attendees"] = [e.lower() for e in data["attendees"]]
    for k, v in data.items():
        setattr(m, k, v)
    m.date = body.date  # model_dump(mode="json") turned it into a string
    m.board_id = board.id
    db.commit()
    return MeetingId(id=m.id)


def _attended(m: MeetingModel, user: User) -> bool:
    return user.email.lower() in m.attendees


@router.get("", response_model=list[MeetingSummary])
def list_meetings(board_id: int, db: Session = Depends(get_db), user: User = Depends(current_user)):
    """Meetings on `board_id` that `user` attended."""
    member_board(db, board_id, user)
    meetings = db.scalars(
        select(MeetingModel)
        .where(MeetingModel.board_id == board_id)
        .order_by(MeetingModel.date.desc(), MeetingModel.id.desc())
    )
    # ponytail: attendees filtered in Python (JSON list); a meeting_attendees table if boards get many meetings.
    return [m for m in meetings if _attended(m, user)]


@router.get("/{meeting_id}", response_model=Meeting)
def get_meeting(meeting_id: int, db: Session = Depends(get_db), user: User = Depends(current_user)):
    m = _meeting(db, meeting_id, user)
    return Meeting.model_validate(m).model_copy(update={"tasks": _view(db, m, user)})


def _meeting(db: Session, meeting_id: int, user: User) -> MeetingModel:
    """The meeting, if `user` attended it and is on its board. Anyone else gets the same 404 as a missing one."""
    m = db.get(MeetingModel, meeting_id)
    board = db.get(Board, m.board_id) if m and m.board_id else None
    if board is None or not _attended(m, user) or user.id not in {u.id for u in board.members}:
        raise HTTPException(404, "meeting not found")
    return m


def _links(t: dict) -> list[int]:
    """Tasks made from this suggestion. Rows saved before `task_ids` kept one `task_id`."""
    return t.get("task_ids") or ([t["task_id"]] if t.get("task_id") is not None else [])


def _view(db: Session, m: MeetingModel, user: User) -> list[SuggestedTask]:
    """Suggestions as `user` sees them: `task_id` is a live task made from it on one of their boards.
    Deleted tasks don't count, so a suggestion can be added again."""
    ids = {i for t in m.suggestions for i in _links(t)}
    mine = (
        set(
            db.scalars(
                select(TaskModel.id)
                .join(board_members, board_members.c.board_id == TaskModel.board_id)
                .where(TaskModel.id.in_(ids), board_members.c.user_id == user.id)
            )
        )
        if ids
        else set()
    )
    return [
        SuggestedTask.model_validate({**t, "task_id": next((i for i in _links(t) if i in mine), None)})
        for t in m.suggestions
    ]


def _suggestion(m: MeetingModel, i: int) -> SuggestedTask:
    if not 0 <= i < len(m.suggestions):
        raise HTTPException(404, "suggestion not found")
    return SuggestedTask(**m.suggestions[i])


def _replace(m: MeetingModel, i: int, *items: dict) -> None:
    """Swap suggestion `i` for `items` (none = delete). Reassigned, not mutated in place, so SQLAlchemy sees it."""
    m.suggestions = [*m.suggestions[:i], *items, *m.suggestions[i + 1 :]]


# Suggestions are addressed by index.
# ponytail: deleting shifts later indexes; give suggestions ids if two people edit one meeting at once.


@router.post("/{meeting_id}/tasks", status_code=201, response_model=list[SuggestedTask])
def add_suggestion(meeting_id: int, body: SuggestedTask, db: Session = Depends(get_db), user: User = Depends(current_user)):
    m = _meeting(db, meeting_id, user)
    m.suggestions = [*m.suggestions, body.model_dump(mode="json", exclude={"task_id"})]
    db.commit()
    return _view(db, m, user)


@router.put("/{meeting_id}/tasks/{i}", response_model=list[SuggestedTask])
def update_suggestion(
    meeting_id: int, i: int, body: SuggestedTask, db: Session = Depends(get_db), user: User = Depends(current_user)
):
    m = _meeting(db, meeting_id, user)
    _suggestion(m, i)
    _replace(m, i, {**body.model_dump(mode="json", exclude={"task_id"}), "task_ids": _links(m.suggestions[i])})
    db.commit()
    return _view(db, m, user)


@router.delete("/{meeting_id}/tasks/{i}", response_model=list[SuggestedTask])
def delete_suggestion(meeting_id: int, i: int, db: Session = Depends(get_db), user: User = Depends(current_user)):
    m = _meeting(db, meeting_id, user)
    _suggestion(m, i)
    _replace(m, i)
    db.commit()
    return _view(db, m, user)


@router.post("/{meeting_id}/tasks/{i}/accept", status_code=201, response_model=Task)
def accept_suggestion(
    meeting_id: int, i: int, body: Accept, db: Session = Depends(get_db), user: User = Depends(current_user)
):
    """Create a task on the meeting's board from suggestion `i`; the suggestion keeps a link to it."""
    m = _meeting(db, meeting_id, user)
    s = _suggestion(m, i)
    if body.board_id != m.board_id:
        raise HTTPException(422, "suggestions can only be added to the meeting's board")
    if _view(db, m, user)[i].task_id is not None:
        raise HTTPException(409, "suggestion already accepted")
    board = member_board(db, body.board_id, user)
    note = m.notes[s.src] if s.src is not None and 0 <= s.src < len(m.notes) else {}
    source = {
        "meeting_id": m.id,
        "title": m.title,
        "date": m.date.isoformat(),
        "time": m.time,
        "platform": m.platform,
        "url": m.url,
        "who": note.get("who"),
        "at": note.get("t"),
        "quote": note.get("text"),
    }
    data = {
        "title": s.title,
        "description": s.description,
        "due": s.due,
        "label": s.label,
        **body.model_dump(exclude_unset=True, exclude={"board_id", "position"}),
        "source": source,
    }
    task = add_task(db, board, user, data)
    linked = {k: v for k, v in m.suggestions[i].items() if k != "task_id"}
    _replace(m, i, {**linked, "task_ids": [*_links(m.suggestions[i]), task.id]})
    db.commit()
    return task
