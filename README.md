# ConnectPro — Enterprise Video Conferencing Platform

A production-ready video conferencing platform built with **Next.js** (frontend) and **FastAPI** (backend).

---

## Quick Start

### Prerequisites
- **Python 3.12** (available on path via `py -3.12`)
- **Node.js 18+** with npm

### Single-Command Setup & Run

From the root directory:

1. **One-Time Setup** (installs both frontend and backend dependencies):
   ```bash
   npm run setup
   ```

2. **Run Both Together** (launches FastAPI backend and Next.js frontend concurrently):
   ```bash
   npm run dev
   ```

- Frontend runs at **http://localhost:3000**
- Backend runs at **http://localhost:8000**
- Swagger docs at **http://localhost:8000/docs**


---

## Architecture

```
ConnectPro/
├── backend/              # FastAPI + SQLAlchemy + SQLite
│   ├── app/
│   │   ├── api/routers/  # REST endpoints
│   │   ├── services/     # Business logic
│   │   ├── repositories/ # Data access
│   │   ├── models/       # ORM models
│   │   ├── schemas/      # Pydantic schemas
│   │   ├── core/         # Config, logging, exceptions
│   │   └── seed/         # Demo data seeding
│   └── tests/
├── frontend/             # Next.js 16 + TypeScript + TailwindCSS v4
│   └── src/
│       ├── app/          # Pages (App Router)
│       ├── components/   # React components
│       ├── hooks/        # Custom hooks
│       └── lib/          # API client + TypeScript types
└── README.md
```

## API Endpoints

| Method   | Route                        | Description                  |
|----------|------------------------------|------------------------------|
| `GET`    | `/health`                    | Health check                 |
| `POST`   | `/api/meeting/create`        | Create instant meeting       |
| `POST`   | `/api/meeting/join`          | Join by code or invite URL   |
| `POST`   | `/api/meeting/schedule`      | Schedule future meeting      |
| `GET`    | `/api/meeting/upcoming`      | List upcoming meetings       |
| `GET`    | `/api/meeting/recent`        | List recent meetings         |
| `GET`    | `/api/meeting/{id}`          | Meeting details              |
| `DELETE` | `/api/meeting/{id}`          | Delete/end meeting           |

## Environment Variables

### Backend (`backend/.env`)
| Variable           | Default                              |
|--------------------|--------------------------------------|
| `APP_ENV`          | `development`                        |
| `PORT`             | `8000`                               |
| `DATABASE_URL`     | `sqlite:///./app.db`                 |
| `CORS_ORIGINS`     | `http://localhost:3000`              |
| `SEED_ON_STARTUP`  | `true`                               |

### Frontend (`frontend/.env.local`)
| Variable               | Default                    |
|------------------------|----------------------------|
| `NEXT_PUBLIC_API_URL`  | `http://localhost:8000`    |

## Tech Stack

| Layer     | Technology                  |
|-----------|-----------------------------|
| Frontend  | Next.js 16, React 19, TailwindCSS v4, TypeScript |
| Backend   | FastAPI, SQLAlchemy 2.0, Pydantic v2 |
| Database  | SQLite                      |
| Fonts     | Inter, Material Symbols Outlined |
