import { Router } from 'express';
import { PrismaClient } from '@prisma/client';

const router = Router();
const prisma = new PrismaClient();
const prismaPackages = (prisma as any).packages || (prisma as any).package;

router.get('/', async (req, res) => {
  try {
    const data = await prismaPackages.findMany({ orderBy: { name: 'asc' } });
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: 'Gagal mengambil data' });
  }
});

router.post('/', async (req, res) => {
  try {
    const pkg = await prismaPackages.create({ data: req.body });
    res.status(201).json(pkg);
  } catch (error) {
    res.status(500).json({ error: 'Gagal membuat data' });
  }
});

router.patch('/:id', async (req, res) => {
  try {
    const pkg = await prismaPackages.update({ where: { id: Number(req.params.id) }, data: req.body });
    res.json(pkg);
  } catch (error) {
    res.status(500).json({ error: 'Gagal update data' });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    await prismaPackages.delete({ where: { id: Number(req.params.id) } });
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ error: 'Gagal menghapus data' });
  }
});

export default router;

