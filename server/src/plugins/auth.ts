import type { FastifyReply, FastifyRequest } from 'fastify';
import jwt from 'jsonwebtoken';
import { env } from '../env.js';
import { UnauthorizedError } from '../errors.js';

declare module 'fastify' {
  interface FastifyRequest {
    user?: { id: string };
  }
}

/**
 * Verifies the Authorization: Bearer <jwt> header and attaches request.user.
 * A preHandler you opt a route into - not applied globally, and not yet
 * applied to any existing route (that's Phase 1b, deliberately separate so
 * auth can be verified working in isolation first).
 */
export async function requireAuth(request: FastifyRequest, _reply: FastifyReply) {
  const header = request.headers.authorization;
  if (!header?.startsWith('Bearer ')) {
    throw new UnauthorizedError('Missing or invalid Authorization header');
  }

  const token = header.slice('Bearer '.length);
  try {
    const payload = jwt.verify(token, env.JWT_SECRET) as jwt.JwtPayload;
    if (typeof payload.sub !== 'string') throw new Error('Missing sub claim');
    request.user = { id: payload.sub };
  } catch {
    throw new UnauthorizedError('Invalid or expired token');
  }
}
