@echo off
echo Starting KidLearner Application...
echo.

cd /d "%~dp0"

echo Installing dependencies...
cd backend\server.js
npm install

echo.
echo Starting server...
echo The application will be available at: http://localhost:4000
echo.
echo To view the frontend, open: frontend\index.html in your browser
echo.
echo Press Ctrl+C to stop the server
echo.

node server.js

pause
