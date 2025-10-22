const express = require('express');
const cors = require('cors');
const lessons = require('./data/lessons.json');
const app = express();

app.use(cors());
app.use(express.json());

// Get all lessons
app.get('/api/lessons', (req, res) => res.json(lessons));

// Get one lesson
app.get('/api/lessons/:id', (req, res) => {
  const lesson = lessons.find(l => l.id === req.params.id);
  if (!lesson) return res.status(404).json({ error: 'Lesson not found' });
  res.json(lesson);
});

// AI Assistant Mock Endpoint (for demo purposes)
app.post('/api/ai', async (req, res) => {
  const { messages } = req.body;
  const userMessage = messages[messages.length - 1]?.content || '';
  
  // Simple mock responses for common coding questions
  const responses = {
    'html': 'HTML is the foundation of web development. It uses tags to structure content on web pages.',
    'css': 'CSS controls the visual appearance of HTML elements. You can style colors, fonts, layouts, and more.',
    'javascript': 'JavaScript adds interactivity to web pages. It can respond to user actions and manipulate page content.',
    'error': 'I can help you debug your code! Try checking for syntax errors, missing semicolons, or typos in variable names.',
    'help': 'I can help you with HTML, CSS, and JavaScript questions. What would you like to know?'
  };
  
  let response = 'I can help you with web development questions! Try asking about HTML, CSS, or JavaScript.';
  
  if (userMessage.toLowerCase().includes('html')) {
    response = responses.html;
  } else if (userMessage.toLowerCase().includes('css')) {
    response = responses.css;
  } else if (userMessage.toLowerCase().includes('javascript') || userMessage.toLowerCase().includes('js')) {
    response = responses.javascript;
  } else if (userMessage.toLowerCase().includes('error') || userMessage.toLowerCase().includes('bug')) {
    response = responses.error;
  } else if (userMessage.toLowerCase().includes('help')) {
    response = responses.help;
  }
  
  res.json({
    choices: [{
      message: {
        content: response
      }
    }]
  });
});

// Start server
const port = process.env.PORT || 4000;
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
