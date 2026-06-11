import { Router } from 'express';
import prisma from '../prismaClient';
import { sseManager } from '../sseManager';
import { getVendorId } from '../middleware/auth';

const router = Router();

const prismaClientModel = (prisma as any).clients;
const prismaProjectModel = (prisma as any).projects;

// Field yang diizinkan untuk tabel clients
const ALLOWED_FIELDS = [
  'id', 'name', 'email', 'phone', 'whatsapp', 'since',
  'instagram', 'status', 'client_type', 'last_contact',
  'portal_access_id', 'address', 'avatar',
];

function sanitizeClientData(body: any) {
  const result: any = {};
  for (const key of ALLOWED_FIELDS) {
    if (body[key] !== undefined) {
      result[key] = body[key];
    }
  }

  if (body.id) {
    result.id = Number(body.id);
  }

  // `since` adalah @db.Date â€” Prisma butuh Date object
  if (result.since && !(result.since instanceof Date)) {
    result.since = new Date(result.since);
  }
  // `last_contact` adalah @db.Timestamp â€” Prisma butuh Date object
  if (result.last_contact && !(result.last_contact instanceof Date)) {
    result.last_contact = new Date(result.last_contact);
  }
  return result;
}

router.post('/:id/sync-status', async (req, res) => {
  try {
    const vendorId = getVendorId(req);
    const { id } = req.params;
    const client = await prismaClientModel.findFirst({ where: { id: Number(id), vendor_id: vendorId } });
    if (!client) return res.status(404).json({ error: 'Client not found' });

    // Don't sync if client status is manually set to 'Hilang' (Lost)
    if (client.status === 'Hilang') {
      return res.json({ message: 'Status tidak perlu diubah (client hilang)', status: client.status });
    }

    const activeProjects = await prismaProjectModel.findMany({
      where: {
        vendor_id: vendorId,
        client_id: Number(id),
        NOT: { status: { in: ['Selesai', 'Dibatalkan'] } }
      }
    });

    const nextStatus = activeProjects.length > 0 ? 'Aktif' : 'Tidak Aktif';

    if (nextStatus !== client.status) {
      await prismaClientModel.update({ where: { id: Number(id) }, data: { status: nextStatus } });
    }
    res.json({ message: 'Sync berhasil', status: nextStatus });
  } catch (error: any) {
    console.error('[POST /clients/:id/sync-status] Error:', error?.message || error);
    res.status(500).json({ error: 'Gagal sync client status', detail: error?.message });
  }
});

router.get('/paginated', async (req, res) => {
  try {
    const vendorId = getVendorId(req);
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 20;
    const offset = (page - 1) * limit;

    const { search, status, clientType } = req.query;

    const where: any = { vendor_id: vendorId };
    if (search) {
      const searchTerm = String(search);
      where.OR = [
        { name: { contains: searchTerm } },
        { email: { contains: searchTerm } },
        { phone: { contains: searchTerm } }
      ];
    }
    if (status) where.status = String(status);
    if (clientType) where.client_type = String(clientType);

    const [total, clients] = await Promise.all([
      prismaClientModel.count({ where }),
      prismaClientModel.findMany({ where, skip: offset, take: limit, orderBy: { since: 'desc' } })
    ]);

    res.json({ clients, total, hasMore: (page * limit) < total });
  } catch (error: any) {
    console.error('[GET /clients/paginated] Error:', error?.message || error);
    res.status(500).json({ error: 'Gagal mengambil paginasi klien', detail: error?.message });
  }
});

router.get('/', async (req, res) => {
  try {
    const vendorId = getVendorId(req);
    const { limit = '50', offset = '0' } = req.query;
    const clients = await prismaClientModel.findMany({
      where: { vendor_id: vendorId },
      skip: Number(offset), take: Math.min(100, Number(limit)), orderBy: { since: 'desc' }
    });
    res.json(clients);
  } catch (error: any) {
    console.error('[GET /clients] Error:', error?.message || error);
    res.status(500).json({ error: 'Gagal mengambil data klien', detail: error?.message });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const vendorId = getVendorId(req);
    const client = await prismaClientModel.findFirst({ where: { id: Number(req.params.id), vendor_id: vendorId } });
    if (!client) return res.status(404).json({ error: 'Client not found' });
    res.json(client);
  } catch (error: any) {
    console.error('[GET /clients/:id] Error:', error?.message || error);
    res.status(500).json({ error: 'Gagal mengambil detail klien', detail: error?.message });
  }
});

router.post('/', async (req, res) => {
  try {
    const vendorId = getVendorId(req);
    const data = sanitizeClientData(req.body);
    data.vendor_id = vendorId;
    console.log('[POST /clients] Payload:', data);
    const client = await prismaClientModel.create({ data });
    sseManager.broadcast('clients', 'created', { id: client.id }, getVendorId(req));
    res.status(201).json(client);
  } catch (error: any) {
    console.error('[POST /clients] Error:', error?.message || error);
    res.status(500).json({ error: 'Gagal membuat klien', detail: error?.message });
  }
});

router.patch('/:id', async (req, res) => {
  try {
    const vendorId = getVendorId(req);
    // Verify ownership first
    const existing = await prismaClientModel.findFirst({ where: { id: Number(req.params.id), vendor_id: vendorId } });
    if (!existing) return res.status(404).json({ error: 'Client not found' });

    const data = sanitizeClientData(req.body);
    delete data.id;
    const client = await prismaClientModel.update({ where: { id: Number(req.params.id) }, data });
    sseManager.broadcast('clients', 'updated', { id: Number(req.params.id) }, getVendorId(req));
    res.json(client);
  } catch (error: any) {
    console.error('[PATCH /clients/:id] Error:', error?.message || error);
    res.status(500).json({ error: 'Gagal update klien', detail: error?.message });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const vendorId = getVendorId(req);
    const existing = await prismaClientModel.findFirst({ where: { id: Number(req.params.id), vendor_id: vendorId } });
    if (!existing) return res.status(404).json({ error: 'Client not found' });

    await prismaClientModel.delete({ where: { id: Number(req.params.id) } });
    sseManager.broadcast('clients', 'deleted', { id: Number(req.params.id) }, getVendorId(req));
    res.status(204).send();
  } catch (error: any) {
    console.error('[DELETE /clients/:id] Error:', error?.message || error);
    res.status(500).json({ error: 'Gagal menghapus klien', detail: error?.message });
  }
});

export default router;


