import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { getVendorId } from '../middleware/auth';

const router = Router();
const prisma = new PrismaClient();
const prismaRecords = (prisma as any).team_payment_records || (prisma as any).teamPaymentRecords;

router.get('/', async (req, res) => {
  try {
    const vendorId = getVendorId(req);
    const data = await prismaRecords.findMany({
      where: { vendor_id: vendorId },
      orderBy: { date: 'desc' },
    });
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: 'Gagal' });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const vendorId = getVendorId(req);
    const record = await prismaRecords.findFirst({
      where: { id: Number(req.params.id), vendor_id: vendorId },
    });
    if (!record) return res.status(404).json({ error: 'Not found' });
    res.json(record);
  } catch (error) {
    res.status(500).json({ error: 'Gagal' });
  }
});

router.post('/', async (req, res) => {
  try {
    const vendorId = getVendorId(req);
    const record = await prismaRecords.create({
      data: { ...req.body, vendor_id: vendorId },
    });
    res.status(201).json(record);
  } catch (error: any) {
    console.error('[POST /team-payment-records] Error:', error?.message);
    res.status(500).json({ error: 'Gagal', detail: error?.message });
  }
});

router.patch('/:id', async (req, res) => {
  try {
    const vendorId = getVendorId(req);
    const existing = await prismaRecords.findFirst({
      where: { id: Number(req.params.id), vendor_id: vendorId },
    });
    if (!existing) return res.status(404).json({ error: 'Not found' });
    const record = await prismaRecords.update({
      where: { id: Number(req.params.id) },
      data: req.body,
    });
    res.json(record);
  } catch (error: any) {
    console.error('[PATCH /team-payment-records/:id] Error:', error?.message);
    res.status(500).json({ error: 'Gagal', detail: error?.message });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const vendorId = getVendorId(req);
    const existing = await prismaRecords.findFirst({
      where: { id: Number(req.params.id), vendor_id: vendorId },
    });
    if (!existing) return res.status(404).json({ error: 'Not found' });
    await prismaRecords.delete({ where: { id: Number(req.params.id) } });
    res.status(204).send();
  } catch (error: any) {
    console.error('[DELETE /team-payment-records/:id] Error:', error?.message);
    res.status(500).json({ error: 'Gagal', detail: error?.message });
  }
});

export default router;
