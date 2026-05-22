import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const prismaTransactions = (prisma as any).transactions;

async function fixAll() {
  try {
    const targetProjectId = '77195c8e-17f9-4b2d-9d65-c4acd560846b';
    
    // Fix ALL orphaned transactions for Hadi7y645's project
    const result = await prismaTransactions.updateMany({
      where: { 
        project_id: null,
        description: { contains: 'Hadi7y645' }
      },
      data: { 
        project_id: targetProjectId
      }
    });
    
    console.log(`✅ Fixed ${result.count} orphaned transactions -> linked to project ${targetProjectId}`);
    
    // Verify
    const allForProject = await prismaTransactions.findMany({
      where: { project_id: targetProjectId },
      orderBy: { created_at: 'desc' }
    });
    console.log(`\nTotal transactions now linked to project: ${allForProject.length}`);
    allForProject.forEach((t: any) => {
      console.log(`  ${t.id} | Rp ${Number(t.amount).toLocaleString('id-ID')}`);
    });
    
  } catch (e: any) {
    console.error('Error:', e.message);
  } finally {
    await prisma.$disconnect();
  }
}

fixAll();
