from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.orm import Session

from ...db.models import Meeting as MeetingModel
from ...db.session import get_db
from ...schemas.meeting import Meeting, MeetingId, MeetingIn, MeetingSummary
from ..deps import current_user, n8n_key

router = APIRouter(prefix="/meetings", tags=["meetings"])


@router.post("", status_code=201, response_model=MeetingId, dependencies=[Depends(n8n_key)])
def ingest(body: MeetingIn, db: Session = Depends(get_db)):
    """n8n pushes one meeting's AI result. Re-posting the same external_id replaces it."""
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
