require('dotenv').config();
const express = require('express');
const fetch = require('node-fetch');
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

// AI Assistant Proxy Endpoint
app.post('/api/ai', async (req, res) => {
  const { messages } = req.body;
  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages,
        temperature: 0.4
      })
    });
    const data = await response.json();
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Start server
app.listen(process.env.PORT || 4000, () =>
  console.log('Server running on port 4000')
);
