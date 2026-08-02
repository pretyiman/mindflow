import type { Prisma } from '@prisma/client';
import { prisma } from '../db.js';
import { NotFoundError } from '../errors.js';
import { resizeGroupToFitMembers } from './groups.service.js';

type NodeInput = {
  categoryId?: string | null;
  name: string;
  iconOverride?: string | null;
  colorOverride?: string | null;
  notes?: string;
  properties?: Record<string, unknown>;
  posX?: number | null;
  posY?: number | null;
};

type NodeUpdateInput = Partial<NodeInput>;

export async function listNodes(mapId: string) {
  return prisma.node.findMany({ where: { mapId }, orderBy: { createdAt: 'asc' } });
}

async function assertCategoryBelongsToMap(
  client: Prisma.TransactionClient,
  mapId: string,
  categoryId: string
) {
  const category = await client.nodeCategory.findUnique({ where: { id: categoryId } });
  if (!category || category.mapId !== mapId) throw new NotFoundError('Category');
}

export async function createNode(mapId: string, data: NodeInput) {
  return prisma.$transaction(async (tx) => {
    if (data.categoryId) await assertCategoryBelongsToMap(tx, mapId, data.categoryId);

    return tx.node.create({
      data: {
        mapId,
        categoryId: data.categoryId ?? null,
        name: data.name,
        iconOverride: data.iconOverride,
        colorOverride: data.colorOverride,
        notes: data.notes ?? '',
        properties: (data.properties ?? {}) as Prisma.InputJsonValue,
        posX: data.posX,
        posY: data.posY
      }
    });
  });
}

async function getNodeOrThrow(id: string) {
  const node = await prisma.node.findUnique({ where: { id } });
  if (!node) throw new NotFoundError('Node');
  return node;
}

export async function updateNode(id: string, data: NodeUpdateInput) {
  const existing = await getNodeOrThrow(id);

  const updated = await prisma.$transaction(async (tx) => {
    if (data.categoryId) await assertCategoryBelongsToMap(tx, existing.mapId, data.categoryId);

    return tx.node.update({
      where: { id },
      data: {
        categoryId: data.categoryId,
        name: data.name,
        iconOverride: data.iconOverride,
        colorOverride: data.colorOverride,
        notes: data.notes,
        properties: data.properties as Prisma.InputJsonValue | undefined,
        posX: data.posX,
        posY: data.posY
      }
    });
  });

  // A grouped node stays independently draggable, and its name drives the
  // group's own width - either changing means the box may need to resize,
  // so re-fit it around the group's current members whenever either happens.
  if (existing.groupId && (data.posX !== undefined || data.posY !== undefined || data.name !== undefined)) {
    await resizeGroupToFitMembers(existing.groupId);
  }

  return updated;
}

export async function deleteNode(id: string) {
  await getNodeOrThrow(id);
  // DB-level cascade (see schema.prisma) removes dependent edges regardless of
  // which side (source/target) the deleted node was on.
  await prisma.node.delete({ where: { id } });
}

export async function setNodeTags(nodeId: string, tagIds: string[]) {
  const node = await getNodeOrThrow(nodeId);

  if (tagIds.length > 0) {
    const validCount = await prisma.tag.count({ where: { id: { in: tagIds }, mapId: node.mapId } });
    if (validCount !== new Set(tagIds).size) {
      throw new NotFoundError('One or more tags');
    }
  }

  await prisma.$transaction([
    prisma.nodeTag.deleteMany({ where: { nodeId } }),
    prisma.nodeTag.createMany({ data: tagIds.map((tagId) => ({ nodeId, tagId })) })
  ]);

  return { nodeId, tagIds };
}
