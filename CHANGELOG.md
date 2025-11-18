# Changelog

All notable changes to the Test Data Factory Service will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Phase 3 Expansion (In Progress)

#### Added - Domain Model
- **ScenarioTemplate**: Parameterized, reusable scenario blueprints with variable definitions
- **Environment**: Named runtime environments (dev, staging, production) with configurations
- **DataSource**: Registry of database connections and API endpoints
- **Tag System**: Flexible tagging for organizing scenarios (Tag + ScenarioTagRelation models)
- **ScenarioSchedule**: Cron-based scheduling for automatic execution
- Enhanced Scenario with: `version`, `isArchived`, `metadata`, `lastExecutedAt`, `executionCount`, `successCount`
- Enhanced ScenarioRun with: `duration`, `errorDetails`, `environmentId`, `triggeredBy`, `scheduleId`

#### Added - Infrastructure
- **Event System**: Domain event bus with typed events and handler registration
- **Adapter Interfaces**: INotificationAdapter, IStorageAdapter, IValidationAdapter, IMetricsAdapter
- **Notification Adapters**: ConsoleNotificationAdapter, NoOpNotificationAdapter
- **Metrics Adapters**: InMemoryMetricsAdapter, ConsoleMetricsAdapter with statistical summaries
- Extended type system with 200+ lines of new TypeScript interfaces

#### Added - Database
- Phase 3 migration (20241118010000_phase3_expansion) with 5 new tables and enhanced indexes
- DataSourceType enum (POSTGRESQL, MYSQL, MONGODB, REDIS, HTTP_API, GRAPHQL_API, REST_API)
- Foreign key relationships between all Phase 3 entities
- Cascade delete rules for referential integrity

#### Added - Documentation
- `docs/PHASE3_OVERVIEW.md`: Comprehensive Phase 3 plan and implementation roadmap
- `CHANGELOG.md`: Version history and migration notes

#### Changed
- Prisma schema expanded from 2 models to 8 models
- Type definitions expanded from 75 lines to 300+ lines
- Added extensibility points for plugin development

## [1.0.0] - 2024-11-18

### Phase 2 - Production Ready

#### Added - Core Features
- Complete scenario CRUD operations (Create, Read, Update, Delete)
- Scenario execution engine with step-by-step processing
- Template variable interpolation with `{{variable.path}}` syntax
- Execution history tracking with detailed logs
- CLI tool with `list`, `run`, `history`, and `logs` commands

#### Added - Adapters
- PostgreSQL adapter for database operations (insert, update, delete)
- HTTP API adapter for RESTful API testing
- Dynamic variable resolution across steps

#### Added - Testing
- Vitest test framework setup
- 24 comprehensive tests covering adapters, types, and execution
- Test utilities for mocking and fixtures
- Coverage reporting configuration

#### Added - Infrastructure
- Dockerfile with multi-stage build for production
- docker-compose.yml with PostgreSQL + App services
- Health checks for all services
- .dockerignore for efficient builds

#### Added - Developer Experience
- Standardized npm scripts (dev, build, start, test, lint, db:migrate, db:seed)
- Enhanced Makefile with organized command groups
- ESLint configuration with TypeScript support
- Prettier for code formatting
- Centralized error handler for consistent API responses

#### Added - Documentation
- Comprehensive README with Phase 2 structure
- QUICKSTART.md for rapid setup
- Example scenarios for SaaS tenants, welfare facilities, and API testing
- Architecture diagrams and domain model explanation

#### Added - Database
- Initial migration (20241118000000_init)
- Scenario and ScenarioRun models
- TargetType and ScenarioRunStatus enums
- Proper indexes and foreign keys

## [0.1.0] - 2024-11-18

### Phase 1 - Initial Scaffold

#### Added
- Basic project structure with TypeScript
- Fastify server setup
- Prisma ORM configuration
- PostgreSQL database schema
- Basic scenario management endpoints
- Initial seed data script

---

## Migration Guide

### Upgrading to Phase 3

Phase 3 introduces new database tables and fields. To upgrade:

1. **Backup your database** before migrating
2. Run the Phase 3 migration:
   ```bash
   npm run db:migrate
   ```
3. The migration will:
   - Add new columns to existing `scenarios` and `scenario_runs` tables
   - Create 5 new tables: `scenario_templates`, `environments`, `data_sources`, `tags`, `scenario_schedules`, `scenario_tags`
   - Add new indexes for query performance

4. **Backwards Compatibility**: All existing scenarios and runs will continue to work. New fields have sensible defaults:
   - `version` defaults to 1
   - `isArchived` defaults to false
   - `executionCount` and `successCount` default to 0

5. **Optional**: Seed example Phase 3 data:
   ```bash
   npm run db:seed
   ```

### Breaking Changes

#### Phase 3
- None. Phase 3 is fully backwards compatible with Phase 2.

#### Phase 2
- None. Phase 2 builds on Phase 1 without breaking changes.

---

## Deprecation Notices

### Phase 3
- No deprecations in this release.

### Future Deprecations (Phase 4+)
- The `targetConfigJson` field may be replaced with `dataSourceId` reference in a future version
- Direct connection string embedding will be discouraged in favor of the data source registry

---

## Security Notes

### Phase 3
- DataSource `connectionConfig` field should store encrypted credentials
- Implement encryption before storing sensitive connection details
- Use environment-specific variables for production deployments

### Phase 2
- API endpoints have no authentication (add authentication in production)
- Database migrations should be reviewed before production use
- .env file should never be committed to version control

---

## Performance Notes

### Phase 3
- New indexes added for: `isArchived`, `templateId`, `environmentId`, `dataSourceId`, `status`, `startedAt`
- Metrics adapter includes p50, p95, p99 percentile calculations
- Event bus executes handlers asynchronously with error isolation

### Phase 2
- Connection pooling configured for PostgreSQL adapter
- Execution logs stored as TEXT for unlimited size
- Cascade deletes for data consistency

---

For more details on any release, see the git commit history or release notes.
