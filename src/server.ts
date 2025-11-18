import Fastify from 'fastify';
import cors from '@fastify/cors';
import dotenv from 'dotenv';
import { connectDB, disconnectDB } from './utils/db';
import { scenarioRoutes } from './routes/scenarios';
import { globalErrorHandler } from './utils/error-handler';

dotenv.config();

const PORT = parseInt(process.env.PORT || '3000', 10);
const HOST = '0.0.0.0';

async function startServer() {
  const fastify = Fastify({
    logger: {
      level: process.env.NODE_ENV === 'development' ? 'info' : 'warn',
    },
  });

  // Register error handler
  fastify.setErrorHandler(globalErrorHandler);

  // Register CORS
  await fastify.register(cors, {
    origin: true, // Allow all origins in development
  });

  // Health check
  fastify.get('/health', async () => {
    return { status: 'ok', timestamp: new Date().toISOString() };
  });

  // Register routes
  await fastify.register(scenarioRoutes);

  // Connect to database
  await connectDB();

  // Start server
  try {
    await fastify.listen({ port: PORT, host: HOST });
    console.log(`\n🚀 Test Data Factory Service running on http://localhost:${PORT}`);
    console.log(`📊 Health check: http://localhost:${PORT}/health`);
    console.log(`📚 API docs: http://localhost:${PORT}/scenarios\n`);
  } catch (err) {
    fastify.log.error(err);
    await disconnectDB();
    process.exit(1);
  }

  // Handle graceful shutdown
  const signals = ['SIGINT', 'SIGTERM'];
  signals.forEach((signal) => {
    process.on(signal, async () => {
      console.log(`\nReceived ${signal}, shutting down gracefully...`);
      await fastify.close();
      await disconnectDB();
      process.exit(0);
    });
  });
}

startServer();
