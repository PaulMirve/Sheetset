from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.orm import Session

from ...db.models import Meeting as MeetingModel
from ...db.models import User
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


@router.get("/{meeting_id}", response_model=Meeting, dependencies=[Depends(current_user)])
def get_meeting(meeting_id: int, db: Session = Depends(get_db)):
    m = db.get(MeetingModel, meeting_id)
    if m is None:
        raise HTTPException(404, "meeting not found")
    return m


def _meeting(db: Session, meeting_id: int) -> MeetingModel:
    m = db.get(MeetingModel, meeting_id)
    if m is None:
        raise HTTPException(404, "meeting not found")
    return m


def _suggestion(m: MeetingModel, i: int) -> SuggestedTask:
    if not 0 <= i < len(m.tasks):
        raise HTTPException(404, "suggestion not found")
    return SuggestedTask(**m.tasks[i])


# Suggestions live in Meeting.tasks (JSON) and are addressed by index.
# ponytail: deleting shifts later indexes; give suggestions ids if two people edit one meeting at once.
# Lists are reassigned, not mutated in place, so SQLAlchemy sees the change.


@router.post("/{meeting_id}/tasks", status_code=201, response_model=list[SuggestedTask], dependencies=[Depends(current_user)])
def add_suggestion(meeting_id: int, body: SuggestedTask, db: Session = Depends(get_db)):
    m = _meeting(db, meeting_id)
    m.tasks = [*m.tasks, body.model_dump(mode="json", exclude={"task_id"})]
    db.commit()
    return m.tasks


@router.put("/{meeting_id}/tasks/{i}", response_model=list[SuggestedTask], dependencies=[Depends(current_user)])
def update_suggestion(meeting_id: int, i: int, body: SuggestedTask, db: Session = Depends(get_db)):
    m = _meeting(db, meeting_id)
    old = _suggestion(m, i)
    m.tasks = [*m.tasks[:i], {**body.model_dump(mode="json"), "task_id": old.task_id}, *m.tasks[i + 1 :]]
    db.commit()
    return m.tasks


@router.delete("/{meeting_id}/tasks/{i}", response_model=list[SuggestedTask], dependencies=[Depends(current_user)])
def delete_suggestion(meeting_id: int, i: int, db: Session = Depends(get_db)):
    m = _meeting(db, meeting_id)
    _suggestion(m, i)
    m.tasks = [*m.tasks[:i], *m.tasks[i + 1 :]]
    db.commit()
    return m.tasks


@router.post("/{meeting_id}/tasks/{i}/accept", status_code=201, response_model=Task)
def accept_suggestion(
    meeting_id: int, i: int, body: Accept, db: Session = Depends(get_db), user: User = Depends(current_user)
):
    """Create a board task from suggestion `i`; the suggestion keeps a link to it."""
    m = _meeting(db, meeting_id)
    s = _suggestion(m, i)
    if s.task_id is not None:
        raise HTTPException(409, "suggestion already accepted")
    board = member_board(db, body.board_id, user)
    data = {
        "title": s.title,
        "description": s.description,
        "due": s.due,
        "label": s.label,
        **body.model_dump(exclude_unset=True, exclude={"board_id", "position"}),
    }
    task = add_task(db, board, user, data)
    m.tasks = [*m.tasks[:i], {**m.tasks[i], "task_id": task.id}, *m.tasks[i + 1 :]]
    db.commit()
    return task
