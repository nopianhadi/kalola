import { Router } from 'express';
import { PrismaClient } from '@prisma/client';

const router = Router();
const prisma = new PrismaClient();
const prismaAddOns = (prisma as any).add_ons;

router.get('/', async (req, res) => {
  try {
    const data = await prismaAddOns.findMany({ orderBy: { name: 'asc' } });
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: 'Gagal mengambil data' });
  }
});

router.post('/', async (req, res) => {
  try {
    const addon = await prismaAddOns.create({ data: req.body });
    res.status(201).json(addon);
  } catch (error) {
    res.status(500).json({ error: 'Gagal membuat data' });
  }
});

router.patch('/:id', async (req, res) => {
  try {
    const addon = await prismaAddOns.update({ where: { id: req.params.id }, data: req.body });
    res.json(addon);
  } catch (error) {
    res.status(500).json({ error: 'Gagal update data' });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    await prismaAddOns.delete({ where: { id: req.params.id } });
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ error: 'Gagal menghapus data' });
  }
});

export default router;

