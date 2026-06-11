import { Router } from 'express';
import prisma from '../prismaClient';
import { sseManager } from '../sseManager';
import { getVendorId } from '../middleware/auth';
import crypto from 'crypto';
import { sendLeadNotification } from '../utils/email.utils';
const router = Router();
const prismaLeads = (prisma as any).leads;
const prismaClients = (prisma as any).clients;

const ALLOWED_SOURCES = ['Friends/Family', 'Instagram', 'TikTok', 'Ads'];
const ALLOWED_STATUSES = ['Baru', 'Dihubungi', 'Konversi', 'Hilang'];

const ALLOWED_FIELDS = [
  'id', 'name', 'city', 'whatsapp', 'source', 'status', 'notes', 'client_id',
];

function slugify(text: string): string {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^\w-]+/g, '')
    .replace(/--+/g, '-');
}

function generatePortalAccessId(name: string): string {
  const slug = slugify(name).slice(0, 12) || 'client';
  const shortId = crypto.randomBytes(2).toString('hex').toUpperCase();
  return `${slug}-${shortId}`;
}

function sanitizeLeadData(body: any) {
  const result: any = {};
  for (const key of ALLOWED_FIELDS) {
    if (body[key] !== undefined) {
      result[key] = body[key];
    }
  }
  if (result.id) result.id = Number(result.id);
  if (result.client_id) result.client_id = Number(result.client_id);
  if (result.source && !ALLOWED_SOURCES.includes(result.source)) {
    throw new Error(`Sumber tidak valid. Pilih: ${ALLOWED_SOURCES.join(', ')}`);
  }
  if (result.status && !ALLOWED_STATUSES.includes(result.status)) {
    throw new Error(`Status tidak valid. Pilih: ${ALLOWED_STATUSES.join(', ')}`);
  }
  return result;
}

router.get('/stats', async (req, res) => {
  try {
    const vendorId = getVendorId(req);
    const { dateFrom, dateTo } = req.query;
    const where: any = { vendor_id: vendorId };
    if (dateFrom || dateTo) {
      where.created_at = {};
      if (dateFrom) where.created_at.gte = new Date(String(dateFrom));
      if (dateTo) {
        const to = new Date(String(dateTo));
        to.setHours(23, 59, 59, 999);
        where.created_at.lte = to;
      }
    }

    const leads = await prismaLeads.findMany({ where, select: { source: true, status: true } });

    const bySource: Record<string, number> = {};
    const byStatus: Record<string, number> = {};
    for (const lead of leads) {
      bySource[lead.source] = (bySource[lead.source] || 0) + 1;
      byStatus[lead.status] = (byStatus[lead.status] || 0) + 1;
    }

    res.json({
      total: leads.length,
      bySource,
      byStatus,
      converted: byStatus['Konversi'] || 0,
      newLeads: byStatus['Baru'] || 0,
    });
  } catch (error: any) {
    console.error('[GET /leads/stats] Error:', error?.message || error);
    res.status(500).json({ error: 'Gagal mengambil statistik leads', detail: error?.message });
  }
});

router.get('/paginated', async (req, res) => {
  try {
    const vendorId = getVendorId(req);
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 20;
    const offset = (page - 1) * limit;
    const { search, source, status, city, dateFrom, dateTo } = req.query;

    const where: any = { vendor_id: vendorId };
    if (search) {
      const term = String(search);
      where.OR = [
        { name: { contains: term } },
        { whatsapp: { contains: term } },
        { city: { contains: term } },
      ];
    }
    if (source) where.source = String(source);
    if (status) where.status = String(status);
    if (city) where.city = String(city);
    if (dateFrom || dateTo) {
      where.created_at = {};
      if (dateFrom) where.created_at.gte = new Date(String(dateFrom));
      if (dateTo) {
        const to = new Date(String(dateTo));
        to.setHours(23, 59, 59, 999);
        where.created_at.lte = to;
      }
    }

    const [total, leads] = await Promise.all([
      prismaLeads.count({ where }),
      prismaLeads.findMany({ where, skip: offset, take: limit, orderBy: { created_at: 'desc' } }),
    ]);

    res.json({ leads, total, hasMore: page * limit < total });
  } catch (error: any) {
    console.error('[GET /leads/paginated] Error:', error?.message || error);
    res.status(500).json({ error: 'Gagal mengambil paginasi leads', detail: error?.message });
  }
});

router.get('/', async (req, res) => {
  try {
    const vendorId = getVendorId(req);
    const { limit = '100', offset = '0', source, status, city } = req.query;
    const where: any = { vendor_id: vendorId };
    if (source) where.source = String(source);
    if (status) where.status = String(status);
    if (city) where.city = String(city);

    const leads = await prismaLeads.findMany({
      where,
      skip: Number(offset),
      take: Math.min(500, Number(limit)),
      orderBy: { created_at: 'desc' },
    });
    res.json(leads);
  } catch (error: any) {
    console.error('[GET /leads] Error:', error?.message || error);
    res.status(500).json({ error: 'Gagal mengambil data leads', detail: error?.message });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const vendorId = getVendorId(req);
    const lead = await prismaLeads.findFirst({ where: { id: Number(req.params.id), vendor_id: vendorId } });
    if (!lead) return res.status(404).json({ error: 'Lead not found' });
    res.json(lead);
  } catch (error: any) {
    console.error('[GET /leads/:id] Error:', error?.message || error);
    res.status(500).json({ error: 'Gagal mengambil detail lead', detail: error?.message });
  }
});

router.post('/', async (req, res) => {
  try {
    const vendorId = getVendorId(req);
    const data = sanitizeLeadData(req.body);
    if (!data.name || !data.whatsapp || !data.source) {
      return res.status(400).json({ error: 'Nama, WhatsApp, dan sumber wajib diisi' });
    }
    if (!data.status) data.status = 'Baru';
    data.vendor_id = vendorId;
    const lead = await prismaLeads.create({ data });
    sseManager.broadcast('leads', 'created', { id: lead.id }, getVendorId(req));

    // Send email notification to Admin/Vendor
    if (vendorId) {
      const vendorUser = await (prisma as any).users.findUnique({
        where: { id: vendorId },
        select: { email: true }
      });
      if (vendorUser?.email) {
        await sendLeadNotification(vendorUser.email, {
          name: lead.name,
          email: lead.email || 'Tidak dicantumkan', // Frontend might not send email, fallback
          phone: lead.whatsapp,
          message: lead.notes || 'Lead baru dari ' + lead.source
        });
      }
    }

    res.status(201).json(lead);
  } catch (error: any) {
    console.error('[POST /leads] Error:', error?.message || error);
    res.status(500).json({ error: 'Gagal membuat lead', detail: error?.message });
  }
});

router.patch('/:id', async (req, res) => {
  try {
    const vendorId = getVendorId(req);
    const existing = await prismaLeads.findFirst({ where: { id: Number(req.params.id), vendor_id: vendorId } });
    if (!existing) return res.status(404).json({ error: 'Not found' });
    const data = sanitizeLeadData(req.body);
    delete data.id;
    data.updated_at = new Date();
    const lead = await prismaLeads.update({ where: { id: Number(req.params.id) }, data });
    sseManager.broadcast('leads', 'updated', { id: Number(req.params.id) }, getVendorId(req));
    res.json(lead);
  } catch (error: any) {
    console.error('[PATCH /leads/:id] Error:', error?.message || error);
    res.status(500).json({ error: 'Gagal update lead', detail: error?.message });
  }
});

router.post('/:id/convert', async (req, res) => {
  try {
    const vendorId = getVendorId(req);
    const lead = await prismaLeads.findFirst({ where: { id: Number(req.params.id), vendor_id: vendorId } });
    if (!lead) return res.status(404).json({ error: 'Lead not found' });
    if (lead.client_id) {
      return res.status(400).json({ error: 'Lead sudah dikonversi ke klien' });
    }

    let portalId = generatePortalAccessId(lead.name);
    let attempts = 0;
    while (attempts < 5) {
      const existing = await prismaClients.findUnique({ where: { portal_access_id: portalId } });
      if (!existing) break;
      portalId = generatePortalAccessId(lead.name);
      attempts++;
    }

    const client = await prismaClients.create({
      data: {
        vendor_id: vendorId,
        name: lead.name,
        phone: lead.whatsapp,
        whatsapp: lead.whatsapp,
        address: lead.city || null,
        since: new Date(),
        status: 'Aktif',
        client_type: 'Langsung',
        last_contact: new Date(),
        portal_access_id: portalId,
      },
    });

    const updatedLead = await prismaLeads.update({
      where: { id: lead.id },
      data: { status: 'Konversi', client_id: client.id, updated_at: new Date() },
    });

    sseManager.broadcast('leads', 'updated', { id: lead.id }, getVendorId(req));
    sseManager.broadcast('clients', 'created', { id: client.id }, getVendorId(req));
    res.json({ lead: updatedLead, client });
  } catch (error: any) {
    console.error('[POST /leads/:id/convert] Error:', error?.message || error);
    res.status(500).json({ error: 'Gagal konversi lead ke klien', detail: error?.message });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const vendorId = getVendorId(req);
    const existing = await prismaLeads.findFirst({ where: { id: Number(req.params.id), vendor_id: vendorId } });
    if (!existing) return res.status(404).json({ error: 'Not found' });
    await prismaLeads.delete({ where: { id: Number(req.params.id) } });
    sseManager.broadcast('leads', 'deleted', { id: Number(req.params.id) }, getVendorId(req));
    res.status(204).send();
  } catch (error: any) {
    console.error('[DELETE /leads/:id] Error:', error?.message || error);
    res.status(500).json({ error: 'Gagal menghapus lead', detail: error?.message });
  }
});

export default router;


