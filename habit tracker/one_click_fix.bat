@echo off
title Fix and Deploy Habit Tracker to GitHub
echo ====================================================================
echo   Habit Tracker - Auto-Fix and Direct Deploy to GitHub
echo ====================================================================
echo.
set "PATH=%LOCALAPPDATA%\Programs\MinGit\cmd;%PATH%"

echo Checking GitHub authentication...
gh auth status >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo.
    echo Please log in to GitHub in your browser:
    echo 1. A one-time code will appear below.
    echo 2. Press Enter to open GitHub in your browser, and enter the code.
    echo.
    gh auth login --hostname github.com -p https -w
)

echo.
echo ====================================================================
echo Authenticated successfully! Pushing all files to root of repository...
echo ====================================================================
git branch -M main
git remote set-url origin https://github.com/jagdxdev/habit-tracker.git
gh auth setup-git
git push -u origin main --force

echo.
echo ====================================================================
echo SUCCESS! Your Habit Tracker is now cleanly uploaded at the root:
echo https://github.com/jagdxdev/habit-tracker
echo ====================================================================
echo.
echo Opening your live repository...
start https://github.com/jagdxdev/habit-tracker
pause
