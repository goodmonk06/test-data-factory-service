# Architecture Overview

This document describes the system architecture, design patterns, and technical decisions behind the Test Data Factory Service.

## System Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                         Client Layer                             │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐        │
│  │   CLI    │  │ REST API │  │   UI     │  │ Scheduler │        │
│  └─────┬────┘  └────┬─────┘  └────┬─────┘  └────┬─────┘        │
└────────┼────────────┼─────────────┼─────────────┼───────────────┘
         │            │             │             │
┌────────┼────────────┼─────────────┼─────────────┼───────────────┐
│        │            │             │             │                │
│        └────────────┴─────────────┴─────────────┘                │
│                         │                                        │
│                   Fastify Server                                 │
│                         │                                        │
│        ┌────────────────┴────────────────┐                       │
│        │                                 │                       │
│   ┌────▼─────┐                    ┌─────▼────┐                  │
│   │  Routes  │                    │ Services │                  │
│   └────┬─────┘                    └─────┬────┘                  │
│        │                                 │                       │
│   ┌────▼────────────────────────────────▼────┐                  │
│   │         Execution Engine                 │                  │
│   │  ┌────────────┐  ┌───────────────────┐  │                  │
│   │  │  Executor  │  │  Event Bus        │  │                  │
│   │  └─────┬──────┘  └───────┬───────────┘  │                  │
│   │        │                  │              │                  │
│   │  ┌─────▼──────┐  ┌────────▼────────┐    │                  │
│   │  │  Adapters  │  │  Event Handlers │    │                  │
│   │  │  - DB      │  │  - Metrics      │    │                  │
│   │  │  - API     │  │  - Notification │    │                  │
│   │  └─────┬──────┘  └─────────────────┘    │                  │
│   └────────┼─────────────────────────────────┘                  │
│            │                                                     │
│   ┌────────▼────────────┐                                       │
│   │   Prisma ORM        │                                       │
│   └────────┬────────────┘                                       │
└────────────┼──────────────────────────────────────────────────┘
             │
     ┌───────▼────────┐
     │   PostgreSQL    │
     └────────────────┘
```

## Layered Architecture

### 1. Presentation Layer
- **REST API** (Fastify): HTTP endpoints for CRUD operations
- **CLI Tool** (Commander): Command-line interface for operators
- **Future**: Web UI dashboard

### 2. Application Layer
- **Routes** (`src/routes`): HTTP request handling and validation
- **Services** (`src/services`): Business logic orchestration
- **CLI Commands** (`src/cli.ts`): Command-line operations

### 3. Domain Layer
- **Execution Engine** (`src/utils/executor.ts`): Core scenario execution logic
- **Adapters** (`src/adapters`): Database and API operations
- **Types** (`src/types`): Domain models and interfaces
- **Events** (`src/lib/events`): Domain event system

### 4. Infrastructure Layer
- **Database** (Prisma + PostgreSQL): Data persistence
- **Metrics** (`src/lib/adapters/metrics-adapter.ts`): Observability
- **Notifications** (`src/lib/adapters/notification-adapter.ts`): Alerting
- **Logging**: Structured application logging

## Core Components

### Scenario Execution Engine

The execution engine is the heart of the system. It:
1. Loads a scenario from the database
2. Initializes the appropriate adapter (DB or API)
3. Executes each step sequentially
4. Maintains an execution context with variables
5. Logs every operation
6. Emits domain events
7. Records execution metrics
8. Persists the run result

```typescript
// Simplified execution flow
async execute(scenario: Scenario) {
  const run = await createRun(scenario);
  const context = { variables: {}, log: [] };
  const adapter = createAdapter(scenario.targetType);

  for (const step of scenario.steps) {
    await adapter.executeStep(step, context);
  }

  await finalizeRun(run, context);
  await emitEvent('scenario.execution.completed', { scenario, run });
}
```

### Adapter Pattern

Adapters provide a unified interface for different target systems:

- **DBAdapter**: Executes SQL operations (INSERT, UPDATE, DELETE)
- **APIAdapter**: Makes HTTP requests (GET, POST, PUT, DELETE)
- **Future**: MongoDBAdapter, RedisAdapter, GraphQLAdapter

Each adapter:
- Implements step execution
- Handles template variable interpolation
- Manages connections/sessions
- Provides error context

### Event System

The event bus enables loose coupling and extensibility:

```typescript
// Event emission
eventBus.emit('scenario.created', { scenario });

// Event handling
eventBus.on('scenario.execution.completed', async (event) => {
  await metrics.recordTimer('scenario.duration', event.payload.duration);
  await notification.sendExecutionAlert(event.payload.run, event.payload.scenario);
});
```

Key events:
- `scenario.created`, `scenario.updated`, `scenario.deleted`
- `scenario.execution.started`, `scenario.execution.completed`, `scenario.execution.failed`
- `template.created`, `template.instantiated`
- `environment.created`, `datasource.created`

### Template System (Phase 3)

Templates enable reusable scenario patterns:

1. **Template Definition**: Scenario structure with parameter placeholders
2. **Parameter Schema**: JSON Schema defining required/optional parameters
3. **Instantiation**: Bind parameters to create concrete scenarios
4. **Versioning**: Track template evolution over time

### Environment Management (Phase 3)

Environments isolate configuration by deployment stage:

- **Variables**: Environment-specific values (URLs, credentials, etc.)
- **Priority**: Ordering for promotion workflows (dev → staging → prod)
- **Activation**: Enable/disable environments dynamically

### Data Source Registry (Phase 3)

Centralized management of connection targets:

- **Type-Based**: PostgreSQL, MySQL, MongoDB, Redis, HTTP APIs
- **Connection Config**: Encrypted credentials and connection strings
- **Health Checks**: Periodic testing of connectivity
- **Reference by Name**: Scenarios reference sources instead of embedding credentials

## Data Flow

### Scenario Creation Flow
```
User → POST /scenarios → Validation → Prisma → PostgreSQL
                              ↓
                         Event Bus
                              ↓
                    Event Handlers (metrics, notifications)
```

### Scenario Execution Flow
```
User → POST /scenarios/:id/execute
  ↓
Load Scenario (with template/environment/datasource)
  ↓
Create ScenarioRun (status: RUNNING)
  ↓
Initialize Adapter (DB or API)
  ↓
For Each Step:
  - Interpolate Variables
  - Execute Operation
  - Store Results in Context
  - Log Progress
  ↓
Update ScenarioRun (status: SUCCESS/FAILED, duration, logs)
  ↓
Emit Events
  ↓
Send Notifications
  ↓
Return Result
```

## Design Patterns

### 1. Repository Pattern
- Prisma acts as the data access layer
- Services encapsulate business logic
- Clear separation between data and logic

### 2. Strategy Pattern
- Adapter interface with multiple implementations
- Runtime selection based on target type
- Easy to add new adapters

### 3. Observer Pattern
- Event bus for publish/subscribe
- Decoupled event producers and consumers
- Extensible without modifying core logic

### 4. Template Method Pattern
- Executor defines execution skeleton
- Adapters implement specific steps
- Consistent execution flow

### 5. Adapter Pattern
- Unified interface for heterogeneous systems
- DB and API adapters with common contract
- Simplifies adding new target types

## Technology Stack

### Backend
- **Runtime**: Node.js 20+ (LTS)
- **Language**: TypeScript 5.6+ (strict mode)
- **Framework**: Fastify 5.1+ (high performance)
- **ORM**: Prisma 5.22+ (type-safe queries)

### Database
- **Primary**: PostgreSQL 16+ (JSONB, full-text search)
- **Connection Pooling**: pg driver with pooling
- **Migrations**: Prisma Migrate

### Testing
- **Framework**: Vitest 2.1+ (fast, ESM-native)
- **Coverage**: v8 (built-in V8 coverage)
- **Mocking**: Vitest built-in mocks

### DevOps
- **Containerization**: Docker + Docker Compose
- **CI/CD**: Compatible with GitHub Actions, GitLab CI
- **Monitoring**: Metrics adapters (Prometheus-compatible)

## Security Considerations

### Current (Phase 2-3)
- ✅ Input validation with Zod
- ✅ SQL injection prevention via Prisma
- ✅ CORS configuration
- ✅ Error message sanitization
- ⚠️ No authentication (add in Phase 4)
- ⚠️ No authorization (add in Phase 4)
- ⚠️ Credentials stored unencrypted (encrypt in Phase 4)

### Planned (Phase 4+)
- API key authentication
- Role-based access control (RBAC)
- Credential encryption at rest
- Audit logging
- Rate limiting
- HTTPS enforcement

## Scalability

### Current Capacity
- **Scenarios**: Thousands (limited by PostgreSQL)
- **Concurrent Executions**: ~10-50 (single instance)
- **Step Throughput**: ~100-1000 steps/second

### Scaling Strategies
1. **Horizontal**: Multiple service instances behind load balancer
2. **Database**: Read replicas for query load
3. **Execution**: Async job queue (Bull, BullMQ)
4. **Caching**: Redis for frequently accessed scenarios

### Performance Optimizations
- Connection pooling (DB and HTTP)
- Lazy loading of related entities
- Indexed queries (scenario filters)
- Batch operations (future)

## Extensibility Points

### Adding New Adapters
1. Implement adapter interface (`IAdapter`)
2. Register in adapter factory
3. Add target type enum value
4. Write adapter-specific tests

### Adding New Event Handlers
```typescript
eventBus.on('scenario.execution.completed', async (event) => {
  // Custom logic here
});
```

### Adding New Validation Rules
1. Implement `IValidationAdapter`
2. Register validator
3. Call during scenario creation/execution

### Adding New Metrics
```typescript
metrics.recordTimer('custom.operation', duration, { label: 'value' });
metrics.recordCounter('custom.count', 1, { type: 'success' });
```

## Future Architecture

### Phase 4+ Enhancements
- **Multi-Tenancy**: Organization/workspace isolation
- **Plugin System**: Dynamic plugin loading
- **Distributed Execution**: Kubernetes-based execution
- **Real-time UI**: WebSocket updates for executions
- **GraphQL API**: Alternative to REST
- **Workflow Engine**: Complex scenario orchestration

### Planned Integrations
- **CI/CD**: GitHub Actions, GitLab CI plugins
- **Monitoring**: Prometheus, Grafana, DataDog
- **Notifications**: Slack, Discord, email, webhooks
- **Authentication**: OAuth2, SAML, Auth0
- **Storage**: S3, GCS for execution artifacts

## Development Guidelines

### Adding Features
1. Design domain model first
2. Create Prisma migration
3. Define TypeScript types
4. Implement service logic
5. Add API routes
6. Write tests (TDD encouraged)
7. Update documentation

### Code Organization
```
src/
├── adapters/      # Target system adapters
├── lib/          # Shared libraries (events, metrics)
├── routes/       # HTTP endpoints
├── services/     # Business logic
├── types/        # TypeScript definitions
├── utils/        # Utilities (executor, db)
├── cli.ts        # CLI entry point
└── server.ts     # Server entry point
```

### Testing Strategy
- **Unit Tests**: Pure functions, adapters
- **Integration Tests**: API endpoints, database
- **E2E Tests**: Full scenario execution flows
- **Performance Tests**: Load testing, benchmarks

---

**Last Updated**: 2024-11-18 (Phase 3 Initial Release)
