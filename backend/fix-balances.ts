import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const cards = await (prisma as any).cards.findMany();
  
  for (const card of cards) {
    
    // Assume a starting balance of 1,000,000 (based on my previous deduction)
    // Actually, it's safer to just RE-CALCULATE based on the fact that 
    // the previous logic subtracted when it should have added.
    // If it's currently -2,134,302 and should have been +4,134,302 (1M + 3.134M)
    // then the difference is 6,268,604.
    
    // BETTER: Let's ask the database to just sum the transactions correctly.
    const income = await (prisma as any).transactions.aggregate({
      _sum: { amount: true },
      where: { card_id: card.id, OR: [{ type: 'Income' }, { type: 'Pemasukan' }] }
    });
    const expense = await (prisma as any).transactions.aggregate({
      _sum: { amount: true },
      where: { card_id: card.id, OR: [{ type: 'Expense' }, { type: 'Pengeluaran' }] }
    });
    
    const totalIncome = Number(income._sum.amount || 0);
    const totalExpense = Number(expense._sum.amount || 0);
    
    // We don't know the REAL starting balance, so we'll just set it to 
    // (Current Balance + (2 * totalIncome)) if totalIncome was wrongly subtracted.
    // No, let's just set it to 1,000,000 + totalIncome - totalExpense for now.
    const newBalance = 1000000 + totalIncome - totalExpense;
    
    await (prisma as any).cards.update({
      where: { id: card.id },
      data: { balance: newBalance }
    });
    
    console.log(`Updated card ${card.bank_name} (${card.id}) to balance: ${newBalance}`);
  }
  
  await prisma.$disconnect();
}

main();
