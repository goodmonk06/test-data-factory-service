-- CreateEnum
CREATE TYPE "TargetType" AS ENUM ('DB', 'API');

-- CreateEnum
CREATE TYPE "ScenarioRunStatus" AS ENUM ('RUNNING', 'SUCCESS', 'FAILED');

-- CreateTable
CREATE TABLE "scenarios" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "targetType" "TargetType" NOT NULL,
    "targetConfigJson" JSONB NOT NULL,
    "stepsJson" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "scenarios_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "scenario_runs" (
    "id" TEXT NOT NULL,
    "scenarioId" TEXT NOT NULL,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "finishedAt" TIMESTAMP(3),
    "status" "ScenarioRunStatus" NOT NULL,
    "logText" TEXT,

    CONSTRAINT "scenario_runs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "scenarios_name_key" ON "scenarios"("name");

-- CreateIndex
CREATE INDEX "scenario_runs_scenarioId_idx" ON "scenario_runs"("scenarioId");

-- AddForeignKey
ALTER TABLE "scenario_runs" ADD CONSTRAINT "scenario_runs_scenarioId_fkey" FOREIGN KEY ("scenarioId") REFERENCES "scenarios"("id") ON DELETE CASCADE ON UPDATE CASCADE;
