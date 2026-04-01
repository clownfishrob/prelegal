from contextlib import asynccontextmanager
from pathlib import Path

from fastapi import FastAPI
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles

from database import init_db
from routers import auth as auth_router
from routers import chat as chat_router
from routers import templates as templates_router

FRONTEND_OUT = Path(__file__).parent.parent / "frontend" / "out"


@asynccontextmanager
async def lifespan(app: FastAPI):
    await init_db()
    yield


app = FastAPI(title="Prelegal API", version="0.1.0", lifespan=lifespan)

app.include_router(auth_router.router)
app.include_router(chat_router.router)
app.include_router(templates_router.router)

if FRONTEND_OUT.is_dir():
    next_static = FRONTEND_OUT / "_next"
    if next_static.is_dir():
        app.mount("/_next", StaticFiles(directory=str(next_static)), name="next-assets")

    @app.get("/{full_path:path}")
    async def spa_fallback(full_path: str):
        file_path = (FRONTEND_OUT / full_path).resolve()
        if full_path and file_path.is_relative_to(FRONTEND_OUT.resolve()) and file_path.is_file():
            return FileResponse(file_path)
        return FileResponse(FRONTEND_OUT / "index.html")
