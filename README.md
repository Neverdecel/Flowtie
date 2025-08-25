# Flowtie

[![CI](https://github.com/Neverdecel/Flowtie/workflows/CI/badge.svg)](https://github.com/Neverdecel/Flowtie/actions)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js Version](https://img.shields.io/badge/node-%3E%3D18.0.0-brightgreen)](https://nodejs.org/)
[![Docker](https://img.shields.io/badge/docker-supported-blue)](https://www.docker.com/)

Hot-reloadable prompt management platform for AI applications.

> 🚀 **Transform your AI prompts from static code to dynamic, testable assets with hot reloading, A/B testing, and collaborative management.**

## Problem

Prompts are mostly hardcoded in AI applications, making it difficult to delegate prompt optimization from developers. This creates bottlenecks and prevents non-developers from effectively managing and testing AI prompts.

## Solution

Flowtie provides:
- 🔥 **Hot reloading** of prompts without application restart
- 🧪 **A/B testing** with traffic splitting and analytics
- 📝 **Version control** for prompts with Git-like branching
- 🎯 **Non-developer interface** for prompt management
- 📦 **SDKs** for easy integration into existing codebases

## Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Dashboard     │    │       API       │    │    Database     │
│   (React)       │◄──►│  (Node.js)      │◄──►│  (PostgreSQL)   │
└─────────────────┘    └─────────────────┘    └─────────────────┘
                              │
                              ▼
                       ┌─────────────────┐
                       │   WebSocket     │
                       │   (Real-time)   │
                       └─────────────────┘
                              │
                              ▼
                       ┌─────────────────┐
                       │      SDKs       │
                       │  (JS/TS, Python)│
                       └─────────────────┘
```

## 🐳 Quick Start with Docker

### Prerequisites
- Docker and Docker Compose
- Make (optional, for easier commands)

### 1. Clone and Setup
```bash
git clone https://github.com/Neverdecel/Flowtie.git
cd flowtie

# Copy environment file and customize if needed
cp .env.example .env
```

### 2. Start Services
```bash
# Using Make (recommended)
make up

# Or using docker-compose directly
docker-compose up -d
```

### 3. Run Database Migrations
```bash
make migrate

# Or directly
docker-compose run --rm migrate
```

### 4. Access the Platform
- **Dashboard**: http://localhost:3000
- **API**: http://localhost:3001
- **API Health**: http://localhost:3001/health

## 🔧 Development

### Start in Development Mode
```bash
make dev
# This enables hot reloading for both API and Dashboard
```

### Useful Commands
```bash
make help           # Show all available commands
make logs           # View logs from all services
make logs-api       # View API logs only
make shell-api      # Open shell in API container
make shell-db       # Open PostgreSQL shell
make restart        # Restart all services
make clean          # Clean up containers and volumes
```

## 📦 Services

| Service | Port | Description |
|---------|------|-------------|
| Dashboard | 3000 | React web interface |
| API | 3001 | Node.js backend with WebSocket |
| PostgreSQL | 5432 | Database |
| Redis | 6379 | Cache and real-time messaging |

## 🚀 Using the SDK

### Installation
```bash
npm install @flowtie/sdk-js
```

### Basic Usage
```javascript
const { FlowTie } = require('@flowtie/sdk-js');

const flowtie = new FlowTie({
  apiUrl: 'http://localhost:3001',
  apiKey: 'your-api-key',
  projectId: 'your-project-id',
  enableRealtime: true,  // Hot reloading
  cachePrompts: true
});

// Initialize connection
await flowtie.initialize();

// Get a prompt with variables
const prompt = await flowtie.getPrompt('welcome-message', {
  variables: { name: 'John', company: 'Acme' }
});

// A/B test prompts
const result = await flowtie.getABTestPrompt('onboarding-flow', {
  variables: { plan: 'premium' }
});

// Listen for hot reloads
flowtie.on('prompt-updated', (event) => {
  console.log('🔄 Prompt updated:', event.prompt.name);
});
```

## 📊 Features

### Dashboard
- User authentication and project management
- Visual prompt editor with real-time preview
- A/B test configuration wizard
- Analytics and performance dashboards
- Version control and approval workflows

### API
- RESTful endpoints for all operations
- WebSocket support for real-time updates
- JWT-based authentication
- Comprehensive analytics tracking
- Rate limiting and security measures

### SDK
- Type-safe prompt definitions
- Automatic caching with TTL
- Hot reloading without application restart
- A/B testing with consistent variant selection
- Built-in analytics and error handling

## 🛠️ Configuration

### Environment Variables
Key variables in `.env`:
```env
DATABASE_URL=postgresql://flowtie:password@postgres:5432/flowtie
JWT_SECRET=your-super-secret-key
REDIS_URL=redis://redis:6379
NEXT_PUBLIC_API_URL=http://localhost:3001
```

### Production Deployment
1. Change default passwords in `.env`
2. Update `JWT_SECRET` to a secure value
3. Configure proper CORS origins
4. Set up SSL/HTTPS
5. Configure backup strategies

### Scaling
- API service can be scaled horizontally
- Redis handles session sharing between API instances
- PostgreSQL can be configured with read replicas
- CDN can be added for dashboard assets

## 🔐 Security

- JWT-based authentication
- Password hashing with bcrypt
- CORS protection
- Helmet.js security headers
- Input validation with Zod
- SQL injection prevention with Prisma

## 🧪 Examples

Check the `/examples` directory for integration examples:
- Basic usage
- Express.js integration
- Error handling patterns
- A/B testing workflows

## 📈 Monitoring

### Health Checks
```bash
curl http://localhost:3001/health
```

### Service Status
```bash
make status
make health
```

### Logs
```bash
make logs           # All services
make logs-api       # API only
make logs-dashboard # Dashboard only
```

## 🔄 Backup and Recovery

### Database Backup
```bash
make backup-db
```

### Volume Management
```bash
# List volumes
docker volume ls | grep flowtie

# Backup volumes
docker run --rm -v flowtie_postgres_data:/data -v $(pwd):/backup alpine tar czf /backup/postgres_backup.tar.gz -C /data .
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test with `make dev`
5. Submit a pull request

## 📄 License

MIT License - see LICENSE file for details

---

**Flowtie** - Making AI prompts manageable, testable, and collaborative! 🚀