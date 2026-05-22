import { Router } from 'express';
import { PrismaClient } from '@prisma/client';

const router = Router();
const prisma = new PrismaClient();
const prismaContracts = (prisma as any).contracts || (prisma as any).contract;
const prismaProjects = (prisma as any).projects || (prisma as any).project;

router.get('/summary', async (req, res) => {
  try {
    const contracts = await prismaContracts.findMany({
      select: { id: true, vendor_signature: true, client_signature: true, project_id: true }
    });
    const projects = await prismaProjects.findMany({ select: { id: true, total_cost: true } });
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
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 20;
    const offset = (page - 1) * limit;
    const search = req.query.search ? String(req.query.search) : '';

    const where: any = {};
    if (search) {
      where.OR = [
        { contract_number: { contains: search } },
        { client_name1: { contains: search } },
        { client_name2: { contains: search } }
      ];
    }

    const [total, contracts] = await Promise.all([
      prismaContracts.count({ where }),
      prismaContracts.findMany({ where, skip: offset, take: limit, orderBy: { created_at: 'desc' } })
    ]);

    res.json({ contracts, total });
  } catch (error) {
    res.status(500).json({ error: 'Gagal' });
  }
});

router.get('/project/:projectId', async (req, res) => {
  try {
    const contract = await prismaContracts.findFirst({ where: { project_id: req.params.projectId } });
    if (!contract) return res.status(404).json({ error: 'Not Found' });
    res.json(contract);
  } catch (error) {
    res.status(500).json({ error: 'Gagal' });
  }
});

router.get('/', async (req, res) => {
  try {
    const contracts = await prismaContracts.findMany({ orderBy: { created_at: 'desc' } });
    res.json(contracts);
  } catch (error) {
    res.status(500).json({ error: 'Gagal' });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const contract = await prismaContracts.findUnique({ where: { id: req.params.id } });
    if (!contract) return res.status(404).json({ error: 'Not Found' });
    res.json(contract);
  } catch (error) {
    res.status(500).json({ error: 'Gagal' });
  }
});

router.post('/', async (req, res) => {
  try {
    const contract = await prismaContracts.create({ data: req.body });
    res.status(201).json(contract);
  } catch (error) {
    res.status(500).json({ error: 'Gagal' });
  }
});

router.patch('/:id', async (req, res) => {
  try {
    const contract = await prismaContracts.update({ where: { id: req.params.id }, data: req.body });
    res.json(contract);
  } catch (error) {
    res.status(500).json({ error: 'Gagal' });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    await prismaContracts.delete({ where: { id: req.params.id } });
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ error: 'Gagal' });
  }
});

export default router;

