# 🐍 Snake Rivals Arena

A modern, multiplayer Snake game with real-time leaderboards and spectator mode. Built with React, FastAPI, and PostgreSQL.

![Snake Rivals Arena](https://img.shields.io/badge/status-active-success.svg)
![License](https://img.shields.io/badge/license-MIT-blue.svg)

## 🎮 Features

- **Two Game Modes**
  - 🚪 Pass-through walls: Snake wraps around the screen
  - 🧱 Deadly walls: Hitting walls ends the game

- **Multiplayer Features**
  - 🏆 Real-time leaderboards
  - 👀 Live spectator mode - watch other players
  - 👤 User authentication and profiles

- **Modern Tech Stack**
  - ⚛️ React + TypeScript frontend
  - 🚀 FastAPI backend
  - 🐘 PostgreSQL database
  - 🐳 Docker containerized

## 🚀 Quick Start

### Using Docker Compose (Recommended)

```bash
# Clone the repository
git clone https://github.com/YOUR_USERNAME/snake-rivals-arena.git
cd snake-rivals-arena

# Start the application
docker compose up

# Access the app
open http://localhost:8000
```

### Using Remote Database

To start the application using the remote production database:

```bash
DATABASE_URL="postgresql+asyncpg://snake_user:pMdiYRvQYAPKaHx4jSt0Oi5WDvQLsEj0@dpg-d4l5fj3uibrs73fris3g-a.oregon-postgres.render.com/snake_rivals" docker compose up -d --build app
```

### Local Development (Docker)
- Frontend + Backend: http://localhost:8000
- API Documentation: http://localhost:8000/api/docs
- PostgreSQL: localhost:5432

### Local Development

**Backend:**
```bash
cd backend
uv sync
uv run uvicorn app.main:app --reload
```

**Frontend:**
```bash
cd frontend
npm install
npm run dev
```

## 📦 Deployment

### Deploy to Render (Free Tier)

1. Push your code to GitHub
2. Sign up at [Render.com](https://render.com)
3. Click "New +" → "Blueprint"
4. Connect your repository
5. Click "Apply"

Render will automatically:
- Create a PostgreSQL database
- Build and deploy your app
- Provide a live URL

**Detailed guide:** See [RENDER_DEPLOYMENT.md](./RENDER_DEPLOYMENT.md)

### Other Deployment Options

- **Fly.io**: Best performance, global deployment
- **Railway**: Easiest setup, auto-deploys
- **Google Cloud Run**: Serverless, pay-per-use
- **AWS ECS**: Enterprise-grade, full control

See [deployment.md](./deployment.md) for detailed instructions.

## 🏗️ Architecture

```
┌─────────────────────────────────────┐
│     Unified App Container           │
│  ┌──────────────┐  ┌──────────────┐ │
│  │   React      │  │   FastAPI    │ │
│  │   Frontend   │  │   Backend    │ │
│  │  (Static)    │  │   (API)      │ │
│  └──────────────┘  └──────────────┘ │
│         Port 8000                    │
└─────────────────────────────────────┘
              │
              ▼
┌─────────────────────────────────────┐
│      PostgreSQL Database            │
│         Port 5432                    │
└─────────────────────────────────────┘
```

**Key Design:**
- Multi-stage Docker build
- FastAPI serves both API and static files
- Single port for all traffic
- Separate database container

## 🛠️ Tech Stack

**Frontend:**
- React 18 + TypeScript
- Vite for build tooling
- Tailwind CSS + shadcn/ui
- React Router for navigation
- TanStack Query for data fetching

**Backend:**
- FastAPI (Python)
- SQLAlchemy ORM
- AsyncPG for PostgreSQL
- Pydantic for validation
- UV for dependency management

**Database:**
- PostgreSQL 15
- Async database operations
- Custom ENUM types for game modes

**DevOps:**
- Docker + Docker Compose
- Multi-stage builds
- Health checks
- Volume persistence

## 📁 Project Structure

```
snake-rivals-arena/
├── frontend/              # React application
│   ├── src/
│   │   ├── components/   # UI components
│   │   ├── services/     # API client
│   │   └── pages/        # Route pages
│   ├── package.json
│   └── vite.config.ts
├── backend/              # FastAPI application
│   ├── app/
│   │   ├── routers/     # API endpoints
│   │   ├── models.py    # Database models
│   │   ├── db.py        # Database config
│   │   └── main.py      # App entry point
│   ├── pyproject.toml
│   └── uv.lock
├── Dockerfile            # Multi-stage build
├── docker-compose.yml    # Local development
├── render.yaml           # Render deployment config
└── README.md
```

## 🎯 API Endpoints

**Authentication:**
- `POST /api/auth/register` - Create new user
- `POST /api/auth/login` - User login
- `POST /api/auth/logout` - User logout

**Leaderboard:**
- `GET /api/leaderboard?gameMode={mode}` - Get top scores
- `POST /api/leaderboard` - Submit new score

**Sessions:**
- `GET /api/sessions` - Get active game sessions
- `POST /api/sessions` - Create new session
- `PUT /api/sessions/{id}` - Update session

**Documentation:**
- `GET /api/docs` - Interactive API docs (Swagger UI)
- `GET /api/redoc` - Alternative API docs (ReDoc)

## 🧪 Testing

**Backend Tests:**
```bash
cd backend
uv run pytest tests/              # Unit tests
uv run pytest tests_integration/  # Integration tests
```

**Frontend Tests:**
```bash
cd frontend
npm test
```

## 🔧 Configuration

### Environment Variables

**Backend:**
- `DATABASE_URL`: PostgreSQL connection string
  - Format: `postgresql+asyncpg://user:password@host:port/database`
  - Default: `postgresql+asyncpg://user:password@db:5432/snake_rivals`

**Database:**
- `POSTGRES_USER`: Database user (default: `user`)
- `POSTGRES_PASSWORD`: Database password (default: `password`)
- `POSTGRES_DB`: Database name (default: `snake_rivals`)

### Ports

- `8000`: Application (frontend + API)
- `5432`: PostgreSQL (for debugging)

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🙏 Acknowledgments

- Built with [FastAPI](https://fastapi.tiangolo.com/)
- UI components from [shadcn/ui](https://ui.shadcn.com/)
- Icons from [Lucide](https://lucide.dev/)

## 📧 Contact

Your Name - [@yourusername](https://twitter.com/yourusername)

Project Link: [https://github.com/YOUR_USERNAME/snake-rivals-arena](https://github.com/YOUR_USERNAME/snake-rivals-arena)

---

Made with ❤️ and 🐍
