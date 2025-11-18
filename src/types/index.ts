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
