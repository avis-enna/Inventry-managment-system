# Development Guide
## Futuristic Inventory Management System

### Quick Start

1. **Run the setup script:**
   ```bash
   ./setup.sh
   ```

2. **Start all services:**
   ```bash
   # Terminal 1 - Backend
   cd backend && npm run dev

   # Terminal 2 - Frontend  
   cd frontend && npm run dev

   # Terminal 3 - ML Service
   cd ml-service && uvicorn app.main:app --reload
   ```

3. **Access the application:**
   - Frontend: http://localhost:3052
   - Backend API: http://localhost:3051
   - API Docs: http://localhost:3051/api-docs
   - ML Service: http://localhost:3053/docs

### Architecture Overview

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │   Backend API   │    │   ML Service    │
│   (Next.js)     │◄──►│   (Node.js)     │◄──►│   (Python)      │
│   Port: 3052    │    │   Port: 3051    │    │   Port: 3053    │
└─────────────────┘    └─────────────────┘    └─────────────────┘
                                │                        │
                                ▼                        ▼
                       ┌─────────────────┐    ┌─────────────────┐
                       │   PostgreSQL    │    │     Redis       │
                       │   Port: 5432    │    │   Port: 6379    │
                       └─────────────────┘    └─────────────────┘
```

### Core Features Implementation Status

#### ✅ Completed
- [x] Project structure and configuration
- [x] Database schema design with Prisma
- [x] Docker development environment
- [x] Authentication system with JWT
- [x] Role-based access control (Admin, Inventory, Sales)
- [x] Basic API structure with Swagger documentation
- [x] ML service foundation with FastAPI
- [x] Frontend setup with Next.js and Tailwind CSS

#### 🚧 In Progress
- [ ] Complete API endpoints for all entities
- [ ] Frontend user interfaces
- [ ] Real-time features with Socket.io
- [ ] ML model implementation

#### 📋 Planned
- [ ] Advanced analytics dashboard
- [ ] Mobile responsiveness
- [ ] Email notifications
- [ ] File upload functionality
- [ ] Comprehensive testing

### Database Schema

The system uses PostgreSQL with the following main entities:

- **Users**: Admin, Inventory, Sales roles
- **Products**: Inventory items with categories and suppliers
- **Sales**: Transaction records with items
- **Returns**: Return request workflow
- **Financial Records**: Revenue, expenses, refunds
- **Predictions**: ML-generated forecasts
- **Audit Logs**: Complete activity tracking
- **Notifications**: Real-time user alerts

### API Endpoints

#### Authentication
- `POST /api/auth/login` - User login
- `GET /api/auth/me` - Get current user
- `POST /api/auth/change-password` - Change password

#### Products (Planned)
- `GET /api/products` - List products
- `POST /api/products` - Create product
- `PUT /api/products/:id` - Update product
- `DELETE /api/products/:id` - Delete product

#### Sales (Planned)
- `GET /api/sales` - List sales
- `POST /api/sales` - Create sale
- `GET /api/sales/:id` - Get sale details

#### Returns (Planned)
- `GET /api/returns` - List return requests
- `POST /api/returns` - Create return request
- `PUT /api/returns/:id/approve` - Approve return (Admin only)

### ML Service Endpoints

#### Predictions
- `GET /api/predictions/demand/{product_id}` - Demand forecasting
- `GET /api/predictions/reorder/{product_id}` - Reorder point optimization
- `GET /api/predictions/price-optimization/{product_id}` - Price optimization

#### Analytics
- `GET /api/analytics/sales-trends` - Sales trend analysis
- `GET /api/analytics/inventory-optimization` - Inventory recommendations
- `GET /api/analytics/financial-insights` - Financial predictions

### Development Workflow

1. **Backend Development:**
   ```bash
   cd backend
   npm run dev          # Start development server
   npm run test         # Run tests
   npm run lint         # Check code style
   npx prisma studio    # Database GUI
   ```

2. **Frontend Development:**
   ```bash
   cd frontend
   npm run dev          # Start development server
   npm run build        # Build for production
   npm run lint         # Check code style
   ```

3. **ML Service Development:**
   ```bash
   cd ml-service
   uvicorn app.main:app --reload  # Start development server
   pytest                         # Run tests
   black .                        # Format code
   ```

### Environment Variables

#### Backend (.env)
```
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/Inventory
REDIS_URL=redis://localhost:6379
JWT_SECRET=your-super-secret-jwt-key
PORT=3051
NODE_ENV=development
```

#### Frontend (.env.local)
```
NEXT_PUBLIC_API_URL=http://localhost:3051
NEXT_PUBLIC_WS_URL=ws://localhost:3051
```

#### ML Service (.env)
```
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/Inventory
REDIS_URL=redis://localhost:6379
ENVIRONMENT=development
DEBUG=true
```

### Testing

#### Backend Testing
```bash
cd backend
npm run test         # Run all tests
npm run test:watch   # Watch mode
npm run test:coverage # Coverage report
```

#### Frontend Testing
```bash
cd frontend
npm run test         # Run all tests
npm run test:watch   # Watch mode
```

#### ML Service Testing
```bash
cd ml-service
pytest              # Run all tests
pytest --cov        # Coverage report
```

### Deployment

The system is containerized and can be deployed using Podman or Docker:

#### Using Podman (Recommended):
```bash
podman-compose -f podman-compose.yml up -d  # Production deployment
```

#### Using Docker (Alternative):
```bash
docker-compose up -d  # Production deployment
```

### Contributing

1. Create a feature branch
2. Make your changes
3. Add tests
4. Update documentation
5. Submit a pull request

### Troubleshooting

#### Common Issues

1. **Database connection errors:**
   - Ensure PostgreSQL is running: `podman-compose -f podman-compose.yml up -d postgres`
   - Or with Docker: `docker-compose up -d postgres`
   - Check connection string in .env files

2. **Port conflicts:**
   - Backend: Change PORT in backend/.env
   - Frontend: Use `npm run dev -- -p 3054`
   - ML Service: Use `uvicorn app.main:app --port 3055`

3. **Permission errors:**
   - Make setup script executable: `chmod +x setup-podman.sh`
   - Check Podman permissions (may need rootless setup)
   - For Docker: Check Docker permissions

4. **Module not found errors:**
   - Reinstall dependencies: `npm install` or `pip install -r requirements.txt`
   - Clear cache: `npm cache clean --force`

### Performance Optimization

- Use Redis for caching frequently accessed data
- Implement database indexing for common queries
- Use React Query for efficient data fetching
- Optimize ML model inference with batch processing
- Implement proper error boundaries and loading states

### Security Considerations

- JWT tokens with proper expiration
- Password hashing with bcrypt
- Input validation and sanitization
- Rate limiting on API endpoints
- CORS configuration
- Environment variable protection
- SQL injection prevention with Prisma
