from typing import Annotated

from pydantic import BaseModel, ConfigDict, StringConstraints

from ..workflow import WorkflowCode

Name = Annotated[str, StringConstraints(strip_whitespace=True, min_length=1, max_length=60)]


class Column(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    name: str
    code: WorkflowCode
    position: int


class Board(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    key: str
    name: str
    shared: bool
    owner_id: int
    columns: list[Column]


class BoardIn(BaseModel):
    name: Name
    shared: bool = False


class BoardPatch(BaseModel):
    # None only means "not sent"; an explicit null fails validation.
    name: Name = None
    shared: bool = None
