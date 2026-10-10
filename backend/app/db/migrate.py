"""Add the fixed workflow without deleting columns or moving existing tasks."""

import logging
import sqlite3
from datetime import datetime, timezone
from pathlib import Path
from uuid import uuid4

from sqlalchemy import inspect
from sqlalchemy.engine import Engine

from ..workflow import WORKFLOW
from .session import Base

logger = logging.getLogger(__name__)


def _backup(engine: Engine) -> Path | None:
    database = engine.url.database
    if not database or database == ":memory:":
        return None
    source = Path(database).resolve()
    directory = source.parent / ".db-backups"
    directory.mkdir(exist_ok=True)
    stamp = datetime.now(timezone.utc).strftime("%Y%m%dT%H%M%SZ")
    target = directory / f"{source.stem}-before-fixed-workflow-{stamp}-{uuid4().hex[:8]}.sqlite3"
    # A separate read connection can back up the committed snapshot while the migration
    # connection holds its write reservation. No changes have been made yet.
    with sqlite3.connect(source.as_uri() + "?mode=ro", uri=True) as old:
        with sqlite3.connect(target) as saved:
            old.backup(saved)
    target.chmod(0o600)
    logger.warning("Fixed workflow migration: database backup saved to %s", target)
    return target


def initialize_database(engine: Engine) -> Path | None:
    """Transactionally expand legacy SQLite databases; retries do not add duplicates.

    Unknown or duplicate legacy stages abort before any schema or data changes. Their
    meaning must be mapped explicitly rather than guessing where their tasks belong.
    """
    aliases = {name.casefold(): code for code, name in WORKFLOW}
    aliases.update({"todo": "todo", "code-review": "code_review", "qa": "ready_for_qa"})
    stages = {code: (name, position) for position, (code, name) in enumerate(WORKFLOW)}
    backup = None

    with engine.connect() as conn:
        # sqlite3's legacy transaction mode does not begin a transaction for DDL.
        conn.exec_driver_sql("BEGIN IMMEDIATE")
        try:
            inspector = inspect(conn)
            if not inspector.has_table("columns"):
                Base.metadata.create_all(conn)
                conn.commit()
                return None

            fields = {c["name"] for c in inspector.get_columns("columns")}
            task_fields = {c["name"] for c in inspector.get_columns("tasks")}
            has_code = "code" in fields
            code_sql = "code" if has_code else "NULL AS code"
            rows = conn.exec_driver_sql(
                f"SELECT id, board_id, name, position, {code_sql} FROM columns ORDER BY board_id, id"
            ).mappings().all()
            boards = {r[0]: {} for r in conn.exec_driver_sql("SELECT id FROM boards")}
            plan = []
            for row in rows:
                code = row["code"] or aliases.get(row["name"].strip().casefold())
                if code not in stages or code in boards[row["board_id"]]:
                    raise RuntimeError(
                        f"Cannot migrate column {row['id']} on board {row['board_id']}: "
                        "unknown or duplicate workflow stage. Map it explicitly before restarting."
                    )
                boards[row["board_id"]][code] = row["id"]
                name, position = stages[code]
                plan.append((code, name, position, row["id"]))

            changed = (
                not has_code
                or not {"is_blocked", "needs_human_review"}.issubset(task_fields)
                or any(len(existing) != len(WORKFLOW) for existing in boards.values())
                or any(
                    (r["code"], r["name"], r["position"]) != p[:3]
                    for r, p in zip(rows, plan)
                )
            )
            if changed:
                backup = _backup(engine)
                task_count = conn.exec_driver_sql("SELECT count(*) FROM tasks").scalar_one()
                if not has_code:
                    conn.exec_driver_sql("ALTER TABLE columns ADD COLUMN code VARCHAR(20)")
                for field in ("is_blocked", "needs_human_review"):
                    if field not in task_fields:
                        conn.exec_driver_sql(
                            f"ALTER TABLE tasks ADD COLUMN {field} BOOLEAN NOT NULL DEFAULT 0"
                        )
                for item in plan:
                    conn.exec_driver_sql(
                        "UPDATE columns SET code=?, name=?, position=? WHERE id=?", item
                    )
                for board_id, existing in boards.items():
                    for position, (code, name) in enumerate(WORKFLOW):
                        if code not in existing:
                            conn.exec_driver_sql(
                                "INSERT INTO columns (board_id, code, name, position) VALUES (?, ?, ?, ?)",
                                (board_id, code, name, position),
                            )
                conn.exec_driver_sql(
                    "CREATE UNIQUE INDEX IF NOT EXISTS uq_columns_board_code ON columns (board_id, code)"
                )
                if conn.exec_driver_sql("PRAGMA foreign_key_check").all():
                    raise RuntimeError("Foreign key validation failed; migration rolled back")
                if conn.exec_driver_sql("SELECT count(*) FROM tasks").scalar_one() != task_count:
                    raise RuntimeError("Task count changed; migration rolled back")

            Base.metadata.create_all(conn)
            conn.commit()
        except Exception:
            conn.rollback()
            raise
    return backup
