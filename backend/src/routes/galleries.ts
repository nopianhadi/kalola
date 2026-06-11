import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { sseManager } from '../sseManager';
import { getVendorId } from '../middleware/auth';

const router = Router();
const prisma = new PrismaClient();

// Public endpoints (no auth needed) - specific named routes must come BEFORE /:id
router.get('/public/:publicId', async (req, res) => {
  try {
    const data = await (prisma as any).galleries.findFirst({
      where: { public_id: req.params.publicId, is_public: true },
      include: { gallery_images: true },
    });
    if (!data) return res.status(404).json({ error: 'Not found' });

    console.log('Public Gallery Request:', {
      publicId: req.params.publicId,
      found: !!data,
      imageCount: data.gallery_images?.length || 0,
    });

    res.json(data);
  } catch (error) {
    console.error('Error fetching public gallery:', error);
    res.status(500).json({ error: 'Gagal memuat gallery' });
  }
});

router.get('/region/:region', async (req, res) => {
  try {
    const data = await (prisma as any).galleries.findMany({
      where: { region: req.params.region, is_public: true },
      include: { gallery_images: true },
      orderBy: { created_at: 'desc' },
    });
    res.json(data);
  } catch (error) {
    console.error('Error fetching galleries by region:', error);
    res.status(500).json({ error: 'Gagal memuat gallery' });
  }
});

// Protected endpoints (require auth, scoped by vendor)
router.get('/', async (req, res) => {
  try {
    const vendorId = getVendorId(req);
    const data = await (prisma as any).galleries.findMany({
      where: { user_id: vendorId },
      include: { gallery_images: true },
      orderBy: { created_at: 'desc' },
    });
    res.json(data);
  } catch (error) {
    console.error('Error fetching galleries:', error);
    res.status(500).json({ error: 'Gagal memuat gallery' });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const vendorId = getVendorId(req);
    const data = await (prisma as any).galleries.findFirst({
      where: { id: Number(req.params.id), user_id: vendorId },
      include: { gallery_images: true },
    });
    if (!data) return res.status(404).json({ error: 'Not found' });
    res.json(data);
  } catch (error) {
    console.error('Error fetching gallery by id:', error);
    res.status(500).json({ error: 'Gagal memuat gallery' });
  }
});

router.post('/', async (req, res) => {
  try {
    const vendorId = getVendorId(req);
    const { images, ...rest } = req.body;
    rest.user_id = vendorId;

    if (!rest.public_id) {
      const crypto = require('crypto');
      rest.public_id = crypto.randomUUID();
    }

    const gallery = await (prisma as any).galleries.create({ data: rest });

    if (images) {
      const parsedImages = typeof images === 'string' ? JSON.parse(images) : images;
      if (Array.isArray(parsedImages) && parsedImages.length > 0) {
        for (const img of parsedImages) {
          await (prisma as any).gallery_images.create({
            data: {
              gallery_id: gallery.id,
              url: img.url,
              thumbnail_url: img.thumbnail_url || null,
              caption: img.caption || null,
              uploaded_at: img.uploadedAt ? new Date(img.uploadedAt) : new Date(),
            },
          });
        }
      }
    }

    const result = await (prisma as any).galleries.findUnique({
      where: { id: gallery.id },
      include: { gallery_images: true },
    });

    sseManager.broadcast('galleries', 'created', { id: result?.id }, getVendorId(req));
    res.status(201).json(result);
  } catch (error) {
    console.error('Error creating gallery:', error);
    res.status(500).json({ error: 'Gagal membuat gallery' });
  }
});

router.patch('/:id', async (req, res) => {
  try {
    const vendorId = getVendorId(req);
    const existing = await (prisma as any).galleries.findFirst({
      where: { id: Number(req.params.id), user_id: vendorId },
    });
    if (!existing) return res.status(404).json({ error: 'Not found' });

    const { images, ...rest } = req.body;

    if (Object.keys(rest).length > 0) {
      await (prisma as any).galleries.update({
        where: { id: Number(req.params.id) },
        data: rest,
      });
    }

    if (images !== undefined) {
      const parsedImages = typeof images === 'string' ? JSON.parse(images) : images;
      if (Array.isArray(parsedImages)) {
        await (prisma as any).gallery_images.deleteMany({
          where: { gallery_id: Number(req.params.id) },
        });
        if (parsedImages.length > 0) {
          for (const img of parsedImages) {
            await (prisma as any).gallery_images.create({
              data: {
                gallery_id: Number(req.params.id),
                url: img.url,
                thumbnail_url: img.thumbnail_url || null,
                caption: img.caption || null,
                uploaded_at: img.uploadedAt ? new Date(img.uploadedAt) : new Date(),
              },
            });
          }
        }
      }
    }

    const result = await (prisma as any).galleries.findUnique({
      where: { id: Number(req.params.id) },
      include: { gallery_images: true },
    });

    sseManager.broadcast('galleries', 'updated', { id: Number(req.params.id) }, getVendorId(req));
    res.json(result);
  } catch (error) {
    console.error('Error updating gallery:', error);
    res.status(500).json({ error: 'Gagal mengupdate gallery' });
  }
});

router.post('/:id/images', async (req, res) => {
  try {
    const vendorId = getVendorId(req);
    const gallery = await (prisma as any).galleries.findFirst({
      where: { id: Number(req.params.id), user_id: vendorId },
    });
    if (!gallery) return res.status(404).json({ error: 'Gallery tidak ditemukan' });

    const { url, thumbnail_url, caption, uploaded_at } = req.body;
    const image = await (prisma as any).gallery_images.create({
      data: {
        gallery_id: Number(req.params.id),
        url,
        thumbnail_url: thumbnail_url || null,
        caption: caption || null,
        uploaded_at: uploaded_at ? new Date(uploaded_at) : new Date(),
      },
    });

    sseManager.broadcast('galleries', 'updated', { id: Number(req.params.id) }, getVendorId(req));
    res.status(201).json(image);
  } catch (error) {
    console.error('Error adding gallery image:', error);
    res.status(500).json({ error: 'Gagal menambahkan gambar' });
  }
});

router.delete('/:id/images/:imageId', async (req, res) => {
  try {
    const vendorId = getVendorId(req);
    // Verify gallery ownership first
    const gallery = await (prisma as any).galleries.findFirst({
      where: { id: Number(req.params.id), user_id: vendorId },
    });
    if (!gallery) return res.status(404).json({ error: 'Gallery tidak ditemukan' });

    await (prisma as any).gallery_images.delete({
      where: { id: Number(req.params.imageId) },
    });
    sseManager.broadcast('galleries', 'updated', { id: Number(req.params.id) }, getVendorId(req));
    res.status(204).send();
  } catch (error) {
    console.error('Error deleting gallery image:', error);
    res.status(500).json({ error: 'Gagal menghapus gambar' });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const vendorId = getVendorId(req);
    const existing = await (prisma as any).galleries.findFirst({
      where: { id: Number(req.params.id), user_id: vendorId },
    });
    if (!existing) return res.status(404).json({ error: 'Not found' });

    await (prisma as any).galleries.delete({ where: { id: Number(req.params.id) } });
    sseManager.broadcast('galleries', 'deleted', { id: Number(req.params.id) }, getVendorId(req));
    res.status(204).send();
  } catch (error) {
    console.error('Error deleting gallery:', error);
    res.status(500).json({ error: 'Gagal menghapus gallery' });
  }
});

export default router;

