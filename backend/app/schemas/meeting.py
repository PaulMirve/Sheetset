import datetime as dt

from pydantic import BaseModel, ConfigDict, EmailStr, Field, HttpUrl


class Note(BaseModel):
    """A note line, or a section heading when only `h` is set."""

    t: str | None = None  # "00:14"
    who: str | None = None
    text: str | None = None
    h: str | None = None


class SuggestedTask(BaseModel):
    title: str = Field(min_length=1, max_length=200)
    who: str | None = None  # a name; the client matches it to board members
    due: dt.date | None = None
    label: str | None = None
    src: int | None = None  # index into notes
    why: str = ""
    description: str = ""  # objective and context; becomes the task description
    task_id: int | None = None  # set once accepted


class MeetingBase(BaseModel):
    external_id: str = Field(min_length=1)
    title: str = Field(min_length=1)
    date: dt.date
    time: str | None = None
    duration: int | None = None  # minutes
    platform: str | None = None  # "Google Meet", "Zoom"
    url: str | None = None
    people: list[str] = []
    notes: list[Note] = []
    summary: str
    decisions: list[str] = []
    tasks: list[SuggestedTask] = []  # suggestions; the name is n8n's contract


class MeetingIn(MeetingBase):
    board: str = Field(min_length=1)  # board key, e.g. "PLAT"
    attendees: list[EmailStr] = Field(min_length=1)  # only these users (if board members) see the meeting
    url: HttpUrl | None = None  # http(s) only: it becomes a link in the app


class Meeting(MeetingBase):
    model_config = ConfigDict(from_attributes=True)

    id: int
    board_id: int
    created_at: dt.datetime


class MeetingSummary(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    title: str
    date: dt.date
    time: str | None
    platform: str | None
    task_count: int


class MeetingId(BaseModel):
    id: int
