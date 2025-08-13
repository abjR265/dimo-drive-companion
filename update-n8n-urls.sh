#!/bin/bash

echo "🔍 Getting current ngrok URL..."

# Get ngrok URL
NGROK_URL=$(curl -s http://localhost:4040/api/tunnels | grep -o '"public_url":"[^"]*"' | cut -d'"' -f4)

if [ -n "$NGROK_URL" ]; then
    echo ""
    echo "🌐 Current ngrok URL: $NGROK_URL"
    echo ""
    echo "📋 Update these URLs in your n8n nodes:"
    echo ""
    echo "1. DIMO Vehicle Info:"
    echo "   URL: $NGROK_URL/mcp/tools/telemetry_query"
    echo ""
    echo "2. DIMO Identity Query:"
    echo "   URL: $NGROK_URL/mcp/tools/identity_query"
    echo ""
    echo "3. DIMO VIN Operations:"
    echo "   URL: $NGROK_URL/mcp/tools/vin_operations"
    echo ""
    echo "4. DIMO Vehicle Search:"
    echo "   URL: $NGROK_URL/mcp/tools/search_vehicles"
    echo ""
    echo "5. DIMO Attestation:"
    echo "   URL: $NGROK_URL/mcp/tools/attestation_create"
    echo ""
    echo "6. DIMO Schema Introspection:"
    echo "   URL: $NGROK_URL/mcp/tools/schema_introspection"
    echo ""
    echo "✅ Test health: curl $NGROK_URL/health"
else
    echo "❌ ngrok not running or URL not found"
    echo "💡 Start ngrok: ngrok http 3001"
fi 