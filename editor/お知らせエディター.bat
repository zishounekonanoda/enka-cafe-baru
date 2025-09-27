@echo off

:: Check for administrative privileges and re-launch if necessary
openfiles >nul 2>&1
if %errorlevel% neq 0 (
    echo Requesting administrative privileges...
    powershell -Command "Start-Process -FilePath '%~f0' -Verb RunAs"
    exit /b
)

:: If we are here, we have admin rights.
:: Change directory to the script's location to ensure files are found.
cd /d "%~dp0"

rem --- Run the Python application ---
echo Running the application with admin rights...
python editor.py

pause
