# Test Data Factory Service

A central service to define and apply reusable test data scenarios to different databases or APIs.

## Features

- **Scenario Definition**: Define reusable test data scenarios with sequences of operations
- **Multiple Adapters**: Support for PostgreSQL databases and HTTP APIs
- **CLI Tool**: Execute scenarios from the command line
- **REST API**: Manage scenarios via HTTP endpoints
- **Execution History**: Track all scenario runs with detailed logs
- **Template Variables**: Use dynamic values across steps with `{{variable}}` syntax

## Tech Stack

- **Backend**: Fastify + TypeScript
- **Database**: Prisma + PostgreSQL
- **Adapters**: PostgreSQL and HTTP API
- **CLI**: Commander.js

## Getting Started

### Prerequisites

- Node.js 18+
- Docker and Docker Compose (for PostgreSQL)

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd test-data-factory-service
```

2. Install dependencies:
```bash
npm install
```

3. Start PostgreSQL:
```bash
docker-compose up -d
```

4. Set up the database:
```bash
npm run prisma:generate
npm run prisma:migrate
```

5. Start the server:
```bash
npm run dev
```

The server will be running at `http://localhost:3000`.

## Usage

### CLI Commands

#### List all scenarios
```bash
npm run cli list
```

#### Run a scenario
```bash
npm run cli run <scenarioName> --env test
```

#### View execution history
```bash
npm run cli history <scenarioName> --limit 10
```

#### View logs for a run
```bash
npm run cli logs <runId>
```

### API Endpoints

#### Scenarios

- `GET /scenarios` - List all scenarios
- `GET /scenarios/:id` - Get scenario by ID
- `POST /scenarios` - Create a new scenario
- `PUT /scenarios/:id` - Update a scenario
- `DELETE /scenarios/:id` - Delete a scenario
- `POST /scenarios/:id/execute` - Execute a scenario
- `GET /scenarios/:id/runs` - Get execution history for a scenario

#### Runs

- `GET /runs/:id` - Get run details with logs

## Scenario Examples

### Example 1: Creating a Demo Tenant in a SaaS Application

This scenario creates a complete demo tenant with users, projects, and sample data.

```json
{
  "name": "create-demo-saas-tenant",
  "description": "Creates a full demo tenant with users and projects for SaaS demo",
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
        "status": "active",
        "created_at": "2024-01-01T00:00:00Z"
      }
    },
    {
      "type": "db:insert",
      "table": "users",
      "values": {
        "id": "user-admin-001",
        "tenant_id": "demo-tenant-001",
        "email": "admin@acme.com",
        "name": "Admin User",
        "role": "admin",
        "created_at": "2024-01-01T00:00:00Z"
      }
    },
    {
      "type": "db:insert",
      "table": "users",
      "values": {
        "id": "user-member-001",
        "tenant_id": "demo-tenant-001",
        "email": "john@acme.com",
        "name": "John Doe",
        "role": "member",
        "created_at": "2024-01-02T00:00:00Z"
      }
    },
    {
      "type": "db:insert",
      "table": "projects",
      "values": {
        "id": "project-001",
        "tenant_id": "demo-tenant-001",
        "name": "Website Redesign",
        "description": "Redesign company website",
        "owner_id": "user-admin-001",
        "status": "in_progress",
        "created_at": "2024-01-05T00:00:00Z"
      }
    },
    {
      "type": "db:insert",
      "table": "tasks",
      "values": {
        "id": "task-001",
        "project_id": "project-001",
        "title": "Design homepage mockup",
        "assigned_to": "user-member-001",
        "status": "completed",
        "created_at": "2024-01-06T00:00:00Z"
      }
    },
    {
      "type": "db:insert",
      "table": "tasks",
      "values": {
        "id": "task-002",
        "project_id": "project-001",
        "title": "Implement responsive layout",
        "assigned_to": "user-member-001",
        "status": "in_progress",
        "created_at": "2024-01-07T00:00:00Z"
      }
    }
  ]
}
```

### Example 2: Generating Realistic Resident Data for Welfare Facility ERP

This scenario creates realistic resident and care plan data for a welfare facility management system.

```json
{
  "name": "create-welfare-facility-residents",
  "description": "Generates realistic resident data for welfare-facility-erp-suite testing",
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
        "address": "123 Care Street, Springfield",
        "capacity": 50,
        "facility_type": "assisted_living",
        "license_number": "FL-2024-001",
        "created_at": "2024-01-01T00:00:00Z"
      }
    },
    {
      "type": "db:insert",
      "table": "residents",
      "values": {
        "id": "resident-001",
        "facility_id": "facility-001",
        "first_name": "Margaret",
        "last_name": "Smith",
        "date_of_birth": "1945-03-15",
        "admission_date": "2024-01-15",
        "room_number": "101A",
        "care_level": "level_2",
        "medical_record_number": "MRN-2024-001",
        "emergency_contact_name": "Robert Smith",
        "emergency_contact_phone": "555-0101",
        "emergency_contact_relation": "Son"
      }
    },
    {
      "type": "db:insert",
      "table": "care_plans",
      "values": {
        "id": "care-plan-001",
        "resident_id": "resident-001",
        "plan_type": "comprehensive",
        "created_by": "staff-001",
        "created_at": "2024-01-16T00:00:00Z",
        "review_date": "2024-04-16",
        "mobility_assistance": true,
        "medication_management": true,
        "dietary_restrictions": "Low sodium, diabetic-friendly",
        "activities_of_daily_living": "Requires assistance with bathing and dressing"
      }
    },
    {
      "type": "db:insert",
      "table": "medications",
      "values": {
        "id": "med-001",
        "resident_id": "resident-001",
        "medication_name": "Metformin",
        "dosage": "500mg",
        "frequency": "twice_daily",
        "prescribed_by": "Dr. Johnson",
        "start_date": "2024-01-16",
        "instructions": "Take with meals"
      }
    },
    {
      "type": "db:insert",
      "table": "residents",
      "values": {
        "id": "resident-002",
        "facility_id": "facility-001",
        "first_name": "James",
        "last_name": "Wilson",
        "date_of_birth": "1938-07-22",
        "admission_date": "2024-02-01",
        "room_number": "102B",
        "care_level": "level_3",
        "medical_record_number": "MRN-2024-002",
        "emergency_contact_name": "Sarah Wilson",
        "emergency_contact_phone": "555-0202",
        "emergency_contact_relation": "Daughter"
      }
    },
    {
      "type": "db:insert",
      "table": "care_plans",
      "values": {
        "id": "care-plan-002",
        "resident_id": "resident-002",
        "plan_type": "comprehensive",
        "created_by": "staff-002",
        "created_at": "2024-02-02T00:00:00Z",
        "review_date": "2024-05-02",
        "mobility_assistance": true,
        "medication_management": true,
        "cognitive_support": true,
        "dietary_restrictions": "Pureed diet",
        "activities_of_daily_living": "Total assistance required",
        "behavioral_notes": "Benefits from music therapy sessions"
      }
    },
    {
      "type": "db:insert",
      "table": "daily_activities",
      "values": {
        "id": "activity-001",
        "resident_id": "resident-002",
        "activity_type": "music_therapy",
        "scheduled_time": "2024-02-03T14:00:00Z",
        "duration_minutes": 45,
        "facilitator": "staff-003",
        "notes": "Participates well, appears relaxed"
      }
    }
  ]
}
```

### Example 3: API Integration Test Scenario

This scenario tests a user registration and onboarding flow via API.

```json
{
  "name": "api-user-registration-flow",
  "description": "Tests complete user registration and onboarding via API",
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
        "name": "Test User",
        "company": "Test Company"
      }
    },
    {
      "type": "api:request",
      "method": "POST",
      "path": "/v1/auth/verify-email",
      "body": {
        "email": "testuser@example.com",
        "code": "123456"
      }
    },
    {
      "type": "api:request",
      "method": "POST",
      "path": "/v1/onboarding/profile",
      "headers": {
        "Authorization": "Bearer {{last_response.data.token}}"
      },
      "body": {
        "role": "developer",
        "team_size": "1-10",
        "use_case": "testing"
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

### Example 4: Using Template Variables

Template variables allow you to reference data from previous steps:

```json
{
  "name": "create-order-with-items",
  "description": "Creates an order and references the inserted ID in subsequent steps",
  "targetType": "DB",
  "targetConfigJson": {
    "connectionString": "postgresql://user:password@localhost:5432/shop_db"
  },
  "stepsJson": [
    {
      "type": "db:insert",
      "table": "orders",
      "values": {
        "customer_id": "cust-123",
        "status": "pending",
        "total": 0,
        "created_at": "2024-01-01T00:00:00Z"
      }
    },
    {
      "type": "db:insert",
      "table": "order_items",
      "values": {
        "order_id": "{{orders_last_insert.id}}",
        "product_id": "prod-001",
        "quantity": 2,
        "price": 29.99
      }
    },
    {
      "type": "db:insert",
      "table": "order_items",
      "values": {
        "order_id": "{{orders_last_insert.id}}",
        "product_id": "prod-002",
        "quantity": 1,
        "price": 49.99
      }
    },
    {
      "type": "db:update",
      "table": "orders",
      "where": {
        "id": "{{orders_last_insert.id}}"
      },
      "values": {
        "total": 109.97
      }
    }
  ]
}
```

## Creating Scenarios via API

You can create scenarios programmatically via the REST API:

```bash
curl -X POST http://localhost:3000/scenarios \
  -H "Content-Type: application/json" \
  -d '{
    "name": "my-test-scenario",
    "description": "My test scenario",
    "targetType": "DB",
    "targetConfigJson": {
      "connectionString": "postgresql://user:password@localhost:5432/mydb"
    },
    "stepsJson": [
      {
        "type": "db:insert",
        "table": "users",
        "values": {
          "email": "test@example.com",
          "name": "Test User"
        }
      }
    ]
  }'
```

## Development

### Build the project
```bash
npm run build
```

### Run tests
```bash
npm test
```

### View Prisma Studio
```bash
npm run prisma:studio
```

## Architecture

```
src/
├── adapters/
│   ├── db-adapter.ts      # PostgreSQL adapter
│   └── api-adapter.ts     # HTTP API adapter
├── routes/
│   └── scenarios.ts       # Fastify routes
├── types/
│   └── index.ts          # TypeScript type definitions
├── utils/
│   ├── db.ts             # Prisma client
│   └── executor.ts       # Scenario execution engine
├── cli.ts                # CLI tool
└── server.ts             # Fastify server
```

## License

MIT
