"""
Application entrypoint.

Wires together configuration, logging, database initialization, seed data,
exception handling, middleware and routers into a single FastAPI app.
"""
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.routers import health, meeting
from app.core.config import settings
from app.core.exceptions import register_exception_handlers
from app.core.logging import configure_logging, get_logger
from app.database.session import init_db

configure_logging()
logger = get_logger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application startup / shutdown hooks."""
    logger.info("Starting %s (%s)...", settings.APP_NAME, settings.APP_ENV)

    init_db()
    logger.info("Database tables ensured.")

    if settings.SEED_ON_STARTUP:
        from app.seed.seed_data import run_seed

        run_seed()

    yield

    logger.info("Shutting down %s...", settings.APP_NAME)


def create_app() -> FastAPI:
    app = FastAPI(
        title=settings.APP_NAME,
        version=settings.APP_VERSION,
        description=(
            "Backend API for a Zoom-inspired video conferencing platform. "
            "Provides meeting creation, joining, scheduling, history and "
            "participant tracking."
        ),
        lifespan=lifespan,
    )

    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.cors_origins_list,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    register_exception_handlers(app)

    app.include_router(health.router)
    app.include_router(meeting.router, prefix=settings.API_PREFIX)

    return app


app = create_app()
