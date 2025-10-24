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
    // Check if Ollama service is running
    const tagsResponse = await fetch('http://localhost:11434/api/tags');
    if (!tagsResponse.ok) {
      throw new Error('Ollama service not running');
    }

    const tagsData = await tagsResponse.json();
    const availableModels = tagsData.models?.map(m => m.name) || [];

    // Check for recommended models
    const recommendedModels = ['gemma3:1b', 'llama3.2:1b', 'llama3.2:3b', 'phi3:3.8b'];
    const installedRecommended = recommendedModels.filter(model => availableModels.includes(model));

    res.json({
      status: 'healthy',
      service: 'running',
      availableModels: availableModels,
      recommendedModels: recommendedModels,
      installedRecommended: installedRecommended,
      suggestions: installedRecommended.length === 0 ? ['Install a recommended model: ollama pull gemma3:1b'] : []
    });

  } catch (error) {
    console.error('Ollama health check failed:', error);
    res.status(503).json({
      status: 'unhealthy',
      service: 'not_configured',
      error: error.message,
      suggestions: [
        'Start Ollama: ollama serve',
        'Install Ollama: https://ollama.ai',
        'Pull a model: ollama pull gemma3:1b'
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
  if (model && !['gemma3:1b', 'llama2', 'llama3.2:1b', 'phi3:3.8b'].includes(model)) {
    return res.status(400).json({
      error: 'Invalid model specified',
      code: 'INVALID_MODEL'
    });
  }

  next();
}

// Ollama AI Assistant Proxy Endpoint for Web Development Questions
app.post('/api/ollama', validateOllamaRequest, async (req, res) => {
  const { messages, model = 'llama3.2:1b' } = req.body;

  try {
    // Check if model is available
    const modelCheck = await fetch('http://localhost:11434/api/tags');
    if (!modelCheck.ok) {
      throw new Error('Ollama service is not running');
    }

    const modelData = await modelCheck.json();
    const availableModels = modelData.models?.map(m => m.name) || [];
    if (!availableModels.includes(model)) {
      throw new Error(`Model '${model}' is not available. Available models: ${availableModels.join(', ')}`);
    }

    // Add system prompt for web development focus
    const systemPrompt = {
      role: 'system',
      content: 'You are an expert web development assistant specializing in HTML, CSS, and JavaScript. You have advanced knowledge of modern web technologies, frameworks, and best practices. Provide clear, accurate, and comprehensive answers about web development topics. Include practical code examples, explain concepts thoroughly, and suggest improvements. Focus on modern web standards, performance optimization, accessibility, and security. Be detailed but concise, and adapt your explanations to the user\'s skill level.'
    };

    const enhancedMessages = [systemPrompt, ...messages];

    console.log(`Sending request to Ollama API with model: ${model}`);

    const response = await fetch('http://localhost:11434/api/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: openrouterModel,
        messages: enhancedMessages,
        stream: false,
        options: {
          temperature: 0.7,
          top_p: 0.9,
          num_predict: 512  // Limit response length for faster responses
        }
      })
    });

    if (!response.ok) {
      const responseText = await response.text();
      console.log('Ollama API error response:', responseText);
      throw new Error(`Ollama API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();

    // Format Ollama response to match OpenAI format
    const formattedResponse = {
      choices: [{
        message: {
          content: data.message?.content || data.response || 'No response from Ollama'
        }
      }]
    };

    res.json(formattedResponse);
  } catch (err) {
    console.error('Ollama API error:', err);

    // Enhanced error messages
    let errorMessage = 'Failed to connect to Ollama AI';
    let errorCode = 'OLLAMA_CONNECTION_ERROR';

    if (err.message.includes('Ollama service is not running')) {
      errorMessage = '❌ Ollama is not running. Please start Ollama and ensure it\'s accessible on port 11434.';
      errorCode = 'OLLAMA_NOT_RUNNING';
    } else if (err.message.includes('Model') && err.message.includes('not available')) {
      errorMessage = err.message;
      errorCode = 'MODEL_NOT_AVAILABLE';
    } else if (err.message.includes('timeout') || err.message.includes('network')) {
      errorMessage = '❌ Network error connecting to Ollama. Please check your connection.';
      errorCode = 'NETWORK_ERROR';
    }

    res.status(500).json({
      error: errorMessage,
      code: errorCode
    });
  }
});

// Code Validation Endpoint using Ollama AI
app.post('/api/validate-code', async (req, res) => {
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
      console.log('OpenAI API response body:', responseText);
      throw new Error(`OpenAI API error: ${response.status} ${response.statusText}`);
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
