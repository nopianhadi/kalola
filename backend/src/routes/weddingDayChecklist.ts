import { Router } from 'express';
import { PrismaClient } from '@prisma/client';

const router = Router();
const prisma = new PrismaClient();
const prismaChecklists = (prisma as any).wedding_day_checklists || (prisma as any).weddingDayChecklists;

router.get('/:projectId', async (req, res) => {
  try {
    const data = await prismaChecklists.findMany({
      where: { project_id: req.params.projectId },
      orderBy: { created_at: 'asc' }
    });
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: 'Gagal' });
  }
});

router.post('/upsert', async (req, res) => {
  try {
    const items = req.body;
    const results = [];
    for (const item of items) {
      if (item.id) {
        const res = await prismaChecklists.update({ where: { id: item.id }, data: item });
        results.push(res);
      } else {
        const res = await prismaChecklists.create({ data: item });
        results.push(res);
      }
    }
    res.json(results);
  } catch (error) {
    res.status(500).json({ error: 'Gagal' });
  }
});

router.patch('/:id', async (req, res) => {
  try {
    const data = await prismaChecklists.update({ where: { id: req.params.id }, data: req.body });
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: 'Gagal' });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    await prismaChecklists.delete({ where: { id: req.params.id } });
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ error: 'Gagal' });
  }
});

router.post('/delete-by-category', async (req, res) => {
  try {
    const { projectId, category } = req.body;
    await prismaChecklists.deleteMany({ where: { project_id: projectId, category } });
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ error: 'Gagal' });
  }
});

router.post('/rename-category', async (req, res) => {
  try {
    const { projectId, oldCategory, newCategory } = req.body;
    await prismaChecklists.updateMany({
      where: { project_id: projectId, category: oldCategory },
      data: { category: newCategory, updated_at: new Date() }
    });
    res.status(200).send();
  } catch (error) {
    res.status(500).json({ error: 'Gagal' });
  }
});

export default router;

