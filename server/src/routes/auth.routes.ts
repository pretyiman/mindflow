import type { FastifyInstance } from 'fastify';
import { requireAuth } from '../plugins/auth.js';
import { changePasswordSchema, loginSchema, registerSchema } from '../schemas/auth.schema.js';
import * as authService from '../services/auth.service.js';

export async function authRoutes(app: FastifyInstance) {
  app.post('/auth/register', async (request, reply) => {
    const body = registerSchema.parse(request.body);
    const result = await authService.register(body);
    reply.status(201).send(result);
  });

  app.post('/auth/login', async (request) => {
    const body = loginSchema.parse(request.body);
    return authService.login(body);
  });

  app.get('/auth/me', { preHandler: requireAuth }, async (request) => {
    return authService.me(request.user!.id);
  });

  app.patch('/auth/password', { preHandler: requireAuth }, async (request, reply) => {
    const body = changePasswordSchema.parse(request.body);
    await authService.changePassword(request.user!.id, body.currentPassword, body.newPassword);
    reply.status(204).send();
  });
}
