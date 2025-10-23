#!/bin/bash

# KidLearner Web Application Startup Script
# This script automatically starts both the backend server and serves the frontend

echo "🚀 Starting KidLearner Web Application..."

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

# Find available ports for both frontend and backend
is_port_in_use() {
    lsof -i :$1 -sTCP:LISTEN -t >/dev/null 2>&1
}

# Find available backend port starting at 4000
BACKEND_PORT=4000
MAX_BACKEND_PORT=4005
while is_port_in_use "$BACKEND_PORT"; do
    BACKEND_PORT=$((BACKEND_PORT + 1))
    if [ "$BACKEND_PORT" -gt "$MAX_BACKEND_PORT" ]; then
        echo -e "${RED}❌ No available ports found between 4000 and $MAX_BACKEND_PORT for the backend.${NC}"
        exit 1
    fi
done

# Find available frontend port starting at 3000
FRONTEND_PORT=3000
MAX_FRONTEND_PORT=3005
while is_port_in_use "$FRONTEND_PORT"; do
    FRONTEND_PORT=$((FRONTEND_PORT + 1))
    if [ "$FRONTEND_PORT" -gt "$MAX_FRONTEND_PORT" ]; then
        echo -e "${RED}❌ No available ports found between 3000 and $MAX_FRONTEND_PORT for the frontend.${NC}"
        exit 1
    fi
done

# .env is optional; warn if missing or placeholder
if [ ! -f "$BACKEND_DIR/.env" ]; then
    echo -e "${YELLOW}⚠️  .env not found in $BACKEND_DIR. AI Assistant will be disabled.${NC}"
else
    if grep -qE "your_openai_api_key_here|your_actual_api_key_here" "$BACKEND_DIR/.env"; then
        echo -e "${YELLOW}⚠️  Please update your OpenAI API key in $BACKEND_DIR/.env. AI Assistant will be disabled until then.${NC}"
    fi
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
echo -e "${BLUE}🔧 Starting backend server on port $BACKEND_PORT...${NC}"
cd "$BACKEND_DIR"
PORT=$BACKEND_PORT npm start &
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
    python3 -m http.server "$FRONTEND_PORT" &
elif command -v python &> /dev/null; then
    python -m http.server "$FRONTEND_PORT" &
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
echo -e "\n${GREEN}🎉 KidLearner Web Application is now running!${NC}"
echo -e "${BLUE}📱 Frontend: http://localhost:$FRONTEND_PORT${NC}"
echo -e "${BLUE}🔧 Backend API: http://localhost:$BACKEND_PORT${NC}"
echo -e "\n${YELLOW}📋 Available Pages:${NC}"
echo -e "   • Home: http://localhost:$FRONTEND_PORT/index.html"
echo -e "   • Lessons: http://localhost:$FRONTEND_PORT/lessons.html"
echo -e "   • Code Editor: http://localhost:$FRONTEND_PORT/editor.html"
echo -e "   • AI Assistant: http://localhost:$FRONTEND_PORT/ai.html"
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








