import type { FastifyInstance } from 'fastify';
import { createNodeSchema, updateNodeSchema } from '../schemas/nodes.schema.js';
import * as nodesService from '../services/nodes.service.js';

export async function nodesRoutes(app: FastifyInstance) {
  app.get<{ Params: { mapId: string } }>('/maps/:mapId/nodes', async (request) => {
    return nodesService.listNodes(request.params.mapId);
  });

  app.post<{ Params: { mapId: string } }>('/maps/:mapId/nodes', async (request, reply) => {
    const body = createNodeSchema.parse(request.body);
    const node = await nodesService.createNode(request.params.mapId, body);
    reply.status(201).send(node);
  });

  app.patch<{ Params: { id: string } }>('/nodes/:id', async (request) => {
    const body = updateNodeSchema.parse(request.body);
    return nodesService.updateNode(request.params.id, body);
  });

  app.delete<{ Params: { id: string } }>('/nodes/:id', async (request, reply) => {
    await nodesService.deleteNode(request.params.id);
    reply.status(204).send();
  });
}
