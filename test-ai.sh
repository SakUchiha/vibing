#!/bin/bash

# KidLearner Together AI Test Script
# This script demonstrates how to test the AI functionality with Together AI

echo "🚀 KidLearner Together AI Test Script"
echo "======================================"

BASE_URL="http://localhost:4000"

echo ""
echo "📋 Testing Health Check..."
echo "curl -s ${BASE_URL}/api/openai/health"
curl -s "${BASE_URL}/api/openai/health" | python3 -m json.tool

echo ""
echo ""
echo "💬 Testing AI Chat (Llama 3.3)..."
echo "curl -X POST ${BASE_URL}/api/openai -H 'Content-Type: application/json' -d '{\"messages\": [{\"role\": \"user\", \"content\": \"Hello! Can you help me understand what HTML is?\"}], \"model\": \"llama\"}'"
curl -X POST "${BASE_URL}/api/openai" \
  -H "Content-Type: application/json" \
  -d '{
    "messages": [
      {
        "role": "user",
        "content": "Hello! Can you help me understand what HTML is?"
      }
    ],
    "model": "llama"
  }' | python3 -m json.tool

echo ""
echo ""
echo "🔍 Testing Code Explanation (CodeLlama)..."
echo "curl -X POST ${BASE_URL}/api/explain-code -H 'Content-Type: application/json' -d '{\"code\": \"<h1>Hello World</h1><p>This is a paragraph.</p>\", \"language\": \"html\"}'"
curl -X POST "${BASE_URL}/api/explain-code" \
  -H "Content-Type: application/json" \
  -d '{
    "code": "<h1>Hello World</h1><p>This is a paragraph.</p>",
    "language": "html"
  }' | python3 -m json.tool

echo ""
echo ""
echo "🏗️  Testing AI Builder (General Chat)..."
echo "curl -X POST ${BASE_URL}/api/ai-builder -H 'Content-Type: application/json' -d '{\"prompt\": \"What are the benefits of using semantic HTML?\", \"task\": \"general-chat\"}'"
curl -X POST "${BASE_URL}/api/ai-builder" \
  -H "Content-Type: application/json" \
  -d '{
    "prompt": "What are the benefits of using semantic HTML?",
    "task": "general-chat"
  }' | python3 -m json.tool

echo ""
echo ""
echo "🏗️  Testing AI Builder (Code Explanation)..."
echo "curl -X POST ${BASE_URL}/api/ai-builder -H 'Content-Type: application/json' -d '{\"prompt\": \"function calculateSum(a, b) { return a + b; }\", \"task\": \"code-explanation\", \"language\": \"javascript\"}'"
curl -X POST "${BASE_URL}/api/ai-builder" \
  -H "Content-Type: application/json" \
  -d '{
    "prompt": "function calculateSum(a, b) { return a + b; }",
    "task": "code-explanation",
    "language": "javascript"
  }' | python3 -m json.tool

echo ""
echo ""
echo "🏗️  Testing AI Builder (Code Review)..."
echo "curl -X POST ${BASE_URL}/api/ai-builder -H 'Content-Type: application/json' -d '{\"prompt\": \"let x=5; let y=10; console.log(x+y);\", \"task\": \"code-review\"}'"
curl -X POST "${BASE_URL}/api/ai-builder" \
  -H "Content-Type: application/json" \
  -d '{
    "prompt": "let x=5; let y=10; console.log(x+y);",
    "task": "code-review"
  }' | python3 -m json.tool

echo ""
echo ""
echo "📚 Available API Endpoints:"
echo "• Health Check: GET ${BASE_URL}/api/openai/health"
echo "• AI Chat: POST ${BASE_URL}/api/openai"
echo "• Code Explanation: POST ${BASE_URL}/api/explain-code"
echo "• AI Builder: POST ${BASE_URL}/api/ai-builder"
echo ""
echo "🔧 Available Models (Free with Together AI):"
echo "• llama (Llama 3.3 70B - recommended for general tasks)"
echo "• code (CodeLlama 34B - recommended for code explanations)"
echo "• deepseek (DeepSeek Coder - good for coding)"
echo "• mixtral (Mixtral 8x7B - fast responses)"
echo ""
echo "📝 Example Usage:"
echo "# Test AI Chat"
echo 'curl -X POST http://localhost:4000/api/openai -H "Content-Type: application/json" -d '\''{"messages": [{"role": "user", "content": "Explain CSS flexbox"}], "model": "llama"}'\'''
echo ""
echo "# Test Code Explanation"
echo 'curl -X POST http://localhost:4000/api/explain-code -H "Content-Type: application/json" -d '\''{"code": "div { display: flex; }", "language": "css"}'\'''
echo ""
echo "# Test AI Builder"
echo 'curl -X POST http://localhost:4000/api/ai-builder -H "Content-Type: application/json" -d '\''{"prompt": "What is JavaScript?", "task": "general-chat"}'\'''
echo ""
echo "💡 Setup Instructions:"
echo "1. Run: ./setup-together-ai.sh"
echo "2. Get API key from https://together.ai"
echo "3. Update .env file with your key"
echo "4. Restart servers"
echo ""
echo "✨ Together AI provides generous free limits for coding tasks!"
