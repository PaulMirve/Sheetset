import os
import tempfile

os.environ["DB_PATH"] = os.path.join(tempfile.mkdtemp(), "test.db")

from sqlalchemy import func, select  # noqa: E402

from app.crud import task as task_crud  # noqa: E402
from app.db import Base, engine  # noqa: E402
from app.db.models import Board, Column, Subtask, Task, User, board_members  # noqa: E402
from app.db.session import SessionLocal  # noqa: E402

Base.metadata.create_all(engine)


def test_board_models():
    with SessionLocal() as s:
        u = User(email="models@b.co", pw="x", first_name="Ada", last_name="Lovelace")
        s.add(u)
        s.flush()
        b = Board(key="APP", name="Spring launch", owner_id=u.id, members=[u])
        b.columns = [Column(name="Done", position=2), Column(name="To do", position=0), Column(name="Doing", position=1)]
        s.add(b)
        s.commit()
        s.expire_all()
        assert [c.name for c in b.columns] == ["To do", "Doing", "Done"]
        col = b.columns[0].id

        # Public numbers come from a counter: deleted numbers are never reused.
        new = lambda title, **kw: task_crud.create(s, b.id, col, u.id, title, **kw)  # noqa: E731
        assert [new(t).number for t in ("a", "b", "c")] == [1, 2, 3]
        s.delete(s.scalar(select(Task).where(Task.number == 3)))
        s.commit()
        assert new("d").number == 4

        # Deleting an epic keeps its tasks.
        epic = new("Billing", is_epic=True)
        kid = new("Migrate", epic_id=epic.id, subtasks=[Subtask(title="Map tiers"), Subtask(title="Dry run")])
        s.delete(epic)
        s.commit()
        s.refresh(kid)
        assert kid.epic_id is None

        # Deleting a task drops its subtasks; deleting a board drops everything under it.
        s.delete(kid)
        s.commit()
        assert s.scalar(select(func.count()).select_from(Subtask)) == 0
        s.delete(b)
        s.commit()
        for t in (Column, Task):
            assert s.scalar(select(func.count()).select_from(t)) == 0
        assert s.scalar(select(func.count()).select_from(board_members)) == 0


if __name__ == "__main__":
    test_board_models()
    print("ok")
