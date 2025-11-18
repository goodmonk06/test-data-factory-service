-- AlterTable: Add Phase 3 fields to scenarios
ALTER TABLE "scenarios" ADD COLUMN "version" INTEGER NOT NULL DEFAULT 1;
ALTER TABLE "scenarios" ADD COLUMN "isArchived" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "scenarios" ADD COLUMN "metadata" JSONB;
ALTER TABLE "scenarios" ADD COLUMN "lastExecutedAt" TIMESTAMP(3);
ALTER TABLE "scenarios" ADD COLUMN "executionCount" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "scenarios" ADD COLUMN "successCount" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "scenarios" ADD COLUMN "templateId" TEXT;
ALTER TABLE "scenarios" ADD COLUMN "environmentId" TEXT;
ALTER TABLE "scenarios" ADD COLUMN "dataSourceId" TEXT;

-- CreateIndex
CREATE INDEX "scenarios_isArchived_idx" ON "scenarios"("isArchived");
CREATE INDEX "scenarios_templateId_idx" ON "scenarios"("templateId");
CREATE INDEX "scenarios_environmentId_idx" ON "scenarios"("environmentId");
CREATE INDEX "scenarios_dataSourceId_idx" ON "scenarios"("dataSourceId");

-- AlterTable: Add Phase 3 fields to scenario_runs
ALTER TABLE "scenario_runs" ADD COLUMN "duration" INTEGER;
ALTER TABLE "scenario_runs" ADD COLUMN "errorDetails" JSONB;
ALTER TABLE "scenario_runs" ADD COLUMN "environmentId" TEXT;
ALTER TABLE "scenario_runs" ADD COLUMN "triggeredBy" TEXT;
ALTER TABLE "scenario_runs" ADD COLUMN "scheduleId" TEXT;

-- CreateIndex
CREATE INDEX "scenario_runs_status_idx" ON "scenario_runs"("status");
CREATE INDEX "scenario_runs_startedAt_idx" ON "scenario_runs"("startedAt");
CREATE INDEX "scenario_runs_environmentId_idx" ON "scenario_runs"("environmentId");
CREATE INDEX "scenario_runs_scheduleId_idx" ON "scenario_runs"("scheduleId");

-- CreateEnum: DataSourceType
CREATE TYPE "DataSourceType" AS ENUM ('POSTGRESQL', 'MYSQL', 'MONGODB', 'REDIS', 'HTTP_API', 'GRAPHQL_API', 'REST_API');

-- CreateTable: scenario_templates
CREATE TABLE "scenario_templates" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "targetType" "TargetType" NOT NULL,
    "parametersSchema" JSONB NOT NULL,
    "stepsTemplate" JSONB NOT NULL,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdBy" TEXT,

    CONSTRAINT "scenario_templates_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "scenario_templates_name_key" ON "scenario_templates"("name");

-- CreateTable: environments
CREATE TABLE "environments" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "variables" JSONB NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "priority" INTEGER NOT NULL DEFAULT 0,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "environments_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "environments_name_key" ON "environments"("name");
CREATE UNIQUE INDEX "environments_slug_key" ON "environments"("slug");
CREATE INDEX "environments_isActive_idx" ON "environments"("isActive");

-- CreateTable: data_sources
CREATE TABLE "data_sources" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" "DataSourceType" NOT NULL,
    "connectionConfig" JSONB NOT NULL,
    "description" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "lastTestedAt" TIMESTAMP(3),
    "testStatus" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "data_sources_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "data_sources_name_key" ON "data_sources"("name");
CREATE INDEX "data_sources_type_idx" ON "data_sources"("type");
CREATE INDEX "data_sources_isActive_idx" ON "data_sources"("isActive");

-- CreateTable: tags
CREATE TABLE "tags" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "color" TEXT,
    "category" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "tags_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "tags_name_key" ON "tags"("name");
CREATE INDEX "tags_category_idx" ON "tags"("category");

-- CreateTable: scenario_tags
CREATE TABLE "scenario_tags" (
    "id" TEXT NOT NULL,
    "scenarioId" TEXT NOT NULL,
    "tagId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "scenario_tags_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "scenario_tags_scenarioId_tagId_key" ON "scenario_tags"("scenarioId", "tagId");
CREATE INDEX "scenario_tags_scenarioId_idx" ON "scenario_tags"("scenarioId");
CREATE INDEX "scenario_tags_tagId_idx" ON "scenario_tags"("tagId");

-- CreateTable: scenario_schedules
CREATE TABLE "scenario_schedules" (
    "id" TEXT NOT NULL,
    "scenarioId" TEXT NOT NULL,
    "cronExpression" TEXT NOT NULL,
    "timezone" TEXT NOT NULL DEFAULT 'UTC',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "description" TEXT,
    "nextRunAt" TIMESTAMP(3),
    "lastRunAt" TIMESTAMP(3),
    "environmentId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "scenario_schedules_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "scenario_schedules_scenarioId_idx" ON "scenario_schedules"("scenarioId");
CREATE INDEX "scenario_schedules_isActive_idx" ON "scenario_schedules"("isActive");
CREATE INDEX "scenario_schedules_nextRunAt_idx" ON "scenario_schedules"("nextRunAt");

-- AddForeignKey
ALTER TABLE "scenarios" ADD CONSTRAINT "scenarios_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "scenario_templates"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "scenarios" ADD CONSTRAINT "scenarios_environmentId_fkey" FOREIGN KEY ("environmentId") REFERENCES "environments"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "scenarios" ADD CONSTRAINT "scenarios_dataSourceId_fkey" FOREIGN KEY ("dataSourceId") REFERENCES "data_sources"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "scenario_runs" ADD CONSTRAINT "scenario_runs_environmentId_fkey" FOREIGN KEY ("environmentId") REFERENCES "environments"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "scenario_runs" ADD CONSTRAINT "scenario_runs_scheduleId_fkey" FOREIGN KEY ("scheduleId") REFERENCES "scenario_schedules"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "scenario_tags" ADD CONSTRAINT "scenario_tags_scenarioId_fkey" FOREIGN KEY ("scenarioId") REFERENCES "scenarios"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "scenario_tags" ADD CONSTRAINT "scenario_tags_tagId_fkey" FOREIGN KEY ("tagId") REFERENCES "tags"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "scenario_schedules" ADD CONSTRAINT "scenario_schedules_scenarioId_fkey" FOREIGN KEY ("scenarioId") REFERENCES "scenarios"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "scenario_schedules" ADD CONSTRAINT "scenario_schedules_environmentId_fkey" FOREIGN KEY ("environmentId") REFERENCES "environments"("id") ON DELETE SET NULL ON UPDATE CASCADE;
