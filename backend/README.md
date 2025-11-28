# Snake Rivals Arena Backend

## Setup
1. Install `uv`: `curl -LsSf https://astral.sh/uv/install.sh | sh` (if not installed)
2. Install dependencies: `uv sync`

## Running the Server
Run the following command from the `backend` directory:

```bash
uv run uvicorn app.main:app --reload
```

The server will start at `http://localhost:8000`.

## Running Tests
```bash
PYTHONPATH=. uv run pytest
```

## API Documentation
Once the server is running, visit:
- Swagger UI: `http://localhost:8000/docs`
- ReDoc: `http://localhost:8000/redoc`
