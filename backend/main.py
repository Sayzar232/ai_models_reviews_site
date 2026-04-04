import os
from contextlib import asynccontextmanager
from fastapi import FastAPI, APIRouter
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from backend.config import get_settings
from backend.database import create_pool, close_pool


@asynccontextmanager
async def lifespan(app: FastAPI):
    await create_pool()
    yield
    await close_pool()


app = FastAPI(
    title="AI Review Hub",
    description="Платформа для оценки и рецензирования AI-моделей",
    version="1.0.0",
    lifespan=lifespan,
)

settings = get_settings()

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount all routers under /api prefix
from backend.routers import auth, models, reviews, local_models, local_reviews

api_router = APIRouter(prefix="/api")
api_router.include_router(auth.router)
api_router.include_router(models.router)
api_router.include_router(reviews.router)
api_router.include_router(local_models.router)
api_router.include_router(local_reviews.router)
app.include_router(api_router)

# Serve frontend static files (must be last)
frontend_dir = os.path.join(os.path.dirname(os.path.dirname(__file__)), "frontend")
if os.path.exists(frontend_dir):
    app.mount("/", StaticFiles(directory=frontend_dir, html=True), name="frontend")
