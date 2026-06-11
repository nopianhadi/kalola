import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { getVendorId } from '../middleware/auth';

const router = Router();
const prisma = new PrismaClient();
const prismaPrintItems = (prisma as any).project_print_items || (prisma as any).projectPrintItems;
const prismaProjects = (prisma as any).projects;

/** Helper: pastikan project_id milik vendor yang login */
async function assertProjectOwnership(projectId: number, vendorId: number): Promise<boolean> {
  const project = await prismaProjects.findFirst({
    where: { id: projectId, vendor_id: vendorId },
  });
  return !!project;
}

router.get('/:projectId', async (req, res) => {
  try {
    const vendorId = getVendorId(req);
    const projectId = Number(req.params.projectId);
    if (!await assertProjectOwnership(projectId, vendorId)) {
      return res.status(403).json({ error: 'Akses ditolak' });
    }
    const data = await prismaPrintItems.findMany({ where: { project_id: projectId } });
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: 'Gagal' });
  }
});

router.post('/:projectId/upsert', async (req, res) => {
  try {
    const vendorId = getVendorId(req);
    const projectId = Number(req.params.projectId);
    if (!await assertProjectOwnership(projectId, vendorId)) {
      return res.status(403).json({ error: 'Akses ditolak' });
    }

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
    const vendorId = getVendorId(req);
    const projectId = Number(req.params.projectId);
    if (!await assertProjectOwnership(projectId, vendorId)) {
      return res.status(403).json({ error: 'Akses ditolak' });
    }
    await prismaPrintItems.deleteMany({ where: { project_id: projectId } });
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ error: 'Gagal' });
  }
});

export default router;
