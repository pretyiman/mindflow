import { prisma } from '../db.js';
import { ConflictError, NotFoundError } from '../errors.js';

// Rough approximation of CustomNode's rendered box, plus room for the group's
// own header/label - only used to size a freshly-created box around its
// initial members; the user can drag the box afterward like any other node.
const NODE_WIDTH = 120;
const NODE_HEIGHT = 96;
const GROUP_PADDING = 50;
const GROUP_HEADER = 36;

type GroupUpdateInput = {
  name?: string;
  color?: string;
  posX?: number;
  posY?: number;
  width?: number;
  height?: number;
};

export async function listGroups(mapId: string) {
  return prisma.nodeGroup.findMany({ where: { mapId }, orderBy: { createdAt: 'asc' } });
}

/**
 * Wraps 2+ ungrouped nodes into one draggable box - purely visual/organizational,
 * never touches edges. Each member keeps its own independent identity; only its
 * posX/posY changes meaning, from absolute canvas coordinates to coordinates
 * relative to the new group (matching React Flow's own parent/child convention),
 * so nothing has to be converted again at render time.
 */
export async function createGroup(mapId: string, data: { nodeIds: string[]; name?: string; color?: string }) {
  if (data.nodeIds.length < 2) throw new ConflictError('Select at least 2 nodes to group');

  return prisma.$transaction(async (tx) => {
    const nodes = await tx.node.findMany({ where: { id: { in: data.nodeIds } } });
    if (nodes.length !== new Set(data.nodeIds).size) throw new NotFoundError('One or more nodes');
    if (nodes.some((n) => n.mapId !== mapId)) throw new ConflictError('Nodes belong to a different map');
    if (nodes.some((n) => n.groupId)) {
      throw new ConflictError('One or more nodes are already in a group - ungroup first');
    }

    const xs = nodes.map((n) => n.posX ?? 0);
    const ys = nodes.map((n) => n.posY ?? 0);
    const minX = Math.min(...xs) - GROUP_PADDING;
    const minY = Math.min(...ys) - GROUP_PADDING - GROUP_HEADER;
    const maxX = Math.max(...xs) + NODE_WIDTH + GROUP_PADDING;
    const maxY = Math.max(...ys) + NODE_HEIGHT + GROUP_PADDING;

    const group = await tx.nodeGroup.create({
      data: {
        mapId,
        name: data.name ?? '',
        color: data.color ?? '#4a4a6a',
        posX: minX,
        posY: minY,
        width: maxX - minX,
        height: maxY - minY
      }
    });

    await Promise.all(
      nodes.map((n) =>
        tx.node.update({
          where: { id: n.id },
          data: {
            groupId: group.id,
            posX: (n.posX ?? 0) - minX,
            posY: (n.posY ?? 0) - minY
          }
        })
      )
    );

    return group;
  });
}

async function getGroupOrThrow(id: string) {
  const group = await prisma.nodeGroup.findUnique({ where: { id } });
  if (!group) throw new NotFoundError('Group');
  return group;
}

export async function updateGroup(id: string, data: GroupUpdateInput) {
  await getGroupOrThrow(id);
  return prisma.nodeGroup.update({ where: { id }, data });
}

/** Ungroups (never deletes) every member, converting each back to an absolute
 * position first so nothing visually jumps once it's independent again. */
export async function deleteGroup(id: string) {
  const group = await getGroupOrThrow(id);

  return prisma.$transaction(async (tx) => {
    const members = await tx.node.findMany({ where: { groupId: id } });
    await Promise.all(
      members.map((n) =>
        tx.node.update({
          where: { id: n.id },
          data: {
            groupId: null,
            posX: (n.posX ?? 0) + group.posX,
            posY: (n.posY ?? 0) + group.posY
          }
        })
      )
    );
    await tx.nodeGroup.delete({ where: { id } });
  });
}
