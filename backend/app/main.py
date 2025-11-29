from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
from .db import init_db
from .routers import auth, leaderboard, sessions

@asynccontextmanager
async def lifespan(app: FastAPI):
    await init_db()
    yield

app = FastAPI(
    title="Snake Rivals Arena API",
    description="API for Snake Rivals Arena game client.",
    version="1.0.0",
    lifespan=lifespan,
    root_path="/api"
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allow all origins for development
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(auth.router)
app.include_router(leaderboard.router)
app.include_router(sessions.router)

@app.get("/")
async def root():
    return {"message": "Welcome to Snake Rivals Arena API"}
