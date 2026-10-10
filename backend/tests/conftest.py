import pytest


@pytest.fixture(autouse=True)
def isolate_app_state():
    # Pytest imports the app once for the entire suite. Changing DB_PATH inside a
    # later test module does not replace that engine; reset the shared test DB.
    from app.api.routes.auth import _failures
    from app.db import Base, engine

    Base.metadata.drop_all(engine)
    Base.metadata.create_all(engine)
    _failures.clear()
    yield
    _failures.clear()
