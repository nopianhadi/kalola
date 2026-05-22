import { Router } from 'express';
import { PrismaClient } from '@prisma/client';

const router = Router();
const prisma = new PrismaClient();
const prismaNotifications = (prisma as any).notifications || (prisma as any).notification;

router.get('/', async (req, res) => {
  try {
    const data = await prismaNotifications.findMany({ orderBy: { timestamp: 'desc' } });
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: 'Gagal' });
  }
});

router.post('/', async (req, res) => {
  try {
    const data = await prismaNotifications.create({ data: req.body });
    res.status(201).json(data);
  } catch (error) {
    res.status(500).json({ error: 'Gagal' });
  }
});

router.patch('/:id', async (req, res) => {
  try {
    const data = await prismaNotifications.update({ where: { id: req.params.id }, data: req.body });
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: 'Gagal' });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    await prismaNotifications.delete({ where: { id: req.params.id } });
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ error: 'Gagal' });
  }
});

router.post('/mark-all-read', async (req, res) => {
  try {
    await prismaNotifications.updateMany({
      where: { is_read: false },
      data: { is_read: true }
    });
    res.status(200).send();
  } catch (error) {
    res.status(500).json({ error: 'Gagal' });
  }
});

export default router;

