import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { getVendorId } from '../middleware/auth';

const router = Router();
const prisma = new PrismaClient();
const prismaChecklists = (prisma as any).wedding_day_checklists || (prisma as any).weddingDayChecklists;
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
    const data = await prismaChecklists.findMany({
      where: { project_id: projectId },
      orderBy: { created_at: 'asc' },
    });
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: 'Gagal' });
  }
});

router.post('/upsert', async (req, res) => {
  try {
    const vendorId = getVendorId(req);
    const items = req.body;
    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: 'Payload harus berupa array' });
    }

    // Kumpulkan semua project_id unik dari payload
    const projectIds = [...new Set(items.map((i: any) => Number(i.project_id)).filter(Boolean))];
    // Verifikasi SEMUA project_id milik vendor ini
    for (const pid of projectIds) {
      if (!await assertProjectOwnership(pid, vendorId)) {
        return res.status(403).json({ error: `Akses ditolak untuk project ${pid}` });
      }
    }

    // Untuk item yang ada id-nya: verifikasi record itu memang milik salah satu project di atas
    const existingIds = items.filter((i: any) => i.id).map((i: any) => Number(i.id));
    if (existingIds.length > 0) {
      const existingRecords = await prismaChecklists.findMany({
        where: { id: { in: existingIds } },
        select: { id: true, project_id: true },
      });
      const projectIdSet = new Set(projectIds);
      for (const rec of existingRecords) {
        if (!projectIdSet.has(rec.project_id)) {
          return res.status(403).json({ error: `Record checklist ID ${rec.id} bukan milik project Anda.` });
        }
      }
      // Pastikan semua ID yang dikirim memang ada di DB (bukan ID rekayasa)
      const foundIds = new Set(existingRecords.map((r: any) => r.id));
      const missingId = existingIds.find(id => !foundIds.has(id));
      if (missingId) return res.status(404).json({ error: `Checklist ID ${missingId} tidak ditemukan.` });
    }

    const results = [];
    for (const item of items) {
      if (item.id) {
        const updated = await prismaChecklists.update({ where: { id: Number(item.id) }, data: item });
        results.push(updated);
      } else {
        const created = await prismaChecklists.create({ data: item });
        results.push(created);
      }
    }
    res.json(results);
  } catch (error) {
    res.status(500).json({ error: 'Gagal' });
  }
});

router.patch('/:id', async (req, res) => {
  try {
    const vendorId = getVendorId(req);
    const record = await prismaChecklists.findFirst({ where: { id: Number(req.params.id) } });
    if (!record) return res.status(404).json({ error: 'Not found' });
    if (record.project_id && !await assertProjectOwnership(record.project_id, vendorId)) {
      return res.status(403).json({ error: 'Akses ditolak' });
    }
    const data = await prismaChecklists.update({
      where: { id: Number(req.params.id) },
      data: req.body,
    });
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: 'Gagal' });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const vendorId = getVendorId(req);
    const record = await prismaChecklists.findFirst({ where: { id: Number(req.params.id) } });
    if (!record) return res.status(404).json({ error: 'Not found' });
    if (record.project_id && !await assertProjectOwnership(record.project_id, vendorId)) {
      return res.status(403).json({ error: 'Akses ditolak' });
    }
    await prismaChecklists.delete({ where: { id: Number(req.params.id) } });
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ error: 'Gagal' });
  }
});

router.post('/delete-by-category', async (req, res) => {
  try {
    const vendorId = getVendorId(req);
    const { projectId, category } = req.body;
    const projectIdNum = Number(projectId);
    if (!await assertProjectOwnership(projectIdNum, vendorId)) {
      return res.status(403).json({ error: 'Akses ditolak' });
    }
    await prismaChecklists.deleteMany({ where: { project_id: projectIdNum, category } });
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ error: 'Gagal' });
  }
});

router.post('/rename-category', async (req, res) => {
  try {
    const vendorId = getVendorId(req);
    const { projectId, oldCategory, newCategory } = req.body;
    const projectIdNum = Number(projectId);
    if (!await assertProjectOwnership(projectIdNum, vendorId)) {
      return res.status(403).json({ error: 'Akses ditolak' });
    }
    await prismaChecklists.updateMany({
      where: { project_id: projectIdNum, category: oldCategory },
      data: { category: newCategory, updated_at: new Date() },
    });
    res.status(200).send();
  } catch (error) {
    res.status(500).json({ error: 'Gagal' });
  }
});

export default router;
