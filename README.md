# Futuristic Inventory Management System

A modern, AI-powered inventory management system with role-based access control, real-time analytics, and predictive capabilities.

## Features

### Core Functionality
- **Role-Based Access Control**: Admin, Inventory, and Sales roles with specific permissions
- **Product Management**: Complete inventory tracking and management
- **Sales Processing**: Streamlined sales workflow with real-time updates
- **Return Management**: Automated return request workflow with admin approval
- **Financial Dashboard**: Comprehensive financial overview and reporting

### Futuristic Features
- **AI-Powered Predictions**: Demand forecasting, price optimization, and inventory planning
- **Real-time Analytics**: Live dashboards with predictive metrics
- **Smart Automation**: Automated alerts, reorder suggestions, and fraud detection
- **Modern UX**: Progressive Web App with voice commands and responsive design
- **Advanced Security**: Multi-factor authentication, audit trails, and data encryption

## Technology Stack

### Backend
- **Node.js** with TypeScript and Express.js
- **PostgreSQL** with Prisma ORM
- **Redis** for caching and sessions
- **Socket.io** for real-time features
- **JWT** authentication with bcrypt

### Frontend
- **React 18** with TypeScript
- **Next.js** for SSR and routing
- **Tailwind CSS** for styling
- **React Query** for state management
- **Chart.js** for data visualization

### ML Service
- **Python** with FastAPI
- **scikit-learn** for machine learning
- **pandas** and **numpy** for data analysis

### DevOps
- **Docker** and Docker Compose
- **GitHub Actions** for CI/CD

## Project Structure

```
├── backend/                 # Node.js API server
│   ├── src/
│   │   ├── controllers/     # Route controllers
│   │   ├── middleware/      # Authentication, validation
│   │   ├── models/          # Database models
│   │   ├── routes/          # API routes
│   │   ├── services/        # Business logic
│   │   └── utils/           # Helper functions
│   ├── prisma/              # Database schema and migrations
│   └── tests/               # Backend tests
├── frontend/                # Next.js React application
│   ├── components/          # Reusable UI components
│   ├── pages/               # Next.js pages
│   ├── hooks/               # Custom React hooks
│   ├── services/            # API integration
│   └── styles/              # CSS and styling
├── ml-service/              # Python ML microservice
│   ├── app/                 # FastAPI application
│   ├── models/              # ML models and training
│   └── data/                # Data processing utilities
├── docker-compose.yml       # Development environment
└── docs/                    # Documentation
```

## Getting Started

### Prerequisites
- Node.js 18+
- Python 3.9+
- Podman and podman-compose (or Docker and Docker Compose)
- PostgreSQL 14+ (optional if using containers)

### Installation

1. Clone the repository
```bash
git clone <repository-url>
cd inventory-management-system
```

2. Start the development environment

**Using Podman (Recommended):**
```bash
./setup-podman.sh
```

**Using Docker (Alternative):**
```bash
docker-compose up -d
```

3. Install dependencies
```bash
# Backend
cd backend && npm install

# Frontend
cd frontend && npm install

# ML Service
cd ml-service && pip install -r requirements.txt
```

4. Setup the database
```bash
cd backend
npx prisma migrate dev
npx prisma db seed
```

5. Start the development servers
```bash
# Backend (Terminal 1)
cd backend && npm run dev

# Frontend (Terminal 2)
cd frontend && npm run dev

# ML Service (Terminal 3)
cd ml-service && uvicorn app.main:app --reload
```

## User Roles

### Admin
- Set and modify product unit prices
- Approve/reject return requests
- Access financial dashboard and reports
- Manage user accounts and permissions
- View predictive analytics and insights

### Inventory Manager
- Add, update, and remove products
- Monitor stock levels and movements
- Generate inventory reports
- Receive automated reorder alerts

### Sales Person
- Process sales transactions
- Create return requests
- View sales history and performance
- Access customer information

## API Documentation

Once the backend is running, visit `http://localhost:3001/api-docs` for interactive API documentation.

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests
5. Submit a pull request

## License

This project is licensed under the MIT License - see the LICENSE file for details.
