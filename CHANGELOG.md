# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- Initial release of Flowtie platform
- Hot-reloadable prompt management system
- A/B testing with traffic splitting and analytics
- Version control for prompts with Git-like branching
- Real-time WebSocket updates for prompt changes
- TypeScript SDK for seamless integration
- React dashboard for non-developer prompt management
- JWT-based authentication and authorization
- Docker containerization support
- Comprehensive API documentation
- Database seeding with sample data

### Features
- **Prompt Management**: Create, edit, and version prompts with template variables
- **A/B Testing**: Split traffic between prompt variants with detailed analytics
- **Hot Reloading**: Update prompts without application restarts
- **SDK Integration**: TypeScript SDK with caching and real-time updates
- **Dashboard**: User-friendly interface for managing prompts and viewing analytics
- **Multi-tenant**: Project-based organization with user management

### Technical
- Node.js API with Express and WebSocket support
- PostgreSQL database with Prisma ORM
- Redis for caching and session management
- Next.js React frontend with TypeScript
- Docker Compose for local development
- Monorepo structure with npm workspaces

## [0.1.0] - 2024-08-25

### Added
- Initial beta release
- Core prompt management functionality
- Basic A/B testing capabilities
- TypeScript SDK
- React dashboard
- Docker support