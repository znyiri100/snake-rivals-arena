from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from contextlib import asynccontextmanager
from pathlib import Path
from .db import init_db
from .routers import auth, leaderboard

@asynccontextmanager
async def lifespan(app: FastAPI):
    await init_db()
    yield

app = FastAPI(
    title="Snake Rivals Arena API",
    description="API for Snake Rivals Arena game client.",
    version="1.0.0",
    lifespan=lifespan,
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allow all origins for development
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include API routers with /api prefix
app.include_router(auth.router, prefix="/api")
app.include_router(leaderboard.router, prefix="/api")

# Mount static files for frontend
static_dir = Path(__file__).parent.parent / "static"
if static_dir.exists():
    app.mount("/assets", StaticFiles(directory=static_dir / "assets"), name="assets")
    
    # Serve index.html for root and all non-API routes (SPA routing)
    @app.get("/")
    async def serve_root():
        return FileResponse(static_dir / "index.html")
    
    @app.get("/{full_path:path}")
    async def serve_spa(full_path: str):
        # Don't intercept API routes
        if full_path.startswith("api/"):
            return {"error": "Not found"}
        
        # Check if the requested file exists
        file_path = static_dir / full_path
        if file_path.is_file():
            return FileResponse(file_path)
        
        # For all other routes, serve index.html (SPA routing)
        return FileResponse(static_dir / "index.html")
else:
    # Fallback if static directory doesn't exist
    @app.get("/")
    async def root():
        return {"message": "Welcome to Snake Rivals Arena API"}
