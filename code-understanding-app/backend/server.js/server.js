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

// OpenAI health check endpoint
app.get('/api/openai/health', async (req, res) => {
  try {
    const apiKey = process.env.OPENROUTER_API_KEY;
    if (!apiKey) {
      throw new Error('OpenRouter API key not configured');
    }

    // Simple API key presence/shape check (avoid strict prefix to prevent false negatives)
    if (typeof apiKey !== 'string' || apiKey.trim().length < 20) {
      throw new Error('OpenRouter API key seems invalid');
    }

    res.json({
      status: 'healthy',
      service: 'configured',
      apiKeyConfigured: true,
      suggestions: []
    });

  } catch (error) {
    console.error('OpenRouter health check failed:', error);
    res.status(503).json({
      status: 'unhealthy',
      service: 'not_configured',
      error: error.message,
      suggestions: [
        'Set OPENROUTER_API_KEY in .env file',
        'Get API key from https://openrouter.ai/',
        'Ensure API key starts with sk-or-v1-'
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

  // Validate model (accept bare and provider-prefixed)
  const allowedBare = ['gpt-3.5-turbo', 'gpt-4', 'gpt-4-turbo-preview', 'gpt-4o', 'gpt-4o-mini'];
  const allowedPrefixed = allowedBare.map(m => `openai/${m}`);
  if (model && ![...allowedBare, ...allowedPrefixed].includes(model)) {
    return res.status(400).json({
      error: 'Invalid model specified',
      code: 'INVALID_MODEL'
    });
  }

  next();
}

// OpenAI AI Assistant Proxy Endpoint for Web Development Questions
app.post('/api/openai', validateOpenAIRequest, async (req, res) => {
  const { messages, model = 'gpt-4o' } = req.body;
  const apiKey = process.env.OPENROUTER_API_KEY;

  // Map UI-selected models to OpenRouter provider-prefixed IDs
  const modelMap = {
    'gpt-3.5-turbo': 'openai/gpt-3.5-turbo',
    'gpt-4': 'openai/gpt-4',
    'gpt-4-turbo-preview': 'openai/gpt-4-turbo-preview',
    'gpt-4o': 'openai/gpt-4o',
    'gpt-4o-mini': 'openai/gpt-4o-mini'
  };
  const openrouterModel = modelMap[model] || model;

  if (!apiKey) {
    return res.status(500).json({
      error: 'OpenRouter API key not configured',
      code: 'API_KEY_MISSING'
    });
  }

  try {
    // Add system prompt for web development focus
    const systemPrompt = {
      role: 'system',
      content: 'You are an expert web development assistant specializing in HTML, CSS, and JavaScript. You have advanced knowledge of modern web technologies, frameworks, and best practices. Provide clear, accurate, and comprehensive answers about web development topics. Include practical code examples, explain concepts thoroughly, and suggest improvements. Focus on modern web standards, performance optimization, accessibility, and security. Be detailed but concise, and adapt your explanations to the user\'s skill level.'
    };

    const enhancedMessages = [systemPrompt, ...messages];

    console.log(`Sending request to OpenRouter API with model: ${model}`);

    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
        'HTTP-Referer': 'https://code-understanding-app.com',
        'X-Title': 'Code Understanding App'
      },
      body: JSON.stringify({
        model: openrouterModel,
        messages: enhancedMessages,
        max_tokens: 2000,
        temperature: 0.7
      })
    });

    if (!response.ok) {
      const responseText = await response.text();
      console.log('OpenRouter API error response:', responseText);
      throw new Error(`OpenRouter API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();

    res.json(data);
  } catch (err) {
    console.error('OpenRouter API error:', err);

    // Enhanced error messages
    let errorMessage = 'Failed to connect to OpenRouter API';
    let errorCode = 'OPENROUTER_CONNECTION_ERROR';

    if (err.message.includes('API key')) {
      errorMessage = '❌ OpenRouter API key is invalid or missing.';
      errorCode = 'API_KEY_INVALID';
    } else if (err.message.includes('rate limit')) {
      errorMessage = '❌ OpenRouter rate limit exceeded. Please try again later.';
      errorCode = 'RATE_LIMIT_EXCEEDED';
    } else if (err.message.includes('timeout') || err.message.includes('network')) {
      errorMessage = '❌ Network error connecting to OpenRouter. Please check your connection.';
      errorCode = 'NETWORK_ERROR';
    }

    res.status(500).json({
      error: errorMessage,
      code: errorCode
    });
  }
});

// Code Explaining Endpoint using OpenRouter API
app.post('/api/explain-code', async (req, res) => {
  const { code, language } = req.body;
  const apiKey = process.env.OPENROUTER_API_KEY;

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

  if (!apiKey) {
    return res.status(500).json({
      error: 'OpenRouter API key not configured',
      code: 'API_KEY_MISSING'
    });
  }

  try {
    // Create explaining prompt based on language
    const explainingPrompts = {
      html: `Explain this HTML code in detail, breaking it down step by step. Help the user understand what each part does and how it works.

HTML Code:
${code}

Please provide a comprehensive explanation covering:
1. Overall structure and purpose of the HTML document
2. Key HTML elements and their semantic meanings and functions
3. How elements are nested and their hierarchical relationships
4. All attributes used and their specific purposes and values
5. Modern HTML5 standards, semantic HTML best practices, and accessibility considerations
6. Step-by-step breakdown of what the code does when rendered
7. Any potential improvements or modern alternatives
8. How this code interacts with CSS and JavaScript if present

Explain it as if teaching someone who is learning HTML, using simple language, clear examples, and practical analogies. Include code snippets to illustrate key points.`,

      css: `Explain this CSS code in detail, breaking it down step by step. Help the user understand styling concepts and how the styles work.

CSS Code:
${code}

Please provide a comprehensive explanation covering:
1. Overall styling approach, design philosophy, and visual theme
2. Key selectors (element, class, ID, pseudo-classes) and what elements they target
3. CSS properties and their specific effects on appearance and behavior
4. Layout and positioning concepts (flexbox, grid, positioning, floats)
5. Responsive design considerations and media queries if present
6. Color schemes, typography choices, and design system principles
7. Step-by-step breakdown of how styles cascade and are applied
8. CSS specificity, inheritance, and potential conflicts
9. Performance considerations and optimization opportunities
10. Browser compatibility and modern CSS features used

Explain it as if teaching someone who is learning CSS, using simple language, visual examples, and practical analogies. Include code snippets to illustrate key concepts.`,

      javascript: `Explain this JavaScript code in detail, breaking it down step by step. Help the user understand programming concepts and logic flow.

JavaScript Code:
${code}

Please provide a comprehensive explanation covering:
1. Overall purpose, functionality, and program flow
2. Variables, data types, scope, and their usage patterns
3. Functions, parameters, return values, and function types (declarations, expressions, arrow functions)
4. Control structures (loops, conditionals, switch statements) and their logic
5. DOM manipulation, event handling, and browser API interactions
6. Key programming concepts (closures, hoisting, async/await, promises, etc.)
7. Step-by-step execution flow and call stack behavior
8. Error handling and debugging considerations
9. Modern JavaScript features (ES6+, modules, destructuring, etc.)
10. Best practices, performance considerations, and potential improvements
11. Security implications and safe coding practices

Explain it as if teaching someone who is learning JavaScript, using simple language, clear examples, and practical analogies. Include code snippets to illustrate complex concepts and walk through execution step-by-step.`
    };

    const messages = [{
      role: 'user',
      content: explainingPrompts[language.toLowerCase()]
    }];

    // Add system prompt for code explaining focus
    const systemPrompt = {
      role: 'system',
      content: `You are an expert programming tutor and senior developer specializing in ${language.toUpperCase()}. Your task is to explain code with exceptional clarity and depth, breaking it down into understandable parts while providing comprehensive context. Use simple language for beginners but include advanced insights for experienced developers. Provide step-by-step explanations, help learners understand both what the code does and why it works that way. Include practical examples, relate concepts to real-world usage, and suggest improvements. Be encouraging, patient, and thorough in your explanations. Always consider performance, security, and best practices.`
    };

    const enhancedMessages = [systemPrompt, ...messages];

    console.log(`Sending ${language} code explanation request to OpenRouter API`);

    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
        'HTTP-Referer': 'https://code-understanding-app.com',
        'X-Title': 'Code Understanding App'
      },
      body: JSON.stringify({
        model: 'openai/gpt-4o',
        messages: enhancedMessages,
        max_tokens: 3000,
        temperature: 0.3
      })
    });

    if (!response.ok) {
      const responseText = await response.text();
      console.log('OpenRouter API response body:', responseText);
      throw new Error(`OpenRouter API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    const explanation = data.choices[0]?.message?.content || 'Unable to explain code';

    res.json({
      language: language.toLowerCase(),
      explanation: explanation,
      rawResponse: explanation
    });

  } catch (err) {
    console.error('Code explanation error:', err);
    res.status(500).json({
      error: `Failed to explain code: ${err.message}. Make sure OpenRouter API key is configured.`,
      code: 'EXPLANATION_ERROR'
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
