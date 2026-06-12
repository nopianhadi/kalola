import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { sendLeadNotification } from '../utils/email.utils';
import { sseManager } from '../sseManager';

const router = Router();
const prisma = new PrismaClient();

/**
 * GET /api/public/moodboard/:projectId
 * Public endpoint — no auth required.
 * Only returns non-sensitive fields: id, projectName, clientName, driveLink.
 */
router.get('/moodboard/:projectId', async (req, res) => {
  try {
    const projectId = parseInt(req.params.projectId, 10);
    if (isNaN(projectId)) return res.status(400).json({ error: 'ID tidak valid' });

    const p = await (prisma as any).projects.findUnique({
      where: { id: projectId },
      select: {
        id: true,
        project_name: true,
        client_name: true,
        drive_link: true,
      },
    });

    if (!p) return res.status(404).json({ error: 'Project tidak ditemukan' });
    if (!p.drive_link) return res.status(404).json({ error: 'Moodboard belum diisi' });

    res.json({
      id: p.id,
      projectName: p.project_name,
      clientName: p.client_name,
      driveLink: p.drive_link,
    });
  } catch (error) {
    console.error('[GET /api/public/moodboard/:projectId]', error);
    res.status(500).json({ error: 'Gagal memuat moodboard' });
  }
});

/**
 * GET /api/public/portfolio/:vendorId?
 * Public endpoint — no auth required.
 * Returns vendor profile + all public portfolios.
 * If vendorId omitted → fallback ke vendor pertama (single-tenant).
 */
/**
 * GET /api/public/portfolio-detail/:publicId
 * Public endpoint — no auth required.
 * Returns a single portfolio by public_id.
 */
router.get('/portfolio-detail/:publicId', async (req, res) => {
  try {
    const data = await (prisma as any).portfolios.findFirst({
      where: { public_id: req.params.publicId, is_public: true },
      include: { portfolio_items: { orderBy: { sort_order: 'asc' } } },
    });
    if (!data) return res.status(404).json({ error: 'Portfolio tidak ditemukan' });
    res.json(data);
  } catch (error) {
    console.error('[GET /api/public/portfolio-detail/:publicId]', error);
    res.status(500).json({ error: 'Gagal memuat portfolio' });
  }
});

/**
 * Helper: fetch profile + portfolios untuk vendor tertentu
 */
async function handlePortfolioListing(vendorId: number, res: any) {
  const [profile, portfolios, feedbacks] = await Promise.all([
    (prisma as any).profiles.findFirst({
      where: { admin_user_id: vendorId },
      select: {
        full_name: true,
        company_name: true,
        bio: true,
        phone: true,
        website: true,
        logo_base64: true,
        brand_color: true,
        address: true,
      },
    }),
    (prisma as any).portfolios.findMany({
      where: { vendor_id: vendorId, is_public: true },
      include: {
        portfolio_items: {
          orderBy: { sort_order: 'asc' },
          take: 1,
        },
      },
      orderBy: { created_at: 'desc' },
    }),
    ((prisma as any).client_feedback || (prisma as any).clientFeedback).findMany({
      where: { vendor_id: vendorId, rating: { gte: 4 } },
      orderBy: { date: 'desc' },
      take: 6,
    }).catch(() => [])
  ]);
  res.json({ profile, portfolios, feedbacks });
}

router.get('/portfolio/:vendorId', async (req, res) => {
  try {
    const vendorId = parseInt(req.params.vendorId, 10);
    if (isNaN(vendorId)) return res.status(400).json({ error: 'Vendor ID tidak valid' });
    await handlePortfolioListing(vendorId, res);
  } catch (error) {
    console.error('[GET /api/public/portfolio/:vendorId]', error);
    res.status(500).json({ error: 'Gagal memuat portfolio' });
  }
});

router.get('/portfolio', async (_req, res) => {
  try {
    const firstUser = await (prisma as any).users.findFirst({
      where: { role: 'Admin' },
      orderBy: { id: 'asc' },
    });
    const vendorId = firstUser?.id ?? null;
    if (!vendorId) return res.status(404).json({ error: 'Vendor tidak ditemukan' });
    await handlePortfolioListing(vendorId, res);
  } catch (error) {
    console.error('[GET /api/public/portfolio]', error);
    res.status(500).json({ error: 'Gagal memuat portfolio' });
  }
});

router.post('/leads', async (req, res) => {
  try {
    const data = req.body;
    const vendorId = data.vendor_id ? Number(data.vendor_id) : null;
    
    if (!vendorId) {
      return res.status(400).json({ error: 'Vendor ID wajib diisi untuk form publik' });
    }
    if (!data.name || !data.whatsapp || !data.source) {
      return res.status(400).json({ error: 'Nama, WhatsApp, dan sumber wajib diisi' });
    }

    const leadData = {
      name: data.name,
      city: data.city || null,
      whatsapp: data.whatsapp,
      source: data.source,
      status: data.status || 'Baru',
      notes: data.notes || null,
      vendor_id: vendorId
    };

    const lead = await (prisma as any).leads.create({ data: leadData });
    sseManager.broadcast('leads', 'created', { id: lead.id }, vendorId);

    const vendorUser = await (prisma as any).users.findUnique({
      where: { id: vendorId },
      select: { email: true }
    });
    if (vendorUser?.email) {
      await sendLeadNotification(vendorUser.email, {
        name: lead.name,
        email: 'Tidak dicantumkan',
        phone: lead.whatsapp,
        message: 'Lead baru dari ' + lead.source
      });
    }

    res.status(201).json(lead);
  } catch (error: any) {
    console.error('[POST /api/public/leads] Error:', error?.message || error);
    res.status(500).json({ error: 'Gagal membuat lead', detail: error?.message });
  }
});

export default router;
