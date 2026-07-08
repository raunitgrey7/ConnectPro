"""Shared / generic Pydantic schemas."""
from typing import Any, Generic, Optional, TypeVar

from pydantic import BaseModel

T = TypeVar("T")


class APIResponse(BaseModel, Generic[T]):
    """Standard success envelope returned by all endpoints."""

    success: bool = True
    message: str = "OK"
    data: Optional[T] = None


class HealthResponse(BaseModel):
    status: str
    app_name: str
    version: str
    environment: str
    database: str
