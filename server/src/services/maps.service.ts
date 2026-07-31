import { prisma } from '../db.js';
import { NotFoundError } from '../errors.js';

export async function listMaps() {
  return prisma.map.findMany({ orderBy: { createdAt: 'desc' } });
}

export async function createMap(data: { name: string; description?: string }) {
  return prisma.map.create({ data });
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
