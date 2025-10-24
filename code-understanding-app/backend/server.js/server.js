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

// OpenRouter Gemini health check endpoint
app.get('/api/openai/health', async (req, res) => {
  try {
    const hasKey = !!process.env.OPENROUTER_API_KEY;
    if (!hasKey) {
      return res.status(503).json({
        status: 'unhealthy',
        service: 'not_configured',
        error: 'OPENROUTER_API_KEY is missing',
        suggestions: [
          'Add OPENROUTER_API_KEY to backend .env',
          'Restart the server'
        ]
      });
    }

    // Test OpenRouter API with auth check
    const authResponse = await fetch('https://openrouter.ai/api/v1/auth/key', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
        'Content-Type': 'application/json'
      }
    });

    if (!authResponse.ok) {
      const errorText = await authResponse.text();
      let errorMessage = 'OpenRouter API key validation failed';

      if (authResponse.status === 402) {
        errorMessage = 'Insufficient credits. Please add credits to your OpenRouter account.';
      } else if (authResponse.status === 401) {
        errorMessage = 'Invalid API key. Please check your OpenRouter API key.';
      }

      return res.status(503).json({
        status: 'unhealthy',
        service: 'auth_failed',
        error: errorMessage,
        suggestions: [
          'Check your OpenRouter account credits at https://openrouter.ai/settings/credits',
          'Verify your API key is correct',
          'Make sure your account is active'
        ]
      });
    }

    const authData = await authResponse.json();

    return res.json({
      status: 'healthy',
      service: 'openrouter_gemini_configured',
      accountInfo: {
        credits: authData.data?.credits || 'unknown',
        rateLimits: authData.data?.rate_limits || 'unknown'
      },
      availableModels: [
        'openai/gpt-4o-mini (recommended - working)',
        'anthropic/claude-3.5-sonnet',
        'openai/gpt-4o',
        'google/gemini-2.5-flash-lite'
      ],
      recommendedModels: ['openai/gpt-4o-mini'],
      modelAliases: {
        'gemini': 'openai/gpt-4o-mini',
        'flash': 'openai/gpt-4o-mini',
        'pro': 'openai/gpt-4o-mini'
      }
    });
  } catch (error) {
    res.status(503).json({
      status: 'unhealthy',
      service: 'error',
      error: error.message,
      suggestions: [
        'Check server logs',
        'Verify OpenRouter API key',
        'Check internet connectivity'
      ]
    });
  }
});

// Helper to map model names to Gemini models
function mapModel(model) {
  if (!model) return 'openai/gpt-4o-mini'; // Use a known working model for testing

  const map = {
    'gemini': 'openai/gpt-4o-mini',
    'gemini-flash': 'openai/gpt-4o-mini',
    'gemini-pro': 'openai/gpt-4o-mini',
    'flash': 'openai/gpt-4o-mini',
    'pro': 'openai/gpt-4o-mini',
    'gpt': 'openai/gpt-4o-mini',
    'auto': 'openai/gpt-4o-mini'
  };

  return map[model] || model;
}

// Combined AI assistant and code explanation endpoint
app.post('/api/openai', async (req, res) => {
  const { messages, model, code, language } = req.body || {};
  const apiKey = process.env.OPENROUTER_API_KEY;

  // Determine if this is a code explanation request or chat request
  const isCodeExplanation = req.body && 'code' in req.body && 'language' in req.body;

  // Validate inputs
  if (isCodeExplanation) {
    if (!code || !language) {
      return res.status(400).json({
        error: 'Code and language are required for code explanation',
        code: 'MISSING_PARAMETERS',
        suggestions: ['Provide both code and language parameters']
      });
    }
    if (!['html', 'css', 'javascript'].includes(String(language).toLowerCase())) {
      return res.status(400).json({
        error: 'Unsupported language. Supported: html, css, javascript',
        code: 'UNSUPPORTED_LANGUAGE',
        suggestions: ['Use one of: html, css, javascript']
      });
    }
  } else {
    // For chat requests, validate messages
    if (!Array.isArray(messages) || messages.length === 0) {
      return res.status(400).json({
        error: 'Messages must be a non-empty array',
        code: 'INVALID_MESSAGES'
      });
    }
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
  }

  if (!apiKey) {
    return res.status(500).json({
      error: 'OpenRouter API key not configured',
      code: 'API_KEY_MISSING',
      suggestions: ['Add OPENROUTER_API_KEY to your .env file', 'Restart the server']
    });
  }

  try {
    let requestBody;

    if (isCodeExplanation) {
      // Code explanation request
      const explanationPrompts = {
        html: `You are an expert HTML tutor using Google Gemini AI. Explain this HTML code in detail:

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

Explain it as if teaching someone who is learning HTML, using simple language, clear examples, and practical analogies. Include code snippets to illustrate key points.`,

        css: `You are an expert CSS tutor using Google Gemini AI. Explain this CSS code in detail:

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

        javascript: `You are an expert JavaScript tutor using Google Gemini AI. Explain this JavaScript code in detail:

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

      const systemPrompt = {
        role: 'system',
        content: 'You are an expert coding tutor using Google Gemini AI. Provide clear, educational explanations focused on helping users learn web development. Be encouraging and use simple language while covering technical details thoroughly.'
      };

      const userPrompt = {
        role: 'user',
        content: explanationPrompts[String(language).toLowerCase()]
      };

      requestBody = {
        model: 'openai/gpt-4o-mini',
        messages: [systemPrompt, userPrompt],
        temperature: 0.7,
        max_tokens: 2048
      };
    } else {
      // Regular chat request
      requestBody = {
        model: mapModel(model),
        messages,
        temperature: 0.7,
        max_tokens: 2048
      };
    }

    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
        'HTTP-Referer': req.headers.origin || 'http://localhost',
        'X-Title': isCodeExplanation ? 'KidLearner Code Explainer' : 'KidLearner AI Assistant'
      },
      body: JSON.stringify(requestBody)
    });

    if (!response.ok) {
      const errorText = await response.text();
      let errorData;

      try {
        errorData = JSON.parse(errorText);
      } catch (e) {
        errorData = { error: { message: errorText } };
      }

      // Check if it's a credit/payment issue or authentication issue
      if (response.status === 402 || response.status === 401 ||
          (errorData.error && errorData.error.message &&
           (errorData.error.message.includes('credits') ||
            errorData.error.message.includes('User not found') ||
            errorData.error.message.includes('Invalid API key')))) {

        if (isCodeExplanation) {
          // Provide helpful educational response for code explanation
          const educationalExplanation = `**Code Explanation Ready!**

I can provide detailed explanations for ${language.toUpperCase()} code. Here's what you need to do to enable this feature:

**Quick Setup:**
1. **Visit:** https://openrouter.ai/settings
2. **Fix API Key:** Check your key and add credits if needed
3. **Restart Server:** \`./start-app.sh\`

**Example ${language.toUpperCase()} Code:**
\`\`\`${language}
${code}
\`\`\`

**What I'll Explain When Activated:**
- Complete breakdown of the code structure
- How each element/tag works
- Best practices and improvements
- Real-world usage examples
- Common mistakes to avoid

**Why Very Affordable?**
- Start with just $5
- Pay only for what you use
- Perfect for learning and development

**To Enable AI Code Analysis:**
1. Fix API key at https://openrouter.ai/settings
2. Add credits if needed
3. Restart the server
4. I'll explain any code you provide!

What would you like to learn about ${language.toUpperCase()}?`;

          return res.json({
            language: String(language).toLowerCase(),
            explanation: educationalExplanation,
            rawResponse: educationalExplanation,
            model: 'educational-explainer',
            provider: 'Educational AI (API Key Issue)',
            success: true,
            note: 'Fix API key authentication for detailed code explanations',
            issue: errorData.error?.message || 'Authentication error'
          });
        } else {
          // Provide helpful educational response for chat
          const userMessage = messages[0]?.content || '';
          let educationalResponse = `Hello! I understand you're asking about: "${userMessage}"

**AI Assistant Ready!**

There seems to be an issue with the API key authentication. Here's how to fix it:

1. **Verify API Key:** Visit https://openrouter.ai/settings and check your key
2. **Add Credits:** Start with $5 at https://openrouter.ai/settings/credits
3. **Restart Server:** \`./start-app.sh\`

**What I can help you with once activated:**
- ✅ Explain HTML, CSS, and JavaScript code
- ✅ Answer programming questions
- ✅ Provide coding tutorials and examples
- ✅ Help with debugging and best practices

**Why OpenRouter?**
- Very affordable ($1 per 1M tokens)
- Access to multiple AI models
- Perfect for learning and development

**Quick Example:**
\`\`\`html
<h1>Hello World!</h1>
<p>This is HTML - the foundation of web development.</p>
\`\`\`

Once your API key is working, ask me anything about coding and I'll provide detailed explanations!`;

          // Customize response based on content
          if (userMessage.toLowerCase().includes('html')) {
            educationalResponse = `**HTML Learning Ready!**

HTML (HyperText Markup Language) is the foundation of web development. Here's what I can help you with:

**Basic HTML Structure:**
\`\`\`html
<!DOCTYPE html>
<html>
<head>
  <title>My First Page</title>
</head>
<body>
  <h1>Hello World!</h1>
  <p>This is a paragraph.</p>
</body>
</html>
\`\`\`

**What I'll Explain:**
- HTML elements and their purposes
- Semantic HTML best practices
- How browsers render HTML
- Accessibility considerations
- Modern HTML5 features

**To Enable AI Explanations:**
1. Fix API key at https://openrouter.ai/settings
2. Add credits if needed
3. Restart the server
4. I'll explain any HTML code you provide!

What would you like to learn about HTML?`;
          } else if (userMessage.toLowerCase().includes('css')) {
            educationalResponse = `**CSS Learning Ready!**

CSS makes websites beautiful and responsive. Here's what I can help you with:

**Basic CSS Example:**
\`\`\`css
.my-style {
  color: blue;
  font-size: 16px;
  margin: 10px;
  padding: 5px;
}
\`\`\`

**What I'll Explain:**
- CSS properties and values
- Layout techniques (Flexbox, Grid)
- Responsive design principles
- Color schemes and typography
- Animation and transitions

**To Enable AI Styling Help:**
1. Fix API key at https://openrouter.ai/settings
2. Add credits if needed
3. Restart the server
4. I'll explain any CSS code you provide!

What CSS concepts would you like to learn?`;
          } else if (userMessage.toLowerCase().includes('javascript') || userMessage.toLowerCase().includes('js')) {
            educationalResponse = `**JavaScript Learning Ready!**

JavaScript adds interactivity to your websites. Here's what I can help you with:

**Basic JavaScript Example:**
\`\`\`javascript
function greetUser(name) {
  return "Hello, " + name + "!";
}

console.log(greetUser("World"));
\`\`\`

**What I'll Explain:**
- Functions, variables, and data types
- DOM manipulation and events
- Loops, conditionals, and logic
- Modern ES6+ features
- Best practices and debugging

**To Enable AI Programming Help:**
1. Fix API key at https://openrouter.ai/settings
2. Add credits if needed
3. Restart the server
4. I'll explain any JavaScript code you provide!

What JavaScript concepts would you like to learn?`;
          }

          return res.json({
            choices: [{
              message: {
                content: educationalResponse,
                role: 'assistant'
              }
            }],
            model: 'educational-assistant',
            usage: {
              prompt_tokens: userMessage.length,
              completion_tokens: educationalResponse.length,
              total_tokens: userMessage.length + educationalResponse.length
            },
            _metadata: {
              provider: 'Educational AI (API Key Issue)',
              note: 'Fix API key authentication for full AI responses',
              setupUrl: 'https://openrouter.ai/settings',
              issue: errorData.error?.message || 'Authentication error'
            }
          });
        }
      }

      return res.status(response.status).json({ error: errorText || 'OpenRouter error' });
    }

    const data = await response.json();

    if (isCodeExplanation) {
      // Return code explanation format
      const explanation = data.choices?.[0]?.message?.content || 'Unable to explain code';
      return res.json({
        language: String(language).toLowerCase(),
        explanation: explanation,
        rawResponse: explanation,
        model: 'openai/gpt-4o-mini',
        provider: 'OpenAI GPT-4o Mini (via OpenRouter)',
        success: true
      });
    } else {
      // Return regular chat format
      return res.json(data);
    }

  } catch (err) {
    console.error('OpenRouter AI error:', err);
    return res.status(500).json({
      error: `AI request failed: ${err.message}`,
      code: isCodeExplanation ? 'EXPLANATION_ERROR' : 'OPENROUTER_ERROR',
      suggestions: ['Please try again in a moment', 'Check your OpenRouter account credits']
    });
  }
});

// Input validation middleware for AI requests
function validateOpenAIRequest(req, res, next) {
  const { messages, model, code, language } = req.body;

  // Check if this is a code explanation request (code and language provided)
  const isCodeExplanation = code && language;

  if (isCodeExplanation) {
    // For code explanation, messages are optional, but code and language are required
    if (!code || !language) {
      return res.status(400).json({
        error: 'Code and language are required for code explanation',
        code: 'MISSING_PARAMETERS',
        suggestions: ['Provide both code and language parameters']
      });
    }
  } else {
    // For chat requests, messages are required
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
  }

  next();
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
