# KidLearner - Interactive Code Learning Platform

A modern, interactive web development learning platform designed to teach HTML, CSS, and JavaScript through hands-on coding exercises.

## Features

- 🎯 **Interactive Lessons**: Step-by-step tutorials with hands-on coding exercises
- ⚡ **Auto-Run Mode**: See your code execute in real-time as you type
- 🤖 **AI Assistant**: Get instant help and explanations from our intelligent coding tutor powered by OpenAI
- 💻 **Live Editor**: Practice coding with our built-in editor that supports HTML, CSS, and JavaScript
- 📊 **Progress Tracking**: Track your learning journey and see how you improve over time
- 📱 **Responsive Design**: Learn on any device - desktop, tablet, or mobile

## Getting Started

### Prerequisites

- Node.js (version 14 or higher)
- OpenAI API key (for AI Assistant functionality)
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

## OpenAI AI Assistant Setup

The AI Assistant requires an OpenAI API key to function. Follow these steps to set it up:

### 1. Get an OpenAI API Key

1. Visit [OpenAI Platform](https://platform.openai.com/)
2. Sign up or log in to your account
3. Navigate to API Keys section
4. Create a new API key
5. Copy the API key (it starts with `sk-`)

### 2. Configure the API Key

Add your OpenAI API key to the backend configuration:

1. Create a `.env` file in the `backend/server.js/` directory
2. Add the following lines:
   ```
   OPENROUTER_API_KEY=foll
   PORT=4000
   ```

### 3. Verify Configuration

The server will automatically load the API key from the `.env` file when it starts. Make sure the key is properly set before using the AI Assistant features.

### 4. Troubleshooting AI (OpenRouter)

**If AI Assistant shows "unavailable":**
- Verify your `OPENROUTER_API_KEY` is correctly set in the `.env` file
- Ensure you have credits with your chosen provider via OpenRouter
- Ensure the backend server is running on port 4000 (or 4001 fallback)
- Check browser console for detailed error messages

**Common AI Issues:**
- **"Invalid API key"**: Double-check `OPENROUTER_API_KEY` in your `.env`
- **"Insufficient credits"**: Add credits or choose a different model
- **"Rate limit exceeded"**: Wait a few minutes before trying again
- **Network errors**: Check your internet connection

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
- The AI uses OpenAI's cloud models - internet connection required

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
- **AI**: OpenAI API with cloud language models
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
- Powered by OpenAI cloud AI models
- Context-aware help for HTML, CSS, and JavaScript
- Code validation and debugging assistance
- Chat-like interface for easy interaction
- Cloud-based processing for reliable responses

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
- **First, ensure your OpenAI API key is configured** (see OpenAI Setup section above)
- Check that you have credits in your OpenAI account
- Verify the API key is correctly set in the `.env` file
- Check browser console for any JavaScript errors
- Make sure the backend server is running on port 4000
- Try restarting the KidLearner server

### Common OpenAI Issues
- **"Invalid API key"**: Double-check the key in your `.env` file
- **"Insufficient credits"**: Add credits to your OpenAI account
- **"Rate limit exceeded"**: Wait a few minutes before trying again
- **Network errors**: Check your internet connection

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
