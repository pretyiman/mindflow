import { prisma } from '../db.js';
import { ConflictError, NotFoundError } from '../errors.js';

export async function listCategories(mapId: string) {
  return prisma.nodeCategory.findMany({ where: { mapId }, orderBy: { createdAt: 'asc' } });
}

export async function createCategory(
  mapId: string,
  data: { name: string; icon?: string; color?: string }
) {
  try {
    return await prisma.nodeCategory.create({ data: { mapId, ...data } });
  } catch (err: any) {
    if (err?.code === 'P2002') {
      throw new ConflictError(`A category named "${data.name}" already exists in this map`);
    }
    if (err?.code === 'P2003') {
      throw new NotFoundError('Map');
    }
    throw err;
  }
}

async function getCategoryOrThrow(id: string) {
  const category = await prisma.nodeCategory.findUnique({ where: { id } });
  if (!category) throw new NotFoundError('Category');
  return category;
}

export async function updateCategory(
  id: string,
  data: { name?: string; icon?: string; color?: string }
) {
  await getCategoryOrThrow(id);
  try {
    return await prisma.nodeCategory.update({ where: { id }, data });
  } catch (err: any) {
    if (err?.code === 'P2002') {
      throw new ConflictError(`A category named "${data.name}" already exists in this map`);
    }
    throw err;
  }
}

export async function deleteCategory(id: string, force: boolean) {
  await getCategoryOrThrow(id);
  const nodeCount = await prisma.node.count({ where: { categoryId: id } });
  if (nodeCount > 0 && !force) {
    throw new ConflictError(
      `Category is used by ${nodeCount} node(s). Pass force=true to delete the category (those nodes become uncategorized, not deleted).`,
      { nodeCount }
    );
  }
  if (nodeCount > 0) {
    // Category is optional now - deleting it should free the nodes, not destroy them.
    await prisma.node.updateMany({ where: { categoryId: id }, data: { categoryId: null } });
  }
  await prisma.nodeCategory.delete({ where: { id } });
}
