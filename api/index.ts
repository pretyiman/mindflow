import type { VercelRequest, VercelResponse } from '@vercel/node';
import type { FastifyInstance } from 'fastify';
import { createApp } from '../server/src/app.js';

// A single plain (non-dynamic) function handling every /api/* request -
// vercel.json explicitly rewrites all of /api/:path* here, rather than
// relying on a [...slug].ts filesystem catch-all, which turned out not to
// match multi-segment paths correctly in this project's setup (single-
// segment paths like /api/health worked, but /api/auth/me didn't - the
// resulting query param came through as the literal string "...slug"
// instead of a proper segment array, a sign the catch-all convention wasn't
// being parsed as intended here). An explicit rewrite sidesteps that
// entirely. Fastify's own HTTP server is a plain node:http server under the
// hood, so the documented way to hand it a request without actually
// listening on a port is to emit Node's own 'request' event directly - this
// is the standard "Fastify without .listen()" serverless pattern.
let appPromise: Promise<FastifyInstance> | null = null;

async function getApp() {
  if (!appPromise) {
    appPromise = createApp().then(async (app) => {
      await app.ready();
      return app;
    });
  }
  return appPromise;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const app = await getApp();
  app.server.emit('request', req, res);
}
