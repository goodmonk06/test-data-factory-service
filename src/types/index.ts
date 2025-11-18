export type TargetType = 'DB' | 'API';

export type ScenarioRunStatus = 'RUNNING' | 'SUCCESS' | 'FAILED';

export interface DBTargetConfig {
  connectionString: string;
}

export interface APITargetConfig {
  baseUrl: string;
  headers?: Record<string, string>;
}

export type TargetConfig = DBTargetConfig | APITargetConfig;

// DB Operation Types
export interface DBInsertStep {
  type: 'db:insert';
  table: string;
  values: Record<string, any>;
}

export interface DBUpdateStep {
  type: 'db:update';
  table: string;
  where: Record<string, any>;
  values: Record<string, any>;
}

export interface DBDeleteStep {
  type: 'db:delete';
  table: string;
  where: Record<string, any>;
}

export type DBStep = DBInsertStep | DBUpdateStep | DBDeleteStep;

// API Operation Types
export interface APIRequestStep {
  type: 'api:request';
  method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  path: string;
  headers?: Record<string, string>;
  body?: any;
}

export type APIStep = APIRequestStep;

export type Step = DBStep | APIStep;

export interface Scenario {
  id: string;
  name: string;
  description?: string;
  targetType: TargetType;
  targetConfigJson: TargetConfig;
  stepsJson: Step[];
  createdAt: Date;
  updatedAt: Date;
}

export interface ScenarioRun {
  id: string;
  scenarioId: string;
  startedAt: Date;
  finishedAt?: Date;
  status: ScenarioRunStatus;
  logText?: string;
}

export interface StepExecutionContext {
  variables: Record<string, any>;
  log: (message: string) => void;
}

// ===== Phase 3: Extended Types =====

export type DataSourceType =
  | 'POSTGRESQL'
  | 'MYSQL'
  | 'MONGODB'
  | 'REDIS'
  | 'HTTP_API'
  | 'GRAPHQL_API'
  | 'REST_API';

// Template Management
export interface ScenarioTemplate {
  id: string;
  name: string;
  description?: string;
  targetType: TargetType;
  parametersSchema: Record<string, any>; // JSON Schema
  stepsTemplate: any[]; // Steps with {{param.name}} placeholders
  metadata?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
  createdBy?: string;
}

export interface TemplateParameter {
  name: string;
  type: 'string' | 'number' | 'boolean' | 'object' | 'array';
  description?: string;
  required?: boolean;
  default?: any;
}

export interface TemplateInstantiationParams {
  templateId: string;
  scenarioName: string;
  parameters: Record<string, any>;
  environmentId?: string;
  dataSourceId?: string;
}

// Environment Management
export interface Environment {
  id: string;
  name: string;
  slug: string;
  description?: string;
  variables: Record<string, any>;
  isActive: boolean;
  priority: number;
  metadata?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

// Data Source Registry
export interface DataSource {
  id: string;
  name: string;
  type: DataSourceType;
  connectionConfig: Record<string, any>;
  description?: string;
  isActive: boolean;
  lastTestedAt?: Date;
  testStatus?: 'healthy' | 'unhealthy' | 'unknown';
  metadata?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

export interface DataSourceTestResult {
  success: boolean;
  message: string;
  latency?: number;
  testedAt: Date;
}

// Tag System
export interface Tag {
  id: string;
  name: string;
  color?: string;
  category?: string;
  createdAt: Date;
}

export interface ScenarioTagRelation {
  id: string;
  scenarioId: string;
  tagId: string;
  createdAt: Date;
}

// Scheduling System
export interface ScenarioSchedule {
  id: string;
  scenarioId: string;
  cronExpression: string;
  timezone: string;
  isActive: boolean;
  description?: string;
  nextRunAt?: Date;
  lastRunAt?: Date;
  environmentId?: string;
  createdAt: Date;
  updatedAt: Date;
}

// Enhanced Scenario with Phase 3 fields
export interface EnhancedScenario extends Scenario {
  version: number;
  isArchived: boolean;
  metadata?: Record<string, any>;
  lastExecutedAt?: Date;
  executionCount: number;
  successCount: number;
  templateId?: string;
  environmentId?: string;
  dataSourceId?: string;
}

// Enhanced ScenarioRun with Phase 3 fields
export interface EnhancedScenarioRun extends ScenarioRun {
  duration?: number;
  errorDetails?: Record<string, any>;
  environmentId?: string;
  triggeredBy?: 'manual' | 'schedule' | 'api' | 'cli';
  scheduleId?: string;
}

// Event System Types
export type DomainEventType =
  | 'scenario.created'
  | 'scenario.updated'
  | 'scenario.deleted'
  | 'scenario.archived'
  | 'scenario.execution.started'
  | 'scenario.execution.completed'
  | 'scenario.execution.failed'
  | 'template.created'
  | 'template.instantiated'
  | 'environment.created'
  | 'environment.updated'
  | 'datasource.created'
  | 'datasource.tested'
  | 'schedule.created'
  | 'schedule.triggered';

export interface DomainEvent<T = any> {
  id: string;
  type: DomainEventType;
  timestamp: Date;
  payload: T;
  metadata?: Record<string, any>;
}

// Adapter Interfaces
export interface INotificationAdapter {
  sendNotification(message: NotificationMessage): Promise<void>;
  sendExecutionAlert(run: EnhancedScenarioRun, scenario: EnhancedScenario): Promise<void>;
}

export interface NotificationMessage {
  title: string;
  body: string;
  severity: 'info' | 'warning' | 'error' | 'success';
  metadata?: Record<string, any>;
}

export interface IStorageAdapter {
  store(key: string, data: any): Promise<string>;
  retrieve(key: string): Promise<any>;
  delete(key: string): Promise<void>;
  list(prefix?: string): Promise<string[]>;
}

export interface IValidationAdapter {
  validateScenario(scenario: Scenario | EnhancedScenario): Promise<ValidationResult>;
  validateStep(step: Step): Promise<ValidationResult>;
}

export interface ValidationResult {
  valid: boolean;
  errors: ValidationError[];
  warnings: ValidationWarning[];
}

export interface ValidationError {
  field: string;
  message: string;
  code?: string;
}

export interface ValidationWarning {
  field: string;
  message: string;
}

export interface IMetricsAdapter {
  recordCounter(name: string, value: number, labels?: Record<string, string>): void;
  recordGauge(name: string, value: number, labels?: Record<string, string>): void;
  recordHistogram(name: string, value: number, labels?: Record<string, string>): void;
  recordTimer(name: string, durationMs: number, labels?: Record<string, string>): void;
}

// Query Filters
export interface ScenarioFilter {
  targetType?: TargetType;
  isArchived?: boolean;
  environmentId?: string;
  dataSourceId?: string;
  templateId?: string;
  tags?: string[];
  search?: string;
}

export interface ScenarioRunFilter {
  scenarioId?: string;
  status?: ScenarioRunStatus;
  environmentId?: string;
  triggeredBy?: string;
  scheduleId?: string;
  startedAfter?: Date;
  startedBefore?: Date;
}
