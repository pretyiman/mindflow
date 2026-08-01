import type { FastifyRequest } from 'fastify';
import { prisma } from '../db.js';
import { NotFoundError } from '../errors.js';

export type MinRole = 'VIEWER' | 'EDITOR';

const ROLE_RANK: Record<MinRole, number> = { VIEWER: 1, EDITOR: 2 };

async function getMapOwner(mapId: string): Promise<{ ownerId: string | null }> {
  const map = await prisma.map.findUnique({ where: { id: mapId }, select: { ownerId: true } });
  if (!map) throw new NotFoundError('Map');
  return map;
}

async function checkMapAccess(userId: string, mapId: string, minRole: MinRole): Promise<void> {
  const map = await getMapOwner(mapId);
  if (map.ownerId === userId) return;

  const collaborator = await prisma.mapCollaborator.findUnique({
    where: { mapId_userId: { mapId, userId } }
  });
  if (collaborator && ROLE_RANK[collaborator.role] >= ROLE_RANK[minRole]) return;

  throw new NotFoundError('Map');
}

async function checkMapOwner(userId: string, mapId: string): Promise<void> {
  const map = await getMapOwner(mapId);
  if (map.ownerId !== userId) throw new NotFoundError('Map');
}

/** For routes with :mapId directly in the URL. Must run AFTER requireAuth -
 * relies on request.user already being set. */
export function requireMapAccess(minRole: MinRole = 'VIEWER') {
  return async (request: FastifyRequest<{ Params: { mapId: string } }>) => {
    await checkMapAccess(request.user!.id, request.params.mapId, minRole);
  };
}

/** For routes keyed by a resource id instead (e.g. /nodes/:id) - looks up
 * that resource's own mapId first, then applies the same check. Must run
 * AFTER requireAuth. */
export function requireResourceMapAccess(
  lookup: (id: string) => Promise<{ mapId: string } | null>,
  minRole: MinRole = 'VIEWER'
) {
  return async (request: FastifyRequest<{ Params: { id: string } }>) => {
    const resource = await lookup(request.params.id);
    if (!resource) throw new NotFoundError('Resource');
    await checkMapAccess(request.user!.id, resource.mapId, minRole);
  };
}

/** Owner-only gate for managing sharing itself (:mapId directly in the URL) -
 * a collaborator, even an EDITOR, can't grant further access. */
export function requireMapOwner() {
  return async (request: FastifyRequest<{ Params: { mapId: string } }>) => {
    await checkMapOwner(request.user!.id, request.params.mapId);
  };
}

/** Owner-only gate for a resource keyed by its own id (e.g. /collaborators/:id). */
export function requireResourceMapOwner(lookup: (id: string) => Promise<{ mapId: string } | null>) {
  return async (request: FastifyRequest<{ Params: { id: string } }>) => {
    const resource = await lookup(request.params.id);
    if (!resource) throw new NotFoundError('Resource');
    await checkMapOwner(request.user!.id, resource.mapId);
  };
}
