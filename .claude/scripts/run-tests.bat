@echo off
echo Running backend tests...
cd D:\Projects\VoxArena\backend
call venv\Scripts\activate
set DATABASE_URL=postgresql://postgres:%DB_PASSWORD%@localhost:5432/voxarena_test
set TESTING=true
pytest -v
if %errorlevel% neq 0 (
  echo BACKEND TESTS FAILED
  exit /b 1
)

echo Running frontend build check...
cd D:\Projects\VoxArena\frontend
call npm run build
if %errorlevel% neq 0 (
  echo FRONTEND BUILD FAILED
  exit /b 1
)
echo ALL TESTS PASSED