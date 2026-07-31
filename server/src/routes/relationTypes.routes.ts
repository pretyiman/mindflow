import type { FastifyInstance } from 'fastify';
import {
  createRelationTypeSchema,
  updateRelationTypeSchema
} from '../schemas/relationTypes.schema.js';
import * as relationTypesService from '../services/relationTypes.service.js';

export async function relationTypesRoutes(app: FastifyInstance) {
  app.get<{ Params: { mapId: string } }>('/maps/:mapId/relation-types', async (request) => {
    return relationTypesService.listRelationTypes(request.params.mapId);
  });

  app.post<{ Params: { mapId: string } }>(
    '/maps/:mapId/relation-types',
    async (request, reply) => {
      const body = createRelationTypeSchema.parse(request.body);
      const relationType = await relationTypesService.createRelationType(
        request.params.mapId,
        body
      );
      reply.status(201).send(relationType);
    }
  );

  app.patch<{ Params: { id: string } }>('/relation-types/:id', async (request) => {
    const body = updateRelationTypeSchema.parse(request.body);
    return relationTypesService.updateRelationType(request.params.id, body);
  });

  app.delete<{ Params: { id: string }; Querystring: { force?: string } }>(
    '/relation-types/:id',
    async (request, reply) => {
      await relationTypesService.deleteRelationType(
        request.params.id,
        request.query.force === 'true'
      );
      reply.status(204).send();
    }
  );
}
