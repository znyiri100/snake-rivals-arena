# 🕹️ Arcade Arena

A modern, full-stack gaming platform featuring classic arcade games with real-time leaderboards, community groups, and a robust user system. Built with React, FastAPI, and PostgreSQL.

![Status](https://img.shields.io/badge/status-active-success.svg)
![License](https://img.shields.io/badge/license-MIT-blue.svg)

## 🎮 Games

- **🐍 Snake**: Classic snake gameplay with wall-wrapping or deadly wall modes.
- **💣 Minesweeper**: Test your logic and speed.
- **👾 Space Invaders**: Defend against waves of aliens.
- **🧱 Tetris**: Stack blocks and clear lines in this timeless puzzle.

## ✨ Key Features

- **👥 Groups System**
  - Create or join community groups (e.g., "Office", "Friends").
  - Compete on leaderboards specific to your group.
  - Multi-tenancy support: Your username can be unique *per group*.

- **🏆 Leaderboards**
  - **Overall Rankings**: See who rules the arcade across all games.
  - **Best Per User**: Track your personal bests.
  - **Top N**: View top players by game mode and group.

- **🛠️ Modern Architecture**
  - **Backend**: FastAPI (Python) serving REST APIs and static files.
  - **Frontend**: React 18 + TypeScript with TanStack Query.
  - **Database**: PostgreSQL (Production) / SQLite (Dev) with SQLAlchemy Async.
  - **Deployment**: Docker containerized with multi-stage builds.

## 🚀 Quick Start

### Using Docker Compose (Recommended)

```bash
# Start the application
docker compose up --build

# Access the app
open http://localhost:8000
```

### Local Development

**Backend:**
```bash
cd backend
# Create virtual env and install dependencies
uv sync
# Run the server (auto-reloads on change)
uv run uvicorn app.main:app --reload
```

**Frontend:**
```bash
cd frontend
npm install
npm run dev
```

## 🏗️ Architecture

The project uses a **Unified App Container** model for deployment:

1.  **Build Stage**: The React frontend is built into static assets.
2.  **Run Stage**: The FastAPI backend mounts the static assets and serves them alongside the API.
3.  **Database**: A separate PostgreSQL container handles data persistence.

```
┌─────────────────────────────────────┐
│     Unified App Container           │
│  ┌──────────────┐  ┌──────────────┐ │
│  │   React      │  │   FastAPI    │ │
│  │   Frontend   │  │   Backend    │ │
│  │  (Static)    │  │   (API)      │ │
│  └──────────────┘  └──────────────┘ │
│         Port 8000                   │
└─────────────────────────────────────┘
              │
              ▼
┌─────────────────────────────────────┐
│      PostgreSQL Database            │
│         Port 5432                   │
└─────────────────────────────────────┘
```

## 🛠️ Tech Stack

**Frontend:**
- **Core**: React 18, TypeScript, Vite
- **Styling**: Tailwind CSS, shadcn/ui
- **State/Data**: TanStack Query
- **Routing**: React Router

**Backend:**
- **Core**: FastAPI (Python 3.12)
- **Database**: SQLAlchemy (Async), Pydantic
- **Manager**: UV

**Infrastructure:**
- Docker & Docker Compose
- PostgreSQL 15

## 📁 Project Structure

```
arcade-arena/
├── frontend/              # React application
│   ├── src/
│   │   ├── components/   # Game boards & UI components
│   │   ├── services/     # API client (api.ts)
│   │   └── pages/        # Game pages & Dashboard
│   └── ...
├── backend/              # FastAPI application
│   ├── app/
│   │   ├── routers/     # API endpoints (auth, leaderboard, etc.)
│   │   ├── sql_models.py # Database schema (User, Group, LeaderboardEntry)
│   │   └── main.py      # App entry point
│   ├── tests/           # Unit tests
│   └── ...
├── Dockerfile            # Multi-stage build definition
├── docker-compose.yml    # Local development orchestration
└── README.md
```

## 🎯 API Endpoints

**Authentication:**
- `POST /api/auth/signup` - Register a new user (and optionally create/join groups).
- `POST /api/auth/login` - User login (returns mock token).
- `GET /api/auth/me` - Get current user details.

**Groups:**
- `GET /api/auth/groups` - List available groups.

**Leaderboard:**
- `GET /api/leaderboard` - Get scores (filterable by game mode and group).
- `POST /api/leaderboard` - Submit a new score.
- `GET /api/leaderboard/rankings/overall` - Get combined rankings.

## 🔧 Configuration

**Environment Variables:**
- `DATABASE_URL`: Connection string for the database.
  - Example: `postgresql+asyncpg://user:pass@host:5432/db_name`

**Ports:**
- `8000`: Main Application (Frontend + API)
- `5432`: PostgreSQL (if running locally via Docker)

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License.