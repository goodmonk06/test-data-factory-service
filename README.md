# Test Data Factory Service

A central service to define and apply reusable test data scenarios to different databases or APIs.

## Overview

Test Data Factory Service provides a structured way to create, manage, and execute test data scenarios. It supports both database operations (PostgreSQL) and HTTP API testing, with a powerful template variable system for data chaining across steps.

Perfect for:
- **QA Teams**: Quickly set up consistent test environments
- **Developers**: Seed databases with realistic data for local development
- **CI/CD Pipelines**: Automate test data provisioning
- **Demo Environments**: Create reproducible demo scenarios

## Tech Stack

- **Backend**: Fastify + TypeScript
- **Database**: Prisma ORM + PostgreSQL
- **Adapters**: PostgreSQL (via pg) and HTTP API (via fetch)
- **CLI**: Commander.js
- **Testing**: Vitest with 24 test cases
- **Deployment**: Docker + Docker Compose

## Domain Model

### Core Entities

**Scenario**
- Represents a test data scenario with a sequence of operations
- Fields: `id`, `name`, `description`, `targetType` (DB/API), `targetConfigJson`, `stepsJson`
- Can target either a database or an HTTP API
- Supports template variables for dynamic data (`{{variable.path}}`)

**ScenarioRun**
- Tracks each execution of a scenario
- Fields: `id`, `scenarioId`, `startedAt`, `finishedAt`, `status`, `logText`
- Status: `RUNNING`, `SUCCESS`, or `FAILED`
- Stores complete execution logs for debugging

### Relationships

- One Scenario has many ScenarioRuns (one-to-many)
- ScenarioRuns cascade delete when Scenario is deleted

## Getting Started

### Requirements

- Node.js 18 or higher
- Docker and Docker Compose
- PostgreSQL 16 (via Docker)

### Setup Steps

#### Option 1: Docker Compose (Recommended)

```bash
# 1. Clone and navigate
git clone <repository-url>
cd test-data-factory-service

# 2. Copy environment file
cp .env.example .env

# 3. Install dependencies
npm install

# 4. Start all services (PostgreSQL + App)
docker compose up -d

# 5. Run migrations
npm run db:migrate

# 6. Seed example scenarios (optional)
npm run db:seed
```

The API will be available at `http://localhost:3000`.

#### Option 2: Local Development

```bash
# 1. Clone and navigate
git clone <repository-url>
cd test-data-factory-service

# 2. Install dependencies
npm install

# 3. Start PostgreSQL only
docker compose up -d postgres

# 4. Generate Prisma client and run migrations
npm run prisma:generate
npm run db:migrate

# 5. Seed example scenarios (optional)
npm run db:seed

# 6. Start development server
npm run dev
```

The API will be available at `http://localhost:3000`.

### Quick Commands

```bash
# Development
npm run dev              # Start dev server with hot reload
npm run build            # Build for production
npm start                # Start production server

# Database
npm run db:migrate       # Run Prisma migrations
npm run db:push          # Push schema changes (dev only)
npm run db:seed          # Seed example scenarios
npm run prisma:studio    # Open Prisma Studio

# Testing
npm test                 # Run all tests
npm run test:watch       # Run tests in watch mode
npm run test:coverage    # Generate coverage report

# Code Quality
npm run lint             # Lint TypeScript files
npm run lint:fix         # Fix linting issues
npm run format           # Format code with Prettier

# CLI
npm run cli list         # List all scenarios
npm run cli run <name>   # Execute a scenario
npm run cli history <name> --limit 10  # View execution history
npm run cli logs <runId> # View run logs
```

## Example Flow: Vertical Slice

Here's a complete end-to-end workflow demonstrating the core features:

### 1. Create a Scenario

```bash
curl -X POST http://localhost:3000/scenarios \
  -H "Content-Type: application/json" \
  -d '{
    "name": "demo-saas-tenant",
    "description": "Create a demo SaaS tenant with users",
    "targetType": "DB",
    "targetConfigJson": {
      "connectionString": "postgresql://postgres:postgres@localhost:5432/test_db"
    },
    "stepsJson": [
      {
        "type": "db:insert",
        "table": "tenants",
        "values": {
          "id": "tenant-001",
          "name": "Acme Corp",
          "plan": "enterprise"
        }
      },
      {
        "type": "db:insert",
        "table": "users",
        "values": {
          "tenant_id": "{{tenants_last_insert.id}}",
          "email": "admin@acme.com",
          "name": "Admin User"
        }
      }
    ]
  }'
```

### 2. List All Scenarios

```bash
curl http://localhost:3000/scenarios
```

### 3. Get Scenario Details

```bash
curl http://localhost:3000/scenarios/<SCENARIO_ID>
```

### 4. Execute the Scenario

Via API:
```bash
curl -X POST http://localhost:3000/scenarios/<SCENARIO_ID>/execute
```

Via CLI:
```bash
npm run cli run demo-saas-tenant
```

### 5. View Execution History

```bash
curl http://localhost:3000/scenarios/<SCENARIO_ID>/runs
```

Or via CLI:
```bash
npm run cli history demo-saas-tenant
```

### 6. Check Execution Logs

```bash
curl http://localhost:3000/runs/<RUN_ID>
```

Or via CLI:
```bash
npm run cli logs <RUN_ID>
```

## Scenario Examples

### Example 1: Creating a Demo Tenant (Database)

Creates a complete demo tenant with users and projects:

```json
{
  "name": "create-demo-saas-tenant",
  "description": "Creates a full demo tenant with users and projects",
  "targetType": "DB",
  "targetConfigJson": {
    "connectionString": "postgresql://user:password@localhost:5432/saas_db"
  },
  "stepsJson": [
    {
      "type": "db:insert",
      "table": "tenants",
      "values": {
        "id": "demo-tenant-001",
        "name": "Acme Corporation",
        "plan": "enterprise",
        "status": "active"
      }
    },
    {
      "type": "db:insert",
      "table": "users",
      "values": {
        "tenant_id": "{{tenants_last_insert.id}}",
        "email": "admin@acme.com",
        "name": "Admin User",
        "role": "admin"
      }
    },
    {
      "type": "db:insert",
      "table": "projects",
      "values": {
        "tenant_id": "{{tenants_last_insert.id}}",
        "owner_id": "{{users_last_insert.id}}",
        "name": "Website Redesign"
      }
    }
  ]
}
```

### Example 2: API Integration Test

Tests user registration and authentication flow:

```json
{
  "name": "api-user-registration-flow",
  "description": "Tests complete user registration via API",
  "targetType": "API",
  "targetConfigJson": {
    "baseUrl": "https://api.example.com",
    "headers": {
      "X-API-Key": "test-api-key-123"
    }
  },
  "stepsJson": [
    {
      "type": "api:request",
      "method": "POST",
      "path": "/v1/auth/register",
      "body": {
        "email": "testuser@example.com",
        "password": "SecurePass123!",
        "name": "Test User"
      }
    },
    {
      "type": "api:request",
      "method": "GET",
      "path": "/v1/user/profile",
      "headers": {
        "Authorization": "Bearer {{last_response.data.token}}"
      }
    }
  ]
}
```

### Example 3: Welfare Facility Resident Data

Generates realistic data for healthcare/welfare systems:

```json
{
  "name": "create-welfare-facility-residents",
  "description": "Generates realistic resident data for welfare-facility-erp-suite",
  "targetType": "DB",
  "targetConfigJson": {
    "connectionString": "postgresql://user:password@localhost:5432/welfare_erp"
  },
  "stepsJson": [
    {
      "type": "db:insert",
      "table": "facilities",
      "values": {
        "id": "facility-001",
        "name": "Sunrise Senior Living",
        "capacity": 50,
        "facility_type": "assisted_living"
      }
    },
    {
      "type": "db:insert",
      "table": "residents",
      "values": {
        "facility_id": "{{facilities_last_insert.id}}",
        "first_name": "Margaret",
        "last_name": "Smith",
        "date_of_birth": "1945-03-15",
        "room_number": "101A",
        "care_level": "level_2"
      }
    },
    {
      "type": "db:insert",
      "table": "care_plans",
      "values": {
        "resident_id": "{{residents_last_insert.id}}",
        "plan_type": "comprehensive",
        "mobility_assistance": true,
        "medication_management": true
      }
    }
  ]
}
```

## Architecture

```
src/
├── adapters/           # Execution adapters
│   ├── db-adapter.ts   # PostgreSQL operations (insert/update/delete)
│   └── api-adapter.ts  # HTTP API requests
├── routes/             # Fastify routes
│   └── scenarios.ts    # Scenario CRUD + execution endpoints
├── types/              # TypeScript type definitions
│   └── index.ts        # Shared types and interfaces
├── utils/              # Utilities
│   ├── db.ts           # Prisma client and connection
│   ├── executor.ts     # Scenario execution engine
│   └── error-handler.ts # Centralized error handling
├── cli.ts              # CLI tool
└── server.ts           # Fastify server entry point

prisma/
├── schema.prisma       # Database schema
└── migrations/         # Database migrations

tests/
└── **/__tests__/       # Vitest test files (24 tests)
```

## Template Variables

The service supports powerful template variables for chaining data across steps:

### Database Operations

After each `db:insert`, the inserted row is stored as `{{table_name_last_insert.*}}`:

```json
{
  "type": "db:insert",
  "table": "users",
  "values": { "email": "test@example.com" }
}
// Result available as: {{users_last_insert.id}}, {{users_last_insert.email}}, etc.
```

### API Operations

After each API request, the response is stored as `{{last_response.*}}`:

```json
{
  "type": "api:request",
  "method": "POST",
  "path": "/auth/login",
  "body": { "email": "test@example.com" }
}
// Response available as: {{last_response.data.token}}, {{last_response.status}}, etc.
```

### Nested Paths

Variables support nested object access:

```
{{users_last_insert.profile.address.city}}
{{last_response.data.user.settings.theme}}
```

## Testing

The project includes comprehensive test coverage:

```bash
# Run all tests (24 tests)
npm test

# Run tests in watch mode
npm run test:watch

# Generate coverage report
npm run test:coverage
```

Test categories:
- **Adapter Tests**: Variable interpolation, URL building, value resolution
- **Type Tests**: Scenario structure validation, step type checking
- **Integration Tests**: End-to-end scenario workflows

## Docker Deployment

### Full Stack

```bash
# Start PostgreSQL + App
docker compose up -d

# View logs
docker compose logs -f app

# Stop all services
docker compose down
```

### Production Build

```bash
# Build the Docker image
docker build -t test-data-factory-service .

# Run container
docker run -p 3000:3000 \
  -e DATABASE_URL="postgresql://..." \
  test-data-factory-service
```

## Future Extensions

### Planned Features

1. **Additional Adapters**
   - MongoDB support
   - Redis operations
   - GraphQL API testing
   - gRPC support

2. **Enhanced Templating**
   - Faker.js integration for realistic data generation
   - Custom functions (e.g., `{{uuid()}}`, `{{timestamp()}}`)
   - Conditional steps based on previous results

3. **Orchestration**
   - Parallel step execution
   - Rollback/cleanup steps
   - Scenario dependencies and composition
   - Scheduled scenario runs

4. **UI Dashboard**
   - Web-based scenario editor
   - Visual step builder
   - Real-time execution monitoring
   - Historical analytics and reporting

5. **Advanced Features**
   - Scenario versioning
   - Environment-specific configurations
   - Shared scenario library
   - Export/import scenarios as YAML

6. **Integration**
   - CI/CD plugins (GitHub Actions, GitLab CI)
   - Webhook notifications
   - Slack/Discord integration
   - OpenAPI spec import

## API Documentation

### Health Check

```
GET /health
Response: { "status": "ok", "timestamp": "2024-11-18T..." }
```

### Scenarios

```
GET    /scenarios           # List all scenarios
POST   /scenarios           # Create scenario
GET    /scenarios/:id       # Get scenario details
PUT    /scenarios/:id       # Update scenario
DELETE /scenarios/:id       # Delete scenario
POST   /scenarios/:id/execute  # Execute scenario
GET    /scenarios/:id/runs  # Get execution history
```

### Runs

```
GET    /runs/:id            # Get run details with logs
```

## Contributing

Contributions are welcome! Please ensure:
- All tests pass (`npm test`)
- Code is linted (`npm run lint`)
- TypeScript compiles (`npm run build`)

## License

MIT

---

**Quick Links:**
- [Getting Started](#getting-started)
- [Example Flow](#example-flow-vertical-slice)
- [Scenario Examples](#scenario-examples)
- [API Documentation](#api-documentation)
- [Quick Start Guide](./QUICKSTART.md)
