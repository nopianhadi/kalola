import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function debug() {
  const clientId = '5e53ec21-3f8a-4247-95cb-82313af3a266';
  
  const client = await prisma.clients.findUnique({
    where: { id: clientId },
    include: {
      projects: {
        include: {
          transactions: true
        }
      }
    }
  });

  if (!client) {
    console.log('Client not found');
    return;
  }

  console.log('Client:', client.name);
  console.log('Projects count:', client.projects.length);

  client.projects.forEach(p => {
    console.log(`\nProject: ${p.project_name} (${p.id})`);
    console.log(`Amount Paid (stored): ${p.amount_paid}`);
    console.log(`Transactions count: ${p.transactions.length}`);
    const sum = p.transactions.reduce((acc, t) => acc + Number(t.amount), 0);
    console.log(`Transactions sum: ${sum}`);
    
    p.transactions.forEach(t => {
        console.log(`- ${t.date.toISOString().split('T')[0]}: ${t.amount} | ${t.description}`);
    });
  });
}

debug().catch(console.error).finally(() => prisma.$disconnect());
