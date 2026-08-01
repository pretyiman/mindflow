import { prisma } from '../db.js';
import { ConflictError, NotFoundError } from '../errors.js';
import { createInvite } from './invites.service.js';

type Role = 'VIEWER' | 'EDITOR';

const userSelect = { id: true, email: true, name: true } as const;

export async function listCollaborators(mapId: string) {
  return prisma.mapCollaborator.findMany({
    where: { mapId },
    include: { user: { select: userSelect } },
    orderBy: { createdAt: 'asc' }
  });
}

// Doesn't require the invited email to already have an account, and doesn't
// grant access instantly - it creates a pending invite (see
// invites.service.ts). The recipient logs in and accepts it themselves,
// either from the email address it was created for or from the link the
// owner hands them directly.
export async function inviteCollaborator(mapId: string, ownerId: string, email: string, role: Role) {
  const owner = await prisma.user.findUnique({ where: { id: ownerId } });
  if (owner?.email === email) throw new ConflictError('The map owner already has full access');

  const existingUser = await prisma.user.findUnique({ where: { email } });
  if (existingUser) {
    const existing = await prisma.mapCollaborator.findUnique({
      where: { mapId_userId: { mapId, userId: existingUser.id } }
    });
    if (existing) throw new ConflictError('This user is already a collaborator on this map');
  }

  return createInvite(mapId, email, role);
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
