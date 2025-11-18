# Quick Start Guide

Get the Test Data Factory Service up and running in 5 minutes!

## Prerequisites

- Node.js 18+ installed
- Docker and Docker Compose installed

## Setup Steps

### 1. Install Dependencies

```bash
npm install
```

### 2. Start PostgreSQL

```bash
docker-compose up -d
```

Wait a few seconds for PostgreSQL to be ready.

### 3. Set Up Database

```bash
npm run prisma:generate
npm run prisma:migrate
```

When prompted for a migration name, you can use `init` or press Enter.

### 4. Seed Example Scenarios (Optional)

```bash
npm run seed
```

This creates three example scenarios:
- `create-demo-saas-tenant` - Demo SaaS tenant setup
- `create-welfare-facility-residents` - Welfare facility test data
- `api-user-registration-flow` - API integration test

### 5. Start the Server

```bash
npm run dev
```

The server will start at `http://localhost:3000`.

## Try It Out!

### Using the CLI

List available scenarios:
```bash
npm run cli list
```

Run a scenario:
```bash
npm run cli run create-demo-saas-tenant
```

View execution history:
```bash
npm run cli history create-demo-saas-tenant
```

### Using the API

List all scenarios:
```bash
curl http://localhost:3000/scenarios
```

Create a new scenario:
```bash
curl -X POST http://localhost:3000/scenarios \
  -H "Content-Type: application/json" \
  -d '{
    "name": "my-first-scenario",
    "description": "A simple test scenario",
    "targetType": "DB",
    "targetConfigJson": {
      "connectionString": "postgresql://postgres:postgres@localhost:5432/test_db?schema=public"
    },
    "stepsJson": [
      {
        "type": "db:insert",
        "table": "users",
        "values": {
          "id": "user-001",
          "email": "test@example.com",
          "name": "Test User"
        }
      }
    ]
  }'
```

Execute a scenario by ID:
```bash
curl -X POST http://localhost:3000/scenarios/<SCENARIO_ID>/execute
```

## What's Next?

1. Check out the [README.md](README.md) for detailed examples
2. Explore the API at `http://localhost:3000/scenarios`
3. Use Prisma Studio to view your database: `npm run prisma:studio`
4. Create your own custom scenarios for your testing needs!

## Common Commands

Using Make:
```bash
make help        # Show all available commands
make setup       # Complete setup (Docker + Prisma)
make start       # Start PostgreSQL
make dev         # Start development server
make stop        # Stop PostgreSQL
```

Using npm:
```bash
npm run dev              # Start development server
npm run build            # Build for production
npm start                # Start production server
npm run cli list         # List scenarios
npm run seed             # Seed example scenarios
npm run prisma:studio    # Open Prisma Studio
```

## Troubleshooting

**PostgreSQL connection issues:**
- Make sure Docker is running: `docker ps`
- Check PostgreSQL logs: `docker-compose logs postgres`
- Verify the port 5432 is not in use: `lsof -i :5432`

**Prisma errors:**
- Regenerate the client: `npm run prisma:generate`
- Reset the database: `npx prisma migrate reset`

**Build errors:**
- Clean and reinstall: `rm -rf node_modules dist && npm install`
- Rebuild: `npm run build`

## Support

For issues or questions, please check the [README.md](README.md) or open an issue on GitHub.
