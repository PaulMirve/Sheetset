import os
import tempfile

# Imported before any test module, so app.core.config finds a key.
os.environ.setdefault("SECRET_KEY", "test-secret")
# Even a single newly added test module must never open the user's database.
os.environ["DB_PATH"] = os.path.join(tempfile.mkdtemp(prefix="kanban-tests-"), "test.db")
