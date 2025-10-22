# KidLearner - Code Understanding Web Application

A web-based learning platform for HTML, CSS, and JavaScript with an integrated AI assistant.

## 🚀 Quick Start

### Option 1: Automated Startup (Recommended)
```bash
# Run the application automatically
npm start
# or
./start-app.sh
```

### Option 2: Manual Startup
```bash
# Terminal 1: Start Backend
cd code-understanding-app/backend/server.js
npm start

# Terminal 2: Start Frontend
cd code-understanding-app/frontend
python3 -m http.server 3000
```

## 🌐 Access the Application

- **Frontend**: http://localhost:3000 (or the next available port up to 3005 when using the startup script)
- **Backend API**: http://localhost:4000

### Available Pages:
- **Home**: http://localhost:<frontend_port>/index.html
- **Lessons**: http://localhost:<frontend_port>/lessons.html
- **Code Editor**: http://localhost:<frontend_port>/editor.html
- **AI Assistant**: http://localhost:<frontend_port>/ai.html

## ⚙️ Configuration

### OpenAI API Key Setup
1. Get your API key from [OpenAI](https://platform.openai.com/api-keys)
2. Edit `code-understanding-app/backend/server.js/.env`:
   ```
   OPENAI_API_KEY=your_actual_api_key_here
   PORT=4000
   ```
   - If the value is left as `your_actual_api_key_here` or `your_openai_api_key_here`, the AI assistant will be disabled.

## 🛠️ Features

- **Interactive Lessons**: Learn HTML, CSS, and JavaScript through structured lessons
- **Code Editor**: Practice coding with a built-in editor
- **AI Assistant**: Get help and explanations from an AI tutor
- **RESTful API**: Backend serves lesson data and AI functionality

## 📁 Project Structure

```
vibing/
├── code-understanding-app/
│   ├── backend/server.js/
│   │   ├── data/lessons.json    # Lesson content
│   │   ├── server.js            # Express server
│   │   ├── package.json         # Backend dependencies
│   │   └── .env                 # Environment variables
│   └── frontend/
│       ├── index.html           # Home page
│       ├── lessons.html         # Lessons page
│       ├── editor.html          # Code editor
│       ├── ai.html              # AI assistant
│       └── js/                  # Frontend JavaScript
├── start-app.sh                 # Automated startup script
└── package.json                 # Root dependencies
```

## 🛑 Stopping the Application

Press `Ctrl+C` in the terminal where the application is running to stop both servers.

## 🔧 Troubleshooting

- **Port conflicts**: If ports 3000 or 4000 are in use, modify the ports in the startup script
- **Python not found**: Install Python 3 to serve the frontend files
- **API errors**: Ensure your OpenAI API key is valid and has credits








