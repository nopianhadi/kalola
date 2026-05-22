import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const projects = await (prisma as any).projects.findMany({
    select: { id: true, project_name: true, booking_status: true, status: true }
  });
  console.log('Current Projects:');
  console.table(projects);
  await prisma.$disconnect();
}

main();
