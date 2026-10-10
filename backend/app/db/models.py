from datetime import date, datetime, timezone

from sqlalchemy import Column as SAColumn
from sqlalchemy import JSON, DateTime, ForeignKey, LargeBinary, String, Table, UniqueConstraint, func
from sqlalchemy.orm import Mapped, deferred, mapped_column, relationship

from .session import Base


class User(Base):
    __tablename__ = "users"

    id: Mapped[int] = mapped_column(primary_key=True)
    email: Mapped[str] = mapped_column(unique=True, index=True)
    pw: Mapped[str]
    first_name: Mapped[str]
    last_name: Mapped[str]
    is_active: Mapped[bool] = mapped_column(default=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())


board_members = Table(
    "board_members",
    Base.metadata,
    SAColumn("board_id", ForeignKey("boards.id", ondelete="CASCADE"), primary_key=True),
    SAColumn("user_id", ForeignKey("users.id", ondelete="CASCADE"), primary_key=True),
)


class Board(Base):
    __tablename__ = "boards"

    id: Mapped[int] = mapped_column(primary_key=True)
    key: Mapped[str] = mapped_column(String(10), unique=True)  # "APP" in "APP-123"; immutable, git refs use it
    name: Mapped[str]
    shared: Mapped[bool] = mapped_column(default=False)
    owner_id: Mapped[int] = mapped_column(ForeignKey("users.id"))
    next_task_number: Mapped[int] = mapped_column(default=1)  # counter, so deleted numbers are never reused
    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now(), onupdate=func.now())

    members: Mapped[list[User]] = relationship(secondary=board_members)  # owner included
    columns: Mapped[list["Column"]] = relationship(
        cascade="all, delete-orphan", passive_deletes=True, order_by="Column.position"
    )

    @property
    def done_column_id(self) -> int | None:
        """Only the explicit done state satisfies a dependency."""
        return next((c.id for c in self.columns if c.code == "done"), None)


class Column(Base):
    __tablename__ = "columns"
    __table_args__ = (UniqueConstraint("board_id", "code"),)

    id: Mapped[int] = mapped_column(primary_key=True)
    board_id: Mapped[int] = mapped_column(ForeignKey("boards.id", ondelete="CASCADE"), index=True)
    name: Mapped[str]
    code: Mapped[str] = mapped_column(String(20))
    position: Mapped[int] = mapped_column(default=0)

    tasks: Mapped[list["Task"]] = relationship(
        cascade="all, delete-orphan", passive_deletes=True, order_by="Task.position"
    )


# A row means task_id can't really start until blocker_id is done.
task_blockers = Table(
    "task_blockers",
    Base.metadata,
    SAColumn("task_id", ForeignKey("tasks.id", ondelete="CASCADE"), primary_key=True),
    SAColumn("blocker_id", ForeignKey("tasks.id", ondelete="CASCADE"), primary_key=True),
)


class Task(Base):
    __tablename__ = "tasks"
    __table_args__ = (UniqueConstraint("board_id", "number"),)

    id: Mapped[int] = mapped_column(primary_key=True)
    board_id: Mapped[int] = mapped_column(ForeignKey("boards.id", ondelete="CASCADE"))
    number: Mapped[int]
    column_id: Mapped[int] = mapped_column(ForeignKey("columns.id", ondelete="CASCADE"), index=True)
    # ponytail: int positions, renumbered on move; fractional ranks if columns get huge
    position: Mapped[int] = mapped_column(default=0)
    title: Mapped[str]
    description: Mapped[str] = mapped_column(default="")
    label: Mapped[str | None]
    due: Mapped[date | None]
    assignee_id: Mapped[int | None] = mapped_column(ForeignKey("users.id", ondelete="SET NULL"))
    is_epic: Mapped[bool] = mapped_column(default=False)
    is_blocked: Mapped[bool] = mapped_column(default=False, server_default="0")
    needs_human_review: Mapped[bool] = mapped_column(default=False, server_default="0")
    # One level deep; deleting an epic keeps its tasks.
    epic_id: Mapped[int | None] = mapped_column(ForeignKey("tasks.id", ondelete="SET NULL"), index=True)
    # The meeting a task was accepted from: {meeting_id, title, date, time, platform, url, who, at, quote}.
    source: Mapped[dict | None] = mapped_column(JSON)
    created_by_id: Mapped[int] = mapped_column(ForeignKey("users.id"))
    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now(), onupdate=func.now())

    subtasks: Mapped[list["Subtask"]] = relationship(
        cascade="all, delete-orphan", passive_deletes=True, order_by="Subtask.position"
    )
    files: Mapped[list["Attachment"]] = relationship(
        cascade="all, delete-orphan", passive_deletes=True, order_by="Attachment.id"
    )
    blockers: Mapped[list["Task"]] = relationship(
        secondary=task_blockers,
        primaryjoin=lambda: Task.id == task_blockers.c.task_id,
        secondaryjoin=lambda: Task.id == task_blockers.c.blocker_id,
        passive_deletes=True,
    )

    @property
    def blocked_by(self) -> list[int]:
        return [t.id for t in self.blockers]


class Subtask(Base):
    __tablename__ = "subtasks"

    id: Mapped[int] = mapped_column(primary_key=True)
    task_id: Mapped[int] = mapped_column(ForeignKey("tasks.id", ondelete="CASCADE"), index=True)
    position: Mapped[int] = mapped_column(default=0)
    title: Mapped[str]
    done: Mapped[bool] = mapped_column(default=False)


class Attachment(Base):
    """A photo or file on a task. Contents are only loaded when downloaded."""

    __tablename__ = "attachments"

    id: Mapped[int] = mapped_column(primary_key=True)
    task_id: Mapped[int] = mapped_column(ForeignKey("tasks.id", ondelete="CASCADE"), index=True)
    name: Mapped[str]
    type: Mapped[str]  # MIME type
    size: Mapped[int]
    # ponytail: bytes in SQLite, capped at 10 MB each; move to disk/object storage if volume grows.
    data: Mapped[bytes] = deferred(mapped_column(LargeBinary))
    created_by_id: Mapped[int] = mapped_column(ForeignKey("users.id"))
    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())


class Meeting(Base):
    """AI result for one meeting, pushed by n8n. Suggestions become Tasks only when a user accepts them."""

    __tablename__ = "meetings"

    id: Mapped[int] = mapped_column(primary_key=True)
    external_id: Mapped[str] = mapped_column(unique=True)  # n8n/platform id; re-posts replace the row
    # Visible to users who are members of this board AND whose email is in `attendees`.
    # None only on meetings ingested before boards were required; nobody sees those.
    board_id: Mapped[int | None] = mapped_column(ForeignKey("boards.id", ondelete="CASCADE"), index=True)
    attendees: Mapped[list] = mapped_column(JSON, default=list)  # lowercased emails
    title: Mapped[str]
    date: Mapped[date]
    time: Mapped[str | None]
    duration: Mapped[int | None]  # minutes
    platform: Mapped[str | None]
    url: Mapped[str | None]
    people: Mapped[list] = mapped_column(JSON, default=list)
    notes: Mapped[list] = mapped_column(JSON, default=list)  # suggested tasks point into this by index (src)
    summary: Mapped[str]
    decisions: Mapped[list] = mapped_column(JSON, default=list)
    suggestions: Mapped[list] = mapped_column("tasks", JSON, default=list)  # SuggestedTask dicts, by index
    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())

    @property
    def task_count(self) -> int:
        return len(self.suggestions)


class TaskExecution(Base):
    """A durable claim. Nullable unique active_task_id allows past runs per ticket."""

    __tablename__ = "task_executions"

    id: Mapped[str] = mapped_column(String(36), primary_key=True)
    task_id: Mapped[int] = mapped_column(ForeignKey("tasks.id", ondelete="CASCADE"), index=True)
    active_task_id: Mapped[int | None] = mapped_column(
        ForeignKey("tasks.id", ondelete="CASCADE"), unique=True
    )
    created_by_id: Mapped[int] = mapped_column(ForeignKey("users.id"))
    project: Mapped[str] = mapped_column(String(100))
    profile: Mapped[str] = mapped_column(String(20))
    developer: Mapped[str] = mapped_column(String(20))
    reviewer: Mapped[str] = mapped_column(String(20))
    status: Mapped[str] = mapped_column(String(20), default="claimed")
    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now(), onupdate=func.now())
    finished_at: Mapped[datetime | None] = mapped_column(DateTime)


class ExecutionEvent(Base):
    """Append-only events, with caller-generated IDs for retry safety."""

    __tablename__ = "execution_events"

    id: Mapped[str] = mapped_column(String(36), primary_key=True)
    execution_id: Mapped[str] = mapped_column(
        ForeignKey("task_executions.id", ondelete="CASCADE"), index=True
    )
    kind: Mapped[str] = mapped_column(String(60))
    payload: Mapped[dict] = mapped_column(JSON, default=dict)
    created_at: Mapped[datetime] = mapped_column(
        DateTime, default=lambda: datetime.now(timezone.utc), server_default=func.now()
    )
