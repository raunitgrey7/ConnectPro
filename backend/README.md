# Video Conferencing Platform — Backend

A production-quality, Zoom-inspired video conferencing backend built with **FastAPI**, **SQLAlchemy**, and **SQLite**, designed with Clean Architecture so it can be dropped behind any frontend (the intended pairing is a Next.js client).

---

## Table of Contents

1. [Tech Stack](#tech-stack)
2. [Architecture](#architecture)
3. [Folder Structure](#folder-structure)
4. [Database Schema & ER Diagram](#database-schema--er-diagram)
5. [Installation Guide](#installation-guide)
6. [Running with Docker](#running-with-docker)
7. [API Documentation](#api-documentation)
8. [Validation Rules](#validation-rules)
9. [Seed Data](#seed-data)
10. [Testing](#testing)
11. [Alembic Migrations](#alembic-migrations)
12. [Design Notes & Trade-offs](#design-notes--trade-offs)

---

## Tech Stack

| Layer            | Technology              |
|-------------------|--------------------------|
| Language          | Python 3.12              |
| Web Framework     | FastAPI                  |
| ORM               | SQLAlchemy 2.0 (typed)   |
| Database          | SQLite                   |
| Migrations        | Alembic                  |
| Validation        | Pydantic v2               |
| ASGI Server       | Uvicorn                  |
| Config            | python-dotenv / pydantic-settings |
| Testing           | Pytest + FastAPI TestClient |

---

## Architecture

The project follows **Clean / Layered Architecture** so responsibilities never leak across boundaries:

```
Router (API layer)
   |  receives HTTP request, validates via Pydantic schema
   v
Service (business logic layer)
   |  enforces domain rules (uniqueness, validation, status transitions)
   v
Repository (data-access layer)
   |  translates domain calls into SQLAlchemy queries
   v
Database (SQLite via SQLAlchemy ORM)
```

- **Routers** never touch the database directly — they only call a `Service`.
- **Services** never write raw SQL — they only call a `Repository`.
- **Repositories** are the only layer that imports SQLAlchemy models directly.
- **Dependency Injection** (`app/dependencies/db.py`) wires a fresh DB session and service instance into every request.
- **Centralized exception handling** (`app/core/exceptions.py`) converts domain exceptions into consistent JSON error responses.

This separation makes the code easy to unit test (swap repositories for mocks), easy to extend (swap SQLite for Postgres by changing `DATABASE_URL`), and interview-ready (each layer maps to a well-known pattern: Repository Pattern, Service Layer, Dependency Injection).

---

## Folder Structure

```
backend/
├── app/
│   ├── main.py                  # FastAPI app factory, lifespan, middleware, routers
│   ├── api/
│   │   └── routers/
│   │       ├── health.py        # GET /health
│   │       └── meeting.py       # All /api/meeting/* endpoints
│   ├── schemas/                 # Pydantic request/response models
│   │   ├── common.py
│   │   ├── user.py
│   │   └── meeting.py
│   ├── models/                  # SQLAlchemy ORM models (one file per table)
│   │   ├── user.py
│   │   ├── meeting.py
│   │   ├── participant.py
│   │   ├── scheduled_meeting.py
│   │   └── meeting_history.py
│   ├── database/
│   │   ├── base.py              # Declarative Base + shared mixins
│   │   └── session.py           # Engine, SessionLocal, init_db()
│   ├── services/
│   │   └── meeting_service.py   # All business logic
│   ├── repositories/
│   │   ├── meeting_repository.py
│   │   └── user_repository.py
│   ├── dependencies/
│   │   └── db.py                # get_db(), get_meeting_service()
│   ├── core/
│   │   ├── config.py            # Settings (env-driven)
│   │   ├── exceptions.py        # AppException hierarchy + handlers
│   │   └── logging.py           # Centralized logging config
│   ├── utils/
│   │   ├── id_generator.py      # Unique meeting-code generator
│   │   └── url_generator.py     # Secure invite-URL generator
│   └── seed/
│       └── seed_data.py         # Dummy data seeding
├── alembic/                     # Migration environment + versions
├── tests/                       # Pytest suite
├── requirements.txt
├── .env.example
├── Dockerfile
├── docker-compose.yml
├── alembic.ini
├── pytest.ini
├── run.py                       # `python run.py` for local dev
└── README.md
```

---

## Database Schema & ER Diagram

### Tables

- **users** — every host or participant is a `User` (idempotently created by email on first create/join/schedule call).
- **meetings** — an instant or already-started meeting *instance*. Rows persist after the meeting ends so `/meeting/recent` and history views keep working.
- **scheduled_meetings** — a future meeting planned via `/meeting/schedule`. When it eventually starts, a `Meeting` row can be linked back via `scheduled_meeting_id`.
- **participants** — join table tracking each user's attendance in a specific meeting (join/leave timestamps, role).
- **meeting_history** — an append-only audit log of lifecycle events (`created`, `joined`, `left`, `ended`, `scheduled`, `cancelled`).

### ER Diagram

```
+--------------------+
|       users        |
+--------------------+
| id (PK)            |
| name               |
| email (UNIQUE)     |
| avatar_url         |
| created_at         |
| updated_at         |
+---------+----------+
          | 1
          | hosts (1-to-many)
          |
   +------+--------------------------------------+--------------------------+
   |                                              |                          |
   v many                                         v many                    v many
+--------------------+              +--------------------------+  +--------------------+
|      meetings      |              |    scheduled_meetings     |  |    participants     |
+--------------------+              +--------------------------+  +--------------------+
| id (PK)            |<-------------| id (PK)                   |  | id (PK)             |
| meeting_code (UQ)  |  optional    | meeting_code (UQ)         |  | meeting_id (FK) ----+---+
| title              |  FK link     | title                     |  | user_id (FK)        |   |
| invite_url         |  (Meeting.   | description               |  | joined_at           |   |
| host_id (FK)       |  scheduled_  | scheduled_start           |  | left_at             |   |
| status             |  meeting_id) | duration_minutes          |  | role                |   |
| started_at         |              | invite_url                |  +--------------------+   |
| ended_at           |              | status                    |                            |
| duration_minutes   |              | host_id (FK)               |                            |
| scheduled_meeting  |--------------| created_at / updated_at    |                            |
| _id (FK, nullable) |              +--------------------------+                            |
+---------+----------+                                                                        |
          | 1                                                                                 |
          | has many                                                                          |
          v many                                                                              |
+------------------------+                                                                    |
|    meeting_history       |                                                                    |
+------------------------+                                                                    |
| id (PK)                   |                                                                    |
| meeting_id (FK) <----------+----------------------------------------------------------------+
| user_id (FK, nullable)    |
| event_type                 |
| notes                       |
| created_at                  |
+------------------------+
```

### Relationships

| Relationship | Type | Cascade |
|---|---|---|
| `User` → `Meeting` (host) | 1-to-many | `ON DELETE CASCADE` |
| `User` → `ScheduledMeeting` (host) | 1-to-many | `ON DELETE CASCADE` |
| `User` → `Participant` | 1-to-many | `ON DELETE CASCADE` |
| `Meeting` → `Participant` | 1-to-many | `ON DELETE CASCADE` |
| `Meeting` → `MeetingHistory` | 1-to-many | `ON DELETE CASCADE` |
| `ScheduledMeeting` → `Meeting` | 1-to-many (optional) | `ON DELETE SET NULL` |

### Constraints & Indexes

- `users.email` — **UNIQUE**, indexed.
- `meetings.meeting_code` / `scheduled_meetings.meeting_code` — **UNIQUE**, indexed (generation retries on collision).
- `participants` — composite unique constraint on `(meeting_id, user_id, joined_at)` so the same join event can't be double-recorded, while still allowing a user to re-join a meeting multiple times (each with a distinct `joined_at`).
- Foreign keys on `host_id`, `meeting_id`, `user_id`, `scheduled_meeting_id` are all indexed for fast joins/lookups.
- `meetings.status` and `scheduled_meetings.status` are indexed since dashboard queries filter on them.

---

## Installation Guide

### Prerequisites
- Python 3.12+
- pip

### Steps

```bash
# 1. Unzip and enter the project
cd backend

# 2. Create and activate a virtual environment
python3 -m venv venv
source venv/bin/activate        # Windows: venv\Scripts\activate

# 3. Install dependencies
pip install -r requirements.txt

# 4. Configure environment variables
cp .env.example .env
# edit .env if you need to change ports, CORS origins, etc.

# 5. Run database migrations (optional — the app also auto-creates tables on
#    startup via SQLAlchemy metadata, but Alembic is the production-correct path)
alembic upgrade head

# 6. Start the server
python run.py
# or
uvicorn app.main:app --reload
```

The API will be available at **http://localhost:8000**, interactive Swagger docs at **http://localhost:8000/docs**, and ReDoc at **http://localhost:8000/redoc**.

On first startup, the app automatically seeds 8 dummy users, 10 upcoming meetings, and 11 recent/active meetings (see [Seed Data](#seed-data)). Set `SEED_ON_STARTUP=false` in `.env` to disable this.

---

## Running with Docker

```bash
docker-compose up --build
```

This builds the image, starts the container, persists the SQLite file in a named Docker volume (`backend_data`), and exposes the API on `http://localhost:8000`.

To stop:
```bash
docker-compose down
```

---

## API Documentation

Base URL: `http://localhost:8000`
All meeting endpoints are prefixed with `/api` (configurable via `API_PREFIX`).

Every response is wrapped in a standard envelope:
```json
{ "success": true, "message": "...", "data": { ... } }
```
Errors follow a consistent shape:
```json
{ "success": false, "error": { "code": "MEETING_NOT_FOUND", "message": "...", "details": { ... } } }
```

### `GET /health`
Health check — verifies the app is running and the database is reachable.

### `POST /api/meeting/create`
Create an instant meeting. Generates a unique meeting code and secure invite URL; the host is automatically added as the first participant.

**Body**
```json
{ "title": "Instant Meeting", "host_name": "Alice", "host_email": "alice@example.com" }
```

### `POST /api/meeting/join`
Join a meeting by `meeting_id` (code) **or** `invite_url` (at least one required).

**Body**
```json
{ "meeting_id": "abc-def-ghi-j", "participant_name": "Bob", "participant_email": "bob@example.com" }
```

### `POST /api/meeting/schedule`
Schedule a future meeting.

**Body**
```json
{
  "title": "Sprint Planning",
  "description": "Plan next sprint",
  "date": "2026-08-01",
  "time": "14:00",
  "duration_minutes": 60,
  "host_name": "Alice",
  "host_email": "alice@example.com"
}
```

### `GET /api/meeting/upcoming?limit=10`
List upcoming scheduled meetings, soonest first. Powers the landing dashboard.

### `GET /api/meeting/recent?limit=10`
List the most recently started/ended meetings, newest first. Powers the landing dashboard.

### `GET /api/meeting/{meeting_id}`
Full meeting detail, including the participant roster. Accepts either the internal UUID or the `meeting_code`.

### `DELETE /api/meeting/{meeting_id}`
Delete/end a meeting (cascade-deletes its participants and history).

Full interactive documentation (request/response schemas, try-it-out) is auto-generated by FastAPI at **`/docs`** (Swagger UI) and **`/redoc`**, and the raw OpenAPI schema is available at **`/openapi.json`**.

---

## Validation Rules

- **Meeting codes** are generated server-side and checked for uniqueness against both `meetings` and `scheduled_meetings` before being assigned (retried up to 5 times).
- **Schedule duration** must be a positive integer ≤ 1440 minutes (24 hours); non-positive values are rejected with `422`.
- **Schedule date/time** must parse as `YYYY-MM-DD` / `HH:MM` and resolve to a moment in the future; past dates return a `422 INVALID_SCHEDULE` error.
- **Join requests** must supply either `meeting_id` or `invite_url`; joining a non-existent meeting returns `404 MEETING_NOT_FOUND`; joining an ended meeting returns `409 MEETING_ENDED`.
- **Emails** are validated as well-formed addresses via Pydantic's `EmailStr`.
- All validation failures return descriptive, field-level error messages via a centralized `422` handler.

---

## Seed Data

On first startup (or by running `python -m app.seed.seed_data` directly), the database is populated with:

- **8 dummy users**
- **10 upcoming (scheduled) meetings**, spread across the next 10 days, each with a random host and duration
- **10 recent (ended) meetings**, spread across the last 10 days, each with 2–4 participants
- **1 live/active demo meeting** so join flows have a real example to hit immediately

Seeding is idempotent — it checks whether any `users` already exist and skips itself on subsequent runs (or container restarts) unless `run_seed(force=True)` is called explicitly.

---

## Testing

```bash
pytest
```

The suite (`tests/test_meetings.py`) covers: health check, meeting creation (including uniqueness of generated codes), joining by code and by invite URL, join failures (not found), scheduling (success, past-date rejection, negative-duration rejection, malformed date rejection), upcoming/recent listings, meeting detail lookup (found/not-found), and deletion (success + idempotent 404 on re-delete). Tests run against an isolated in-memory SQLite database via a `TestClient` + dependency override, so they never touch your local `app.db`.

---

## Alembic Migrations

An initial migration (`alembic/versions/<hash>_initial_schema.py`) is included, generated via:
```bash
alembic revision --autogenerate -m "initial schema"
```

To apply migrations:
```bash
alembic upgrade head
```

To create a new migration after changing models:
```bash
alembic revision --autogenerate -m "describe your change"
alembic upgrade head
```

---

## Design Notes & Trade-offs

- **SQLite** was chosen per the spec for zero-setup local development; the code is written against the SQLAlchemy ORM only (no raw/dialect-specific SQL), so swapping `DATABASE_URL` to Postgres/MySQL requires no application code changes — only a new Alembic migration run.
- **Users are upserted by email** on every create/join/schedule call rather than requiring a separate signup flow, since the spec doesn't define authentication. A real product would add an auth layer (JWT/OAuth) in front of this.
- **Meeting rows persist after ending** (rather than being deleted) so `/meeting/recent` and `meeting_history` remain meaningful; `DELETE /api/meeting/{id}` is provided for explicit hard-deletion when needed.
- **Invite URLs** embed a random `token` query parameter (via `secrets.token_urlsafe`) so links can't be trivially guessed even by someone who knows the meeting-code pattern.
