---
description: Restart the app with the remote database connection
---

1. Stop any running containers to ensure a clean restart.
// turbo
2. docker compose down

3. Start the application with the remote database configuration.
// turbo
4. DATABASE_URL="postgresql+asyncpg://snake_user:<PASSWORD>@dpg-d4l5fj3uibrs73fris3g-a.oregon-postgres.render.com/snake_rivals" docker compose up -d --build app
