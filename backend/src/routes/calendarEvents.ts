import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { getVendorId } from '../middleware/auth';

const router = Router();
const prisma = new PrismaClient();
const prismaEvents = (prisma as any).calendar_events || (prisma as any).calendarEvents;

router.get('/', async (req, res) => {
  try {
    const vendorId = getVendorId(req);
    const data = await prismaEvents.findMany({
      where: { vendor_id: vendorId },
      orderBy: { date: 'asc' }
    });
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: 'Gagal' });
  }
});

router.get('/range', async (req, res) => {
  try {
    const vendorId = getVendorId(req);
    const { from, to } = req.query;
    const data = await prismaEvents.findMany({
      where: {
        vendor_id: vendorId,
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
    const vendorId = getVendorId(req);
    const data = await prismaEvents.create({ data: { ...req.body, vendor_id: vendorId } });
    res.status(201).json(data);
  } catch (error) {
    res.status(500).json({ error: 'Gagal' });
  }
});

router.patch('/:id', async (req, res) => {
  try {
    const vendorId = getVendorId(req);
    const existing = await prismaEvents.findFirst({ where: { id: Number(req.params.id), vendor_id: vendorId } });
    if (!existing) return res.status(404).json({ error: 'Not found' });
    const data = await prismaEvents.update({ where: { id: Number(req.params.id) }, data: req.body });
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: 'Gagal' });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const vendorId = getVendorId(req);
    const existing = await prismaEvents.findFirst({ where: { id: Number(req.params.id), vendor_id: vendorId } });
    if (!existing) return res.status(404).json({ error: 'Not found' });
    await prismaEvents.delete({ where: { id: Number(req.params.id) } });
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ error: 'Gagal' });
  }
});

export default router;
