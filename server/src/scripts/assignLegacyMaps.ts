// One-time migration: before accounts existed, every map had ownerId = null.
// Assigns all of them to whichever user registered first, so nothing becomes
// orphaned the moment ownership enforcement goes live. Safe to re-run - it
// only ever touches maps that are still unowned.
import { prisma } from '../db.js';

async function main() {
  const firstUser = await prisma.user.findFirst({ orderBy: { createdAt: 'asc' } });
  if (!firstUser) {
    console.log('No users exist yet - register an account first, then re-run this script.');
    return;
  }

  const result = await prisma.map.updateMany({
    where: { ownerId: null },
    data: { ownerId: firstUser.id }
  });

  console.log(`Assigned ${result.count} previously-unowned map(s) to ${firstUser.email}.`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
