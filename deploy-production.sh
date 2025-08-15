#!/bin/bash

# DIMO AI Production Deployment Script
# This script deploys the MCP server to Railway and frontend to Vercel

set -e

echo "Starting DIMO AI Production Deployment..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if required tools are installed
check_dependencies() {
    print_status "Checking dependencies..."
    
    if ! command -v railway &> /dev/null; then
        print_error "Railway CLI not found. Please install it first:"
        echo "npm install -g @railway/cli"
        exit 1
    fi
    
    if ! command -v vercel &> /dev/null; then
        print_error "Vercel CLI not found. Please install it first:"
        echo "npm install -g vercel"
        exit 1
    fi
    
    print_success "All dependencies are installed"
}

# Deploy MCP Server to Railway
deploy_mcp_server() {
    print_status "Deploying MCP Server to Railway..."
    
    cd mcp-dimo
    
    # Check if Railway project exists
    if ! railway status &> /dev/null; then
        print_status "Initializing Railway project..."
        railway init
    fi
    
    # Deploy to Railway
    print_status "Deploying to Railway..."
    railway up
    
    # Get the deployment URL
    MCP_URL=$(railway domain)
    print_success "MCP Server deployed to: $MCP_URL"
    
    cd ..
    
    # Update environment variable for frontend
    export VITE_MCP_SERVER_URL=$MCP_URL
}

# Deploy Frontend to Vercel
deploy_frontend() {
    print_status "Deploying Frontend to Vercel..."
    
    # Build the frontend
    print_status "Building frontend..."
    npm run build
    
    # Deploy to Vercel
    print_status "Deploying to Vercel..."
    vercel --prod
    
    print_success "Frontend deployed successfully!"
}

# Set up environment variables
setup_env_vars() {
    print_status "Setting up environment variables..."
    
    # Check if .env file exists
    if [ ! -f ".env" ]; then
        print_warning ".env file not found. Please create one from env.example"
        print_status "Copying env.example to .env..."
        cp env.example .env
        print_warning "Please edit .env with your actual values before continuing"
        exit 1
    fi
    
    print_success "Environment variables configured"
}

# Main deployment process
main() {
    print_status "Starting deployment process..."
    
    # Check dependencies
    check_dependencies
    
    # Setup environment
    setup_env_vars
    
    # Deploy MCP server first
    deploy_mcp_server
    
    # Deploy frontend
    deploy_frontend
    
    print_success "🎉 Deployment completed successfully!"
    print_status "Your DIMO AI app is now live!"
    print_status "Frontend: https://your-app.vercel.app"
    print_status "MCP Server: $MCP_URL"
}

# Run main function
main "$@"
