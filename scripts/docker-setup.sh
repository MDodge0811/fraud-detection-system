#!/bin/bash

# Fraud Detection System Docker Setup Script
# This script sets up the entire system using Docker

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if Docker is installed
check_docker() {
    if ! command -v docker &> /dev/null; then
        print_error "Docker is not installed. Please install Docker first."
        exit 1
    fi

    if ! docker compose version &> /dev/null; then
        print_error "Docker Compose is not available. Please install Docker Compose first."
        exit 1
    fi

    print_success "Docker and Docker Compose are installed"
}

# Build and start the application
start_app() {
    print_status "Building and starting the fraud detection system..."
    
    # Build and start all services
    docker compose up --build -d
    
    print_success "Application started successfully!"
    print_status "Frontend: http://localhost:5173"
    print_status "Backend API: http://localhost:3000"
    print_status "Database: localhost:5432"
}

# Run tests
run_tests() {
    print_status "Running tests in Docker..."
    
    # Stop any running containers
    docker compose down
    
    # Run tests
    docker compose -f docker-compose.test.yml up --build --abort-on-container-exit
    
    print_success "Tests completed!"
}

# Stop the application
stop_app() {
    print_status "Stopping the fraud detection system..."
    docker compose down
    print_success "Application stopped"
}

# Clean up everything
cleanup() {
    print_status "Cleaning up Docker resources..."
    docker compose down -v --remove-orphans
    docker system prune -f
    print_success "Cleanup completed"
}

# Show logs
show_logs() {
    print_status "Showing application logs..."
    docker-compose logs -f
}

# Show status
show_status() {
    print_status "Application status:"
    docker-compose ps
}

# Database operations
setup_database() {
    print_status "Setting up database..."
    docker-compose exec backend npx prisma db push
    docker-compose exec backend npx prisma generate
    print_success "Database setup completed"
}

seed_database() {
    print_status "Seeding database..."
    docker-compose exec backend npm run seed
    print_success "Database seeded"
}

# Main script logic
case "${1:-start}" in
    "start")
        check_docker
        start_app
        ;;
    "test")
        check_docker
        run_tests
        ;;
    "stop")
        stop_app
        ;;
    "restart")
        stop_app
        start_app
        ;;
    "logs")
        show_logs
        ;;
    "status")
        show_status
        ;;
    "cleanup")
        cleanup
        ;;
    "db-setup")
        setup_database
        ;;
    "db-seed")
        seed_database
        ;;
    "full-setup")
        check_docker
        start_app
        sleep 10
        setup_database
        seed_database
        print_success "Full setup completed!"
        ;;
    *)
        echo "Usage: $0 {start|test|stop|restart|logs|status|cleanup|db-setup|db-seed|full-setup}"
        echo ""
        echo "Commands:"
        echo "  start       - Build and start the application"
        echo "  test        - Run all tests in Docker"
        echo "  stop        - Stop the application"
        echo "  restart     - Restart the application"
        echo "  logs        - Show application logs"
        echo "  status      - Show application status"
        echo "  cleanup     - Clean up all Docker resources"
        echo "  db-setup    - Set up the database schema"
        echo "  db-seed     - Seed the database with initial data"
        echo "  full-setup  - Complete setup (start + db-setup + db-seed)"
        exit 1
        ;;
esac 