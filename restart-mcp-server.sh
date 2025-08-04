#!/bin/bash

echo "🔄 Restarting DIMO MCP Server..."

# Kill existing server
pkill -f "http-server.ts"

# Wait for process to stop
sleep 2

# Start new server
cd mcp-dimo
nohup bun run http-server.ts > server.log 2>&1 &

# Wait for server to start
sleep 3

# Check if server is running
if curl -s http://localhost:3001/health > /dev/null; then
    echo "✅ MCP Server restarted successfully!"
    echo "📊 Health check: http://localhost:3001/health"
    echo "📝 Logs: tail -f mcp-dimo/server.log"
else
    echo "❌ Failed to restart MCP Server"
    echo "📝 Check logs: cat mcp-dimo/server.log"
fi 