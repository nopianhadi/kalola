import { Router } from 'express';
import { PrismaClient } from '@prisma/client';

const router = Router();
const prisma = new PrismaClient();
const prismaClientFeedback = (prisma as any).client_feedback || (prisma as any).clientFeedback;

router.get('/', async (req, res) => {
  try {
    const data = await prismaClientFeedback.findMany({ orderBy: { date: 'desc' } });
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: 'Gagal' });
  }
});

router.post('/', async (req, res) => {
  try {
    const data = await prismaClientFeedback.create({ data: req.body });
    res.status(201).json(data);
  } catch (error) {
    res.status(500).json({ error: 'Gagal' });
  }
});

export default router;

