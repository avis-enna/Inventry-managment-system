#!/bin/bash

# Start Podman services for Inventory Management System
echo "🐳 Starting Podman services..."

# Check if Podman is installed
if ! command -v podman &> /dev/null; then
    echo "❌ Podman is not installed. Please install Podman first."
    echo "   Installation: https://podman.io/getting-started/installation"
    exit 1
fi

if ! command -v podman-compose &> /dev/null; then
    echo "❌ Podman Compose is not installed. Please install podman-compose first."
    echo "   Installation: pip3 install podman-compose"
    exit 1
fi

# Start PostgreSQL and Redis
echo "🗄️ Starting PostgreSQL..."
podman-compose -f podman-compose.yml up -d postgres

echo "🔴 Starting Redis..."
podman-compose -f podman-compose.yml up -d redis

# Wait for services to be ready
echo "⏳ Waiting for services to be ready..."
sleep 5

# Check if services are running
echo "📊 Checking service status..."
podman ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"

echo ""
echo "✅ Podman services started successfully!"
echo ""
echo "🌐 Available services:"
echo "- PostgreSQL: localhost:5432"
echo "- Redis: localhost:6379"
echo ""
echo "📋 Next steps:"
echo "1. Start backend: cd backend && npm run dev"
echo "2. Start frontend: cd frontend && npm run dev"
echo "3. Start ML service: cd ml-service && uvicorn app.main:app --reload"
