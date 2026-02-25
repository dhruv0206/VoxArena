@echo off
echo Running security scans...
set FAILED=0

echo --- Backend: bandit ---
cd D:\Projects\VoxArena\backend
call venv\Scripts\activate
bandit -r . --exclude .\tests -f txt
if %errorlevel% neq 0 set FAILED=1

echo --- Backend: pip-audit ---
pip-audit -r requirements.txt
if %errorlevel% neq 0 set FAILED=1

echo --- Frontend: npm audit ---
cd D:\Projects\VoxArena\frontend
npm audit --audit-level=high
if %errorlevel% neq 0 set FAILED=1

if %FAILED%==1 (
  echo SECURITY SCAN FAILED - do not merge
  exit /b 1
) else (
  echo SECURITY SCAN PASSED
)