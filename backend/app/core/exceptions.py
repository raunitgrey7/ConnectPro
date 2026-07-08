"""
Centralized application exceptions and FastAPI exception handlers.

Every domain-level error raised by the service/repository layers should be a
subclass of AppException so that a single exception handler can translate it
into a consistent, well-structured JSON error response.
"""
from typing import Any, Dict, Optional

from fastapi import FastAPI, Request, status
from fastapi.encoders import jsonable_encoder
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse

from app.core.logging import get_logger

logger = get_logger(__name__)


class AppException(Exception):
    """Base class for all application-level exceptions."""

    status_code: int = status.HTTP_400_BAD_REQUEST
    error_code: str = "APP_ERROR"

    def __init__(self, message: str, details: Optional[Dict[str, Any]] = None) -> None:
        self.message = message
        self.details = details or {}
        super().__init__(message)


class NotFoundException(AppException):
    status_code = status.HTTP_404_NOT_FOUND
    error_code = "NOT_FOUND"


class ValidationException(AppException):
    status_code = status.HTTP_422_UNPROCESSABLE_ENTITY
    error_code = "VALIDATION_ERROR"


class ConflictException(AppException):
    status_code = status.HTTP_409_CONFLICT
    error_code = "CONFLICT"


class MeetingNotFoundException(NotFoundException):
    error_code = "MEETING_NOT_FOUND"

    def __init__(self, meeting_id: str) -> None:
        super().__init__(
            message=f"Meeting with id '{meeting_id}' was not found.",
            details={"meeting_id": meeting_id},
        )


class MeetingEndedException(ConflictException):
    error_code = "MEETING_ENDED"

    def __init__(self, meeting_id: str) -> None:
        super().__init__(
            message=f"Meeting '{meeting_id}' has already ended and cannot be joined.",
            details={"meeting_id": meeting_id},
        )


class InvalidScheduleException(ValidationException):
    error_code = "INVALID_SCHEDULE"


class UserNotFoundException(NotFoundException):
    error_code = "USER_NOT_FOUND"

    def __init__(self, user_id: str) -> None:
        super().__init__(
            message=f"User with id '{user_id}' was not found.",
            details={"user_id": user_id},
        )


def _error_payload(error_code: str, message: str, details: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
    return {
        "success": False,
        "error": {
            "code": error_code,
            "message": message,
            "details": details or {},
        },
    }


def register_exception_handlers(app: FastAPI) -> None:
    """Attach global exception handlers to the FastAPI application."""

    @app.exception_handler(AppException)
    async def app_exception_handler(request: Request, exc: AppException) -> JSONResponse:
        logger.warning("AppException on %s %s: %s", request.method, request.url.path, exc.message)
        return JSONResponse(
            status_code=exc.status_code,
            content=_error_payload(exc.error_code, exc.message, exc.details),
        )

    @app.exception_handler(RequestValidationError)
    async def validation_exception_handler(
        request: Request, exc: RequestValidationError
    ) -> JSONResponse:
        raw_errors = exc.errors()
        for err in raw_errors:
            err.pop("ctx", None)
        safe_errors = jsonable_encoder(raw_errors)
        logger.warning("Validation error on %s %s: %s", request.method, request.url.path, safe_errors)
        return JSONResponse(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            content=_error_payload(
                "VALIDATION_ERROR",
                "One or more fields failed validation.",
                {"errors": safe_errors},
            ),
        )

    @app.exception_handler(Exception)
    async def unhandled_exception_handler(request: Request, exc: Exception) -> JSONResponse:
        logger.exception("Unhandled exception on %s %s", request.method, request.url.path)
        return JSONResponse(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            content=_error_payload(
                "INTERNAL_SERVER_ERROR",
                "An unexpected error occurred. Please try again later.",
            ),
        )
