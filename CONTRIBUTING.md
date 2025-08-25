# Contributing to Flowtie

We love your input! We want to make contributing to Flowtie as easy and transparent as possible, whether it's:

- Reporting a bug
- Discussing the current state of the code
- Submitting a fix
- Proposing new features
- Becoming a maintainer

## Development Process

We use GitHub to host code, to track issues and feature requests, as well as accept pull requests.

### Pull Requests

1. Fork the repo and create your branch from `main`
2. If you've added code that should be tested, add tests
3. If you've changed APIs, update the documentation
4. Ensure the test suite passes
5. Make sure your code lints
6. Issue that pull request!

### Development Setup

1. **Prerequisites:**
   - Node.js 18+ 
   - Docker and Docker Compose
   - Git

2. **Clone and setup:**
   ```bash
   git clone https://github.com/your-username/flowtie.git
   cd flowtie
   npm install
   ```

3. **Start development environment:**
   ```bash
   # Using Make (recommended)
   make dev
   
   # Or using docker-compose directly
   docker-compose -f docker-compose.yml -f docker-compose.dev.yml up -d
   ```

4. **Run tests:**
   ```bash
   npm test
   ```

5. **Access services:**
   - Dashboard: http://localhost:3000
   - API: http://localhost:3001
   - Database: localhost:5432

### Code Style

We use ESLint and Prettier to maintain consistent code style:

```bash
# Check linting
npm run lint

# Auto-fix linting issues
npm run lint:fix

# Format code with Prettier
npm run format
```

### Project Structure

```
flowtie/
├── packages/
│   ├── api/          # Node.js backend API
│   ├── dashboard/    # React frontend dashboard
│   ├── sdk-js/       # JavaScript/TypeScript SDK
│   └── sdk-python/   # Python SDK (future)
├── examples/         # Usage examples
├── docs/            # Documentation
└── docker/          # Docker configurations
```

## Bug Reports

We use GitHub issues to track public bugs. Report a bug by [opening a new issue](https://github.com/your-org/flowtie/issues/new).

**Great Bug Reports** include:

- A quick summary and/or background
- Steps to reproduce
  - Be specific!
  - Give sample code if you can
- What you expected would happen
- What actually happens
- Notes (possibly including why you think this might be happening, or stuff you tried that didn't work)

## Feature Requests

We welcome feature requests! Please:

1. Check if the feature already exists or is planned
2. Open an issue with the `feature-request` label
3. Describe the problem you're solving
4. Explain your proposed solution
5. Consider if this should be a core feature or an extension

## Coding Guidelines

### TypeScript
- Use TypeScript for all new code
- Define proper types and interfaces
- Avoid `any` unless absolutely necessary

### React/Next.js (Dashboard)
- Use functional components with hooks
- Follow the existing component structure
- Use TypeScript for all components

### Node.js (API)
- Use Express.js patterns
- Implement proper error handling
- Add appropriate logging

### Database
- Use Prisma for database operations
- Create migrations for schema changes
- Follow naming conventions

### Testing
- Write tests for new features
- Maintain existing test coverage
- Use Jest for testing

### Documentation
- Update README for significant changes
- Add inline code comments for complex logic
- Update API documentation when needed

## Commit Convention

We follow [Conventional Commits](https://www.conventionalcommits.org/):

```
type(scope): description

feat(api): add prompt versioning endpoint
fix(dashboard): resolve A/B test creation bug
docs(readme): update installation instructions
refactor(sdk): improve error handling
test(api): add integration tests for auth
```

Types: `feat`, `fix`, `docs`, `style`, `refactor`, `test`, `chore`

## Release Process

1. Version bumps follow [Semantic Versioning](https://semver.org/)
2. Changelog is automatically generated from commits
3. Releases are tagged and published automatically
4. Docker images are built and pushed on release

## Community

- Be respectful and inclusive
- Help others learn and grow
- Share knowledge and best practices
- Follow our [Code of Conduct](CODE_OF_CONDUCT.md)

## Questions?

Feel free to open an issue with the `question` label or join our community discussions.

Thank you for contributing! 🚀