from fastapi import APIRouter

from .routes import auth, boards, executions, meetings, tasks

api_router = APIRouter()
api_router.include_router(auth.router)
api_router.include_router(boards.router)
api_router.include_router(meetings.router)
api_router.include_router(tasks.router)

api_router.include_router(executions.router)
