# KidLearner AI Assistant - OpenRouter Integration

This project integrates Google Gemini and other AI models through OpenRouter to provide intelligent coding assistance and explanations.

## 🚀 Features

- **AI-Powered Code Explanations** - Detailed explanations for HTML, CSS, and JavaScript
- **Interactive AI Chat** - General programming questions and assistance
- **Multi-Model Support** - Access to Gemini, GPT-4, Claude, and more through OpenRouter
- **Fallback System** - Automatically tries different models if one fails
- **Educational Focus** - Designed specifically for learning web development

## 🔧 Setup

1. **Install Dependencies**
   ```bash
   cd code-understanding-app/backend/server.js
   npm install
   ```

2. **Configure API Key**
   Edit `/backend/server.js/.env`:
   ```
   OPENROUTER_API_KEY=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
   ```

3. **Start the Application**
   ```bash
   cd /path/to/vibing
   ./start-app.sh
   ```

## 📡 API Endpoints

### Health Check
```bash
GET /api/openai/health
```
Returns API status, available models, and account information.

### AI Chat
```bash
POST /api/openai
Content-Type: application/json

{
  "messages": [
    {
      "role": "user",
      "content": "Your question here"
    }
  ],
  "model": "gemini" // optional, defaults to Gemini
}
```

### Code Explanation
```bash
POST /api/explain-code
Content-Type: application/json

{
  "code": "<h1>Hello World</h1>",
  "language": "html"
}
```

### AI Builder (Advanced)
```bash
POST /api/ai-builder
Content-Type: application/json

{
  "prompt": "Explain this JavaScript function",
  "task": "code-explanation",
  "language": "javascript",
  "model": "gemini"
}
```

## 🤖 Available Models

### Recommended for Code Tasks
- **`gemini`** → Google Gemini 1.5 Flash (Best for code explanations)
- **`gemini-flash`** → Google Gemini 1.5 Flash
- **`gemini-pro`** → Google Gemini 1.5 Pro

### Other Available Models
- **`gpt-4o-mini`** → OpenAI GPT-4o Mini
- **`claude`** → Anthropic Claude 3.5 Sonnet
- **`auto`** → OpenRouter auto-select (recommended for general chat)

## 🧪 Testing

Run the comprehensive test script:
```bash
./test-ai.sh
```

Or test individual endpoints:

```bash
# Test health
curl http://localhost:4000/api/openai/health

# Test AI chat
curl -X POST http://localhost:4000/api/openai \
  -H "Content-Type: application/json" \
  -d '{"messages": [{"role": "user", "content": "What is CSS?"}], "model": "gemini"}'

# Test code explanation
curl -X POST http://localhost:4000/api/explain-code \
  -H "Content-Type: application/json" \
  -d '{"code": "div { color: blue; }", "language": "css"}'
```

## 🔄 Model Selection

The system automatically selects the best model based on your request:

- **Code Explanations**: Uses Gemini (best for educational content)
- **General Chat**: Uses auto-selection (OpenRouter chooses best model)
- **Code Review**: Uses Gemini (good at analyzing code quality)

## 💰 Credit Management

OpenRouter uses a credit system. To add credits:
1. Visit [OpenRouter Credits](https://openrouter.ai/settings/credits)
2. Add payment method
3. Purchase credits
4. Start using AI features

## 🛠️ Troubleshooting

### Common Issues

**"Insufficient credits" Error**
- Add credits to your OpenRouter account
- Visit: https://openrouter.ai/settings/credits

**"Invalid API key" Error**
- Verify your API key in the .env file
- Check your OpenRouter account status

**"Rate limit exceeded" Error**
- Wait a moment before retrying
- Consider upgrading your OpenRouter plan

### Fallback System

The system automatically tries different models if one fails:
1. Primary model (e.g., Gemini)
2. Secondary model (e.g., GPT-4o Mini)
3. Tertiary model (e.g., Claude)
4. Last resort model (e.g., GPT-3.5 Turbo)

## 📋 Response Format

All AI endpoints return consistent JSON responses:

```json
{
  "success": true,
  "response": "AI generated response text",
  "model": "google/gemini-1.5-flash",
  "provider": "Google Gemini",
  "metadata": {
    "task": "code-explanation",
    "language": "html",
    "timestamp": "2025-01-01T00:00:00.000Z"
  }
}
```

Error responses include helpful suggestions:

```json
{
  "success": false,
  "error": "Insufficient credits in OpenRouter account",
  "code": "INSUFFICIENT_CREDITS",
  "suggestions": [
    "Add credits to your OpenRouter account at https://openrouter.ai/settings/credits",
    "Consider upgrading your OpenRouter plan"
  ]
}
```

## 🎯 Best Practices

1. **Use Gemini for Code** - Best model for educational content
2. **Provide Clear Prompts** - Better prompts = better responses
3. **Specify Language** - Always include language for code explanations
4. **Check Credits** - Monitor your OpenRouter account usage
5. **Use Auto Mode** - For general questions, let OpenRouter choose

## 🔧 Development

The AI system includes:
- Automatic retry with fallback models
- Comprehensive error handling
- Request logging for debugging
- Rate limit management
- Credit usage monitoring

For development, check the server logs for detailed AI request information.
