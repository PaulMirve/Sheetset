import sqlite3

import pytest
from sqlalchemy import create_engine

from app.db.migrate import initialize_database
from app.workflow import WORKFLOW


def legacy_database(tmp_path):
    path = tmp_path / "legacy.db"
    with sqlite3.connect(path) as db:
        db.executescript("""
            CREATE TABLE boards (id INTEGER PRIMARY KEY);
            CREATE TABLE columns (
                id INTEGER PRIMARY KEY, board_id INTEGER NOT NULL REFERENCES boards(id),
                name TEXT NOT NULL, position INTEGER NOT NULL
            );
            CREATE TABLE tasks (
                id INTEGER PRIMARY KEY, board_id INTEGER NOT NULL REFERENCES boards(id),
                column_id INTEGER NOT NULL REFERENCES columns(id), title TEXT NOT NULL
            );
            INSERT INTO boards VALUES (1), (2);
            INSERT INTO columns VALUES
                (11, 1, 'Done', 0), (12, 1, 'To do', 1),
                (13, 1, 'Doing', 2), (14, 1, 'Code review', 3);
            INSERT INTO tasks VALUES (21, 1, 11, 'Finished'), (22, 1, 13, 'In progress');
        """)
    return path, create_engine(f"sqlite:///{path}")


def test_migration_preserves_ids_tasks_and_backup_and_is_idempotent(tmp_path):
    path, engine = legacy_database(tmp_path)
    backup = initialize_database(engine)
    assert backup is not None and backup.exists()
    with sqlite3.connect(path) as db:
        assert db.execute("SELECT id, board_id, column_id, title FROM tasks ORDER BY id").fetchall() == [
            (21, 1, 11, "Finished"), (22, 1, 13, "In progress"),
        ]
        assert db.execute("SELECT is_blocked, needs_human_review FROM tasks").fetchall() == [(0, 0), (0, 0)]
        for board_id in (1, 2):
            assert db.execute(
                "SELECT code, name FROM columns WHERE board_id=? ORDER BY position", (board_id,),
            ).fetchall() == list(WORKFLOW)
        assert db.execute("SELECT code FROM columns WHERE id=11").fetchone() == ("done",)
        original = db.execute("SELECT * FROM columns ORDER BY id").fetchall()
    with sqlite3.connect(backup) as saved:
        assert saved.execute("SELECT * FROM tasks ORDER BY id").fetchall() == [
            (21, 1, 11, "Finished"), (22, 1, 13, "In progress"),
        ]
        assert "code" not in {r[1] for r in saved.execute("PRAGMA table_info(columns)")}
    assert initialize_database(engine) is None
    with sqlite3.connect(path) as db:
        assert db.execute("SELECT * FROM columns ORDER BY id").fetchall() == original
    assert len(list((tmp_path / ".db-backups").glob("*.sqlite3"))) == 1
    engine.dispose()


@pytest.mark.parametrize("name", ["Unmapped", "Done"])
def test_unknown_or_duplicate_legacy_column_aborts_without_changes(tmp_path, name):
    path, engine = legacy_database(tmp_path)
    with sqlite3.connect(path) as db:
        db.execute("UPDATE columns SET name=? WHERE id=12", (name,))
        before = list(db.iterdump())
    with pytest.raises(RuntimeError, match="unknown or duplicate"):
        initialize_database(engine)
    with sqlite3.connect(path) as db:
        assert list(db.iterdump()) == before
    assert not (tmp_path / ".db-backups").exists()
    engine.dispose()


def test_mid_migration_failure_rolls_back_schema_and_rows(tmp_path):
    path, engine = legacy_database(tmp_path)
    with sqlite3.connect(path) as db:
        db.executescript("""
            CREATE TRIGGER reject_new_column BEFORE INSERT ON columns
            BEGIN SELECT RAISE(ABORT, 'simulated migration failure'); END;
        """)
        before = list(db.iterdump())
    with pytest.raises(Exception, match="simulated migration failure"):
        initialize_database(engine)
    with sqlite3.connect(path) as db:
        assert list(db.iterdump()) == before
    engine.dispose()
