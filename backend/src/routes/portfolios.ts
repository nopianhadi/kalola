import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { sseManager } from '../sseManager';
import { getVendorId } from '../middleware/auth';

const router = Router();
const prisma = new PrismaClient();

// â”€â”€â”€ PUBLIC: GET /portfolios/public/:publicId â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
router.get('/public/:publicId', async (req, res) => {
  try {
    const data = await (prisma as any).portfolios.findFirst({
      where: { public_id: req.params.publicId, is_public: true },
      include: { portfolio_items: { orderBy: { sort_order: 'asc' } } },
    });
    if (!data) return res.status(404).json({ error: 'Portfolio tidak ditemukan' });
    res.json(data);
  } catch (error) {
    console.error('Error fetching public portfolio:', error);
    res.status(500).json({ error: 'Gagal memuat portfolio' });
  }
});

// â”€â”€â”€ PROTECTED: GET /portfolios â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
router.get('/', async (req, res) => {
  try {
    const vendorId = getVendorId(req);
    const data = await (prisma as any).portfolios.findMany({
      where: { vendor_id: vendorId },
      include: { portfolio_items: { orderBy: { sort_order: 'asc' } } },
      orderBy: { created_at: 'desc' },
    });
    res.json(data);
  } catch (error) {
    console.error('Error fetching portfolios:', error);
    res.status(500).json({ error: 'Gagal memuat portfolio' });
  }
});

// â”€â”€â”€ PROTECTED: GET /portfolios/:id â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
router.get('/:id', async (req, res) => {
  try {
    const vendorId = getVendorId(req);
    const data = await (prisma as any).portfolios.findFirst({
      where: { id: Number(req.params.id), vendor_id: vendorId },
      include: { portfolio_items: { orderBy: { sort_order: 'asc' } } },
    });
    if (!data) return res.status(404).json({ error: 'Portfolio tidak ditemukan' });
    res.json(data);
  } catch (error) {
    console.error('Error fetching portfolio by id:', error);
    res.status(500).json({ error: 'Gagal memuat portfolio' });
  }
});

// â”€â”€â”€ PROTECTED: POST /portfolios â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
router.post('/', async (req, res) => {
  try {
    const vendorId = getVendorId(req);
    const { items, user_id: _uid, vendor_id: _vid, created_at, updated_at, id: _id, ...rest } = req.body;

    // Sanitize: hapus field kosong
    const data: Record<string, any> = { vendor_id: vendorId };
    for (const [key, val] of Object.entries(rest)) {
      if (val === '' || val === null || val === undefined) continue;
      if (key === 'project_date' && typeof val === 'string') {
        data[key] = new Date(val).toISOString();
      } else {
        data[key] = val;
      }
    }

    if (!data.public_id) {
      const crypto = require('crypto');
      data.public_id = crypto.randomUUID();
    }

    const portfolio = await (prisma as any).portfolios.create({ data });

    if (items) {
      const parsed = typeof items === 'string' ? JSON.parse(items) : items;
      if (Array.isArray(parsed) && parsed.length > 0) {
        for (let i = 0; i < parsed.length; i++) {
          const img = parsed[i];
          await (prisma as any).portfolio_items.create({
            data: {
              portfolio_id: portfolio.id,
              vendor_id: vendorId,
              url: img.url,
              thumbnail_url: img.thumbnail_url || null,
              caption: img.caption || null,
              sort_order: img.sort_order ?? i,
              uploaded_at: img.uploadedAt ? new Date(img.uploadedAt) : new Date(),
            },
          });
        }
      }
    }

    const result = await (prisma as any).portfolios.findUnique({
      where: { id: portfolio.id },
      include: { portfolio_items: { orderBy: { sort_order: 'asc' } } },
    });

    sseManager.broadcast('portfolios', 'created', { id: result?.id }, getVendorId(req));
    res.status(201).json(result);
  } catch (error) {
    console.error('Error creating portfolio:', error);
    res.status(500).json({ error: 'Gagal membuat portfolio', details: error instanceof Error ? error.message : String(error) });
  }
});

// â”€â”€â”€ PROTECTED: PATCH /portfolios/:id â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
router.patch('/:id', async (req, res) => {
  try {
    const vendorId = getVendorId(req);
    const existing = await (prisma as any).portfolios.findFirst({
      where: { id: Number(req.params.id), vendor_id: vendorId },
    });
    if (!existing) return res.status(404).json({ error: 'Portfolio tidak ditemukan' });

    const { items, user_id, vendor_id: _vid, public_id, created_at, updated_at, id: _id, ...rest } = req.body;

    // Sanitize: hapus field kosong agar tidak error di Prisma
    const data: Record<string, any> = {};
    for (const [key, val] of Object.entries(rest)) {
      if (val === '' || val === null || val === undefined) continue;
      if (key === 'project_date' && typeof val === 'string') {
        data[key] = new Date(val).toISOString();
      } else {
        data[key] = val;
      }
    }

    if (Object.keys(data).length > 0) {
      await (prisma as any).portfolios.update({
        where: { id: Number(req.params.id) },
        data,
      });
    }

    if (items !== undefined) {
      const parsed = typeof items === 'string' ? JSON.parse(items) : items;
      if (Array.isArray(parsed)) {
        await (prisma as any).portfolio_items.deleteMany({
          where: { portfolio_id: Number(req.params.id) },
        });
        for (let i = 0; i < parsed.length; i++) {
          const img = parsed[i];
          await (prisma as any).portfolio_items.create({
            data: {
              portfolio_id: Number(req.params.id),
              vendor_id: vendorId,
              url: img.url,
              thumbnail_url: img.thumbnail_url || null,
              caption: img.caption || null,
              sort_order: img.sort_order ?? i,
              uploaded_at: img.uploadedAt ? new Date(img.uploadedAt) : new Date(),
            },
          });
        }
      }
    }

    const result = await (prisma as any).portfolios.findUnique({
      where: { id: Number(req.params.id) },
      include: { portfolio_items: { orderBy: { sort_order: 'asc' } } },
    });

    sseManager.broadcast('portfolios', 'updated', { id: Number(req.params.id) }, getVendorId(req));
    res.json(result);
  } catch (error) {
    console.error('Error updating portfolio:', error);
    res.status(500).json({ error: 'Gagal mengupdate portfolio' });
  }
});

// â”€â”€â”€ PROTECTED: POST /portfolios/:id/items â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
router.post('/:id/items', async (req, res) => {
  try {
    const vendorId = getVendorId(req);
    const portfolio = await (prisma as any).portfolios.findFirst({
      where: { id: Number(req.params.id), vendor_id: vendorId },
    });
    if (!portfolio) return res.status(404).json({ error: 'Portfolio tidak ditemukan' });

    const { url, thumbnail_url, caption, sort_order, uploaded_at } = req.body;
    const item = await (prisma as any).portfolio_items.create({
      data: {
        portfolio_id: Number(req.params.id),
        vendor_id: vendorId,
        url,
        thumbnail_url: thumbnail_url || null,
        caption: caption || null,
        sort_order: sort_order ?? 0,
        uploaded_at: uploaded_at ? new Date(uploaded_at) : new Date(),
      },
    });

    sseManager.broadcast('portfolios', 'updated', { id: Number(req.params.id) }, getVendorId(req));
    res.status(201).json(item);
  } catch (error) {
    console.error('Error adding portfolio item:', error);
    res.status(500).json({ error: 'Gagal menambahkan gambar' });
  }
});

// â”€â”€â”€ PROTECTED: DELETE /portfolios/:id/items/:itemId â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
router.delete('/:id/items/:itemId', async (req, res) => {
  try {
    const vendorId = getVendorId(req);
    const portfolio = await (prisma as any).portfolios.findFirst({
      where: { id: Number(req.params.id), vendor_id: vendorId },
    });
    if (!portfolio) return res.status(404).json({ error: 'Portfolio tidak ditemukan' });

    await (prisma as any).portfolio_items.delete({
      where: { id: Number(req.params.itemId) },
    });
    sseManager.broadcast('portfolios', 'updated', { id: Number(req.params.id) }, getVendorId(req));
    res.status(204).send();
  } catch (error) {
    console.error('Error deleting portfolio item:', error);
    res.status(500).json({ error: 'Gagal menghapus gambar' });
  }
});

// â”€â”€â”€ PROTECTED: DELETE /portfolios/:id â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
router.delete('/:id', async (req, res) => {
  try {
    const vendorId = getVendorId(req);
    const existing = await (prisma as any).portfolios.findFirst({
      where: { id: Number(req.params.id), vendor_id: vendorId },
    });
    if (!existing) return res.status(404).json({ error: 'Portfolio tidak ditemukan' });

    await (prisma as any).portfolios.delete({ where: { id: Number(req.params.id) } });
    sseManager.broadcast('portfolios', 'deleted', { id: Number(req.params.id) }, getVendorId(req));
    res.status(204).send();
  } catch (error) {
    console.error('Error deleting portfolio:', error);
    res.status(500).json({ error: 'Gagal menghapus portfolio' });
  }
});

export default router;

