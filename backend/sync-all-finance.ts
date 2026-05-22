import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function syncFinance(projectId: string) {
  const project = await (prisma as any).projects.findUnique({
    where: { id: projectId },
    include: { transactions: true }
  });
  
  if (!project) {
    console.log('Project not found');
    return;
  }

  const totalPaid = project.transactions.reduce((sum: number, t: any) => {
    return sum + Number(t.amount || 0);
  }, 0);

  const newStatus = totalPaid >= Number(project.total_cost) ? 'Lunas' : (totalPaid > 0 ? 'DP Terbayar' : 'Belum Bayar');

  console.log(`Project: ${project.project_name}`);
  console.log(`Total transactions: ${project.transactions.length}`);
  console.log(`Total paid (sum of transactions): Rp ${totalPaid.toLocaleString('id-ID')}`);
  console.log(`Current amount_paid in DB: Rp ${Number(project.amount_paid).toLocaleString('id-ID')}`);
  console.log(`New payment status: ${newStatus}`);
  
  await (prisma as any).projects.update({
    where: { id: projectId },
    data: {
      amount_paid: totalPaid,
      payment_status: newStatus
    }
  });

  console.log(`\n✅ Synced! amount_paid is now Rp ${totalPaid.toLocaleString('id-ID')}`);
}

// Sync all projects that have mismatched amount_paid
async function syncAll() {
  const projects = await (prisma as any).projects.findMany({
    include: { transactions: true }
  });

  console.log(`Found ${projects.length} projects.\n`);

  let fixed = 0;
  for (const project of projects) {
    const txSum = project.transactions.reduce((sum: number, t: any) => sum + Number(t.amount || 0), 0);
    const stored = Number(project.amount_paid || 0);
    
    if (Math.abs(txSum - stored) > 0.01) {
      console.log(`⚠️  Mismatch in "${project.project_name}":`);
      console.log(`   DB stored: Rp ${stored.toLocaleString('id-ID')}`);
      console.log(`   TX sum:    Rp ${txSum.toLocaleString('id-ID')}`);
      
      const newStatus = txSum >= Number(project.total_cost) ? 'Lunas' : (txSum > 0 ? 'DP Terbayar' : 'Belum Bayar');
      await (prisma as any).projects.update({
        where: { id: project.id },
        data: { amount_paid: txSum, payment_status: newStatus }
      });
      console.log(`   ✅ Fixed! New amount_paid: Rp ${txSum.toLocaleString('id-ID')}, status: ${newStatus}\n`);
      fixed++;
    }
  }

  if (fixed === 0) {
    console.log('✅ All projects are already in sync!');
  } else {
    console.log(`\n🏁 Done. Fixed ${fixed} project(s).`);
  }
}

syncAll().catch(console.error).finally(() => prisma.$disconnect());
