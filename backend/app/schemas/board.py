from typing import Annotated

from pydantic import BaseModel, ConfigDict, Field, StringConstraints

Name = Annotated[str, StringConstraints(strip_whitespace=True, min_length=1, max_length=60)]


class Column(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    name: str
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


class ColumnIn(BaseModel):
    name: Name


class ColumnPatch(BaseModel):
    name: Name = None
    position: int = Field(None, ge=0)
