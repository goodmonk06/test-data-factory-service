import { Scenario, Step, StepExecutionContext } from '../types';
import { DBAdapter } from '../adapters/db-adapter';
import { APIAdapter } from '../adapters/api-adapter';
import { prisma } from './db';

export class ScenarioExecutor {
  async execute(scenario: Scenario): Promise<{ runId: string; success: boolean }> {
    const logs: string[] = [];
    const context: StepExecutionContext = {
      variables: {},
      log: (message: string) => {
        const timestamp = new Date().toISOString();
        const logEntry = `[${timestamp}] ${message}`;
        console.log(logEntry);
        logs.push(logEntry);
      },
    };

    // Create a new scenario run
    const run = await prisma.scenarioRun.create({
      data: {
        scenarioId: scenario.id,
        status: 'RUNNING',
        logText: '',
      },
    });

    context.log(`Started scenario: ${scenario.name}`);
    context.log(`Description: ${scenario.description || 'N/A'}`);
    context.log(`Target type: ${scenario.targetType}`);

    let adapter: DBAdapter | APIAdapter | null = null;
    let success = false;

    try {
      // Initialize the appropriate adapter
      if (scenario.targetType === 'DB') {
        adapter = new DBAdapter(scenario.targetConfigJson as any);
        context.log('Initialized DB adapter');
      } else if (scenario.targetType === 'API') {
        adapter = new APIAdapter(scenario.targetConfigJson as any);
        context.log('Initialized API adapter');
      } else {
        throw new Error(`Unknown target type: ${scenario.targetType}`);
      }

      // Execute each step
      const steps = scenario.stepsJson as Step[];
      context.log(`Executing ${steps.length} step(s)...`);

      for (let i = 0; i < steps.length; i++) {
        const step = steps[i];
        context.log(`\n--- Step ${i + 1}/${steps.length}: ${step.type} ---`);

        await adapter.executeStep(step as any, context);

        context.log(`Step ${i + 1} completed successfully`);
      }

      success = true;
      context.log('\n=== Scenario completed successfully ===');

      // Update the run with success
      await prisma.scenarioRun.update({
        where: { id: run.id },
        data: {
          status: 'SUCCESS',
          finishedAt: new Date(),
          logText: logs.join('\n'),
        },
      });
    } catch (error: any) {
      context.log(`\n!!! ERROR: ${error.message} !!!`);
      if (error.stack) {
        context.log(`Stack trace: ${error.stack}`);
      }

      // Update the run with failure
      await prisma.scenarioRun.update({
        where: { id: run.id },
        data: {
          status: 'FAILED',
          finishedAt: new Date(),
          logText: logs.join('\n'),
        },
      });
    } finally {
      // Clean up the adapter
      if (adapter && 'close' in adapter) {
        await adapter.close();
      }
    }

    return { runId: run.id, success };
  }
}
