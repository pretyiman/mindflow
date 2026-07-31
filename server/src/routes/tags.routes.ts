import type { FastifyInstance } from 'fastify';
import { createTagSchema, setNodeTagsSchema, updateTagSchema } from '../schemas/tags.schema.js';
import * as tagsService from '../services/tags.service.js';
import * as nodesService from '../services/nodes.service.js';

export async function tagsRoutes(app: FastifyInstance) {
  app.get<{ Params: { mapId: string } }>('/maps/:mapId/tags', async (request) => {
    return tagsService.listTags(request.params.mapId);
  });

  app.post<{ Params: { mapId: string } }>('/maps/:mapId/tags', async (request, reply) => {
    const body = createTagSchema.parse(request.body);
    const tag = await tagsService.createTag(request.params.mapId, body);
    reply.status(201).send(tag);
  });

  app.patch<{ Params: { id: string } }>('/tags/:id', async (request) => {
    const body = updateTagSchema.parse(request.body);
    return tagsService.updateTag(request.params.id, body);
  });

  app.delete<{ Params: { id: string }; Querystring: { force?: string } }>(
    '/tags/:id',
    async (request, reply) => {
      await tagsService.deleteTag(request.params.id, request.query.force === 'true');
      reply.status(204).send();
    }
  );

  app.put<{ Params: { id: string } }>('/nodes/:id/tags', async (request) => {
    const body = setNodeTagsSchema.parse(request.body);
    return nodesService.setNodeTags(request.params.id, body.tagIds);
  });
}
