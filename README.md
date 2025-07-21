# 🚨 Real-Time Fraud Detection Alert System

A comprehensive, real-time fraud detection system with ML-based risk scoring, built with Node.js, React, PostgreSQL, and WebSocket technology. This system simulates financial transactions, analyzes them for fraud risk using machine learning, and provides real-time alerts through an interactive dashboard.

## 🎯 Features

### 🔍 **Real-Time Fraud Detection**
- **Live Transaction Monitoring**: Continuous simulation of financial transactions
- **Dual Risk Analysis**: ML-based and rule-based risk scoring for comprehensive fraud detection
- **Instant Alerts**: Real-time notifications for high-risk transactions
- **WebSocket Integration**: Live updates across all dashboard components
- **Performance Optimized**: Database views for efficient aggregations

### 📊 **Interactive Dashboard**
- **Real-Time Charts**: Transaction volume, risk distribution, and alert trends
- **Live Statistics**: Dynamic counters for transactions, alerts, and risk metrics
- **Responsive Design**: Modern UI built with styled-components
- **Connection Status**: Visual indicator for WebSocket connection health
- **Timeframe Filtering**: Dynamic data filtering (1h, 24h, 7d, 30d, all time)
- **Professional UI**: Optimized colors and pagination for production use

### 🧠 **Machine Learning Features**
- **Logistic Regression Model**: Binary classification for fraud detection
- **Feature Engineering**: Normalized transaction features for ML training
- **Risk Scoring**: 0-100 risk scores with detailed reasoning
- **Training Data Management**: Continuous model improvement
- **Model Persistence**: Automatic model saving and loading

### 🏗️ **Architecture & Technology**
- **TypeScript**: Full-stack type safety
- **Prisma ORM**: Modern database management with migrations
- **PostgreSQL**: Robust relational database with optimized views
- **Socket.IO**: Real-time bidirectional communication
- **Chart.js**: Interactive data visualization
- **Docker**: Containerized development and production environments
- **Zustand**: Lightweight state management

## 🚀 Quick Start

### Prerequisites
- **Node.js** 20+ 
- **PostgreSQL** 14+
- **Docker** & **Docker Compose**
- **npm** or **yarn**

### 1. Clone the Repository
```bash
git clone <repository-url>
cd fraud-detection-system
```

### 2. Docker Development Setup (Recommended)
```bash
# Start all services with Docker Compose
docker compose up -d

# Access the application
# Frontend: http://localhost:5173
# Backend API: http://localhost:3000
# Database: localhost:5433
```

### 3. Manual Setup (Alternative)

#### Database Setup
```bash
# Create a PostgreSQL database
createdb fraud_detection

# Set up environment variables
cp backend/.env.example backend/.env
# Edit backend/.env with your database URL
```

#### Backend Setup
```bash
cd backend
npm install
npx prisma generate    # Generate Prisma client
npx prisma migrate deploy  # Apply migrations
npm run seed           # Seed initial data
npm run dev            # Start development server
```

#### Frontend Setup
```bash
cd frontend
npm install
npm run dev            # Start development server
```

### 4. Access the Application
- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:3000
- **Health Check**: http://localhost:3000/api/health

## 📁 Project Structure

```
fraud-detection-system/
├── backend/                    # Node.js + Express API
│   ├── prisma/                # Database schema & migrations
│   │   ├── schema.prisma      # Database schema
│   │   └── migrations/        # Database migrations with views
│   ├── services/              # Business logic
│   │   ├── simulation/        # Transaction simulation engine
│   │   ├── mlRiskAnalyzer/    # ML risk analysis
│   │   ├── basicRiskAnalyzer/ # Rule-based risk analysis
│   │   └── index.ts           # Service exports
│   ├── routes/                # API endpoints
│   ├── websocket/             # WebSocket handlers
│   ├── tests/                 # Integration tests
│   ├── Dockerfile.dev         # Development Dockerfile
│   ├── Dockerfile.prod        # Production Dockerfile
│   ├── index.ts               # Express server + WebSocket
│   ├── seed.ts                # Database seeding
│   └── package.json
├── frontend/                   # React + Vite application
│   ├── src/
│   │   ├── components/        # React components
│   │   │   ├── Dashboard.tsx  # Main dashboard
│   │   │   ├── charts/        # Chart components
│   │   │   └── AlertsTable.tsx # Alerts table
│   │   ├── services/          # API & WebSocket services
│   │   ├── stores/            # Zustand state management
│   │   ├── styles/            # Styled-components themes
│   │   └── App.tsx            # Main app component
│   ├── Dockerfile.dev         # Development Dockerfile
│   ├── Dockerfile             # Production Dockerfile
│   └── package.json
├── scripts/                    # Deployment and utility scripts
├── docker-compose.yml          # Development environment
├── docker-compose.prod.yml     # Production environment
└── README.md                   # This file
```

## 🗄️ Database Schema

### Core Tables
- **`users`**: User accounts and profiles
- **`devices`**: Device fingerprints and tracking
- **`merchants`**: Merchant information and risk levels
- **`transactions`**: Financial transaction records
- **`risk_signals`**: ML-generated risk assessments
- **`alerts`**: Fraud alerts and notifications
- **`training_data`**: ML model training data
- **`audit_logs`**: System audit trail

### Optimized Views
- **`risk_distribution`**: Aggregated risk level distribution
- **`alert_trends_hourly`**: Hourly alert trends
- **`transaction_volume_hourly`**: Hourly transaction volumes
- **`daily_stats`**: Daily aggregated statistics
- **`alert_stats_daily`**: Daily alert statistics
- **`current_dashboard_stats`**: Real-time dashboard metrics
- **`recent_activity`**: Recent system activity

### Key Relationships
- Transactions link users, devices, and merchants
- Risk signals are generated for each transaction
- Alerts are created for high-risk transactions
- Training data feeds the ML model

## 🔧 API Endpoints

### Core Endpoints
- `GET /api/health` - Health check
- `GET /api/alerts` - Recent fraud alerts with pagination
- `GET /api/transactions` - Recent transactions with pagination
- `GET /api/risk-signals` - Risk analysis data
- `GET /api/dashboard/stats` - Dashboard statistics
- `GET /api/simulation/status` - Simulation status

### Aggregated Endpoints (with timeframe filtering)
- `GET /api/dashboard/risk-distribution?timeframe=24h` - Risk distribution chart data
- `GET /api/dashboard/alert-trends?timeframe=7d` - Alert trends chart data
- `GET /api/dashboard/transaction-volume?timeframe=1h` - Transaction volume chart data

### WebSocket Events
- `transaction:new` - New transaction created
- `alert:new` - New fraud alert
- `risk-signal:new` - New risk signal
- `dashboard:stats` - Updated statistics

## 🧪 Testing

### Integration Tests
```bash
cd backend
npm run test
```

### Performance Testing
```bash
# Generate 25k test records
cd backend
npm run performance-test
```

### Test Database
The system uses Docker for isolated test database:
```bash
docker compose -f docker-compose.test.yml up -d
npm run test
docker compose -f docker-compose.test.yml down
```

## 🎨 Frontend Features

### Dashboard Components
- **Real-Time Charts**: Chart.js integration with live updates
- **Interactive Tables**: TanStack Table for data display with pagination
- **Connection Status**: WebSocket health indicator
- **Responsive Layout**: Mobile-friendly design
- **Timeframe Selector**: Dynamic data filtering
- **Professional Styling**: Production-ready UI components

### Key Libraries
- **React 19**: Latest React features
- **Vite**: Fast development server
- **styled-components**: CSS-in-JS styling with transient props
- **Chart.js**: Data visualization with dynamic colors
- **Socket.IO Client**: Real-time communication
- **Zustand**: Lightweight state management
- **TanStack Table**: Advanced table functionality
- **date-fns**: Date manipulation utilities

## 🔒 Security Features

### Production Considerations
- **Environment Variables**: Secure configuration management
- **CORS Configuration**: Proper cross-origin settings
- **Input Validation**: Type-safe data handling
- **Error Handling**: Comprehensive error management
- **Database Views**: Optimized queries with proper permissions

### Recommended Enhancements
- **Authentication**: JWT-based user authentication
- **Encryption**: Data encryption at rest and in transit
- **Rate Limiting**: API rate limiting
- **Audit Logging**: Comprehensive security logging

## 🚀 Deployment & CI/CD

This project uses a hybrid deployment approach for optimal performance:

### 🎯 Deployment Architecture

#### Frontend (Vercel)
- **Platform**: Vercel
- **Deployment**: Automated via GitHub Actions
- **Benefits**: Fast static hosting, global CDN, automatic previews

#### Backend (Railway)
- **Platform**: Railway
- **Deployment**: Manual deployment with automated migrations
- **Benefits**: Full WebSocket support, PostgreSQL database, real-time logs
- **Database**: Railway PostgreSQL with optimized views

#### Database (Railway PostgreSQL)
- **Platform**: Railway PostgreSQL
- **Benefits**: Managed database with automatic backups and migrations

### 🔄 CI/CD Pipeline

#### Automated Workflows
- **Frontend CI/CD**: Testing, linting, and deployment to Vercel
- **Preview Deployments**: Automatic preview URLs for pull requests
- **Production Deployments**: Automatic frontend deployment on main branch
- **Backend Testing**: Automated backend tests and security scans
- **Database Management**: Automated database migrations and seeding

#### Quick Setup
1. **Fork this repository** to your GitHub account
2. **Deploy backend to Railway** using the provided scripts
3. **Set up Vercel frontend** with environment variables
4. **Deploy frontend automatically** on every push to main branch

#### Environment Variables

**Frontend (Vercel):**
```bash
VITE_API_URL=https://your-railway-backend.railway.app/api
VITE_WS_URL=https://your-railway-backend.railway.app
```

**Backend (Railway):**
```bash
DATABASE_URL=your_railway_postgres_url
NODE_ENV=production
```

### Railway Deployment

#### Quick Deploy
```bash
# Install Railway CLI
npm install -g @railway/cli

# Login and deploy
railway login
railway up
```

#### Manual Database Setup
```bash
# Apply migrations
railway run npx prisma migrate deploy

# Seed database
railway run npm run seed
```

### Traditional Deployment

#### Backend Deployment
```bash
cd backend
npm run build
npm start
```

#### Frontend Deployment
```bash
cd frontend
npm run build
# Deploy dist/ folder to your hosting service
```

## 📈 Performance

### Optimization Features
- **Database Views**: Pre-computed aggregations for fast queries
- **WebSocket Connection**: Efficient real-time updates
- **Database Indexing**: Optimized query performance
- **Connection Pooling**: Database connection management
- **Docker Optimization**: Multi-stage builds for production

### Performance Testing
- **25k Record Generation**: Automated test data creation
- **Response Time Monitoring**: API endpoint performance tracking
- **Memory Usage**: Container resource monitoring
- **Database Query Optimization**: View-based aggregations

### Monitoring
- **Health Checks**: System health monitoring
- **Error Tracking**: Comprehensive error logging
- **Performance Metrics**: Response time tracking
- **WebSocket Status**: Real-time connection monitoring

## 🤝 Contributing

### Development Workflow
1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new features
5. Submit a pull request

### Code Standards
- **TypeScript**: Strict type checking
- **ESLint**: Code quality enforcement
- **Prettier**: Code formatting
- **Jest**: Unit and integration testing

### Development Environment
- **Docker Compose**: Consistent development environment
- **Hot Reloading**: Frontend and backend live updates
- **Volume Mounts**: Local code changes reflected immediately
- **Database Migrations**: Automated schema management

## 📚 Documentation

### Additional Resources
- [Prisma Documentation](https://www.prisma.io/docs)
- [Socket.IO Documentation](https://socket.io/docs)
- [Chart.js Documentation](https://www.chartjs.org/docs)
- [styled-components Documentation](https://styled-components.com/docs)
- [Zustand Documentation](https://zustand.docs.pmnd.rs)
- [TanStack Table Documentation](https://tanstack.com/table/latest)

### API Documentation
- **Swagger/OpenAPI**: Available at `/api-docs` (when implemented)
- **Postman Collection**: Available in `/docs` folder

## 🐛 Troubleshooting

### Common Issues

#### WebSocket Connection Issues
```bash
# Check WebSocket server status
docker compose logs backend | grep "WebSocket"

# Verify frontend connection
# Check browser console for WebSocket errors
```

#### Database Connection Issues
```bash
# Check database status
docker compose logs postgres

# Reset database
docker compose down
docker compose up -d
```

#### Frontend Not Updating
```bash
# Rebuild frontend container
docker compose restart frontend

# Check volume mounts
docker compose exec frontend ls -la
```

#### Migration Issues
```bash
# Reset local database
docker compose down
docker volume rm fraud-detection-system_postgres_data
docker compose up -d

# Apply migrations
cd backend
npx prisma migrate deploy
npm run seed
```

### Performance Issues
- **Slow Queries**: Check database views are created
- **Memory Usage**: Monitor container resources
- **WebSocket Lag**: Check connection status and event emission

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

### Getting Help
- **Issues**: Create a GitHub issue
- **Discussions**: Use GitHub Discussions
- **Documentation**: Check the docs folder

### Production Support
- **Railway Dashboard**: Monitor backend performance
- **Vercel Dashboard**: Monitor frontend performance
- **Database Monitoring**: Railway PostgreSQL metrics

---

**Built with ❤️ for the fintech community**

*Last updated: July 2024*
