import type { FastifyInstance } from 'fastify';
import { createEdgeSchema, updateEdgeSchema } from '../schemas/edges.schema.js';
import * as edgesService from '../services/edges.service.js';

export async function edgesRoutes(app: FastifyInstance) {
  app.get<{ Params: { mapId: string } }>('/maps/:mapId/edges', async (request) => {
    return edgesService.listEdges(request.params.mapId);
  });

  app.post<{ Params: { mapId: string } }>('/maps/:mapId/edges', async (request, reply) => {
    const body = createEdgeSchema.parse(request.body);
    const edge = await edgesService.createEdge(request.params.mapId, body);
    reply.status(201).send(edge);
  });

  app.patch<{ Params: { id: string } }>('/edges/:id', async (request) => {
    const body = updateEdgeSchema.parse(request.body);
    return edgesService.updateEdge(request.params.id, body);
  });

  app.delete<{ Params: { id: string } }>('/edges/:id', async (request, reply) => {
    await edgesService.deleteEdge(request.params.id);
    reply.status(204).send();
  });
}
