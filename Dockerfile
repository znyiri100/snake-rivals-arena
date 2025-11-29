# Stage 1: Build the frontend
FROM node:20-alpine AS frontend-builder

WORKDIR /frontend

# Copy frontend package files
COPY frontend/package.json frontend/package-lock.json ./

# Install dependencies
RUN npm ci

# Copy frontend source
COPY frontend/ ./

# Build the frontend
RUN npm run build

# Stage 2: Build the backend with frontend static files
FROM python:3.12-slim

WORKDIR /app

# Install uv
COPY --from=ghcr.io/astral-sh/uv:latest /uv /bin/uv

# Copy backend dependency files
COPY backend/pyproject.toml backend/uv.lock ./

# Install dependencies
RUN uv sync --frozen --no-cache

# Copy backend code
COPY backend/ ./

# Copy built frontend from Stage 1
COPY --from=frontend-builder /frontend/dist ./static

# Expose port
EXPOSE 8000

# Run the app
CMD ["uv", "run", "uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
