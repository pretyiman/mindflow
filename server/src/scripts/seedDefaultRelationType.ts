// One-time backfill: createMap now seeds a default "Connection" relation
// type so new maps can be connected immediately, but maps created before
// that change may still have zero relation types. Safe to re-run - it only
// ever touches maps that still have none.
import { prisma } from '../db.js';

async function main() {
  const maps = await prisma.map.findMany({
    where: { relationTypes: { none: {} } },
    select: { id: true, name: true }
  });

  for (const map of maps) {
    await prisma.relationType.create({ data: { mapId: map.id, name: 'Connection' } });
  }

  console.log(`Seeded a default relation type on ${maps.length} map(s).`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
