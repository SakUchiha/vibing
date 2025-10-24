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

### 1. Get OpenAI API Key

1. Visit [OpenAI Platform](https://platform.openai.com/api-keys)
2. Sign in to your OpenAI account (or create one)
3. Click "Create new secret key"
4. Copy the API key (save it securely - you won't be able to see it again)

### 2. Configure the Backend

Create a `.env` file in the `backend/server.js/` directory:

```bash
cd backend/server.js
touch .env
```

Add your API key to the `.env` file:

```
OPENAI_API_KEY=your_api_key_here
```

Replace `your_api_key_here` with your actual OpenAI API key.

### 3. Verify Configuration

Restart the server and check that the AI assistant works:

```bash
# Restart the server
node server.js

# Check AI status in the browser
# Navigate to AI Assistant page and check the status indicator
```

### 4. Troubleshooting OpenAI Setup

**If API key is not configured:**
- Make sure the `.env` file exists in `backend/server.js/`
- Verify the API key format starts with `sk-`
- Restart the server after adding the key

**If API calls fail:**
- Check your OpenAI account has credits
- Verify your API key is valid
- Check network connectivity
- Review OpenAI status page: https://status.openai.com

**If AI Assistant shows "unavailable":**
- Verify `.env` file exists with correct API key
- Restart the KidLearner backend server
- Check browser console for detailed error messages
- Ensure OpenAI API is accessible from your network

### Model Information

The application uses GPT-3.5-turbo by default, which provides:
- Fast response times
- Good quality for coding assistance
- Cost-effective for learning purposes

You can modify the model in the backend code if needed.

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
<<<<<<< HEAD
- The AI uses OpenAI's cloud service for responses
=======
- The AI uses OpenAI's cloud service for responses
>>>>>>> 4cf4bf224f8b7bd973fcaacd7d992cc5f4736a85

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
<<<<<<< HEAD
- **AI**: OpenAI API integration
=======
- **AI**: OpenAI API integration
>>>>>>> 4cf4bf224f8b7bd973fcaacd7d992cc5f4736a85
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
- Powered by OpenAI's GPT models
- Context-aware help for HTML, CSS, and JavaScript
- Code validation and debugging assistance
- Chat-like interface for easy interaction
- Cloud-based AI processing via OpenAI API

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
- **First, ensure OpenAI API key is configured** (see OpenAI Setup section above)
- Check that the `.env` file exists in `backend/server.js/`
- Verify the API key format (should start with `sk-`)
- Check browser console for any JavaScript errors
- Make sure the backend server is running on port 4000
- Try restarting the KidLearner server

### Common OpenAI Issues
- **"API key not configured"**: Add OpenAI API key to `.env` file
- **"Invalid API key"**: Verify your API key from OpenAI platform
- **"Rate limit exceeded"**: Wait a few minutes before trying again
- **Network errors**: Check internet connection and OpenAI status

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
