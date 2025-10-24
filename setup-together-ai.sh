#!/bin/bash

# KidLearner Together AI Setup Script
# This script helps you set up Together AI for free AI functionality

echo "🚀 KidLearner Together AI Setup"
echo "================================"
echo ""
echo "📋 Setup Steps:"
echo "1. Get free API key from Together AI"
echo "2. Update .env file with your key"
echo "3. Restart the application"
echo "4. Test AI functionality"
echo ""

# Check if .env file exists
ENV_FILE="/Users/anbschool0005/Documents/vibing/code-understanding-app/backend/server.js/.env"
if [ ! -f "$ENV_FILE" ]; then
    echo "❌ .env file not found at $ENV_FILE"
    echo "📁 Creating .env file..."

    cat > "$ENV_FILE" << EOF
# Together AI Configuration (Free Alternative)
TOGETHER_API_KEY=your_together_ai_key_here
TOGETHER_BASE_URL=https://api.together.xyz/v1

# Server Configuration
PORT=4000
EOF
    echo "✅ .env file created!"
else
    echo "✅ .env file exists at $ENV_FILE"
    echo "📝 Current content:"
    cat "$ENV_FILE"
fi

echo ""
echo "🔑 To get your Together AI API key:"
echo "1. Visit: https://together.ai"
echo "2. Sign up for a free account"
echo "3. Go to API Keys section"
echo "4. Create a new API key"
echo "5. Copy the key and replace 'your_together_ai_key_here' in .env"
echo ""

echo "🔧 After adding your API key:"
echo "1. Restart the backend server:"
echo "   cd /Users/anbschool0005/Documents/vibing/code-understanding-app/backend/server.js"
echo "   npm start"
echo ""
echo "2. Test the health endpoint:"
echo "   curl http://localhost:4000/api/openai/health"
echo ""
echo "3. Test AI chat:"
echo "   curl -X POST http://localhost:4000/api/openai \\"
echo "     -H 'Content-Type: application/json' \\"
echo "     -d '{\"messages\": [{\"role\": \"user\", \"content\": \"Hello! Can you help me with HTML?\"}], \"model\": \"llama\"}'"
echo ""
echo "4. Test code explanation:"
echo "   curl -X POST http://localhost:4000/api/explain-code \\"
echo "     -H 'Content-Type: application/json' \\"
echo "     -d '{\"code\": \"<h1>Hello World</h1>\", \"language\": \"html\"}'"
echo ""

echo "🤖 Available Models (Free):"
echo "• llama (Llama 3.3 70B - Best for general tasks)"
echo "• code (CodeLlama 34B - Best for code explanations)"
echo "• deepseek (DeepSeek Coder - Good for coding)"
echo "• mixtral (Mixtral 8x7B - Fast responses)"
echo ""

echo "💡 Tips:"
echo "• Together AI has generous free limits"
echo "• CodeLlama is excellent for explaining code"
echo "• Llama 3.3 is great for general questions"
echo "• All models are optimized for coding tasks"
echo ""

echo "🎯 Next Steps:"
echo "1. Get API key from https://together.ai"
echo "2. Update TOGETHER_API_KEY in .env file"
echo "3. Restart servers: ./start-app.sh"
echo "4. Test with: ./test-ai.sh"
echo ""

echo "✨ Your AI assistant will be ready to help with coding questions!"
echo ""
echo "Need help? Check the AI-BUILDER-README.md file for detailed instructions."
