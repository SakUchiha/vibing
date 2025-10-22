#!/bin/bash

# W3Clone Web Application Startup Script
# This script automatically starts both the backend server and serves the frontend

echo "🚀 Starting W3Clone Web Application..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Get the directory where this script is located
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$SCRIPT_DIR"
BACKEND_DIR="$PROJECT_ROOT/code-understanding-app/backend/server.js"
FRONTEND_DIR="$PROJECT_ROOT/code-understanding-app/frontend"

echo -e "${BLUE}📁 Project Root: $PROJECT_ROOT${NC}"
echo -e "${BLUE}📁 Backend Directory: $BACKEND_DIR${NC}"
echo -e "${BLUE}📁 Frontend Directory: $FRONTEND_DIR${NC}"

# Check if .env file exists and has API key
if [ ! -f "$BACKEND_DIR/.env" ]; then
    echo -e "${RED}❌ .env file not found!${NC}"
    echo -e "${YELLOW}Please create a .env file in $BACKEND_DIR with your OpenAI API key:${NC}"
    echo "OPENAI_API_KEY=your_actual_api_key_here"
    echo "PORT=4000"
    exit 1
fi

# Check if OpenAI API key is set
if grep -q "your_openai_api_key_here" "$BACKEND_DIR/.env"; then
    echo -e "${YELLOW}⚠️  Warning: Please update your OpenAI API key in $BACKEND_DIR/.env${NC}"
    echo -e "${YELLOW}   The AI Assistant feature will not work without a valid API key.${NC}"
fi

# Function to cleanup background processes
cleanup() {
    echo -e "\n${YELLOW}🛑 Shutting down servers...${NC}"
    if [ ! -z "$BACKEND_PID" ]; then
        kill $BACKEND_PID 2>/dev/null
        echo -e "${GREEN}✅ Backend server stopped${NC}"
    fi
    if [ ! -z "$FRONTEND_PID" ]; then
        kill $FRONTEND_PID 2>/dev/null
        echo -e "${GREEN}✅ Frontend server stopped${NC}"
    fi
    exit 0
}

# Set up signal handlers
trap cleanup SIGINT SIGTERM

# Start backend server
echo -e "${BLUE}🔧 Starting backend server...${NC}"
cd "$BACKEND_DIR"
npm start &
BACKEND_PID=$!

# Wait a moment for backend to start
sleep 3

# Check if backend is running
if ! kill -0 $BACKEND_PID 2>/dev/null; then
    echo -e "${RED}❌ Failed to start backend server${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Backend server started (PID: $BACKEND_PID)${NC}"

# Start frontend server using Python's built-in server
echo -e "${BLUE}🌐 Starting frontend server...${NC}"
cd "$FRONTEND_DIR"

# Try different Python versions
if command -v python3 &> /dev/null; then
    python3 -m http.server 3000 &
elif command -v python &> /dev/null; then
    python -m http.server 3000 &
else
    echo -e "${RED}❌ Python not found. Please install Python to serve the frontend.${NC}"
    echo -e "${YELLOW}Alternatively, you can open the frontend files directly in your browser.${NC}"
    cleanup
    exit 1
fi

FRONTEND_PID=$!

# Wait a moment for frontend to start
sleep 2

echo -e "${GREEN}✅ Frontend server started (PID: $FRONTEND_PID)${NC}"

# Display access information
echo -e "\n${GREEN}🎉 W3Clone Web Application is now running!${NC}"
echo -e "${BLUE}📱 Frontend: http://localhost:3000${NC}"
echo -e "${BLUE}🔧 Backend API: http://localhost:4000${NC}"
echo -e "\n${YELLOW}📋 Available Pages:${NC}"
echo -e "   • Home: http://localhost:3000/index.html"
echo -e "   • Lessons: http://localhost:3000/lessons.html"
echo -e "   • Code Editor: http://localhost:3000/editor.html"
echo -e "   • AI Assistant: http://localhost:3000/ai.html"
echo -e "\n${YELLOW}💡 Press Ctrl+C to stop both servers${NC}"

# Keep the script running and monitor processes
while true; do
    if ! kill -0 $BACKEND_PID 2>/dev/null; then
        echo -e "${RED}❌ Backend server stopped unexpectedly${NC}"
        cleanup
        exit 1
    fi
    if ! kill -0 $FRONTEND_PID 2>/dev/null; then
        echo -e "${RED}❌ Frontend server stopped unexpectedly${NC}"
        cleanup
        exit 1
    fi
    sleep 5
done








