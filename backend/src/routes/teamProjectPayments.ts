import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { getVendorId } from '../middleware/auth';

const router = Router();
const prisma = new PrismaClient();
const prismaPayments = (prisma as any).team_project_payments || (prisma as any).teamProjectPayments;
const prismaProjects = (prisma as any).projects;

/** Helper: pastikan project_id milik vendor yang login */
async function assertProjectOwnership(projectId: number, vendorId: number): Promise<boolean> {
  const project = await prismaProjects.findFirst({
    where: { id: projectId, vendor_id: vendorId },
  });
  return !!project;
}

router.get('/', async (req, res) => {
  try {
    const vendorId = getVendorId(req);
    // Hanya ambil pembayaran dari project milik vendor ini
    const data = await prismaPayments.findMany({
      where: { projects: { vendor_id: vendorId } },
      orderBy: { date: 'desc' },
    });
    res.json(data);
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
    const data = await prismaPayments.findMany({ where: { project_id: projectId } });
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: 'Gagal' });
  }
});

router.post('/project/:projectId/upsert', async (req, res) => {
  try {
    const vendorId = getVendorId(req);
    const projectId = Number(req.params.projectId);
    if (!await assertProjectOwnership(projectId, vendorId)) {
      return res.status(403).json({ error: 'Akses ditolak' });
    }

    const incoming = req.body; // array of TeamProjectPayment (frontend shape)

    const existing = await prismaPayments.findMany({ where: { project_id: projectId } });
    const existingByMemberId = new Map<number, any>(
      existing.map((p: any) => [Number(p.team_member_id), p])
    );
    const incomingMemberIds = new Set<number>(incoming.map((p: any) => Number(p.teamMemberId)));

    const merged = incoming.map((p: any) => {
      const memberId = Number(p.teamMemberId);
      const prev = existingByMemberId.get(memberId);
      if (!prev) return {
        project_id: projectId,
        team_member_name: p.teamMemberName,
        team_member_id: memberId,
        date: p.date ? new Date(p.date) : new Date(),
        status: p.status || 'Belum Bayar',
        fee: Number(p.fee || 0),
        amount_paid: Number(p.amountPaid || 0),
      };

      const isPaid = prev.status === 'Lunas';
      return {
        id: prev.id,
        project_id: projectId,
        team_member_name: isPaid ? prev.team_member_name : p.teamMemberName,
        team_member_id: memberId,
        date: isPaid ? prev.date : (p.date ? new Date(p.date) : new Date()),
        status: isPaid ? 'Lunas' : (p.status || 'Belum Bayar'),
        fee: isPaid ? Number(prev.fee) : Number(p.fee || 0),
        amount_paid: isPaid ? Number(prev.amount_paid) : Number(p.amountPaid || 0),
      };
    });

    // Keep paid members that are no longer in incoming (don't delete paid records)
    for (const prev of existing) {
      if (prev.status === 'Lunas' && !incomingMemberIds.has(Number(prev.team_member_id))) {
        merged.push(prev);
      }
    }

    // Delete unpaid records for members no longer in team
    const toDeleteIds = existing
      .filter((p: any) => p.status !== 'Lunas' && !incomingMemberIds.has(Number(p.team_member_id)))
      .map((p: any) => p.id);

    await prisma.$transaction(async (tx: any) => {
      const ptx = tx.team_project_payments || tx.teamProjectPayments;
      if (toDeleteIds.length > 0) {
        await ptx.deleteMany({ where: { id: { in: toDeleteIds } } });
      }

      for (const row of merged) {
        if (row.id) {
          const { id, ...data } = row;
          await ptx.update({ where: { id }, data });
        } else {
          await ptx.create({ data: row });
        }
      }
    });

    const result = await prismaPayments.findMany({ where: { project_id: projectId } });
    res.json(result);
  } catch (error) {
    console.error('[POST /team-project-payments/project/:projectId/upsert] Error:', error);
    res.status(500).json({ error: 'Gagal' });
  }
});

router.patch('/:id/status', async (req, res) => {
  try {
    const vendorId = getVendorId(req);
    const record = await prismaPayments.findFirst({ where: { id: Number(req.params.id) } });
    if (!record) return res.status(404).json({ error: 'Not found' });
    if (!await assertProjectOwnership(record.project_id, vendorId)) {
      return res.status(403).json({ error: 'Akses ditolak' });
    }
    await prismaPayments.update({
      where: { id: Number(req.params.id) },
      data: { status: req.body.status },
    });
    res.status(200).send();
  } catch (error) {
    res.status(500).json({ error: 'Gagal' });
  }
});

router.patch('/:id/fee', async (req, res) => {
  try {
    const vendorId = getVendorId(req);
    const record = await prismaPayments.findFirst({ where: { id: Number(req.params.id) } });
    if (!record) return res.status(404).json({ error: 'Not found' });
    if (!await assertProjectOwnership(record.project_id, vendorId)) {
      return res.status(403).json({ error: 'Akses ditolak' });
    }
    const { fee, status } = req.body;
    await prismaPayments.update({ where: { id: Number(req.params.id) }, data: { fee, status } });
    res.status(200).send();
  } catch (error) {
    res.status(500).json({ error: 'Gagal' });
  }
});

router.patch('/:id', async (req, res) => {
  try {
    const vendorId = getVendorId(req);
    const record = await prismaPayments.findFirst({ where: { id: Number(req.params.id) } });
    if (!record) return res.status(404).json({ error: 'Not found' });
    if (!await assertProjectOwnership(record.project_id, vendorId)) {
      return res.status(403).json({ error: 'Akses ditolak' });
    }
    const data = await prismaPayments.update({
      where: { id: Number(req.params.id) },
      data: req.body,
    });
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: 'Gagal' });
  }
});

router.delete('/project/:projectId', async (req, res) => {
  try {
    const vendorId = getVendorId(req);
    const projectId = Number(req.params.projectId);
    if (!await assertProjectOwnership(projectId, vendorId)) {
      return res.status(403).json({ error: 'Akses ditolak' });
    }
    await prismaPayments.deleteMany({ where: { project_id: projectId } });
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ error: 'Gagal' });
  }
});

router.post('/sync-project/:projectId', async (req, res) => {
  try {
    const vendorId = getVendorId(req);
    const projectId = Number(req.params.projectId);
    const prismaAssignments = (prisma as any).project_team_assignments;

    const project = await prismaProjects.findFirst({ where: { id: projectId, vendor_id: vendorId } });
    if (!project) return res.status(404).json({ error: 'Project tidak ditemukan' });

    const assignments = await prismaAssignments.findMany({ where: { project_id: projectId } });
    if (assignments.length === 0) return res.json([]);

    const existing = await prismaPayments.findMany({ where: { project_id: projectId } });
    const existingByMemberId = new Map<number, any>(
      existing.map((p: any) => [Number(p.team_member_id), p])
    );

    await prisma.$transaction(async (tx: any) => {
      const ptx = tx.team_project_payments || tx.teamProjectPayments;
      for (const a of assignments) {
        const memberId = Number(a.member_id);
        const prev = existingByMemberId.get(memberId);
        if (!prev) {
          await ptx.create({
            data: {
              project_id: projectId,
              team_member_id: memberId,
              team_member_name: a.member_name,
              date: project.date,
              status: 'Belum Bayar',
              fee: Number(a.fee || 0),
              amount_paid: 0,
            },
          });
        } else if (prev.status !== 'Lunas') {
          await ptx.update({
            where: { id: prev.id },
            data: { team_member_name: a.member_name, fee: Number(a.fee || 0) },
          });
        }
      }
    });

    const result = await prismaPayments.findMany({ where: { project_id: projectId } });
    res.json(result);
  } catch (error) {
    console.error('[POST /team-project-payments/sync-project/:projectId] Error:', error);
    res.status(500).json({ error: 'Gagal sync' });
  }
});

export default router;
