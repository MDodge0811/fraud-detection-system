# Fraud Detection System - Docker Setup

This guide provides comprehensive instructions for running the Fraud Detection System using Docker.

## 🐳 Quick Start

### Prerequisites

- Docker (version 20.10 or higher)
- Docker Compose (version 2.0 or higher)
- At least 4GB of available RAM
- At least 10GB of available disk space

### One-Command Setup

```bash
# Clone the repository (if not already done)
git clone <repository-url>
cd fraud-detection-system

# Run the full setup script
./scripts/docker-setup.sh full-setup
```

This will:
1. Build all Docker images
2. Start all services
3. Set up the database schema
4. Seed the database with initial data
5. Make the application available at http://localhost:5173

## 🚀 Available Commands

The `docker-setup.sh` script provides several commands:

```bash
# Start the application
./scripts/docker-setup.sh start

# Run tests
./scripts/docker-setup.sh test

# Stop the application
./scripts/docker-setup.sh stop

# Restart the application
./scripts/docker-setup.sh restart

# View logs
./scripts/docker-setup.sh logs

# Check status
./scripts/docker-setup.sh status

# Clean up everything
./scripts/docker-setup.sh cleanup

# Set up database schema
./scripts/docker-setup.sh db-setup

# Seed database with data
./scripts/docker-setup.sh db-seed
```

## 🏗️ Architecture

The system consists of the following services:

### Production Services (`docker-compose.yml`)

- **PostgreSQL** (port 5432): Main database
- **Backend API** (port 3000): Node.js/Express API with ML services
- **Frontend** (port 5173): React application served by Nginx
- **Redis** (port 6379): Caching and session storage

### Test Services (`docker-compose.test.yml`)

- **Test PostgreSQL** (port 5433): Isolated test database
- **Backend Tests**: Runs backend test suite
- **Frontend Tests**: Runs frontend test suite
- **Integration Tests**: End-to-end testing

## 📁 File Structure

```
fraud-detection-system/
├── docker-compose.yml              # Production services
├── docker-compose.test.yml         # Test services
├── scripts/
│   ├── docker-setup.sh            # Setup script
│   ├── init-db.sql               # Main DB initialization
│   └── init-test-db.sql          # Test DB initialization
├── backend/
│   ├── Dockerfile                # Production backend image
│   ├── Dockerfile.test           # Test backend image
│   └── .dockerignore
├── frontend/
│   ├── Dockerfile                # Production frontend image
│   ├── Dockerfile.test           # Test frontend image
│   ├── nginx.conf               # Nginx configuration
│   └── .dockerignore
└── DOCKER_README.md              # This file
```

## 🔧 Manual Setup

If you prefer to run commands manually:

### 1. Build and Start Services

```bash
# Start all services
docker-compose up --build -d

# Check status
docker-compose ps
```

### 2. Set Up Database

```bash
# Push schema to database
docker-compose exec backend npx prisma db push

# Generate Prisma client
docker-compose exec backend npx prisma generate

# Seed database
docker-compose exec backend npm run seed
```

### 3. Run Tests

```bash
# Run all tests
docker-compose -f docker-compose.test.yml up --build --abort-on-container-exit
```

## 🌐 Access Points

Once running, you can access:

- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:3000
- **API Documentation**: http://localhost:3000/api/docs
- **Health Check**: http://localhost:3000/health
- **Database**: localhost:5432 (postgres/postgres)

## 🔍 Monitoring and Debugging

### View Logs

```bash
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f backend
docker-compose logs -f frontend
docker-compose logs -f postgres
```

### Check Service Health

```bash
# Service status
docker-compose ps

# Health checks
curl http://localhost:3000/health
curl http://localhost:5173/health
```

### Database Access

```bash
# Connect to database
docker-compose exec postgres psql -U postgres -d fraud_detection

# Run Prisma Studio
docker-compose exec backend npx prisma studio
```

## 🧪 Testing

### Run All Tests

```bash
./scripts/docker-setup.sh test
```

### Run Specific Test Suites

```bash
# Backend tests only
docker-compose -f docker-compose.test.yml up backend-tests

# Frontend tests only
docker-compose -f docker-compose.test.yml up frontend-tests

# Integration tests only
docker-compose -f docker-compose.test.yml up integration-tests
```

### Test Coverage

Test coverage reports are generated in the `coverage/` directory:

- Backend: `coverage/backend/`
- Frontend: `coverage/frontend/`

## 🔒 Security Considerations

### Production Deployment

For production deployment, update the following:

1. **Environment Variables**: Create a `.env.production` file
2. **Secrets**: Use Docker secrets or external secret management
3. **SSL/TLS**: Configure HTTPS with proper certificates
4. **Network Security**: Use Docker networks and firewalls
5. **Database Security**: Use strong passwords and connection encryption

### Security Headers

The Nginx configuration includes security headers:
- X-Frame-Options
- X-XSS-Protection
- X-Content-Type-Options
- Content-Security-Policy

## 📊 Performance Optimization

### Resource Limits

Add resource limits to `docker-compose.yml`:

```yaml
services:
  backend:
    deploy:
      resources:
        limits:
          memory: 1G
          cpus: '0.5'
        reservations:
          memory: 512M
          cpus: '0.25'
```

### Caching

- **Redis**: Used for session storage and caching
- **Nginx**: Static asset caching configured
- **Database**: Connection pooling enabled

## 🚨 Troubleshooting

### Common Issues

1. **Port Conflicts**
   ```bash
   # Check what's using the ports
   lsof -i :3000
   lsof -i :5173
   lsof -i :5432
   ```

2. **Database Connection Issues**
   ```bash
   # Check database logs
   docker-compose logs postgres
   
   # Test connection
   docker-compose exec backend npx prisma db push
   ```

3. **Build Failures**
   ```bash
   # Clean and rebuild
   docker-compose down
   docker system prune -f
   docker-compose up --build
   ```

4. **Memory Issues**
   ```bash
   # Check Docker resource usage
   docker stats
   
   # Increase Docker memory limit in Docker Desktop
   ```

### Reset Everything

```bash
# Complete cleanup
./scripts/docker-setup.sh cleanup

# Fresh start
./scripts/docker-setup.sh full-setup
```

## 🔄 CI/CD Integration

### GitHub Actions

The system includes GitHub Actions workflows that use Docker:

- **Frontend Tests**: `docker-compose.test.yml` for frontend testing
- **Backend Tests**: `docker-compose.test.yml` for backend testing
- **Integration Tests**: Full system testing

### Local Development

For local development without Docker:

```bash
# Backend
cd backend
npm install
npm run dev

# Frontend
cd frontend
npm install
npm run dev
```

## 📈 Scaling

### Horizontal Scaling

```bash
# Scale backend services
docker-compose up --scale backend=3

# Scale with load balancer
docker-compose -f docker-compose.yml -f docker-compose.override.yml up
```

### Production Considerations

- Use Docker Swarm or Kubernetes for orchestration
- Implement proper logging (ELK stack)
- Set up monitoring (Prometheus/Grafana)
- Use external databases (AWS RDS, Google Cloud SQL)
- Implement proper backup strategies

## 📚 Additional Resources

- [Docker Documentation](https://docs.docker.com/)
- [Docker Compose Documentation](https://docs.docker.com/compose/)
- [Prisma Documentation](https://www.prisma.io/docs/)
- [Nginx Documentation](https://nginx.org/en/docs/)

## 🤝 Contributing

When contributing to the Docker setup:

1. Test your changes with `./scripts/docker-setup.sh test`
2. Update this README if needed
3. Ensure all services start correctly
4. Verify test coverage doesn't decrease

---

**Need Help?** Check the troubleshooting section or create an issue in the repository. 