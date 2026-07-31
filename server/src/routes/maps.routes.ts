import type { FastifyInstance } from 'fastify';
import { createMapSchema, updateMapSchema } from '../schemas/maps.schema.js';
import * as mapsService from '../services/maps.service.js';

export async function mapsRoutes(app: FastifyInstance) {
  app.get('/maps', async () => mapsService.listMaps());

  app.post('/maps', async (request, reply) => {
    const body = createMapSchema.parse(request.body);
    const map = await mapsService.createMap(body);
    reply.status(201).send(map);
  });

  app.get<{ Params: { mapId: string } }>('/maps/:mapId', async (request) => {
    return mapsService.getMap(request.params.mapId);
  });

  app.patch<{ Params: { mapId: string } }>('/maps/:mapId', async (request) => {
    const body = updateMapSchema.parse(request.body);
    return mapsService.updateMap(request.params.mapId, body);
  });

  app.delete<{ Params: { mapId: string } }>('/maps/:mapId', async (request, reply) => {
    await mapsService.deleteMap(request.params.mapId);
    reply.status(204).send();
  });

  app.get<{ Params: { mapId: string } }>('/maps/:mapId/graph', async (request) => {
    return mapsService.getGraph(request.params.mapId);
  });
}
