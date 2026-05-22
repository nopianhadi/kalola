import { Router } from 'express';
import { PrismaClient } from '@prisma/client';

const router = Router();
const prisma = new PrismaClient();
const prismaEvents = (prisma as any).calendar_events || (prisma as any).calendarEvents;

router.get('/', async (req, res) => {
  try {
    const data = await prismaEvents.findMany({ orderBy: { date: 'asc' } });
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: 'Gagal' });
  }
});

router.get('/range', async (req, res) => {
  try {
    const { from, to } = req.query;
    const data = await prismaEvents.findMany({
      where: {
        date: {
          gte: from ? new Date(String(from)) : undefined,
          lte: to ? new Date(String(to)) : undefined,
        }
      },
      orderBy: { date: 'asc' }
    });
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: 'Gagal' });
  }
});

router.post('/', async (req, res) => {
  try {
    const data = await prismaEvents.create({ data: req.body });
    res.status(201).json(data);
  } catch (error) {
    res.status(500).json({ error: 'Gagal' });
  }
});

router.patch('/:id', async (req, res) => {
  try {
    const data = await prismaEvents.update({ where: { id: req.params.id }, data: req.body });
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: 'Gagal' });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    await prismaEvents.delete({ where: { id: req.params.id } });
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ error: 'Gagal' });
  }
});

export default router;

