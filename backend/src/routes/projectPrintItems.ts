import { Router } from 'express';
import { PrismaClient } from '@prisma/client';

const router = Router();
const prisma = new PrismaClient();
const prismaPrintItems = (prisma as any).project_print_items || (prisma as any).projectPrintItems;

router.get('/:projectId', async (req, res) => {
  try {
    const data = await prismaPrintItems.findMany({ where: { project_id: req.params.projectId } });
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: 'Gagal' });
  }
});

router.post('/:projectId/upsert', async (req, res) => {
  try {
    const { projectId } = req.params;
    const items = req.body;
    
    await prisma.$transaction(async (tx: any) => {
      const ptx = tx.project_print_items || tx.projectPrintItems;
      await ptx.deleteMany({ where: { project_id: projectId } });
      if (items && items.length > 0) {
        const rows = items.map((i: any) => ({
          project_id: projectId,
          item_type: i.type,
          custom_name: i.customName ?? null,
          details: i.details,
          cost: i.cost ?? 0,
        }));
        await ptx.createMany({ data: rows });
      }
    });
    res.status(200).send();
  } catch (error) {
    res.status(500).json({ error: 'Gagal' });
  }
});

router.delete('/:projectId', async (req, res) => {
  try {
    await prismaPrintItems.deleteMany({ where: { project_id: req.params.projectId } });
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ error: 'Gagal' });
  }
});

export default router;

