import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { getVendorId } from '../middleware/auth';

const router = Router();
const prisma = new PrismaClient();
const prismaPackages = (prisma as any).packages || (prisma as any).package;

router.get('/', async (req, res) => {
  try {
    const vendorId = getVendorId(req);
    const data = await prismaPackages.findMany({
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
    const pkg = await prismaPackages.create({ data: { ...req.body, vendor_id: vendorId } });
    res.status(201).json(pkg);
  } catch (error) {
    res.status(500).json({ error: 'Gagal membuat data' });
  }
});

router.patch('/:id', async (req, res) => {
  try {
    const vendorId = getVendorId(req);
    const existing = await prismaPackages.findFirst({ where: { id: Number(req.params.id), vendor_id: vendorId } });
    if (!existing) return res.status(404).json({ error: 'Not found' });
    const pkg = await prismaPackages.update({ where: { id: Number(req.params.id) }, data: req.body });
    res.json(pkg);
  } catch (error) {
    res.status(500).json({ error: 'Gagal update data' });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const vendorId = getVendorId(req);
    const existing = await prismaPackages.findFirst({ where: { id: Number(req.params.id), vendor_id: vendorId } });
    if (!existing) return res.status(404).json({ error: 'Not found' });
    await prismaPackages.delete({ where: { id: Number(req.params.id) } });
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ error: 'Gagal menghapus data' });
  }
});

export default router;
