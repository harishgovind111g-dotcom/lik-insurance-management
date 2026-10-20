@echo off
title LIK Insurance - starter
cd /d "%~dp0"

echo ============================================
echo   LIK Insurance - starting the project
echo ============================================

where dotnet >/dev/null 2>nul
if errorlevel 1 (
  echo [ERROR] .NET SDK not found. Install it from https://dotnet.microsoft.com/download
  pause
  exit /b 1
)
where npm >/dev/null 2>nul
if errorlevel 1 (
  echo [ERROR] Node.js not found. Install the LTS version from https://nodejs.org
  pause
  exit /b 1
)

echo [1/3] Starting the backend API in a new window...
start "LIK API (backend)" /d "%~dp0backend\LIK.Api" cmd /k dotnet run

if not exist "frontend\node_modules" (
  echo [2/3] Installing website packages - first time only, please wait...
  pushd frontend
  call npm install
  popd
) else (
  echo [2/3] Website packages already installed.
)

echo [3/3] Starting the website in a new window...
start "LIK Website (frontend)" /d "%~dp0frontend" cmd /k npm run dev

echo Opening http://localhost:5173 in your browser...
timeout /t 10 /nobreak >nul
start "" http://localhost:5173
echo.
echo Done. Keep the two new windows open while you use the site.
echo To stop, close those windows.
pause
