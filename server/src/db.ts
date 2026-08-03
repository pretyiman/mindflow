import { PrismaClient } from '@prisma/client';
import { PrismaNeon } from '@prisma/adapter-neon';
import { Pool } from '@neondatabase/serverless';

// Vercel's serverless functions can't hold many concurrent raw TCP
// connections the way a long-running process (local dev, Render) can, and
// Prisma's default binary query engine needs a platform-matched native
// binary that's fragile to pin correctly on Lambda. The Neon adapter
// sidesteps both by querying over HTTP/WebSocket instead - so it's used
// only when actually running on Vercel (which sets VERCEL=1), everywhere
// else keeps the plain client that's already verified working.
export const prisma = process.env.VERCEL
  ? new PrismaClient({ adapter: new PrismaNeon(new Pool({ connectionString: process.env.DATABASE_URL! })) })
  : new PrismaClient();
