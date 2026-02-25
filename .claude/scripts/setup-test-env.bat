@echo off
echo Setting up test environment...
cd D:\Projects\VoxArena\backend
call venv\Scripts\activate
psql -U postgres -c "CREATE DATABASE voxarena_test;" 2>nul
set DATABASE_URL=postgresql://postgres:%DB_PASSWORD%@localhost:5432/voxarena_test
set TESTING=true
alembic upgrade head
echo Test environment ready