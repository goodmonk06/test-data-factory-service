import { FastifyError, FastifyReply, FastifyRequest } from 'fastify';
import { ZodError } from 'zod';

export interface ErrorResponse {
  error: string;
  message: string;
  statusCode: number;
  details?: any;
}

export function createErrorResponse(
  statusCode: number,
  message: string,
  details?: any
): ErrorResponse {
  return {
    error: getErrorName(statusCode),
    message,
    statusCode,
    ...(details && { details }),
  };
}

function getErrorName(statusCode: number): string {
  const errorNames: Record<number, string> = {
    400: 'Bad Request',
    401: 'Unauthorized',
    403: 'Forbidden',
    404: 'Not Found',
    409: 'Conflict',
    422: 'Unprocessable Entity',
    500: 'Internal Server Error',
  };

  return errorNames[statusCode] || 'Error';
}

export async function globalErrorHandler(
  error: FastifyError,
  request: FastifyRequest,
  reply: FastifyReply
) {
  // Log the error
  request.log.error(error);

  // Handle Zod validation errors
  if (error instanceof ZodError) {
    return reply.status(400).send(
      createErrorResponse(400, 'Validation failed', {
        issues: error.errors,
      })
    );
  }

  // Handle Prisma errors
  if (error.name === 'PrismaClientKnownRequestError') {
    const prismaError = error as any;

    if (prismaError.code === 'P2002') {
      return reply.status(409).send(createErrorResponse(409, 'Resource already exists'));
    }

    if (prismaError.code === 'P2025') {
      return reply.status(404).send(createErrorResponse(404, 'Resource not found'));
    }

    if (prismaError.code === 'P2003') {
      return reply.status(400).send(createErrorResponse(400, 'Foreign key constraint failed'));
    }
  }

  // Handle Fastify validation errors
  if (error.validation) {
    return reply.status(400).send(
      createErrorResponse(400, 'Validation failed', {
        issues: error.validation,
      })
    );
  }

  // Handle custom status codes
  const statusCode = error.statusCode || 500;
  const message = statusCode === 500 ? 'Internal server error' : error.message;

  return reply.status(statusCode).send(createErrorResponse(statusCode, message));
}
