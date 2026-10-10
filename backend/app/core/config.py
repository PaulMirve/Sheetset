import os

if not os.environ.get("SECRET_KEY"):
    raise RuntimeError("SECRET_KEY is not set; copy backend/.env.example to backend/.env and fill it in")
SECRET_KEY = os.environ["SECRET_KEY"].encode()
TOKEN_TTL = int(os.environ.get("TOKEN_TTL", 60 * 60 * 24 * 7))
DB_PATH = os.environ.get("DB_PATH", os.path.join(os.path.dirname(__file__), "../../kanban.db"))
CORS_ORIGINS = os.environ.get("CORS_ORIGINS", "http://localhost:5173,http://localhost:1420").split(",")
N8N_API_KEY = os.environ.get("N8N_API_KEY", "")  # empty = meeting ingest disabled
MIN_PASSWORD_LENGTH = 8
