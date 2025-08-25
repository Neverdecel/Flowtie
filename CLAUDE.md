# Claude Configuration

This file contains configuration and reminders for Claude Code when working on this project.

## Commands to Run

When making changes to the codebase, always run these commands:

```bash
# Run linting and fix issues
npm run lint

# Run tests
npm test

# Build the project
npm run build
```

## Project Context

- **Project**: Flowtie - Hot-reloadable prompt management platform
- **Stack**: Node.js, TypeScript, React, PostgreSQL, Redis, Docker
- **Architecture**: Monorepo with packages for API, Dashboard, and SDK

## Development Setup

```bash
# Local development (recommended for development)
npm install
cd packages/api && npm run dev
cd packages/dashboard && npm run dev

# Docker development
make dev
```

## Key Files

- **API**: `packages/api/src/index.ts`
- **Dashboard**: `packages/dashboard/src/pages/`
- **SDK**: `packages/sdk-js/src/index.ts`
- **Database Schema**: `packages/api/prisma/schema.prisma`

## Testing

Always test changes with:
1. Unit tests: `npm test`
2. Manual testing via dashboard
3. Docker build: `docker-compose build`

## Deployment

Production deployment uses Docker:
```bash
make prod
```