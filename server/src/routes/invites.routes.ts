import type { FastifyInstance } from 'fastify';
import { prisma } from '../db.js';
import { requireAuth } from '../plugins/auth.js';
import { requireResourceMapOwner } from '../plugins/authorization.js';
import * as invitesService from '../services/invites.service.js';

const lookupInvite = (id: string) =>
  prisma.mapInvite.findUnique({ where: { id }, select: { mapId: true } });

export async function invitesRoutes(app: FastifyInstance) {
  // Deliberately NOT gated by requireMapAccess - the whole point is that the
  // recipient isn't a collaborator yet. Any logged-in user can look up an
  // invite by its (long, random) token; only requireAuth applies.
  app.get<{ Params: { token: string } }>(
    '/invites/:token',
    { preHandler: requireAuth },
    async (request) => invitesService.getInvite(request.params.token)
  );

  app.post<{ Params: { token: string } }>(
    '/invites/:token/accept',
    { preHandler: requireAuth },
    async (request) => invitesService.acceptInvite(request.params.token, request.user!.id)
  );

  app.delete<{ Params: { id: string } }>(
    '/invites/:id',
    { preHandler: [requireAuth, requireResourceMapOwner(lookupInvite)] },
    async (request, reply) => {
      await invitesService.removeInvite(request.params.id);
      reply.status(204).send();
    }
  );
}
