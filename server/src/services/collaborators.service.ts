import { prisma } from '../db.js';
import { ConflictError, NotFoundError } from '../errors.js';

type Role = 'VIEWER' | 'EDITOR';

const userSelect = { id: true, email: true, name: true } as const;

export async function listCollaborators(mapId: string) {
  return prisma.mapCollaborator.findMany({
    where: { mapId },
    include: { user: { select: userSelect } },
    orderBy: { createdAt: 'asc' }
  });
}

export async function inviteCollaborator(mapId: string, ownerId: string, email: string, role: Role) {
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) throw new NotFoundError('User with that email');
  if (user.id === ownerId) throw new ConflictError('The map owner already has full access');

  const existing = await prisma.mapCollaborator.findUnique({
    where: { mapId_userId: { mapId, userId: user.id } }
  });
  if (existing) throw new ConflictError('This user is already a collaborator on this map');

  return prisma.mapCollaborator.create({
    data: { mapId, userId: user.id, role },
    include: { user: { select: userSelect } }
  });
}

export async function updateCollaboratorRole(id: string, role: Role) {
  const existing = await prisma.mapCollaborator.findUnique({ where: { id } });
  if (!existing) throw new NotFoundError('Collaborator');
  return prisma.mapCollaborator.update({
    where: { id },
    data: { role },
    include: { user: { select: userSelect } }
  });
}

export async function removeCollaborator(id: string) {
  const existing = await prisma.mapCollaborator.findUnique({ where: { id } });
  if (!existing) throw new NotFoundError('Collaborator');
  await prisma.mapCollaborator.delete({ where: { id } });
}
