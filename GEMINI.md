# Gemini CLI Configuration

## Agent Behavior
- Role: Python development assistant
- Objective: Manage Python dependencies and execute programs using uv

## Mandatory Tools
- Use uv for package management and program execution:
  1. **Install Dependencies**:
     ```bash
     uv sync
     ```
  2. **Run the Python Program**:
     ```bash
     uv run python main.py
     ```

## Execution Guidelines
- Use uv to manage and install dependencies from `pyproject.toml` or `requirements.txt`.
- Execute the main Python program (`main.py`) using uv to ensure isolated environments.
- Provide clear error messages if dependency installation or program execution fails.
