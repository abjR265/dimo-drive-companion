#!/bin/bash

echo "🚀 Starting DIMO MCP Server and ngrok..."

# Kill any existing processes
pkill -f "http-server.ts"
pkill -f "ngrok"

# Start MCP server
cd mcp-dimo
nohup bun run http-server.ts > server.log 2>&1 &
sleep 3

# Start ngrok
nohup ngrok http 3001 > ngrok.log 2>&1 &
sleep 5

# Get ngrok URL
NGROK_URL=$(curl -s http://localhost:4040/api/tunnels | grep -o '"public_url":"[^"]*"' | cut -d'"' -f4)

if [ -n "$NGROK_URL" ]; then
    echo ""
    echo "✅ DIMO MCP Server is running!"
    echo "🌐 ngrok URL: $NGROK_URL"
    echo ""
    echo "📋 Copy this URL to update your n8n nodes:"
    echo "$NGROK_URL"
    echo ""
    echo "📊 Health check: $NGROK_URL/health"
    echo "📝 MCP logs: tail -f mcp-dimo/server.log"
    echo "📝 ngrok logs: tail -f ngrok.log"
    echo ""
    echo "🔄 To restart: ./start-dimo-mcp.sh"
else
    echo "❌ Failed to get ngrok URL"
    echo "📝 Check ngrok logs: cat ngrok.log"
fi 