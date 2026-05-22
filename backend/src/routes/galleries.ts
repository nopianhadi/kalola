import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import crypto from 'crypto';

const router = Router();
const prisma = new PrismaClient();

router.get('/', async (req, res) => {
  try {
    const data = await (prisma as any).galleries.findMany({ 
      include: { gallery_images: true },
      orderBy: { created_at: 'desc' } 
    });
    res.json(data);
  } catch (error) {
    console.error('Error fetching galleries:', error);
    res.status(500).json({ error: 'Gagal memuat gallery' });
  }
});

router.get('/region/:region', async (req, res) => {
  try {
    const data = await (prisma as any).galleries.findMany({
      where: { region: req.params.region, is_public: true },
      include: { gallery_images: true },
      orderBy: { created_at: 'desc' }
    });
    res.json(data);
  } catch (error) {
    console.error('Error fetching galleries by region:', error);
    res.status(500).json({ error: 'Gagal memuat gallery' });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const data = await (prisma as any).galleries.findUnique({ 
      where: { id: Number(req.params.id) },
      include: { gallery_images: true }
    });
    if (!data) return res.status(404).json({ error: 'Not found' });
    res.json(data);
  } catch (error) {
    console.error('Error fetching gallery by id:', error);
    res.status(500).json({ error: 'Gagal memuat gallery' });
  }
});

router.get('/public/:publicId', async (req, res) => {
  try {
    const data = await (prisma as any).galleries.findFirst({
      where: { public_id: req.params.publicId, is_public: true },
      include: { gallery_images: true }
    });
    if (!data) return res.status(404).json({ error: 'Not found' });
    
    // Log untuk debugging
    console.log('Public Gallery Request:', {
      publicId: req.params.publicId,
      found: !!data,
      imageCount: data.gallery_images?.length || 0
    });
    
    res.json(data);
  } catch (error) {
    console.error('Error fetching public gallery:', error);
    res.status(500).json({ error: 'Gagal memuat gallery' });
  }
});

router.post('/', async (req, res) => {
  try {
    const { images, ...rest } = req.body;
    
    // Create gallery first
    const gallery = await (prisma as any).galleries.create({ data: rest });
    
    // Then insert images sequentially (no transaction to avoid timeout with large base64)
    if (images) {
      const parsedImages = typeof images === 'string' ? JSON.parse(images) : images;
      if (Array.isArray(parsedImages) && parsedImages.length > 0) {
        // Insert images sequentially to avoid MySQL packet size limits (which drop the connection)
        for (const img of parsedImages) {
          await (prisma as any).gallery_images.create({
            data: {
              gallery_id: gallery.id,
              url: img.url,
              thumbnail_url: img.thumbnail_url || null,
              caption: img.caption || null,
              uploaded_at: img.uploadedAt ? new Date(img.uploadedAt) : new Date()
            }
          });
        }
      }
    }
    
    const result = await (prisma as any).galleries.findUnique({
      where: { id: gallery.id },
      include: { gallery_images: true }
    });
    
    res.status(201).json(result);
  } catch (error) {
    console.error('Error creating gallery:', error);
    res.status(500).json({ error: 'Gagal membuat gallery' });
  }
});

router.patch('/:id', async (req, res) => {
  try {
    const { images, ...rest } = req.body;
    
    // Update gallery basic info
    if (Object.keys(rest).length > 0) {
      await (prisma as any).galleries.update({ 
        where: { id: Number(req.params.id) }, 
        data: rest
      });
    }

    // Handle images separately (no transaction - avoids timeout with large base64 payloads)
    if (images !== undefined) {
      const parsedImages = typeof images === 'string' ? JSON.parse(images) : images;
      if (Array.isArray(parsedImages)) {
        // Delete existing images first
        await (prisma as any).gallery_images.deleteMany({
          where: { gallery_id: Number(req.params.id) }
        });
        
        // Re-insert all images (existing + new) sequentially to avoid connection drops from large queries
        if (parsedImages.length > 0) {
          for (const img of parsedImages) {
            await (prisma as any).gallery_images.create({
              data: {
                gallery_id: Number(req.params.id),
                url: img.url,
                thumbnail_url: img.thumbnail_url || null,
                caption: img.caption || null,
                uploaded_at: img.uploadedAt ? new Date(img.uploadedAt) : new Date()
              }
            });
          }
        }
      }
    }

    const result = await (prisma as any).galleries.findUnique({
      where: { id: Number(req.params.id) },
      include: { gallery_images: true }
    });

    res.json(result);
  } catch (error) {
    console.error('Error updating gallery:', error);
    res.status(500).json({ error: 'Gagal mengupdate gallery' });
  }
});

// Add a single image to a gallery (avoids large PATCH payloads that exceed MySQL max_allowed_packet)
router.post('/:id/images', async (req, res) => {
  try {
    const { id, url, thumbnail_url, caption, uploaded_at } = req.body;

    // Validate that the gallery exists
    const gallery = await (prisma as any).galleries.findUnique({ where: { id: Number(req.params.id) } });
    if (!gallery) return res.status(404).json({ error: 'Gallery tidak ditemukan' });

    const image = await (prisma as any).gallery_images.create({
      data: {
        gallery_id: Number(req.params.id),
        url,
        thumbnail_url: thumbnail_url || null,
        caption: caption || null,
        uploaded_at: uploaded_at ? new Date(uploaded_at) : new Date()
      }
    });

    res.status(201).json(image);
  } catch (error) {
    console.error('Error adding gallery image:', error);
    res.status(500).json({ error: 'Gagal menambahkan gambar' });
  }
});

// Delete a single image from a gallery
router.delete('/:id/images/:imageId', async (req, res) => {
  try {
    await (prisma as any).gallery_images.delete({
      where: { id: Number(req.params.imageId) }
    });
    res.status(204).send();
  } catch (error) {
    console.error('Error deleting gallery image:', error);
    res.status(500).json({ error: 'Gagal menghapus gambar' });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    await (prisma as any).galleries.delete({ where: { id: Number(req.params.id) } });
    res.status(204).send();
  } catch (error) {
    console.error('Error deleting gallery:', error);
    res.status(500).json({ error: 'Gagal menghapus gallery' });
  }
});

export default router;

