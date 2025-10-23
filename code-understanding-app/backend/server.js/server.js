require('dotenv').config();
const express = require('express');
const path = require('path');
const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));
const cors = require('cors');
const lessons = require('./data/lessons.json');
const app = express();

// Serve static files from the frontend directory
app.use(express.static(path.join(__dirname, '../../frontend')));

// Serve index.html for root route
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../../frontend/index.html'));
});

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

// OpenAI health check endpoint
app.get('/api/openai/health', async (req, res) => {
  try {
    // Check if OpenAI API key is configured
    if (!process.env.OPENAI_API_KEY) {
      throw new Error('OpenAI API key not configured');
    }

    // Simple health check - we can't actually test the API without making a call
    // but we can verify the key exists and is properly formatted
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey.startsWith('sk-')) {
      throw new Error('Invalid OpenAI API key format');
    }

    res.json({
      status: 'healthy',
      service: 'configured',
      provider: 'OpenAI',
      suggestions: []
    });

  } catch (error) {
    console.error('OpenAI health check failed:', error.message);
    res.status(503).json({
      status: 'unhealthy',
      service: 'not_configured',
      error: error.message,
      suggestions: [
        'Configure OpenAI API key in .env file',
        'Get API key from: https://platform.openai.com/api-keys'
      ]
    });
  }
});

// Input validation middleware
function validateOpenAIRequest(req, res, next) {
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
  if (model && !['gpt-3.5-turbo', 'gpt-4', 'gpt-4-turbo-preview'].includes(model)) {
    return res.status(400).json({
      error: 'Invalid model specified',
      code: 'INVALID_MODEL'
    });
  }

  next();
}

// OpenAI AI Assistant Proxy Endpoint for Web Development Questions
app.post('/api/openai', validateOpenAIRequest, async (req, res) => {
  const { messages, model = 'gpt-3.5-turbo' } = req.body;

  try {
    // Check if OpenAI API key is configured
    if (!process.env.OPENAI_API_KEY) {
      throw new Error('OpenAI API key not configured');
    }

    // Add system prompt for web development focus
    const systemPrompt = {
      role: 'system',
      content: 'You are an expert web development assistant specializing in HTML, CSS, and JavaScript. Provide clear, accurate, and helpful answers about web development topics. Include code examples when relevant. Focus on modern web standards and best practices. Keep responses concise and practical.'
    };

    const enhancedMessages = [systemPrompt, ...messages];

    console.log(`Sending request to OpenAI API with model: ${model}`);

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: model,
        messages: enhancedMessages,
        max_tokens: 1000,
        temperature: 0.7
      })
    });

    if (!response.ok) {
      const responseText = await response.text();
      console.log('OpenAI API error response:', responseText);
      throw new Error(`OpenAI API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();

    // Format OpenAI response
    const formattedResponse = {
      choices: [{
        message: {
          content: data.choices[0]?.message?.content || 'No response from OpenAI'
        }
      }]
    };

    res.json(formattedResponse);
  } catch (err) {
    console.error('OpenAI API error:', err);

    // Enhanced error messages
    let errorMessage = 'Failed to connect to OpenAI API';
    let errorCode = 'OPENAI_CONNECTION_ERROR';

    if (err.message.includes('API key not configured')) {
      errorMessage = '❌ OpenAI API key not configured. Please check your .env file.';
      errorCode = 'API_KEY_MISSING';
    } else if (err.message.includes('401')) {
      errorMessage = '❌ Invalid OpenAI API key. Please check your API key.';
      errorCode = 'INVALID_API_KEY';
    } else if (err.message.includes('429')) {
      errorMessage = '❌ OpenAI API rate limit exceeded. Please try again later.';
      errorCode = 'RATE_LIMIT';
    } else if (err.message.includes('timeout') || err.message.includes('network')) {
      errorMessage = '❌ Network error connecting to OpenAI. Please check your connection.';
      errorCode = 'NETWORK_ERROR';
    }

    res.status(500).json({
      error: errorMessage,
      code: errorCode
    });
  }
});

// Code Validation Endpoint using OpenAI
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

    console.log(`Sending ${language} code validation request to OpenAI API`);

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: 'gpt-3.5-turbo',
        messages: enhancedMessages,
        max_tokens: 1500,
        temperature: 0.3
      })
    });

    if (!response.ok) {
      const responseText = await response.text();
      console.log('OpenAI API response body:', responseText);
      throw new Error(`OpenAI API error: ${response.status} ${response.statusText}`);
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
      error: `Failed to validate code: ${err.message}. Make sure OpenAI API key is configured.`,
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
