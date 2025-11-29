# Snake Rivals Arena - Deployment Guide

This guide explains how to deploy the Snake Rivals Arena application using the unified container architecture.

## Architecture Overview

The application uses a **two-container architecture**:
- **app**: Unified container with FastAPI backend + React frontend
- **db**: PostgreSQL database

## Quick Start

### Using Docker Compose (Recommended)

1. **Build the containers:**
   ```bash
   docker compose build
   ```

2. **Start the application:**
   ```bash
   docker compose up
   ```

3. **Access the application:**
   - Open your browser to `http://localhost:8000`
   - All routes (frontend and API) are served from port 8000

4. **Stop the application:**
   ```bash
   docker compose down
   ```

### Using Docker Directly

If you prefer not to use Docker Compose:

1. **Create a network:**
   ```bash
   docker network create snake-network
   ```

2. **Start PostgreSQL:**
   ```bash
   docker run -d \
     --name snake-db \
     --network snake-network \
     -e POSTGRES_USER=user \
     -e POSTGRES_PASSWORD=password \
     -e POSTGRES_DB=snake_rivals \
     -v snake_data:/var/lib/postgresql/data \
     postgres:15
   ```

3. **Build and run the app:**
   ```bash
   docker build -t snake-rivals-arena .
   
   docker run -d \
     --name snake-app \
     --network snake-network \
     -e DATABASE_URL=postgresql+asyncpg://user:password@snake-db:5432/snake_rivals \
     -p 8000:8000 \
     snake-rivals-arena
   ```

4. **Access the application:**
   - Open your browser to `http://localhost:8000`

## Environment Variables

### Database Configuration

- `DATABASE_URL`: PostgreSQL connection string
  - Format: `postgresql+asyncpg://user:password@host:port/database`
  - Default: `postgresql+asyncpg://user:password@db:5432/snake_rivals`

### PostgreSQL Variables

- `POSTGRES_USER`: Database user (default: `user`)
- `POSTGRES_PASSWORD`: Database password (default: `password`)
- `POSTGRES_DB`: Database name (default: `snake_rivals`)

## Port Configuration

- **Port 8000**: Main application port
  - Frontend: `http://localhost:8000`
  - API: `http://localhost:8000/api/*`
  - Swagger docs: `http://localhost:8000/api/docs`

- **Port 5432**: PostgreSQL (exposed for debugging)
  - Connect: `psql -h localhost -p 5432 -U user -d snake_rivals`

## Data Persistence

Database data is persisted in a Docker volume named `postgres_data`.

### Backup Database

```bash
docker compose exec db pg_dump -U user snake_rivals > backup.sql
```

### Restore Database

```bash
cat backup.sql | docker compose exec -T db psql -U user snake_rivals
```

### Reset Database

```bash
docker compose down -v  # Remove volumes
docker compose up       # Recreate with fresh database
```

## Production Deployment

For production deployments, consider:

1. **Use a managed database service:**
   - AWS RDS, Google Cloud SQL, Azure Database for PostgreSQL
   - Update `DATABASE_URL` to point to your managed database
   - Remove the `db` service from docker-compose.yml

2. **Set secure passwords:**
   - Use environment variables or secrets management
   - Never commit passwords to version control

3. **Use a reverse proxy:**
   - Nginx or Traefik for SSL/TLS termination
   - Load balancing if running multiple instances

4. **Configure CORS properly:**
   - Update `allow_origins` in `backend/app/main.py`
   - Restrict to your actual domain(s)

5. **Use environment-specific builds:**
   - Set `NODE_ENV=production` for frontend builds
   - Configure logging levels appropriately

## Troubleshooting

### Container won't start

Check logs:
```bash
docker compose logs app
docker compose logs db
```

### Database connection errors

Verify database is healthy:
```bash
docker compose exec db pg_isready -U user -d snake_rivals
```

### Frontend not loading

Check if static files were built:
```bash
docker compose exec app ls -la /app/static
```

### API endpoints not working

Test API directly:
```bash
curl http://localhost:8000/api/leaderboard?gameMode=walls
```

## Development

For local development without Docker:

1. **Start PostgreSQL:**
   ```bash
   docker compose up db
   ```

2. **Run backend:**
   ```bash
   cd backend
   uv run uvicorn app.main:app --reload
   ```

3. **Run frontend:**
   ```bash
   cd frontend
   npm run dev
   ```

This allows hot-reloading for both frontend and backend during development.
