import { Router } from 'express';
import { PrismaClient } from '@prisma/client';

const router = Router();
const prisma = new PrismaClient();
const prismaRecords = (prisma as any).team_payment_records || (prisma as any).teamPaymentRecords;

router.get('/', async (req, res) => {
  try {
    const data = await prismaRecords.findMany({ orderBy: { date: 'desc' } });
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: 'Gagal' });
  }
});

router.post('/', async (req, res) => {
  try {
    const record = await prismaRecords.create({ data: req.body });
    res.status(201).json(record);
  } catch (error) {
    res.status(500).json({ error: 'Gagal' });
  }
});

router.patch('/:id', async (req, res) => {
  try {
    const record = await prismaRecords.update({ where: { id: req.params.id }, data: req.body });
    res.json(record);
  } catch (error) {
    res.status(500).json({ error: 'Gagal' });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    await prismaRecords.delete({ where: { id: req.params.id } });
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ error: 'Gagal' });
  }
});

export default router;

