import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { getVendorId } from '../middleware/auth';

const router = Router();
const prisma = new PrismaClient();
const prismaAddOns = (prisma as any).add_ons;

router.get('/', async (req, res) => {
  try {
    const vendorId = getVendorId(req);
    const data = await prismaAddOns.findMany({
      where: { vendor_id: vendorId },
      orderBy: { name: 'asc' }
    });
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: 'Gagal mengambil data' });
  }
});

router.post('/', async (req, res) => {
  try {
    const vendorId = getVendorId(req);
    const addon = await prismaAddOns.create({ data: { ...req.body, vendor_id: vendorId } });
    res.status(201).json(addon);
  } catch (error) {
    res.status(500).json({ error: 'Gagal membuat data' });
  }
});

router.patch('/:id', async (req, res) => {
  try {
    const vendorId = getVendorId(req);
    const existing = await prismaAddOns.findFirst({ where: { id: Number(req.params.id), vendor_id: vendorId } });
    if (!existing) return res.status(404).json({ error: 'Not found' });
    const addon = await prismaAddOns.update({ where: { id: Number(req.params.id) }, data: req.body });
    res.json(addon);
  } catch (error) {
    res.status(500).json({ error: 'Gagal update data' });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const vendorId = getVendorId(req);
    const existing = await prismaAddOns.findFirst({ where: { id: Number(req.params.id), vendor_id: vendorId } });
    if (!existing) return res.status(404).json({ error: 'Not found' });
    await prismaAddOns.delete({ where: { id: Number(req.params.id) } });
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ error: 'Gagal menghapus data' });
  }
});

export default router;
