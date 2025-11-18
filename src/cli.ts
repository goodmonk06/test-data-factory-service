#!/usr/bin/env node

import { Command } from 'commander';
import dotenv from 'dotenv';
import { prisma, connectDB, disconnectDB } from './utils/db';
import { ScenarioExecutor } from './utils/executor';
import { Scenario } from './types';

dotenv.config();

const program = new Command();

program
  .name('tdf')
  .description('Test Data Factory CLI - Execute test data scenarios')
  .version('1.0.0');

program
  .command('run <scenarioName>')
  .description('Run a scenario by name')
  .option('-e, --env <environment>', 'Environment (e.g., test, staging)', 'test')
  .action(async (scenarioName: string, options: { env: string }) => {
    try {
      await connectDB();

      console.log(`\nRunning scenario: ${scenarioName}`);
      console.log(`Environment: ${options.env}\n`);

      // Find the scenario
      const dbScenario = await prisma.scenario.findUnique({
        where: { name: scenarioName },
      });

      if (!dbScenario) {
        console.error(`Error: Scenario '${scenarioName}' not found`);
        process.exit(1);
      }

      // Convert Prisma model to our Scenario type
      const scenario: Scenario = {
        id: dbScenario.id,
        name: dbScenario.name,
        description: dbScenario.description || undefined,
        targetType: dbScenario.targetType as 'DB' | 'API',
        targetConfigJson: dbScenario.targetConfigJson as any,
        stepsJson: dbScenario.stepsJson as any,
        createdAt: dbScenario.createdAt,
        updatedAt: dbScenario.updatedAt,
      };

      // Execute the scenario
      const executor = new ScenarioExecutor();
      const result = await executor.execute(scenario);

      console.log(`\nRun ID: ${result.runId}`);
      console.log(`Status: ${result.success ? 'SUCCESS' : 'FAILED'}`);

      await disconnectDB();
      process.exit(result.success ? 0 : 1);
    } catch (error: any) {
      console.error(`\nFatal error: ${error.message}`);
      await disconnectDB();
      process.exit(1);
    }
  });

program
  .command('list')
  .description('List all available scenarios')
  .action(async () => {
    try {
      await connectDB();

      const scenarios = await prisma.scenario.findMany({
        orderBy: { createdAt: 'desc' },
      });

      if (scenarios.length === 0) {
        console.log('No scenarios found');
      } else {
        console.log(`\nFound ${scenarios.length} scenario(s):\n`);
        scenarios.forEach((scenario) => {
          console.log(`- ${scenario.name}`);
          console.log(`  Type: ${scenario.targetType}`);
          console.log(`  Description: ${scenario.description || 'N/A'}`);
          console.log(`  Created: ${scenario.createdAt.toISOString()}\n`);
        });
      }

      await disconnectDB();
    } catch (error: any) {
      console.error(`Error: ${error.message}`);
      await disconnectDB();
      process.exit(1);
    }
  });

program
  .command('history <scenarioName>')
  .description('Show execution history for a scenario')
  .option('-l, --limit <number>', 'Number of runs to show', '10')
  .action(async (scenarioName: string, options: { limit: string }) => {
    try {
      await connectDB();

      const scenario = await prisma.scenario.findUnique({
        where: { name: scenarioName },
        include: {
          runs: {
            orderBy: { startedAt: 'desc' },
            take: parseInt(options.limit),
          },
        },
      });

      if (!scenario) {
        console.error(`Error: Scenario '${scenarioName}' not found`);
        process.exit(1);
      }

      console.log(`\nExecution history for: ${scenario.name}\n`);

      if (scenario.runs.length === 0) {
        console.log('No runs found');
      } else {
        scenario.runs.forEach((run) => {
          const duration = run.finishedAt
            ? `${Math.round((run.finishedAt.getTime() - run.startedAt.getTime()) / 1000)}s`
            : 'N/A';

          console.log(`Run ID: ${run.id}`);
          console.log(`  Status: ${run.status}`);
          console.log(`  Started: ${run.startedAt.toISOString()}`);
          console.log(`  Finished: ${run.finishedAt?.toISOString() || 'N/A'}`);
          console.log(`  Duration: ${duration}\n`);
        });
      }

      await disconnectDB();
    } catch (error: any) {
      console.error(`Error: ${error.message}`);
      await disconnectDB();
      process.exit(1);
    }
  });

program
  .command('logs <runId>')
  .description('Show logs for a specific run')
  .action(async (runId: string) => {
    try {
      await connectDB();

      const run = await prisma.scenarioRun.findUnique({
        where: { id: runId },
        include: { scenario: true },
      });

      if (!run) {
        console.error(`Error: Run '${runId}' not found`);
        process.exit(1);
      }

      console.log(`\nLogs for run: ${runId}`);
      console.log(`Scenario: ${run.scenario.name}`);
      console.log(`Status: ${run.status}`);
      console.log(`Started: ${run.startedAt.toISOString()}\n`);
      console.log('--- Logs ---\n');
      console.log(run.logText || 'No logs available');

      await disconnectDB();
    } catch (error: any) {
      console.error(`Error: ${error.message}`);
      await disconnectDB();
      process.exit(1);
    }
  });

program.parse();
