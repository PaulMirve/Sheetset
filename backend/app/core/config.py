import os

SECRET_KEY = os.environ.get("SECRET_KEY", "REDACTED_LOCAL_CREDENTIAL").encode()
TOKEN_TTL = int(os.environ.get("TOKEN_TTL", 60 * 60 * 24 * 7))
DB_PATH = os.environ.get("DB_PATH", os.path.join(os.path.dirname(__file__), "../../kanban.db"))
CORS_ORIGINS = os.environ.get("CORS_ORIGINS", "http://localhost:5173").split(",")
MIN_PASSWORD_LENGTH = 8
