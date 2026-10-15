@echo off
title Push Habit Tracker to GitHub
echo ===================================================
echo Pushing Habit Tracker to https://github.com/jagdxdev/habit-tracker
echo ===================================================
set "PATH=%LOCALAPPDATA%\Programs\MinGit\cmd;%PATH%"

git branch -M main
git remote set-url origin https://github.com/jagdxdev/habit-tracker.git
echo Pushing project to GitHub...
echo If prompted to sign in, choose "Sign in with your browser".
echo.
git push -u origin main --force

if %ERRORLEVEL% EQU 0 (
    echo.
    echo ===================================================
    echo SUCCESS! Habit Tracker pushed to your GitHub repository:
    echo https://github.com/jagdxdev/habit-tracker
    echo ===================================================
    start https://github.com/jagdxdev/habit-tracker
) else (
    echo.
    echo ===================================================
    echo Authentication was cancelled or failed.
    echo Please run this script again and sign in when prompted.
    echo ===================================================
)
pause
