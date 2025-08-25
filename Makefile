# Flowtie Docker Management
.PHONY: help build up down logs clean restart status seed

# Default target
help: ## Show this help message
	@echo "Flowtie Docker Commands:"
	@echo ""
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "\033[36m%-20s\033[0m %s\n", $$1, $$2}'

build: ## Build all Docker images
	@echo "🏗️  Building Flowtie containers..."
	docker-compose build --no-cache

up: ## Start all services
	@echo "🚀 Starting Flowtie platform..."
	docker-compose up -d
	@echo "✅ Services started!"
	@echo "📡 API: http://localhost:3001"
	@echo "🖥️  Dashboard: http://localhost:3000"
	@echo "🗄️  PostgreSQL: localhost:5432"
	@echo "🔄 Redis: localhost:6379"

down: ## Stop all services
	@echo "🛑 Stopping Flowtie platform..."
	docker-compose down

logs: ## Show logs for all services
	docker-compose logs -f

logs-api: ## Show API logs
	docker-compose logs -f api

logs-dashboard: ## Show dashboard logs
	docker-compose logs -f dashboard

logs-db: ## Show database logs
	docker-compose logs -f postgres

clean: ## Stop and remove all containers, volumes, and images
	@echo "🧹 Cleaning up Flowtie containers and volumes..."
	docker-compose down -v --remove-orphans
	docker system prune -f
	@echo "✅ Cleanup complete!"

restart: down up ## Restart all services

status: ## Show status of all services
	@echo "📊 Flowtie Service Status:"
	docker-compose ps

health: ## Check health of all services
	@echo "🏥 Health Check:"
	@docker-compose ps --format "table {{.Name}}\t{{.Status}}\t{{.Ports}}"

migrate: ## Run database migrations
	@echo "🔄 Running database migrations..."
	docker-compose run --rm migrate

shell-api: ## Open shell in API container
	docker-compose exec api sh

shell-db: ## Open PostgreSQL shell
	docker-compose exec postgres psql -U flowtie -d flowtie

seed: ## Seed database with sample data (after first run)
	@echo "🌱 Seeding database with sample data..."
	docker-compose exec api npm run seed

backup-db: ## Backup database
	@echo "💾 Backing up database..."
	docker-compose exec postgres pg_dump -U flowtie -d flowtie > backup_$(shell date +%Y%m%d_%H%M%S).sql
	@echo "✅ Database backed up!"

dev: ## Start services in development mode (with hot reload and sample data)
	@echo "🔧 Starting in development mode..."
	docker-compose -f docker-compose.yml -f docker-compose.dev.yml up -d
	@echo "⏳ Setting up development environment..."
	@sleep 10
	@./docker/scripts/dev-setup.sh

prod: build up ## Build and start in production mode