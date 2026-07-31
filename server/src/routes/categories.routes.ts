import type { FastifyInstance } from 'fastify';
import { createCategorySchema, updateCategorySchema } from '../schemas/categories.schema.js';
import * as categoriesService from '../services/categories.service.js';

export async function categoriesRoutes(app: FastifyInstance) {
  app.get<{ Params: { mapId: string } }>('/maps/:mapId/categories', async (request) => {
    return categoriesService.listCategories(request.params.mapId);
  });

  app.post<{ Params: { mapId: string } }>('/maps/:mapId/categories', async (request, reply) => {
    const body = createCategorySchema.parse(request.body);
    const category = await categoriesService.createCategory(request.params.mapId, body);
    reply.status(201).send(category);
  });

  app.patch<{ Params: { id: string } }>('/categories/:id', async (request) => {
    const body = updateCategorySchema.parse(request.body);
    return categoriesService.updateCategory(request.params.id, body);
  });

  app.delete<{ Params: { id: string }; Querystring: { force?: string } }>(
    '/categories/:id',
    async (request, reply) => {
      await categoriesService.deleteCategory(request.params.id, request.query.force === 'true');
      reply.status(204).send();
    }
  );
}
