import type { FastifyInstance } from 'fastify';
import { ZodError } from 'zod';
import { AppError } from '../errors.js';

export function registerErrorHandler(app: FastifyInstance) {
  app.setErrorHandler((error, _request, reply) => {
    if (error instanceof ZodError) {
      reply.status(400).send({
        error: { code: 'VALIDATION_ERROR', message: 'Invalid request body', details: error.flatten() }
      });
      return;
    }
    if (error instanceof AppError) {
      reply.status(error.statusCode).send({
        error: { code: error.code, message: error.message, details: error.details }
      });
      return;
    }
    app.log.error(error);
    reply.status(500).send({ error: { code: 'INTERNAL_ERROR', message: 'Something went wrong' } });
  });
}
