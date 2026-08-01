import cors from '@fastify/cors';
import Fastify from 'fastify';
import { env } from './env.js';
import { registerErrorHandler } from './plugins/errorHandler.js';
import { mapsRoutes } from './routes/maps.routes.js';
import { categoriesRoutes } from './routes/categories.routes.js';
import { relationTypesRoutes } from './routes/relationTypes.routes.js';
import { nodesRoutes } from './routes/nodes.routes.js';
import { edgesRoutes } from './routes/edges.routes.js';
import { tagsRoutes } from './routes/tags.routes.js';
import { groupsRoutes } from './routes/groups.routes.js';
import { authRoutes } from './routes/auth.routes.js';
import { collaboratorsRoutes } from './routes/collaborators.routes.js';
import { invitesRoutes } from './routes/invites.routes.js';

const app = Fastify({ logger: true });

await app.register(cors, { origin: true });
registerErrorHandler(app);

await app.register(
  async (api) => {
    api.get('/health', async () => ({ status: 'ok' }));
    await api.register(mapsRoutes);
    await api.register(categoriesRoutes);
    await api.register(relationTypesRoutes);
    await api.register(nodesRoutes);
    await api.register(edgesRoutes);
    await api.register(tagsRoutes);
    await api.register(groupsRoutes);
    await api.register(authRoutes);
    await api.register(collaboratorsRoutes);
    await api.register(invitesRoutes);
  },
  { prefix: '/api' }
);

app.listen({ port: env.PORT, host: '0.0.0.0' }).catch((err) => {
  app.log.error(err);
  process.exit(1);
});
