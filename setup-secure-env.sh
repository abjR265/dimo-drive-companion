#!/bin/bash

echo "🔒 DIMO AI Secure Environment Setup"
echo "==================================="
echo ""

echo "📋 This script will help you set up environment variables securely."
echo ""

# Check if .env file exists
if [ -f ".env" ]; then
    echo "⚠️  Warning: .env file already exists"
    echo "   Backing up existing .env file to .env.backup.$(date +%Y%m%d_%H%M%S)"
    cp .env .env.backup.$(date +%Y%m%d_%H%M%S)
fi

echo "🔧 Creating secure .env file with placeholder values..."
echo ""

# Create .env file with placeholder values
cat > .env << 'EOF'
# DIMO AI Web Application - Environment Variables
# ⚠️  REPLACE ALL PLACEHOLDER VALUES WITH YOUR ACTUAL CREDENTIALS

# =============================================================================
# DIMO AUTHENTICATION
# =============================================================================
# Get these from https://console.dimo.org/
VITE_DIMO_CLIENT_ID=your_dimo_client_id_here
VITE_DIMO_REDIRECT_URI=http://localhost:8080/auth/callback
VITE_DIMO_API_KEY=your_dimo_api_key_here
VITE_DIMO_DOMAIN=your_dimo_domain.com
VITE_DIMO_PRIVATE_KEY=your_dimo_private_key_here

# =============================================================================
# n8n AI WORKFLOW
# =============================================================================
# Get these from your n8n Cloud account
VITE_N8N_WEBHOOK_URL=https://your-n8n-workflow.webhook.url
VITE_N8N_API_KEY=your_n8n_api_key_here
VITE_N8N_BASE_URL=https://app.n8n.cloud

# =============================================================================
# OPENAI INTEGRATION
# =============================================================================
# Get from https://platform.openai.com/
VITE_OPENAI_API_KEY=your_openai_api_key_here
VITE_OPENAI_ENDPOINT=https://api.openai.com/v1
VITE_OPENAI_ORG_ID=your_openai_org_id_here

# =============================================================================
# OCR SERVICES
# =============================================================================
# Get from https://ocr.space/ocrapi
VITE_OCR_API_KEY=your_ocr_api_key_here

# =============================================================================
# MCP SERVER
# =============================================================================
# Local MCP server URL
VITE_MCP_SERVER_URL=http://localhost:3001

# =============================================================================
# SUPABASE (OPTIONAL)
# =============================================================================
# Get from your Supabase project
VITE_SUPABASE_URL=your_supabase_url_here
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key_here

# =============================================================================
# DEVELOPMENT SETTINGS
# =============================================================================
NODE_ENV=development
EOF

echo "✅ .env file created with secure placeholder values"
echo ""

echo "🔍 Next Steps:"
echo "   1. Edit .env file and replace placeholder values with your actual credentials"
echo "   2. Get DIMO credentials from https://console.dimo.org/"
echo "   3. Get OpenAI API key from https://platform.openai.com/"
echo "   4. Get OCR API key from https://ocr.space/ocrapi"
echo "   5. Set up n8n workflow and get webhook URL"
echo ""

echo "🔒 Security Reminders:"
echo "   ✅ .env file is already in .gitignore"
echo "   ✅ Never commit real API keys to Git"
echo "   ✅ Use different keys for dev/staging/prod"
echo "   ✅ Rotate API keys regularly"
echo ""

echo "📚 Documentation:"
echo "   - See README.md for detailed setup instructions"
echo "   - See SECURITY_REPORT.md for security guidelines"
echo ""

echo "🎯 Ready to configure your environment! 🚗✨" 