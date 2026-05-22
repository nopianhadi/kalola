import { Router } from 'express';
import { PrismaClient } from '@prisma/client';

const router = Router();
const prisma = new PrismaClient();
const prismaPromoCodes = (prisma as any).promo_codes || (prisma as any).promoCodes;

router.get('/', async (req, res) => {
  try {
    const data = await prismaPromoCodes.findMany({ orderBy: { code: 'asc' } });
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: 'Gagal mengambil data' });
  }
});

router.post('/', async (req, res) => {
  try {
    const promo = await prismaPromoCodes.create({ data: req.body });
    res.status(201).json(promo);
  } catch (error) {
    res.status(500).json({ error: 'Gagal membuat data' });
  }
});

router.patch('/:id', async (req, res) => {
  try {
    const promo = await prismaPromoCodes.update({ where: { id: req.params.id }, data: req.body });
    res.json(promo);
  } catch (error) {
    res.status(500).json({ error: 'Gagal update data' });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    await prismaPromoCodes.delete({ where: { id: req.params.id } });
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ error: 'Gagal menghapus data' });
  }
});

export default router;

