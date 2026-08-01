import type { FastifyInstance } from 'fastify';
import { prisma } from '../db.js';
import { requireAuth } from '../plugins/auth.js';
import { requireMapAccess, requireResourceMapAccess } from '../plugins/authorization.js';
import { createNodeSchema, updateNodeSchema } from '../schemas/nodes.schema.js';
import * as nodesService from '../services/nodes.service.js';

const lookupNode = (id: string) => prisma.node.findUnique({ where: { id }, select: { mapId: true } });

export async function nodesRoutes(app: FastifyInstance) {
  app.get<{ Params: { mapId: string } }>(
    '/maps/:mapId/nodes',
    { preHandler: [requireAuth, requireMapAccess('VIEWER')] },
    async (request) => nodesService.listNodes(request.params.mapId)
  );

  app.post<{ Params: { mapId: string } }>(
    '/maps/:mapId/nodes',
    { preHandler: [requireAuth, requireMapAccess('EDITOR')] },
    async (request, reply) => {
      const body = createNodeSchema.parse(request.body);
      const node = await nodesService.createNode(request.params.mapId, body);
      reply.status(201).send(node);
    }
  );

  app.patch<{ Params: { id: string } }>(
    '/nodes/:id',
    { preHandler: [requireAuth, requireResourceMapAccess(lookupNode, 'EDITOR')] },
    async (request) => {
      const body = updateNodeSchema.parse(request.body);
      return nodesService.updateNode(request.params.id, body);
    }
  );

  app.delete<{ Params: { id: string } }>(
    '/nodes/:id',
    { preHandler: [requireAuth, requireResourceMapAccess(lookupNode, 'EDITOR')] },
    async (request, reply) => {
      await nodesService.deleteNode(request.params.id);
      reply.status(204).send();
    }
  );
}
