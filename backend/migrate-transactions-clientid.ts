import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function migrate() {
  console.log('Starting migration: populating client_id in transactions...');
  
  const transactions = await (prisma as any).transactions.findMany({
    where: { client_id: null },
    include: { projects: true }
  });

  console.log(`Found ${transactions.length} transactions with missing client_id.`);

  let updatedCount = 0;
  for (const tx of transactions) {
    if (tx.projects && tx.projects.client_id) {
      await (prisma as any).transactions.update({
        where: { id: tx.id },
        data: { client_id: tx.projects.client_id }
      });
      updatedCount++;
    }
  }

  console.log(`Migration complete. Updated ${updatedCount} transactions.`);
}

migrate().catch(console.error).finally(() => prisma.$disconnect());
