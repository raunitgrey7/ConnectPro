"""Health check endpoint."""
from fastapi import APIRouter, Depends
from sqlalchemy import text
from sqlalchemy.orm import Session

from app.core.config import settings
from app.dependencies.db import get_db
from app.schemas.common import HealthResponse

router = APIRouter(tags=["Health"])


@router.get("/health", response_model=HealthResponse, summary="Health check")
def health_check(db: Session = Depends(get_db)) -> HealthResponse:
    """Simple liveness/readiness probe that also verifies DB connectivity."""
    try:
        db.execute(text("SELECT 1"))
        db_status = "connected"
    except Exception:  # noqa: BLE001
        db_status = "unavailable"

    return HealthResponse(
        status="healthy" if db_status == "connected" else "degraded",
        app_name=settings.APP_NAME,
        version=settings.APP_VERSION,
        environment=settings.APP_ENV,
        database=db_status,
    )
