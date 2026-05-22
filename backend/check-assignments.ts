import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const count = await (prisma as any).project_team_assignments.count({
    where: { project_id: '77195c8e-17f9-4b2d-9d65-c4acd560846b' }
  });
  console.log('Assignments count for 77195c8e-17f9-4b2d-9d65-c4acd560846b:', count);
  await prisma.$disconnect();
}

main();
