require('dotenv').config();
const express = require('express');
const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));
const cors = require('cors');
const lessons = require('./data/lessons.json');
const app = express();

// Simple in-memory cache for API responses
const responseCache = new Map();
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

// Cache middleware
function cacheMiddleware(req, res, next) {
  const key = req.originalUrl;
  const cached = responseCache.get(key);

  if (cached && (Date.now() - cached.timestamp) < CACHE_DURATION) {
    return res.json(cached.data);
  }

  // Store original send method
  const originalSend = res.json;
  res.json = function(data) {
    responseCache.set(key, { data, timestamp: Date.now() });
    originalSend.call(this, data);
  };

  next();
}

app.use(cors());
app.use(express.json());

// Get all lessons
app.get('/api/lessons', cacheMiddleware, (req, res) => res.json(lessons));

// Get one lesson
app.get('/api/lessons/:id', cacheMiddleware, (req, res) => {
  const lesson = lessons.find(l => l.id === req.params.id);
  if (!lesson) return res.status(404).json({ error: 'Lesson not found' });
  res.json(lesson);
});

// Input validation middleware
function validateOllamaRequest(req, res, next) {
  const { messages, model } = req.body;

  // Validate messages array
  if (!Array.isArray(messages) || messages.length === 0) {
    return res.status(400).json({
      error: 'Messages must be a non-empty array',
      code: 'INVALID_MESSAGES'
    });
  }

  // Validate each message
  for (const message of messages) {
    if (!message.role || !message.content) {
      return res.status(400).json({
        error: 'Each message must have role and content',
        code: 'INVALID_MESSAGE_FORMAT'
      });
    }
    if (!['user', 'assistant', 'system'].includes(message.role)) {
      return res.status(400).json({
        error: 'Message role must be user, assistant, or system',
        code: 'INVALID_ROLE'
      });
    }
    if (typeof message.content !== 'string' || message.content.length > 10000) {
      return res.status(400).json({
        error: 'Message content must be a string with max 10000 characters',
        code: 'INVALID_CONTENT'
      });
    }
  }

  // Validate model
  if (model && !['gemma3:1b', 'llama2'].includes(model)) {
    return res.status(400).json({
      error: 'Invalid model specified',
      code: 'INVALID_MODEL'
    });
  }

  next();
}

// Ollama AI Assistant Proxy Endpoint for Web Development Questions
app.post('/api/ollama', validateOllamaRequest, async (req, res) => {
  const { messages, model = 'gemma3:1b' } = req.body;

  // Add system prompt for web development focus
  const systemPrompt = {
    role: 'system',
    content: 'You are an expert web development assistant specializing in HTML, CSS, and JavaScript. Provide clear, accurate, and helpful answers about web development topics. Include code examples when relevant. Focus on modern web standards and best practices.'
  };

  const enhancedMessages = [systemPrompt, ...messages];

  try {
    console.log('Sending request to Ollama API:');
    console.log('URL: http://localhost:11434/api/chat');
    console.log('Headers:', {
      'Content-Type': 'application/json'
      // Removed Authorization header as Ollama typically doesn't require API keys for local instances
    });
    console.log('Body:', JSON.stringify({
      model: model,
      messages: enhancedMessages,
      stream: false
    }, null, 2));

    const response = await fetch('http://localhost:11434/api/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
        // Removed Authorization header as Ollama typically doesn't require API keys for local instances
      },
      body: JSON.stringify({
        model: model,
        messages: enhancedMessages,
        stream: false
      })
    });

    console.log('Ollama API response status:', response.status);
    console.log('Ollama API response headers:', Object.fromEntries(response.headers.entries()));

    if (!response.ok) {
      const responseText = await response.text();
      console.log('Ollama API response body:', responseText);
      throw new Error(`Ollama API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    console.log('Ollama API response data:', JSON.stringify(data, null, 2));

    // Format Ollama response to match OpenAI format
    const formattedResponse = {
      choices: [{
        message: {
          content: data.message?.content || data.response || 'No response from Ollama'
        }
      }]
    };

    console.log('Formatted response:', JSON.stringify(formattedResponse, null, 2));
    res.json(formattedResponse);
  } catch (err) {
    console.error('Ollama API error:', err);
    res.status(500).json({
      error: `Failed to connect to Ollama: ${err.message}. Make sure Ollama is running locally on port 11434.`,
      code: 'OLLAMA_CONNECTION_ERROR'
    });
  }
});

// Code Validation Endpoint using Ollama AI
app.post('/api/validate-code', async (req, res) => {
  const { code, language } = req.body;

  if (!code || !language) {
    return res.status(400).json({
      error: 'Code and language are required',
      code: 'MISSING_PARAMETERS'
    });
  }

  if (!['html', 'css', 'javascript'].includes(language.toLowerCase())) {
    return res.status(400).json({
      error: 'Unsupported language. Supported: html, css, javascript',
      code: 'UNSUPPORTED_LANGUAGE'
    });
  }

  try {
    // Create validation prompt based on language
    const validationPrompts = {
      html: `Analyze this HTML code for syntax errors, semantic issues, accessibility problems, and best practices. Provide specific feedback with line numbers if possible. Be constructive and suggest improvements.

HTML Code:
${code}

Please provide a detailed analysis covering:
1. Syntax errors
2. Semantic HTML usage
3. Accessibility issues
4. Best practices
5. Suggestions for improvement`,

      css: `Analyze this CSS code for syntax errors, specificity issues, performance problems, and best practices. Provide specific feedback with selectors if possible. Be constructive and suggest improvements.

CSS Code:
${code}

Please provide a detailed analysis covering:
1. Syntax errors
2. Selector specificity issues
3. Performance considerations
4. Browser compatibility
5. Best practices and suggestions`,

      javascript: `Analyze this JavaScript code for syntax errors, logical issues, performance problems, security concerns, and best practices. Provide specific feedback with line numbers if possible. Be constructive and suggest improvements.

JavaScript Code:
${code}

Please provide a detailed analysis covering:
1. Syntax errors
2. Logic errors or potential bugs
3. Performance issues
4. Security vulnerabilities
5. Best practices and modern JavaScript patterns
6. Suggestions for improvement`
    };

    const messages = [{
      role: 'user',
      content: validationPrompts[language.toLowerCase()]
    }];

    // Add system prompt for code validation focus
    const systemPrompt = {
      role: 'system',
      content: `You are an expert code reviewer specializing in ${language.toUpperCase()}. Provide detailed, constructive feedback on code quality, syntax, best practices, and potential improvements. Format your response clearly with sections for different types of issues. Be specific about line numbers or code sections when possible.`
    };

    const enhancedMessages = [systemPrompt, ...messages];

    console.log(`Sending ${language} code validation request to Ollama API`);

    const response = await fetch('http://localhost:11434/api/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'gemma3:1b',
        messages: enhancedMessages,
        stream: false
      })
    });

    if (!response.ok) {
      const responseText = await response.text();
      console.log('Ollama API response body:', responseText);
      throw new Error(`Ollama API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    const analysis = data.message?.content || data.response || 'Unable to analyze code';

    // Parse the analysis into structured format
    const structuredAnalysis = parseValidationResponse(analysis, language);

    res.json({
      language: language.toLowerCase(),
      analysis: structuredAnalysis,
      rawResponse: analysis
    });

  } catch (err) {
    console.error('Code validation error:', err);
    res.status(500).json({
      error: `Failed to validate code: ${err.message}. Make sure Ollama is running locally on port 11434.`,
      code: 'VALIDATION_ERROR'
    });
  }
});

// Helper function to parse validation response into structured format
function parseValidationResponse(analysis, language) {
  // Simple parsing logic to structure the response
  const sections = {
    errors: [],
    warnings: [],
    suggestions: [],
    bestPractices: []
  };

  const lines = analysis.split('\n');
  let currentSection = 'suggestions';

  for (const line of lines) {
    const trimmedLine = line.trim();

    if (trimmedLine.toLowerCase().includes('error') || trimmedLine.toLowerCase().includes('syntax')) {
      currentSection = 'errors';
      if (trimmedLine.length > 10) sections.errors.push(trimmedLine);
    } else if (trimmedLine.toLowerCase().includes('warning') || trimmedLine.toLowerCase().includes('issue')) {
      currentSection = 'warnings';
      if (trimmedLine.length > 10) sections.warnings.push(trimmedLine);
    } else if (trimmedLine.toLowerCase().includes('suggestion') || trimmedLine.toLowerCase().includes('improvement')) {
      currentSection = 'suggestions';
      if (trimmedLine.length > 10) sections.suggestions.push(trimmedLine);
    } else if (trimmedLine.toLowerCase().includes('best practice') || trimmedLine.toLowerCase().includes('recommend')) {
      currentSection = 'bestPractices';
      if (trimmedLine.length > 10) sections.bestPractices.push(trimmedLine);
    } else if (trimmedLine.length > 10 && !trimmedLine.startsWith('#') && !trimmedLine.startsWith('- ')) {
      sections[currentSection].push(trimmedLine);
    }
  }

  return sections;
}

// Add security headers
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  next();
});

// Start server
const port = process.env.PORT || 4000;
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
