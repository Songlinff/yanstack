@echo off
chcp 936 >nul
title YanStack Publisher

powershell -ExecutionPolicy Bypass -NoProfile -File "%~dp0start.ps1"
set RC=%ERRORLEVEL%

echo.
if not "%RC%"=="0" (
  echo [FAILED] Exit code %RC%. Please copy all text above and send it back.
) else (
  echo [DONE] Window closed by user. Site and tunnel keep running in the background.
)
pause
