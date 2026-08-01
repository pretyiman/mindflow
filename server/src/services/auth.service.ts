import jwt from 'jsonwebtoken';
import { prisma } from '../db.js';
import { env } from '../env.js';
import { ConflictError, NotFoundError, UnauthorizedError } from '../errors.js';
import { hashPassword, verifyPassword } from '../lib/password.js';

type RegisterInput = { email: string; password: string; name?: string };
type LoginInput = { email: string; password: string };

function signToken(userId: string): string {
  return jwt.sign({ sub: userId }, env.JWT_SECRET, { expiresIn: env.JWT_EXPIRY } as jwt.SignOptions);
}

function toPublicUser(user: { id: string; email: string; name: string | null }) {
  return { id: user.id, email: user.email, name: user.name };
}

export async function register(data: RegisterInput) {
  const existing = await prisma.user.findUnique({ where: { email: data.email } });
  if (existing) throw new ConflictError('An account with this email already exists');

  const passwordHash = await hashPassword(data.password);
  const user = await prisma.user.create({
    data: { email: data.email, passwordHash, name: data.name }
  });
  return { user: toPublicUser(user), token: signToken(user.id) };
}

export async function login(data: LoginInput) {
  const user = await prisma.user.findUnique({ where: { email: data.email } });
  if (!user) throw new UnauthorizedError('Invalid email or password');

  const valid = await verifyPassword(data.password, user.passwordHash);
  if (!valid) throw new UnauthorizedError('Invalid email or password');

  return { user: toPublicUser(user), token: signToken(user.id) };
}

export async function me(userId: string) {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw new NotFoundError('User');
  return toPublicUser(user);
}
