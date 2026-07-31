import { prisma } from '../db.js';
import { ConflictError, NotFoundError } from '../errors.js';

type RelationTypeInput = {
  name: string;
  isDirectional?: boolean;
  isHierarchy?: boolean;
  color?: string;
  lineStyle?: string;
  maxOutgoingPerSource?: number | null;
  maxIncomingPerTarget?: number | null;
};

export async function listRelationTypes(mapId: string) {
  return prisma.relationType.findMany({ where: { mapId }, orderBy: { createdAt: 'asc' } });
}

export async function createRelationType(mapId: string, data: RelationTypeInput) {
  try {
    return await prisma.relationType.create({ data: { mapId, ...data } });
  } catch (err: any) {
    if (err?.code === 'P2002') {
      throw new ConflictError(`A relation type named "${data.name}" already exists in this map`);
    }
    if (err?.code === 'P2003') {
      throw new NotFoundError('Map');
    }
    throw err;
  }
}

async function getRelationTypeOrThrow(id: string) {
  const relationType = await prisma.relationType.findUnique({ where: { id } });
  if (!relationType) throw new NotFoundError('Relation type');
  return relationType;
}

export async function updateRelationType(id: string, data: Partial<RelationTypeInput>) {
  await getRelationTypeOrThrow(id);
  try {
    return await prisma.relationType.update({ where: { id }, data });
  } catch (err: any) {
    if (err?.code === 'P2002') {
      throw new ConflictError(`A relation type named "${data.name}" already exists in this map`);
    }
    throw err;
  }
}

export async function deleteRelationType(id: string, force: boolean) {
  await getRelationTypeOrThrow(id);
  const edgeCount = await prisma.edge.count({ where: { relationTypeId: id } });
  if (edgeCount > 0 && !force) {
    throw new ConflictError(
      `Relation type is used by ${edgeCount} edge(s). Pass force=true to delete the relation type and all its edges.`,
      { edgeCount }
    );
  }
  if (edgeCount > 0) {
    await prisma.edge.deleteMany({ where: { relationTypeId: id } });
  }
  await prisma.relationType.delete({ where: { id } });
}
