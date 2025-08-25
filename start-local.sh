#!/bin/bash

# Simple local development startup script for Flowtie
echo "🚀 Starting Flowtie locally for development..."

# Start database and redis services only with Docker
echo "🗄️  Starting database services..."
docker-compose up -d postgres redis

# Wait for services to be ready
echo "⏳ Waiting for database to be ready..."
sleep 10

# Run migrations
echo "🔄 Running database migrations..."
cd packages/api
npm install
npx prisma migrate deploy
npx prisma generate

# Seed database
echo "🌱 Seeding database..."
npm run seed

echo "✅ Database setup complete!"

# Start API locally
echo "🔌 Starting API server..."
npm run dev &

# Start dashboard locally
cd ../dashboard
echo "🖥️  Starting dashboard..."
npm install
npm run dev &

echo ""
echo "🎉 Flowtie is starting up!"
echo "📊 Dashboard: http://localhost:3000"
echo "🔌 API: http://localhost:3001"
echo ""
echo "Demo accounts:"
echo "📧 demo@flowtie.dev / password123 (User)"
echo "📧 admin@flowtie.dev / admin123 (Admin)"
echo ""
echo "Press Ctrl+C to stop all services"
wait