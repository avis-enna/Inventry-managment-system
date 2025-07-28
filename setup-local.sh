#!/bin/bash

# Futuristic Inventory Management System Local Setup Script (No Docker)
echo "🚀 Setting up Futuristic Inventory Management System (Local Development)..."

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

# Check if PostgreSQL is installed or if Podman is available
if ! command -v psql &> /dev/null && ! command -v podman &> /dev/null; then
    echo "⚠️  Neither PostgreSQL nor Podman is installed."
    echo "   Option 1: Install PostgreSQL locally"
    echo "   Download from: https://postgresql.org/download/"
    echo "   After installation, create the database: createdb -U postgres Inventory"
    echo ""
    echo "   Option 2: Install Podman for containerized PostgreSQL"
    echo "   Installation: https://podman.io/getting-started/installation"
    echo "   Then run: ./setup-podman.sh"
    echo ""
    read -p "Do you want to continue anyway? (y/n): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
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

# Install backend dependencies
echo "📦 Installing backend dependencies..."
cd backend
if npm install; then
    echo "✅ Backend dependencies installed"
else
    echo "❌ Failed to install backend dependencies"
    exit 1
fi

# Generate Prisma client
echo "🔧 Generating Prisma client..."
if npx prisma generate; then
    echo "✅ Prisma client generated"
else
    echo "❌ Failed to generate Prisma client"
    exit 1
fi

# Check if database is accessible and run migrations
echo "🗄️ Setting up database..."
if npx prisma migrate dev --name init; then
    echo "✅ Database migrations completed"
    
    # Seed the database
    if npx prisma db seed; then
        echo "✅ Database seeded with initial data"
    else
        echo "⚠️  Database seeding failed - you may need to run this manually later"
    fi
else
    echo "⚠️  Database migration failed - please check your PostgreSQL connection"
    echo "   Make sure PostgreSQL is running and the database 'Inventory' exists"
    echo "   You can create it with: createdb -U postgres Inventory"
fi

cd ..

# Install frontend dependencies
echo "📦 Installing frontend dependencies..."
cd frontend
if npm install; then
    echo "✅ Frontend dependencies installed"
else
    echo "❌ Failed to install frontend dependencies"
    exit 1
fi
cd ..

# Install ML service dependencies
echo "📦 Installing ML service dependencies..."
cd ml-service
if pip3 install -r requirements.txt; then
    echo "✅ ML service dependencies installed"
else
    echo "⚠️  ML service dependencies installation failed"
    echo "   You may need to install them manually: pip3 install -r requirements.txt"
fi
cd ..

echo ""
echo "🎉 Setup completed!"
echo ""
echo "📋 To start the system:"
echo ""
echo "1. Start PostgreSQL (if not already running)"
echo "   - On macOS with Homebrew: brew services start postgresql"
echo "   - On Ubuntu: sudo systemctl start postgresql"
echo "   - On Windows: Start PostgreSQL service"
echo ""
echo "2. Start Redis (optional, for caching):"
echo "   - On macOS with Homebrew: brew services start redis"
echo "   - On Ubuntu: sudo systemctl start redis"
echo ""
echo "3. Start the services in separate terminals:"
echo ""
echo "   Terminal 1 - Backend:"
echo "   cd backend && npm run dev"
echo ""
echo "   Terminal 2 - Frontend:"
echo "   cd frontend && npm run dev"
echo ""
echo "   Terminal 3 - ML Service:"
echo "   cd ml-service && uvicorn app.main:app --reload"
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
echo "📚 For more information, see DEVELOPMENT_GUIDE.md"
