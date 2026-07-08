"""Shared pytest fixtures: an isolated in-memory SQLite DB and a TestClient."""
import os
import tempfile

_TMP_DB_PATH = os.path.join(tempfile.gettempdir(), "test_video_conferencing.db")
os.environ["DATABASE_URL"] = f"sqlite:///{_TMP_DB_PATH}"
os.environ["SEED_ON_STARTUP"] = "false"

if os.path.exists(_TMP_DB_PATH):
    os.remove(_TMP_DB_PATH)

import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool
from fastapi.testclient import TestClient

from app.database.base import Base
from app.dependencies.db import get_db


@pytest.fixture()
def db_engine():
    engine = create_engine(
        "sqlite:///:memory:",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )
    from app.models import user, meeting, participant, scheduled_meeting, meeting_history  # noqa

    Base.metadata.create_all(bind=engine)
    yield engine
    Base.metadata.drop_all(bind=engine)


@pytest.fixture()
def client(db_engine):
    TestingSessionLocal = sessionmaker(bind=db_engine, autoflush=False, autocommit=False)

    def override_get_db():
        db = TestingSessionLocal()
        try:
            yield db
        finally:
            db.close()

    from app.main import app

    app.dependency_overrides[get_db] = override_get_db
    with TestClient(app) as test_client:
        yield test_client
    app.dependency_overrides.clear()
