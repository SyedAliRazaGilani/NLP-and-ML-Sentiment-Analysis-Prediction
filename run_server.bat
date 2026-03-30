@echo off
REM Always start from the folder that contains this script (fixes wrong templates / Models path).
cd /d "%~dp0"
echo.
echo Working directory: %CD%
echo.
netstat -ano | findstr ":5000" | findstr "LISTENING"
if %ERRORLEVEL%==0 (
  echo.
  echo WARNING: Something is already LISTENING on port 5000.
  echo You may be opening ANOTHER app in the browser — not this project.
  echo Kill the old process Task Manager ^> Details ^> End task on that PID, or use:
  echo   netstat -ano ^| findstr :5000
  echo.
)
echo Starting Flask...
python -m flask --app api run --host 127.0.0.1 --port 5000
pause
