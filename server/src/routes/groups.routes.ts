import type { FastifyInstance } from 'fastify';
import { createGroupSchema, updateGroupSchema } from '../schemas/groups.schema.js';
import * as groupsService from '../services/groups.service.js';

export async function groupsRoutes(app: FastifyInstance) {
  app.get<{ Params: { mapId: string } }>('/maps/:mapId/groups', async (request) => {
    return groupsService.listGroups(request.params.mapId);
  });

  app.post<{ Params: { mapId: string } }>('/maps/:mapId/groups', async (request, reply) => {
    const body = createGroupSchema.parse(request.body);
    const group = await groupsService.createGroup(request.params.mapId, body);
    reply.status(201).send(group);
  });

  app.patch<{ Params: { id: string } }>('/groups/:id', async (request) => {
    const body = updateGroupSchema.parse(request.body);
    return groupsService.updateGroup(request.params.id, body);
  });

  app.delete<{ Params: { id: string } }>('/groups/:id', async (request, reply) => {
    await groupsService.deleteGroup(request.params.id);
    reply.status(204).send();
  });
}
