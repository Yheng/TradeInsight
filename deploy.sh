#!/bin/bash

# TradeInsight Deployment Script
set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
ENVIRONMENT=${1:-development}
VERSION=${2:-latest}

echo -e "${BLUE}🚀 TradeInsight Deployment Script${NC}"
echo -e "${BLUE}Environment: ${ENVIRONMENT}${NC}"
echo -e "${BLUE}Version: ${VERSION}${NC}"

# Functions
log_info() {
    echo -e "${GREEN}ℹ️  $1${NC}"
}

log_warn() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

log_error() {
    echo -e "${RED}❌ $1${NC}"
}

# Check prerequisites
check_prerequisites() {
    log_info "Checking prerequisites..."
    
    # Check Docker
    if ! command -v docker &> /dev/null; then
        log_error "Docker is not installed"
        exit 1
    fi
    
    # Check Docker Compose
    if ! command -v docker-compose &> /dev/null; then
        log_error "Docker Compose is not installed"
        exit 1
    fi
    
    # Check Node.js
    if ! command -v node &> /dev/null; then
        log_error "Node.js is not installed"
        exit 1
    fi
    
    log_info "Prerequisites check passed"
}

# Load environment variables
load_environment() {
    log_info "Loading environment configuration..."
    
    ENV_FILE=".env.${ENVIRONMENT}"
    if [ -f "$ENV_FILE" ]; then
        export $(cat $ENV_FILE | grep -v '#' | xargs)
        log_info "Loaded environment from $ENV_FILE"
    else
        log_warn "Environment file $ENV_FILE not found, using defaults"
        if [ ! -f ".env" ]; then
            cp .env.example .env
            log_info "Created .env from .env.example"
        fi
        export $(cat .env | grep -v '#' | xargs)
    fi
}

# Build applications
build_applications() {
    log_info "Building applications..."
    
    # Install dependencies
    npm ci
    
    # Build packages
    npm run build
    
    log_info "Applications built successfully"
}

# Run tests
run_tests() {
    if [ "$ENVIRONMENT" != "production" ]; then
        log_info "Running tests..."
        
        # Lint
        npm run lint
        
        # Type check
        npm run typecheck
        
        # Unit tests
        npm run test:coverage
        
        log_info "All tests passed"
    else
        log_info "Skipping tests for production deployment"
    fi
}

# Database operations
setup_database() {
    log_info "Setting up database..."
    
    if [ "$ENVIRONMENT" = "production" ]; then
        # Create backup before any changes
        if [ -f "data/tradeinsight.db" ]; then
            log_info "Creating backup before deployment..."
            npm run db:backup
        fi
    fi
    
    # Ensure data directory exists
    mkdir -p data
    
    log_info "Database setup completed"
}

# Deploy with Docker Compose
deploy_docker() {
    log_info "Deploying with Docker Compose..."
    
    # Set environment-specific compose file
    COMPOSE_FILE="docker-compose.yml"
    if [ -f "docker-compose.${ENVIRONMENT}.yml" ]; then
        COMPOSE_FILE="docker-compose.yml:docker-compose.${ENVIRONMENT}.yml"
    fi
    
    # Pull latest images (if using registry)
    # docker-compose -f $COMPOSE_FILE pull
    
    # Build and start services
    docker-compose -f $COMPOSE_FILE build
    docker-compose -f $COMPOSE_FILE up -d
    
    log_info "Services deployed successfully"
}

# Health checks
run_health_checks() {
    log_info "Running health checks..."
    
    # Wait for services to start
    sleep 10
    
    # Check API health
    API_PORT=${API_PORT:-3000}
    if curl -f "http://localhost:${API_PORT}/health" &> /dev/null; then
        log_info "API health check passed"
    else
        log_error "API health check failed"
        return 1
    fi
    
    # Check frontend
    FRONTEND_PORT=${FRONTEND_PORT:-5173}
    if curl -f "http://localhost:${FRONTEND_PORT}" &> /dev/null; then
        log_info "Frontend health check passed"
    else
        log_error "Frontend health check failed"
        return 1
    fi
    
    # Check MT5 service
    MT5_PORT=${MT5_PORT:-8000}
    if curl -f "http://localhost:${MT5_PORT}/health" &> /dev/null; then
        log_info "MT5 service health check passed"
    else
        log_warn "MT5 service health check failed (this might be expected if not configured)"
    fi
    
    log_info "Health checks completed"
}

# Show deployment info
show_deployment_info() {
    log_info "Deployment completed successfully!"
    
    echo ""
    echo -e "${GREEN}📊 Service URLs:${NC}"
    echo -e "Frontend:   http://localhost:${FRONTEND_PORT:-5173}"
    echo -e "API:        http://localhost:${API_PORT:-3000}"
    echo -e "MT5 Service: http://localhost:${MT5_PORT:-8000}"
    
    if [ "$ENVIRONMENT" = "development" ]; then
        echo -e "Grafana:    http://localhost:${GRAFANA_PORT:-3001} (admin:admin)"
        echo -e "Prometheus: http://localhost:${PROMETHEUS_PORT:-9090}"
    fi
    
    echo ""
    echo -e "${GREEN}🔧 Management Commands:${NC}"
    echo -e "View logs:    docker-compose logs -f"
    echo -e "Stop services: docker-compose down"
    echo -e "Restart:      docker-compose restart"
    echo -e "Health check: npm run health"
    echo ""
}

# Rollback function
rollback() {
    log_warn "Rolling back deployment..."
    
    # Stop current services
    docker-compose down
    
    # Restore database backup if exists
    if [ "$ENVIRONMENT" = "production" ]; then
        LATEST_BACKUP=$(ls -t backups/*.db 2>/dev/null | head -n1)
        if [ -n "$LATEST_BACKUP" ]; then
            log_info "Restoring database from $LATEST_BACKUP"
            npm run db:restore $(basename "$LATEST_BACKUP")
        fi
    fi
    
    log_info "Rollback completed"
}

# Cleanup function
cleanup() {
    log_info "Cleaning up..."
    
    # Remove unused Docker images
    docker image prune -f
    
    # Remove old backups (keep last 10)
    if [ -d "backups" ]; then
        ls -t backups/*.db 2>/dev/null | tail -n +11 | xargs -r rm
    fi
    
    log_info "Cleanup completed"
}

# Main deployment flow
main() {
    case "${1:-deploy}" in
        "deploy")
            check_prerequisites
            load_environment
            build_applications
            run_tests
            setup_database
            deploy_docker
            run_health_checks
            show_deployment_info
            ;;
        "rollback")
            rollback
            ;;
        "cleanup")
            cleanup
            ;;
        "health")
            run_health_checks
            ;;
        *)
            echo "Usage: $0 [deploy|rollback|cleanup|health] [environment] [version]"
            echo ""
            echo "Commands:"
            echo "  deploy   - Deploy the application (default)"
            echo "  rollback - Rollback to previous version"
            echo "  cleanup  - Clean up old resources"
            echo "  health   - Run health checks"
            echo ""
            echo "Environments:"
            echo "  development (default)"
            echo "  staging"
            echo "  production"
            exit 1
            ;;
    esac
}

# Trap errors and run cleanup
trap 'log_error "Deployment failed"; exit 1' ERR

# Run main function
main "$@"