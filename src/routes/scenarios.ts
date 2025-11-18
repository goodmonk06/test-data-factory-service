import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { z } from 'zod';
import { prisma } from '../utils/db';
import { ScenarioExecutor } from '../utils/executor';
import { Scenario } from '../types';

// Validation schemas
const createScenarioSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  targetType: z.enum(['DB', 'API']),
  targetConfigJson: z.record(z.any()),
  stepsJson: z.array(z.record(z.any())),
});

const updateScenarioSchema = z.object({
  name: z.string().min(1).optional(),
  description: z.string().optional(),
  targetType: z.enum(['DB', 'API']).optional(),
  targetConfigJson: z.record(z.any()).optional(),
  stepsJson: z.array(z.record(z.any())).optional(),
});

export async function scenarioRoutes(fastify: FastifyInstance) {
  // Get all scenarios
  fastify.get('/scenarios', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const scenarios = await prisma.scenario.findMany({
        orderBy: { createdAt: 'desc' },
      });
      return reply.send({ scenarios });
    } catch (error: any) {
      return reply.status(500).send({ error: error.message });
    }
  });

  // Get scenario by ID
  fastify.get(
    '/scenarios/:id',
    async (
      request: FastifyRequest<{ Params: { id: string } }>,
      reply: FastifyReply
    ) => {
      try {
        const scenario = await prisma.scenario.findUnique({
          where: { id: request.params.id },
          include: { runs: { orderBy: { startedAt: 'desc' }, take: 10 } },
        });

        if (!scenario) {
          return reply.status(404).send({ error: 'Scenario not found' });
        }

        return reply.send({ scenario });
      } catch (error: any) {
        return reply.status(500).send({ error: error.message });
      }
    }
  );

  // Create scenario
  fastify.post(
    '/scenarios',
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const data = createScenarioSchema.parse(request.body);

        const scenario = await prisma.scenario.create({
          data: {
            name: data.name,
            description: data.description,
            targetType: data.targetType,
            targetConfigJson: data.targetConfigJson,
            stepsJson: data.stepsJson,
          },
        });

        return reply.status(201).send({ scenario });
      } catch (error: any) {
        if (error instanceof z.ZodError) {
          return reply.status(400).send({ error: error.errors });
        }
        return reply.status(500).send({ error: error.message });
      }
    }
  );

  // Update scenario
  fastify.put(
    '/scenarios/:id',
    async (
      request: FastifyRequest<{ Params: { id: string } }>,
      reply: FastifyReply
    ) => {
      try {
        const data = updateScenarioSchema.parse(request.body);

        const scenario = await prisma.scenario.update({
          where: { id: request.params.id },
          data,
        });

        return reply.send({ scenario });
      } catch (error: any) {
        if (error instanceof z.ZodError) {
          return reply.status(400).send({ error: error.errors });
        }
        if (error.code === 'P2025') {
          return reply.status(404).send({ error: 'Scenario not found' });
        }
        return reply.status(500).send({ error: error.message });
      }
    }
  );

  // Delete scenario
  fastify.delete(
    '/scenarios/:id',
    async (
      request: FastifyRequest<{ Params: { id: string } }>,
      reply: FastifyReply
    ) => {
      try {
        await prisma.scenario.delete({
          where: { id: request.params.id },
        });

        return reply.send({ message: 'Scenario deleted successfully' });
      } catch (error: any) {
        if (error.code === 'P2025') {
          return reply.status(404).send({ error: 'Scenario not found' });
        }
        return reply.status(500).send({ error: error.message });
      }
    }
  );

  // Execute scenario
  fastify.post(
    '/scenarios/:id/execute',
    async (
      request: FastifyRequest<{ Params: { id: string } }>,
      reply: FastifyReply
    ) => {
      try {
        const dbScenario = await prisma.scenario.findUnique({
          where: { id: request.params.id },
        });

        if (!dbScenario) {
          return reply.status(404).send({ error: 'Scenario not found' });
        }

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

        const executor = new ScenarioExecutor();
        const result = await executor.execute(scenario);

        return reply.send({
          runId: result.runId,
          success: result.success,
        });
      } catch (error: any) {
        return reply.status(500).send({ error: error.message });
      }
    }
  );

  // Get scenario runs
  fastify.get(
    '/scenarios/:id/runs',
    async (
      request: FastifyRequest<{ Params: { id: string } }>,
      reply: FastifyReply
    ) => {
      try {
        const runs = await prisma.scenarioRun.findMany({
          where: { scenarioId: request.params.id },
          orderBy: { startedAt: 'desc' },
          take: 50,
        });

        return reply.send({ runs });
      } catch (error: any) {
        return reply.status(500).send({ error: error.message });
      }
    }
  );

  // Get run details
  fastify.get(
    '/runs/:id',
    async (
      request: FastifyRequest<{ Params: { id: string } }>,
      reply: FastifyReply
    ) => {
      try {
        const run = await prisma.scenarioRun.findUnique({
          where: { id: request.params.id },
          include: { scenario: true },
        });

        if (!run) {
          return reply.status(404).send({ error: 'Run not found' });
        }

        return reply.send({ run });
      } catch (error: any) {
        return reply.status(500).send({ error: error.message });
      }
    }
  );
}
