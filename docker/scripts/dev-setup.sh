#!/bin/bash

# Flowtie Development Setup Script
# This script runs after containers start to set up the development environment

echo "🚀 Starting Flowtie development setup..."

# Wait for database to be ready
echo "⏳ Waiting for database to be ready..."
./docker/scripts/wait-for-it.sh postgres:5432 -t 60

# Run database migrations
echo "📦 Running database migrations..."
docker-compose exec api npx prisma migrate deploy

# Generate Prisma client
echo "🔧 Generating Prisma client..."
docker-compose exec api npx prisma generate

# Seed database with sample data
echo "🌱 Seeding database with sample data..."
docker-compose exec api npm run seed

echo "✅ Development setup complete!"
echo ""
echo "🎉 Flowtie is ready!"
echo "📊 Dashboard: http://localhost:3000"
echo "🔌 API: http://localhost:3001"
echo ""
echo "Demo accounts:"
echo "📧 demo@flowtie.dev / password123 (User)"
echo "📧 admin@flowtie.dev / admin123 (Admin)"
echo ""
echo "Sample data includes:"
echo "• AI Chatbot Demo project with 4 prompts"
echo "• Running A/B test: Welcome Message Test"
echo "• 150+ analytics data points"
echo "• Real-time hot reloading enabled"