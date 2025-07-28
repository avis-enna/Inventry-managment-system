#!/bin/bash

# Futuristic Inventory Management System Setup Script with Podman
echo "🚀 Setting up Futuristic Inventory Management System with Podman..."

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

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js 18+ first."
    echo "   Download from: https://nodejs.org/"
    exit 1
fi

# Check if Python is installed
if ! command -v python3 &> /dev/null; then
    echo "❌ Python 3 is not installed. Please install Python 3.9+ first."
    echo "   Download from: https://python.org/"
    exit 1
fi

echo "✅ Prerequisites check passed"

# Create necessary directories
echo "📁 Creating directories..."
mkdir -p backend/logs
mkdir -p frontend/public
mkdir -p ml-service/models/trained
mkdir -p ml-service/data/processed

# Copy environment files
echo "🔧 Setting up environment files..."
if [ ! -f backend/.env ]; then
    cp backend/.env.example backend/.env
    echo "✅ Created backend/.env from example"
fi

if [ ! -f frontend/.env.local ]; then
    cat > frontend/.env.local << EOF
NEXT_PUBLIC_API_URL=http://localhost:3051
NEXT_PUBLIC_WS_URL=ws://localhost:3051
EOF
    echo "✅ Created frontend/.env.local"
fi

if [ ! -f ml-service/.env ]; then
    cat > ml-service/.env << EOF
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/Inventory
REDIS_URL=redis://localhost:6379
ENVIRONMENT=development
DEBUG=true
EOF
    echo "✅ Created ml-service/.env"
fi

# Start Podman services
echo "🐳 Starting Podman services..."
podman-compose -f podman-compose.yml up -d postgres redis

# Wait for PostgreSQL to be ready
echo "⏳ Waiting for PostgreSQL to be ready..."
sleep 10

# Install backend dependencies
echo "📦 Installing backend dependencies..."
cd backend
npm install

# Generate Prisma client and run migrations
echo "🗄️ Setting up database..."
npx prisma generate
npx prisma migrate dev --name init
npx prisma db seed

cd ..

# Install frontend dependencies
echo "📦 Installing frontend dependencies..."
cd frontend
npm install
cd ..

# Install ML service dependencies
echo "📦 Installing ML service dependencies..."
cd ml-service
pip3 install -r requirements.txt
cd ..

echo "🎉 Setup completed successfully!"
echo ""
echo "📋 Next steps:"
echo "1. Start the backend: cd backend && npm run dev"
echo "2. Start the frontend: cd frontend && npm run dev"
echo "3. Start the ML service: cd ml-service && uvicorn app.main:app --reload"
echo ""
echo "🌐 Access points:"
echo "- Frontend: http://localhost:3052"
echo "- Backend API: http://localhost:3051"
echo "- API Documentation: http://localhost:3051/api-docs"
echo "- ML Service: http://localhost:3053"
echo "- ML Service Docs: http://localhost:3053/docs"
echo ""
echo "🔑 Default login credentials:"
echo "- Admin: admin@inventory.com / admin123"
echo "- Inventory Manager: inventory@inventory.com / admin123"
echo "- Sales Person: sales@inventory.com / admin123"
echo ""
echo "🐳 Podman services running:"
echo "- PostgreSQL: podman ps | grep postgres"
echo "- Redis: podman ps | grep redis"
echo ""
echo "📚 For more information, see DEVELOPMENT_GUIDE.md"
