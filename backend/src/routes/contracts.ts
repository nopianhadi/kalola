import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { getVendorId } from '../middleware/auth';

const router = Router();
const prisma = new PrismaClient();
const prismaContracts = (prisma as any).contracts || (prisma as any).contract;
const prismaProjects = (prisma as any).projects || (prisma as any).project;

/** Helper: pastikan project_id milik vendor yang login */
async function assertProjectOwnership(projectId: number, vendorId: number): Promise<boolean> {
  const project = await prismaProjects.findFirst({
    where: { id: projectId, vendor_id: vendorId },
  });
  return !!project;
}

router.get('/summary', async (req, res) => {
  try {
    const vendorId = getVendorId(req);
    // Ambil hanya contracts dari projects milik vendor ini
    const contracts = await prismaContracts.findMany({
      where: { projects: { vendor_id: vendorId } },
      select: { id: true, vendor_signature: true, client_signature: true, project_id: true },
    });
    const projects = await prismaProjects.findMany({
      where: { vendor_id: vendorId },
      select: { id: true, total_cost: true },
    });
    const projectMap = new Map(projects.map((p: any) => [p.id, Number(p.total_cost || 0)]));

    let waitingForClient = 0;
    let waitingForVendor = 0;
    let totalValue = 0;

    contracts.forEach((c: any) => {
      if (c.vendor_signature && !c.client_signature) waitingForClient++;
      if (!c.vendor_signature) waitingForVendor++;
      totalValue += (projectMap.get(c.project_id) as number) || 0;
    });

    res.json({ waitingForClient, waitingForVendor, totalValue });
  } catch (error) {
    res.status(500).json({ error: 'Gagal' });
  }
});

router.get('/paginated', async (req, res) => {
  try {
    const vendorId = getVendorId(req);
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 20;
    const offset = (page - 1) * limit;
    const search = req.query.search ? String(req.query.search) : '';

    const where: any = { projects: { vendor_id: vendorId } };
    if (search) {
      where.OR = [
        { contract_number: { contains: search } },
        { client_name_1: { contains: search } },
        { client_name_2: { contains: search } },
      ];
    }

    const [total, contracts] = await Promise.all([
      prismaContracts.count({ where }),
      prismaContracts.findMany({ where, skip: offset, take: limit, orderBy: { created_at: 'desc' } }),
    ]);

    res.json({ contracts, total });
  } catch (error) {
    res.status(500).json({ error: 'Gagal' });
  }
});

router.get('/project/:projectId', async (req, res) => {
  try {
    const vendorId = getVendorId(req);
    const projectId = Number(req.params.projectId);
    if (!await assertProjectOwnership(projectId, vendorId)) {
      return res.status(403).json({ error: 'Akses ditolak' });
    }
    const contract = await prismaContracts.findFirst({ where: { project_id: projectId } });
    if (!contract) return res.status(404).json({ error: 'Not Found' });
    res.json(contract);
  } catch (error) {
    res.status(500).json({ error: 'Gagal' });
  }
});

router.get('/', async (req, res) => {
  try {
    const vendorId = getVendorId(req);
    const contracts = await prismaContracts.findMany({
      where: { projects: { vendor_id: vendorId } },
      orderBy: { created_at: 'desc' },
    });
    res.json(contracts);
  } catch (error) {
    res.status(500).json({ error: 'Gagal' });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const vendorId = getVendorId(req);
    const contract = await prismaContracts.findFirst({
      where: {
        id: Number(req.params.id),
        projects: { vendor_id: vendorId },
      },
    });
    if (!contract) return res.status(404).json({ error: 'Not Found' });
    res.json(contract);
  } catch (error) {
    res.status(500).json({ error: 'Gagal' });
  }
});

router.post('/', async (req, res) => {
  try {
    const vendorId = getVendorId(req);
    const projectId = Number(req.body.project_id);
    const clientId = Number(req.body.client_id);

    if (!Number.isFinite(projectId) || projectId <= 0) {
      return res.status(400).json({ error: 'project_id wajib berupa angka valid.' });
    }
    if (!Number.isFinite(clientId) || clientId <= 0) {
      return res.status(400).json({ error: 'client_id wajib berupa angka valid.' });
    }

    if (!await assertProjectOwnership(projectId, vendorId)) {
      return res.status(403).json({ error: 'Akses ditolak' });
    }

    const contract = await prismaContracts.create({
      data: {
        ...req.body,
        project_id: projectId,
        client_id: clientId,
      },
    });
    res.status(201).json(contract);
  } catch (error: any) {
    console.error('[contracts.create] raw error:', error);
    console.error('[contracts.create] stack:', error?.stack || 'no stack');
    res.status(500).json({
      error: error?.message || 'Gagal menyimpan kontrak ke database.',
      detail: error?.code || error?.name || null,
    });
  }
});

router.patch('/:id', async (req, res) => {
  try {
    const vendorId = getVendorId(req);
    const existing = await prismaContracts.findFirst({
      where: {
        id: Number(req.params.id),
        projects: { vendor_id: vendorId },
      },
    });
    if (!existing) return res.status(404).json({ error: 'Not Found' });
    const contract = await prismaContracts.update({
      where: { id: Number(req.params.id) },
      data: req.body,
    });
    res.json(contract);
  } catch (error: any) {
    console.error('[contracts.update] raw error:', error);
    console.error('[contracts.update] stack:', error?.stack || 'no stack');
    res.status(500).json({
      error: error?.message || 'Gagal memperbarui kontrak di database.',
      detail: error?.code || error?.name || null,
    });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const vendorId = getVendorId(req);
    const existing = await prismaContracts.findFirst({
      where: {
        id: Number(req.params.id),
        projects: { vendor_id: vendorId },
      },
    });
    if (!existing) return res.status(404).json({ error: 'Not Found' });
    await prismaContracts.delete({ where: { id: Number(req.params.id) } });
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ error: 'Gagal' });
  }
});

export default router;
