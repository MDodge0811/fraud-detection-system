# 🚨 Real-Time Fraud Detection Alert System

A comprehensive, real-time fraud detection system with ML-based risk scoring, built with Node.js, React, PostgreSQL, and WebSocket technology. This system simulates financial transactions, analyzes them for fraud risk using machine learning, and provides real-time alerts through an interactive dashboard.

## 🎯 Features

### 🔍 **Real-Time Fraud Detection**
- **Live Transaction Monitoring**: Continuous simulation of financial transactions
- **ML-Based Risk Scoring**: Advanced machine learning algorithms for fraud detection
- **Instant Alerts**: Real-time notifications for high-risk transactions
- **WebSocket Integration**: Live updates across all dashboard components

### 📊 **Interactive Dashboard**
- **Real-Time Charts**: Transaction volume, risk distribution, and alert trends
- **Live Statistics**: Dynamic counters for transactions, alerts, and risk metrics
- **Responsive Design**: Modern UI built with styled-components
- **Connection Status**: Visual indicator for WebSocket connection health

### 🧠 **Machine Learning Features**
- **Logistic Regression Model**: Binary classification for fraud detection
- **Feature Engineering**: Normalized transaction features for ML training
- **Risk Scoring**: 0-100 risk scores with detailed reasoning
- **Training Data Management**: Continuous model improvement

### 🏗️ **Architecture & Technology**
- **TypeScript**: Full-stack type safety
- **Prisma ORM**: Modern database management
- **PostgreSQL**: Robust relational database
- **Socket.IO**: Real-time bidirectional communication
- **Chart.js**: Interactive data visualization

## 🚀 Quick Start

### Prerequisites
- **Node.js** 18+ 
- **PostgreSQL** 14+
- **Docker** (for testing)
- **npm** or **yarn**

### 1. Clone the Repository
```bash
git clone <repository-url>
cd fraud-detection-system
```

### 2. Database Setup
```bash
# Create a PostgreSQL database
createdb fraud_detection

# Set up environment variables
cp backend/.env.example backend/.env
# Edit backend/.env with your database URL
```

### 3. Backend Setup
```bash
cd backend
npm install
npm run db:generate    # Generate Prisma client
npm run db:push        # Push schema to database
npm run seed           # Seed initial data
npm run dev            # Start development server
```

### 4. Frontend Setup
```bash
cd frontend
npm install
npm run dev            # Start development server
```

### 5. Access the Application
- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:3000
- **Health Check**: http://localhost:3000/health

## 📁 Project Structure

```
fraud-detection-system/
├── backend/                    # Node.js + Express API
│   ├── prisma/                # Database schema & migrations
│   │   ├── schema.prisma      # Database schema
│   │   └── migrations/        # Database migrations
│   ├── services/              # Business logic
│   │   ├── transactionSimulator.ts  # Transaction simulation
│   │   ├── mlRiskAnalyzer.ts  # ML risk analysis
│   │   └── index.ts           # Service exports
│   ├── tests/                 # Integration tests
│   ├── index.ts               # Express server + WebSocket
│   ├── seed.ts                # Database seeding
│   └── package.json
├── frontend/                   # React + Vite application
│   ├── src/
│   │   ├── components/        # React components
│   │   │   └── Dashboard.tsx  # Main dashboard
│   │   ├── services/          # API & WebSocket services
│   │   │   ├── api.ts         # REST API client
│   │   │   └── websocket.ts   # WebSocket client
│   │   └── App.tsx            # Main app component
│   └── package.json
├── docker-compose.test.yml     # Test database setup
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

### Key Relationships
- Transactions link users, devices, and merchants
- Risk signals are generated for each transaction
- Alerts are created for high-risk transactions
- Training data feeds the ML model

## 🔧 API Endpoints

### Core Endpoints
- `GET /health` - Health check
- `GET /alerts` - Recent fraud alerts
- `GET /transactions` - Recent transactions
- `GET /risk-signals` - Risk analysis data
- `GET /dashboard/stats` - Dashboard statistics
- `GET /simulation/status` - Simulation status

### WebSocket Events
- `transaction:new` - New transaction created
- `alert:new` - New fraud alert
- `risk-signal:new` - New risk signal
- `dashboard:stats` - Updated statistics

## 🧪 Testing

### Integration Tests
```bash
cd backend
npm run test:integration
```

### Test Database
The system uses Docker for isolated test database:
```bash
npm run docker:up      # Start test database
npm run docker:down    # Stop test database
```

## 🎨 Frontend Features

### Dashboard Components
- **Real-Time Charts**: Chart.js integration with live updates
- **Interactive Tables**: TanStack Table for data display
- **Connection Status**: WebSocket health indicator
- **Responsive Layout**: Mobile-friendly design

### Key Libraries
- **React 19**: Latest React features
- **Vite**: Fast development server
- **styled-components**: CSS-in-JS styling
- **Chart.js**: Data visualization
- **Socket.IO Client**: Real-time communication

## 🔒 Security Features

### Production Considerations
- **Environment Variables**: Secure configuration management
- **CORS Configuration**: Proper cross-origin settings
- **Input Validation**: Type-safe data handling
- **Error Handling**: Comprehensive error management

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

#### Backend (Manual Deployment)
- **Platform**: Railway, Heroku, or any Node.js hosting
- **Deployment**: Manual deployment process
- **Benefits**: Full WebSocket support, PostgreSQL database, real-time logs

#### Database (Managed PostgreSQL)
- **Platform**: Railway PostgreSQL, Supabase, or similar
- **Benefits**: Managed database with automatic backups

### 🔄 CI/CD Pipeline

#### Automated Workflows
- **Frontend CI/CD**: Testing, linting, and deployment to Vercel
- **Preview Deployments**: Automatic preview URLs for pull requests
- **Production Deployments**: Automatic frontend deployment on main branch
- **Backend Testing**: Automated backend tests and security scans
- **Database Management**: Automated database migrations and seeding

#### Quick Setup
1. **Fork this repository** to your GitHub account
2. **Deploy backend manually** to your preferred platform
3. **Set up Vercel frontend** with environment variables
4. **Deploy frontend automatically** on every push to main branch

#### Environment Variables

**Frontend (Vercel):**
```bash
VITE_API_URL=https://your-backend-url.com/api
VITE_WS_URL=https://your-backend-url.com
```

**Backend:**
```bash
DATABASE_URL=your_postgres_url
NODE_ENV=production
```

### 📋 Required GitHub Secrets (Frontend Only)
```bash
VERCEL_TOKEN=your_vercel_token
VERCEL_ORG_ID=your_org_id
VERCEL_PROJECT_ID_FRONTEND=your_frontend_project_id
```

For detailed setup instructions, see:
- [GITHUB_ACTIONS.md](./GITHUB_ACTIONS.md) - CI/CD documentation
- [DEPLOYMENT.md](./DEPLOYMENT.md) - Vercel deployment guide

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

### Environment Variables
```bash
# Backend (.env)
DATABASE_URL="postgresql://user:password@localhost:5432/fraud_detection"
PORT=3000
NODE_ENV=production

# Frontend (Vite environment)
VITE_API_URL="http://localhost:3000"
```

## 📈 Performance

### Optimization Features
- **WebSocket Connection**: Efficient real-time updates
- **Database Indexing**: Optimized query performance
- **Connection Pooling**: Database connection management
- **Caching**: Redis integration ready

### Monitoring
- **Health Checks**: System health monitoring
- **Error Tracking**: Comprehensive error logging
- **Performance Metrics**: Response time tracking

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

## 📚 Documentation

### Additional Resources
- [Prisma Documentation](https://www.prisma.io/docs)
- [Socket.IO Documentation](https://socket.io/docs)
- [Chart.js Documentation](https://www.chartjs.org/docs)
- [styled-components Documentation](https://styled-components.com/docs)

### API Documentation
- **Swagger/OpenAPI**: Available at `/api-docs` (when implemented)
- **Postman Collection**: Available in `/docs` folder

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

### Common Issues
1. **WebSocket Connection Failed**: Check CORS configuration and ports
2. **Database Connection Error**: Verify PostgreSQL is running and credentials
3. **Build Errors**: Ensure Node.js version compatibility

### Getting Help
- **Issues**: Create a GitHub issue
- **Discussions**: Use GitHub Discussions
- **Documentation**: Check the docs folder

---

**Built with ❤️ for the fintech community**
