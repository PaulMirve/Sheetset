import datetime as dt
from typing import Literal
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field


class ClaimIn(BaseModel):
    execution_id: UUID
    project: str = Field(min_length=1, max_length=100)
    profile: Literal["personal", "gob", "wonderist"]
    developer: Literal["claude", "cursor"]
    reviewer: Literal["claude", "codex", "manual"]
    expected_board_id: int = Field(gt=0)


class Execution(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    task_id: int
    active_task_id: int | None
    created_by_id: int
    project: str
    profile: str
    developer: str
    reviewer: str
    status: str
    created_at: dt.datetime
    updated_at: dt.datetime
    finished_at: dt.datetime | None


class EventIn(BaseModel):
    event_id: UUID
    kind: str = Field(min_length=1, max_length=60)
    payload: dict = Field(default_factory=dict)


class Event(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    execution_id: str
    kind: str
    payload: dict
    created_at: dt.datetime


class FinishIn(BaseModel):
    status: Literal["ready_for_qa", "needs_human_review", "cancelled"]
    expected_column_id: int = Field(gt=0)


class StageIn(BaseModel):
    stage: Literal["doing", "code_review"]
    expected_column_id: int = Field(gt=0)


class ResumeIn(BaseModel):
    expected_column_id: int = Field(gt=0)
    expected_task_updated_at: dt.datetime
