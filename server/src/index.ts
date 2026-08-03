import fs from 'node:fs';
import path from 'node:path';
import cors from '@fastify/cors';
import fastifyStatic from '@fastify/static';
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

// In dev, Vite's own dev server serves the client (see vite.config.ts's proxy).
// In production there's no separate frontend host - this process runs with
// cwd = server/ (npm workspaces convention), so client/dist sits one level
// up. Only registered when that build actually exists, so a plain dev/test
// run of the compiled server never needs it.
const clientDistPath = path.resolve(process.cwd(), '../client/dist');
if (fs.existsSync(clientDistPath)) {
  await app.register(fastifyStatic, { root: clientDistPath });
  // SPA fallback: any GET that isn't a static asset or an /api/* route (e.g.
  // a hard refresh on /invite/:token) still gets index.html, so client-side
  // routing can take over. API 404s must stay JSON, not fall into this.
  app.setNotFoundHandler((request, reply) => {
    if (request.method === 'GET' && !request.url.startsWith('/api')) {
      reply.sendFile('index.html');
      return;
    }
    reply.status(404).send({ error: { code: 'NOT_FOUND', message: 'Not found' } });
  });
}

app.listen({ port: env.PORT, host: '0.0.0.0' }).catch((err) => {
  app.log.error(err);
  process.exit(1);
});
