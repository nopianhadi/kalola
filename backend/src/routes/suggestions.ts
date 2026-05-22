import { Router } from 'express';
import { PrismaClient } from '@prisma/client';

const router = Router();
const prisma = new PrismaClient();
const prismaSuggestions = (prisma as any).suggestions || (prisma as any).suggestion;

router.get('/', async (req, res) => {
  try {
    const data = await prismaSuggestions.findMany({ orderBy: { date: 'desc' } });
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: 'Gagal' });
  }
});

router.post('/', async (req, res) => {
  try {
    const data = await prismaSuggestions.create({ data: req.body });
    res.status(201).json(data);
  } catch (error) {
    res.status(500).json({ error: 'Gagal' });
  }
});

export default router;

