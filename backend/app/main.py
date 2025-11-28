from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .routers import auth, leaderboard, sessions

app = FastAPI(
    title="Snake Rivals Arena API",
    description="API for Snake Rivals Arena game client.",
    version="1.0.0",
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
