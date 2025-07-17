# Fraud Detection Backend

Real-time fraud detection system with ML-based risk scoring, built with Node.js, Express, TypeScript, and Prisma.

## Features

- 🚨 Real-time transaction simulation (every 5 seconds)
- 📊 ML-based risk scoring with logistic regression
- 🔍 Interactive alerts dashboard
- 📈 Comprehensive API endpoints
- 🛡️ Fintech-grade security patterns
- 📋 Audit logging for compliance

## Tech Stack

- **Runtime**: Node.js v20+
- **Framework**: Express.js with TypeScript
- **Database**: PostgreSQL with Prisma ORM
- **ML**: ml.js for logistic regression
- **Security**: UUID primary keys, input validation
- **Monitoring**: Health checks, error handling

## Quick Start

### 1. Install Dependencies

```bash
npm install
```

### 2. Environment Setup

Create a `.env` file in the backend directory:

```env
# Database Configuration
DATABASE_URL="postgresql://username:password@localhost:5432/fraud_detection"

# Server Configuration
PORT=3000
NODE_ENV=development
```

**Database Options:**
- **Neon (Recommended)**: Free PostgreSQL hosting
- **Supabase**: Free PostgreSQL with dashboard
- **Local**: PostgreSQL installed locally

### 3. Database Setup

```bash
# Generate Prisma client
npm run db:generate

# Push schema to database
npm run db:push

# Seed with initial data
npm run seed
```

### 4. Start Development Server

```bash
npm run dev
```

The server will start on `http://localhost:3000` with:
- Transaction simulation running every 5 seconds
- Real-time risk scoring
- Automatic alert generation for high-risk transactions

## API Endpoints

### Health Check
```
GET /health
```

### Alerts
```
GET /alerts
```
Returns the 50 most recent alerts with full transaction details.

### Transactions
```
GET /transactions
```
Returns the 100 most recent transactions with related data.

### Risk Signals
```
GET /risk-signals
```
Returns the 100 most recent risk signals.

### Dashboard Stats
```
GET /dashboard/stats
```
Returns aggregated statistics for the dashboard.

### Simulation Control
```
GET /simulation/status
```
Returns the current status of transaction simulation.

### Risk Analysis
```
GET /risk-analysis/:transactionId
```
Returns detailed risk analysis for a specific transaction including features and risk factors.

## Transaction Simulation

The system automatically generates mock transactions every 5 seconds:

- **Random amounts**: $1 - $10,000
- **Real ML-based risk scoring**: Uses feature extraction and weighted algorithms
- **Automatic alerts**: Generated for risk scores ≥75%
- **Realistic data**: Uses seeded users, devices, and merchants
- **Modular design**: Transaction simulation is handled by `services/transactionSimulator.ts`
- **Graceful shutdown**: Simulation stops cleanly on server shutdown

## Risk Analysis System

The system uses real ML-based risk scoring with the following features:

### **Risk Factors:**
- **Transaction Amount** (25% weight): Normalized amount relative to $10,000 max
- **Device Age** (15% weight): How long the device has been used
- **Merchant Risk** (30% weight): Pre-configured merchant risk levels
- **Transaction Frequency** (20% weight): Number of transactions in last 5 minutes
- **Average User Amount** (10% weight): User's average transaction amount

### **Risk Multipliers:**
- High amount relative to user's average (1.5x)
- High frequency transactions (1.3x)
- Very new device (1.4x)
- High-risk merchant (1.6x)

### **Risk Levels:**
- **Critical**: 90-100%
- **High**: 75-89%
- **Medium**: 50-74%
- **Low**: 25-49%
- **Very Low**: 0-24%

## Database Schema

The system uses 8 interconnected tables:

- **users**: Customer profiles
- **devices**: User device fingerprints
- **merchants**: Merchant risk profiles
- **transactions**: Core transaction logs
- **risk_signals**: ML risk assessments
- **alerts**: Fraud alerts
- **audit_logs**: Compliance audit trail
- **training_data**: ML model training data

## Development Commands

```bash
# Development
npm run dev              # Start development server
npm run seed             # Seed database with mock data

# Database
npm run db:generate      # Generate Prisma client
npm run db:push          # Push schema changes
npm run db:studio        # Open Prisma Studio

# Production
npm run build            # Build TypeScript
npm start                # Start production server
```

## ML Integration

The system includes:
- **Feature extraction**: Amount, device age, merchant risk, frequency
- **Risk scoring**: Logistic regression model
- **Training data**: Automatic feature collection
- **Real-time prediction**: Instant risk assessment

## Security Features

- UUID primary keys for all entities
- Input validation and sanitization
- Error handling with no sensitive data exposure
- Audit logging for compliance
- CORS configuration for frontend integration

## Monitoring

- Health check endpoint for uptime monitoring
- Comprehensive error logging
- Transaction simulation status
- Database connection monitoring

## Next Steps

1. **Frontend Integration**: Connect to React dashboard
2. **ML Model Training**: Implement periodic model retraining
3. **Authentication**: Add user authentication and authorization
4. **Encryption**: Implement data encryption for sensitive fields
5. **Rate Limiting**: Add API rate limiting
6. **Webhooks**: Implement real-time webhook notifications

## Troubleshooting

### Database Connection Issues
- Verify DATABASE_URL in .env
- Ensure database is running and accessible
- Check network connectivity

### Prisma Issues
- Run `npm run db:generate` after schema changes
- Use `npm run db:studio` to inspect database
- Check Prisma logs for detailed errors

### Transaction Simulation Not Working
- Ensure database is seeded: `npm run seed`
- Check console logs for error messages
- Verify all required tables exist

## License

MIT License - see LICENSE file for details. 