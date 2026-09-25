from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.orm import Session

from ...db.models import Meeting as MeetingModel
from ...db.models import Task as TaskModel
from ...db.models import User, board_members
from ...db.session import get_db
from ...schemas.meeting import Meeting, MeetingId, MeetingIn, MeetingSummary, SuggestedTask
from ...schemas.task import Accept, Task
from ..deps import current_user, member_board, n8n_key
from .tasks import add_task

router = APIRouter(prefix="/meetings", tags=["meetings"])


@router.post("", status_code=201, response_model=MeetingId, dependencies=[Depends(n8n_key)])
def ingest(body: MeetingIn, db: Session = Depends(get_db)):
    """n8n pushes one meeting's AI result. Re-posting the same external_id replaces it."""
    # ponytail: a re-post also replaces suggestion edits and accepted links; merge by title if n8n re-posts often.
    m = db.scalar(select(MeetingModel).where(MeetingModel.external_id == body.external_id))
    if m is None:
        m = MeetingModel()
        db.add(m)
    for k, v in body.model_dump(mode="json").items():
        setattr(m, k, v)
    m.date = body.date  # model_dump(mode="json") turned it into a string
    db.commit()
    return MeetingId(id=m.id)


# ponytail: every signed-in user sees every meeting; add an owner/board link when that stops being fine.
@router.get("", response_model=list[MeetingSummary], dependencies=[Depends(current_user)])
def list_meetings(db: Session = Depends(get_db)):
    return db.scalars(select(MeetingModel).order_by(MeetingModel.date.desc(), MeetingModel.id.desc())).all()


@router.get("/{meeting_id}", response_model=Meeting)
def get_meeting(meeting_id: int, db: Session = Depends(get_db), user: User = Depends(current_user)):
    m = _meeting(db, meeting_id)
    return Meeting.model_validate(m).model_copy(update={"tasks": _view(db, m, user)})


def _meeting(db: Session, meeting_id: int) -> MeetingModel:
    m = db.get(MeetingModel, meeting_id)
    if m is None:
        raise HTTPException(404, "meeting not found")
    return m


def _links(t: dict) -> list[int]:
    """Tasks made from this suggestion, on anyone's boards. Rows saved before `task_ids` kept one `task_id`."""
    return t.get("task_ids") or ([t["task_id"]] if t.get("task_id") is not None else [])


def _view(db: Session, m: MeetingModel, user: User) -> list[SuggestedTask]:
    """Suggestions as `user` sees them: `task_id` is a live task made from it on one of their boards.
    Tasks on other people's boards, and deleted ones, don't count, so each account can add a suggestion once."""
    ids = {i for t in m.tasks for i in _links(t)}
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
    return [SuggestedTask.model_validate({**t, "task_id": next((i for i in _links(t) if i in mine), None)}) for t in m.tasks]


def _suggestion(m: MeetingModel, i: int) -> SuggestedTask:
    if not 0 <= i < len(m.tasks):
        raise HTTPException(404, "suggestion not found")
    return SuggestedTask(**m.tasks[i])


# Suggestions live in Meeting.tasks (JSON) and are addressed by index.
# ponytail: deleting shifts later indexes; give suggestions ids if two people edit one meeting at once.
# Lists are reassigned, not mutated in place, so SQLAlchemy sees the change.


@router.post("/{meeting_id}/tasks", status_code=201, response_model=list[SuggestedTask])
def add_suggestion(meeting_id: int, body: SuggestedTask, db: Session = Depends(get_db), user: User = Depends(current_user)):
    m = _meeting(db, meeting_id)
    m.tasks = [*m.tasks, body.model_dump(mode="json", exclude={"task_id"})]
    db.commit()
    return _view(db, m, user)


@router.put("/{meeting_id}/tasks/{i}", response_model=list[SuggestedTask])
def update_suggestion(
    meeting_id: int, i: int, body: SuggestedTask, db: Session = Depends(get_db), user: User = Depends(current_user)
):
    m = _meeting(db, meeting_id)
    _suggestion(m, i)
    edited = {**body.model_dump(mode="json", exclude={"task_id"}), "task_ids": _links(m.tasks[i])}
    m.tasks = [*m.tasks[:i], edited, *m.tasks[i + 1 :]]
    db.commit()
    return _view(db, m, user)


@router.delete("/{meeting_id}/tasks/{i}", response_model=list[SuggestedTask])
def delete_suggestion(meeting_id: int, i: int, db: Session = Depends(get_db), user: User = Depends(current_user)):
    m = _meeting(db, meeting_id)
    _suggestion(m, i)
    m.tasks = [*m.tasks[:i], *m.tasks[i + 1 :]]
    db.commit()
    return _view(db, m, user)


@router.post("/{meeting_id}/tasks/{i}/accept", status_code=201, response_model=Task)
def accept_suggestion(
    meeting_id: int, i: int, body: Accept, db: Session = Depends(get_db), user: User = Depends(current_user)
):
    """Create a board task from suggestion `i`; the suggestion keeps a link to it.
    Each account can accept it once; someone else having accepted it doesn't block you."""
    m = _meeting(db, meeting_id)
    s = _suggestion(m, i)
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
    linked = {**{k: v for k, v in m.tasks[i].items() if k != "task_id"}, "task_ids": [*_links(m.tasks[i]), task.id]}
    m.tasks = [*m.tasks[:i], linked, *m.tasks[i + 1 :]]
    db.commit()
    return task
