import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { getVendorId } from '../middleware/auth';

const router = Router();
const prisma = new PrismaClient();
const prismaPromoCodes = (prisma as any).promo_codes || (prisma as any).promoCodes;

router.get('/', async (req, res) => {
  try {
    const vendorId = getVendorId(req);
    const data = await prismaPromoCodes.findMany({
      where: { vendor_id: vendorId },
      orderBy: { code: 'asc' }
    });
    res.json(data);
  } catch (error) {
    console.error('[GET /promo-codes]', error);
    res.status(500).json({ error: 'Gagal mengambil data' });
  }
});

router.post('/', async (req, res) => {
  try {
    const vendorId = getVendorId(req);
    const body = req.body;
    const data: any = {
      vendor_id: vendorId,
      code: String(body.code || '').trim(),
      discount_type: String(body.discount_type || 'percentage').trim(),
      discount_value: Number(body.discount_value ?? 0),
      is_active: body.is_active !== undefined ? Boolean(body.is_active) : true,
      usage_count: body.usage_count !== undefined ? Number(body.usage_count) : 0,
      ...(body.max_usage !== undefined && body.max_usage !== null ? { max_usage: Number(body.max_usage) } : {}),
      ...(body.expiry_date !== undefined && body.expiry_date !== null ? { expiry_date: new Date(body.expiry_date) } : {}),
    };
    const promo = await prismaPromoCodes.create({ data });
    res.status(201).json(promo);
  } catch (error: any) {
    console.error('[POST /promo-codes]', error);
    if (error?.code === 'P2002' || error?.message?.includes('Unique constraint')) {
      return res.status(409).json({ error: 'Kode promo sudah digunakan. Gunakan kode yang berbeda.' });
    }
    res.status(500).json({ error: 'Gagal membuat data', detail: error?.message });
  }
});

router.patch('/:id', async (req, res) => {
  try {
    const vendorId = getVendorId(req);
    const numId = Number(req.params.id);
    if (isNaN(numId)) return res.status(400).json({ error: 'Invalid ID' });
    const existing = await prismaPromoCodes.findFirst({ where: { id: numId, vendor_id: vendorId } });
    if (!existing) return res.status(404).json({ error: 'Not found' });
    const body = req.body;
    const data: any = {
      ...(body.code !== undefined ? { code: String(body.code).trim() } : {}),
      ...(body.discount_type !== undefined ? { discount_type: String(body.discount_type).trim() } : {}),
      ...(body.discount_value !== undefined ? { discount_value: Number(body.discount_value) } : {}),
      ...(body.is_active !== undefined ? { is_active: Boolean(body.is_active) } : {}),
      ...(body.usage_count !== undefined ? { usage_count: Number(body.usage_count) } : {}),
      ...(body.max_usage !== undefined ? { max_usage: body.max_usage !== null ? Number(body.max_usage) : null } : {}),
      ...(body.expiry_date !== undefined ? { expiry_date: body.expiry_date ? new Date(body.expiry_date) : null } : {}),
    };
    const promo = await prismaPromoCodes.update({ where: { id: numId }, data });
    res.json(promo);
  } catch (error: any) {
    console.error('[PATCH /promo-codes/:id]', error);
    res.status(500).json({ error: 'Gagal update data', detail: error?.message });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const vendorId = getVendorId(req);
    const numId = Number(req.params.id);
    if (isNaN(numId)) return res.status(400).json({ error: 'Invalid ID' });
    const existing = await prismaPromoCodes.findFirst({ where: { id: numId, vendor_id: vendorId } });
    if (!existing) return res.status(404).json({ error: 'Not found' });
    await prismaPromoCodes.delete({ where: { id: numId } });
    res.status(204).send();
  } catch (error: any) {
    console.error('[DELETE /promo-codes/:id]', error);
    res.status(500).json({ error: 'Gagal menghapus data', detail: error?.message });
  }
});

export default router;
