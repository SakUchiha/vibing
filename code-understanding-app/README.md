# KidLearner - Interactive Code Learning Platform

A modern, interactive web development learning platform designed to teach HTML, CSS, and JavaScript through hands-on coding exercises.

## Features

- 🎯 **Interactive Lessons**: Step-by-step tutorials with hands-on coding exercises
- ⚡ **Auto-Run Mode**: See your code execute in real-time as you type
- 🤖 **AI Assistant**: Get instant help and explanations from our intelligent coding tutor
- 💻 **Live Editor**: Practice coding with our built-in editor that supports HTML, CSS, and JavaScript
- 📊 **Progress Tracking**: Track your learning journey and see how you improve over time
- 📱 **Responsive Design**: Learn on any device - desktop, tablet, or mobile

## Getting Started

### Prerequisites

- Node.js (version 14 or higher)
- A modern web browser

### Installation

1. **Clone or download this repository**
2. **Navigate to the project directory**
   ```bash
   cd code-understanding-app
   ```

3. **Install dependencies**
   ```bash
   cd backend/server.js
   npm install
   ```

4. **Start the server**
   ```bash
   node server.js
   ```

5. **Open the frontend**
   - Open `frontend/index.html` in your web browser
   - Or navigate to `http://localhost:4000` (if serving from server)

### Quick Start (Windows)

1. Double-click `start-app.bat` to automatically install dependencies and start the server
2. Open `frontend/index.html` in your browser

## How to Use

### 1. Browse Lessons
- Click on "Lessons" in the navigation
- Choose from HTML, CSS, or JavaScript lessons
- Each lesson includes theory, examples, and hands-on exercises

### 2. Use the Code Editor
- Click on "Code Editor" to access the live coding environment
- Enable "Auto Run" to see changes in real-time
- Use the "Save" button to download your code as an HTML file

### 3. Get AI Help
- Click on "AI Assistant" for instant help with coding questions
- Ask about HTML, CSS, JavaScript concepts
- Get debugging assistance and best practices

### 4. Study Guide
- Access the comprehensive study guide for quick reference
- Review HTML tags, CSS properties, and JavaScript concepts
- Find best practices and additional resources

## Project Structure

```
code-understanding-app/
├── frontend/
│   ├── index.html          # Home page
│   ├── lessons.html        # Lessons listing
│   ├── lesson-viewer.html  # Individual lesson viewer
│   ├── editor.html         # Code editor
│   ├── ai.html            # AI assistant
│   ├── study-guide.html   # Study guide
│   ├── css/
│   │   └── styles.css     # Main stylesheet
│   └── js/
│       ├── main.js        # Main JavaScript
│       ├── editor.js      # Editor functionality
│       └── ai.js          # AI assistant functionality
├── backend/
│   └── server.js/
│       ├── server.js      # Express server
│       ├── data/
│       │   └── lessons.json # Lesson data
│       └── package.json   # Backend dependencies
└── README.md
```

## Technologies Used

- **Frontend**: HTML5, CSS3, JavaScript (ES6+)
- **Backend**: Node.js, Express.js
- **Styling**: Custom CSS with modern design principles
- **Icons**: Font Awesome
- **Data**: JSON-based lesson storage

## Features in Detail

### Interactive Lessons
- 9 comprehensive lessons covering HTML, CSS, and JavaScript
- Progressive difficulty from beginner to intermediate
- Hands-on exercises with starter code
- Learning objectives and hints for each lesson

### Code Editor
- Real-time preview of HTML, CSS, and JavaScript
- Auto-run mode for instant feedback
- Save functionality to download your work
- Responsive design that works on all devices

### AI Assistant
- Mock AI responses for common coding questions
- Context-aware help for HTML, CSS, and JavaScript
- Suggestion prompts for common questions
- Chat-like interface for easy interaction

### Study Guide
- Comprehensive reference for HTML tags, CSS properties, and JavaScript concepts
- Best practices and tips
- Quick reference cards
- Links to additional resources

## Customization

### Adding New Lessons
1. Edit `backend/server.js/data/lessons.json`
2. Add a new lesson object with the required structure:
   ```json
   {
     "id": "unique-id",
     "title": "Lesson Title",
     "category": "HTML|CSS|JavaScript",
     "difficulty": "Beginner|Intermediate|Advanced",
     "duration": "X minutes",
     "summary": "Brief description",
     "description": "Detailed description",
     "slides": [...],
     "learningObjectives": [...],
     "exercise": {
       "description": "Exercise description",
       "starter": "Starting code",
       "hints": [...]
     }
   }
   ```

### Modifying Styles
- Edit `frontend/css/styles.css` to customize the appearance
- The design uses CSS Grid and Flexbox for modern layouts
- Color scheme can be modified by changing CSS custom properties

## Troubleshooting

### Server Won't Start
- Make sure Node.js is installed
- Check if port 4000 is available
- Run `npm install` in the backend/server.js directory

### Frontend Not Loading
- Make sure the server is running
- Check browser console for errors
- Try opening the HTML files directly in your browser

### AI Assistant Not Working
- The AI assistant uses mock responses (no external API required)
- Check browser console for any JavaScript errors
- Make sure the server is running on port 4000

## Contributing

This is an educational project. Feel free to:
- Add new lessons
- Improve the UI/UX
- Fix bugs
- Add new features

## License

This project is open source and available under the MIT License.

## Support

For questions or issues:
1. Check the troubleshooting section above
2. Review the code comments for implementation details
3. Use the AI assistant for coding-related questions

---

**Happy Learning! 🚀**
