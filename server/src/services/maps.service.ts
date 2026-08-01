import { prisma } from '../db.js';
import { NotFoundError } from '../errors.js';

export async function listMaps(userId: string) {
  const [maps, collaborations] = await Promise.all([
    prisma.map.findMany({
      where: { OR: [{ ownerId: userId }, { collaborators: { some: { userId } } }] },
      orderBy: { createdAt: 'desc' }
    }),
    prisma.mapCollaborator.findMany({ where: { userId }, select: { mapId: true, role: true } })
  ]);
  const roleByMapId = new Map(collaborations.map((c) => [c.mapId, c.role]));
  return maps.map((map) => ({
    ...map,
    myRole: map.ownerId === userId ? 'OWNER' : (roleByMapId.get(map.id) ?? 'VIEWER')
  }));
}

export async function createMap(ownerId: string, data: { name: string; description?: string }) {
  const map = await prisma.map.create({ data: { ...data, ownerId } });
  // So a brand-new map can be connected immediately, the same way a node
  // doesn't require a category to exist first - relies on RelationType's own
  // schema defaults (solid line, directional, #cccccc). Purely a starting
  // point: rename it or add more from Relation Types like any other.
  await prisma.relationType.create({ data: { mapId: map.id, name: 'Connection' } });
  return map;
}

export async function getMap(id: string) {
  const map = await prisma.map.findUnique({ where: { id } });
  if (!map) throw new NotFoundError('Map');
  return map;
}

export async function updateMap(id: string, data: { name?: string; description?: string }) {
  await getMap(id);
  return prisma.map.update({ where: { id }, data });
}

export async function deleteMap(id: string) {
  await getMap(id);
  await prisma.map.delete({ where: { id } });
}

export async function getGraph(mapId: string) {
  await getMap(mapId);
  const [categories, relationTypes, tags, nodesRaw, edges, groups] = await Promise.all([
    prisma.nodeCategory.findMany({ where: { mapId }, orderBy: { createdAt: 'asc' } }),
    prisma.relationType.findMany({ where: { mapId }, orderBy: { createdAt: 'asc' } }),
    prisma.tag.findMany({ where: { mapId }, orderBy: { createdAt: 'asc' } }),
    prisma.node.findMany({
      where: { mapId },
      orderBy: { createdAt: 'asc' },
      include: { nodeTags: { select: { tagId: true } } }
    }),
    prisma.edge.findMany({ where: { mapId }, orderBy: { createdAt: 'asc' } }),
    prisma.nodeGroup.findMany({ where: { mapId }, orderBy: { createdAt: 'asc' } })
  ]);
  const nodes = nodesRaw.map(({ nodeTags, ...node }) => ({
    ...node,
    tagIds: nodeTags.map((nt) => nt.tagId)
  }));
  return { categories, relationTypes, tags, nodes, edges, groups };
}
