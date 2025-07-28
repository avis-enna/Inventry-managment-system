#!/bin/bash

# Stop Podman services for Inventory Management System
echo "🛑 Stopping Podman services..."

# Check if Podman is installed
if ! command -v podman &> /dev/null; then
    echo "❌ Podman is not installed."
    exit 1
fi

if ! command -v podman-compose &> /dev/null; then
    echo "❌ Podman Compose is not installed."
    exit 1
fi

# Stop all services
echo "🗄️ Stopping PostgreSQL..."
podman-compose -f podman-compose.yml stop postgres

echo "🔴 Stopping Redis..."
podman-compose -f podman-compose.yml stop redis

echo "🧹 Removing containers..."
podman-compose -f podman-compose.yml down

echo ""
echo "✅ All Podman services stopped successfully!"
echo ""
echo "📊 Remaining containers:"
podman ps -a --format "table {{.Names}}\t{{.Status}}"
