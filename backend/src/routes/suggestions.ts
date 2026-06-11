import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticate, getVendorId } from '../middleware/auth';

const router = Router();
const prisma = new PrismaClient();
const prismaSuggestions = (prisma as any).suggestions || (prisma as any).suggestion;

/**
 * POST /suggestions (PUBLIC)
 * Klien/publik kirim saran melalui booking form — tidak butuh auth.
 * vendor_id diambil dari query param ?vendorId untuk mengirimkan ke vendor yang tepat.
 */
router.post('/', async (req, res) => {
  try {
    const vendorId = req.body.vendor_id || req.query.vendorId || null;
    const data = await prismaSuggestions.create({
      data: {
        ...req.body,
        vendor_id: vendorId ? Number(vendorId) : null,
      },
    });
    res.status(201).json(data);
  } catch (error) {
    res.status(500).json({ error: 'Gagal mengirim saran' });
  }
});

/**
 * GET /suggestions (PROTECTED)
 * Hanya vendor yang bisa melihat saran masuk ke tenant mereka.
 */
router.get('/', authenticate, async (req, res) => {
  try {
    const vendorId = getVendorId(req);
    const data = await prismaSuggestions.findMany({
      where: { vendor_id: vendorId },
      orderBy: { date: 'desc' },
    });
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: 'Gagal' });
  }
});

/**
 * DELETE /suggestions/:id (PROTECTED)
 */
router.delete('/:id', authenticate, async (req, res) => {
  try {
    const vendorId = getVendorId(req);
    const existing = await prismaSuggestions.findFirst({
      where: { id: Number(req.params.id), vendor_id: vendorId },
    });
    if (!existing) return res.status(404).json({ error: 'Not found' });
    await prismaSuggestions.delete({ where: { id: Number(req.params.id) } });
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ error: 'Gagal' });
  }
});

export default router;
