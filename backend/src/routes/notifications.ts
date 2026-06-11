import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { getVendorId } from '../middleware/auth';

const router = Router();
const prisma = new PrismaClient();
const prismaNotifications = (prisma as any).notifications || (prisma as any).notification;

router.get('/', async (req, res) => {
  try {
    const vendorId = getVendorId(req);
    const data = await prismaNotifications.findMany({
      where: { vendor_id: vendorId },
      orderBy: { timestamp: 'desc' }
    });
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: 'Gagal' });
  }
});

router.post('/', async (req, res) => {
  try {
    const vendorId = getVendorId(req);
    const data = await prismaNotifications.create({ data: { ...req.body, vendor_id: vendorId } });
    res.status(201).json(data);
  } catch (error) {
    res.status(500).json({ error: 'Gagal' });
  }
});

router.patch('/:id', async (req, res) => {
  try {
    const vendorId = getVendorId(req);
    const existing = await prismaNotifications.findFirst({ where: { id: Number(req.params.id), vendor_id: vendorId } });
    if (!existing) return res.status(404).json({ error: 'Not found' });
    const data = await prismaNotifications.update({ where: { id: Number(req.params.id) }, data: req.body });
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: 'Gagal' });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const vendorId = getVendorId(req);
    const existing = await prismaNotifications.findFirst({ where: { id: Number(req.params.id), vendor_id: vendorId } });
    if (!existing) return res.status(404).json({ error: 'Not found' });
    await prismaNotifications.delete({ where: { id: Number(req.params.id) } });
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ error: 'Gagal' });
  }
});

router.post('/mark-all-read', async (req, res) => {
  try {
    const vendorId = getVendorId(req);
    await prismaNotifications.updateMany({
      where: { vendor_id: vendorId, is_read: false },
      data: { is_read: true }
    });
    res.status(200).send();
  } catch (error) {
    res.status(500).json({ error: 'Gagal' });
  }
});

export default router;
