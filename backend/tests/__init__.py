import os

# Imported before any test module, so app.core.config finds a key.
os.environ.setdefault("SECRET_KEY", "test-secret")
