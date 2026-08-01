import { randomBytes } from 'node:crypto';
import { prisma } from '../db.js';
import { ConflictError, NotFoundError } from '../errors.js';

type Role = 'VIEWER' | 'EDITOR';

export async function createInvite(mapId: string, email: string, role: Role) {
  const token = randomBytes(24).toString('base64url');
  return prisma.mapInvite.create({ data: { mapId, email, role, token } });
}

export async function listPendingInvites(mapId: string) {
  return prisma.mapInvite.findMany({
    where: { mapId, acceptedAt: null },
    orderBy: { createdAt: 'asc' }
  });
}

async function getInviteByToken(token: string) {
  const invite = await prisma.mapInvite.findUnique({
    where: { token },
    include: { map: { select: { id: true, name: true, ownerId: true } } }
  });
  if (!invite) throw new NotFoundError('Invite');
  return invite;
}

export async function getInvite(token: string) {
  const invite = await getInviteByToken(token);
  return {
    mapId: invite.map.id,
    mapName: invite.map.name,
    role: invite.role,
    accepted: invite.acceptedAt !== null
  };
}

export async function acceptInvite(token: string, userId: string) {
  const invite = await getInviteByToken(token);
  if (invite.acceptedAt) throw new ConflictError('This invite link has already been used');
  if (invite.map.ownerId === userId) throw new ConflictError('You already own this map');

  await prisma.$transaction([
    prisma.mapCollaborator.upsert({
      where: { mapId_userId: { mapId: invite.mapId, userId } },
      create: { mapId: invite.mapId, userId, role: invite.role },
      update: { role: invite.role }
    }),
    prisma.mapInvite.update({ where: { id: invite.id }, data: { acceptedAt: new Date() } })
  ]);

  return { mapId: invite.mapId };
}

export async function removeInvite(id: string) {
  const invite = await prisma.mapInvite.findUnique({ where: { id } });
  if (!invite) throw new NotFoundError('Invite');
  await prisma.mapInvite.delete({ where: { id } });
}
