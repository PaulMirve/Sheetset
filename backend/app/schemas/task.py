import datetime as dt

from pydantic import BaseModel, ConfigDict, Field


class SubtaskIn(BaseModel):
    title: str = Field(min_length=1, max_length=200)
    done: bool = False


class CriterionIn(SubtaskIn):
    title: str = Field(min_length=1, max_length=500)  # criteria run longer than subtasks


class Subtask(SubtaskIn):
    model_config = ConfigDict(from_attributes=True)

    id: int


class Criterion(CriterionIn):
    model_config = ConfigDict(from_attributes=True)

    id: int


class TaskFile(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    name: str
    type: str
    size: int
    created_by_id: int
    created_at: dt.datetime


class TaskIn(BaseModel):
    title: str = Field(min_length=1, max_length=200)
    column_id: int
    description: str = ""
    label: str | None = None
    due: dt.date | None = None
    assignee_id: int | None = None
    is_epic: bool = False
    is_blocked: bool = False
    needs_human_review: bool = False
    epic_id: int | None = None
    subtasks: list[SubtaskIn] = []
    criteria: list[CriterionIn] = []  # acceptance criteria
    blocked_by: list[int] = []  # ids of tasks on the same board


class TaskPatch(BaseModel):
    """Only the fields sent are changed. `subtasks` and `criteria` replace the whole list."""

    # Non-nullable fields default to None only to mean "not sent"; an explicit null fails validation.
    title: str = Field(None, min_length=1, max_length=200)
    column_id: int = None
    position: int = Field(None, ge=0)
    description: str = None
    label: str | None = None
    due: dt.date | None = None
    assignee_id: int | None = None
    is_epic: bool = None
    is_blocked: bool = None
    needs_human_review: bool = None
    epic_id: int | None = None
    subtasks: list[SubtaskIn] = None
    criteria: list[CriterionIn] = None
    blocked_by: list[int] = None  # replaces the whole list


class Task(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    board_id: int
    number: int
    column_id: int
    position: int
    title: str
    description: str
    label: str | None
    due: dt.date | None
    assignee_id: int | None
    is_epic: bool
    is_blocked: bool
    needs_human_review: bool
    epic_id: int | None
    source: dict | None
    created_by_id: int
    created_at: dt.datetime
    updated_at: dt.datetime
    subtasks: list[Subtask]
    criteria: list[Criterion]
    files: list[TaskFile]
    blocked_by: list[int]


class Accept(TaskPatch):
    """Turn a suggestion into a task. Omitted title/description/due/label come from the suggestion."""

    board_id: int
    column_id: int
