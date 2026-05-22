import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const transactions = await (prisma as any).transactions.findMany({
    orderBy: { date: 'desc' }
  });
  const cards = await (prisma as any).cards.findMany();
  
  console.log('Transactions:');
  console.table(transactions.map((t: any) => ({
    id: t.id,
    date: t.date,
    desc: t.description,
    amount: Number(t.amount),
    type: t.type,
    card_id: t.card_id
  })));

  console.log('Cards:');
  console.table(cards.map((c: any) => ({
    id: c.id,
    bank: c.bank_name,
    balance: Number(c.balance)
  })));

  await prisma.$disconnect();
}

main();
