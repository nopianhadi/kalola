import { Router } from 'express';
import { PrismaClient } from '@prisma/client';

const router = Router();
const prisma = new PrismaClient();
const prismaPayments = (prisma as any).team_project_payments || (prisma as any).teamProjectPayments;

router.get('/', async (req, res) => {
  try {
    const data = await prismaPayments.findMany({ orderBy: { date: 'desc' } });
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: 'Gagal' });
  }
});

router.get('/project/:projectId', async (req, res) => {
  try {
    const data = await prismaPayments.findMany({ where: { project_id: req.params.projectId } });
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: 'Gagal' });
  }
});

router.post('/project/:projectId/upsert', async (req, res) => {
  try {
    const { projectId } = req.params;
    const incoming = req.body;

    const existing = await prismaPayments.findMany({ where: { project_id: projectId } });
    const existingByMemberId = new Map<string, any>(existing.map((p: any) => [p.team_member_id, p]));
    const incomingMemberIds = new Set<string>(incoming.map((p: any) => p.teamMemberId));

    const merged = incoming.map((p: any) => {
      const prev = existingByMemberId.get(p.teamMemberId);
      if (!prev) return {
         project_id: projectId,
         team_member_name: p.teamMemberName,
         team_member_id: p.teamMemberId,
         date: p.date,
         status: p.status,
         fee: p.fee,
         amount_paid: p.amountPaid || 0,
      };

      const isPaid = prev.status === 'Lunas';
      return {
        id: prev.id,
        project_id: projectId,
        team_member_name: isPaid ? prev.team_member_name : p.teamMemberName,
        team_member_id: p.teamMemberId,
        date: isPaid ? prev.date : p.date,
        status: isPaid ? 'Lunas' : p.status,
        fee: isPaid ? prev.fee : p.fee,
        amount_paid: isPaid ? prev.amount_paid : p.amountPaid,
      };
    });

    for (const prev of existing) {
      if (prev.status === 'Lunas' && !incomingMemberIds.has(prev.team_member_id)) {
        merged.push(prev);
      }
    }

    const toDeleteIds = existing
      .filter((p: any) => p.status !== 'Lunas' && !incomingMemberIds.has(p.team_member_id))
      .map((p: any) => p.id);

    await prisma.$transaction(async (tx: any) => {
      const ptx = tx.team_project_payments || tx.teamProjectPayments;
      if (toDeleteIds.length > 0) {
        await ptx.deleteMany({ where: { id: { in: toDeleteIds } } });
      }
      
      for (const row of merged) {
        if (row.id) {
          await ptx.update({ where: { id: row.id }, data: row });
        } else {
          await ptx.create({ data: row });
        }
      }
    });

    const result = await prismaPayments.findMany({ where: { project_id: projectId } });
    res.json(result);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Gagal' });
  }
});

router.patch('/:id/status', async (req, res) => {
  try {
    await prismaPayments.update({ where: { id: req.params.id }, data: { status: req.body.status } });
    res.status(200).send();
  } catch (error) {
    res.status(500).json({ error: 'Gagal' });
  }
});

router.patch('/:id/fee', async (req, res) => {
  try {
    const { fee, status } = req.body;
    await prismaPayments.update({ where: { id: req.params.id }, data: { fee, status } });
    res.status(200).send();
  } catch (error) {
    res.status(500).json({ error: 'Gagal' });
  }
});

router.patch('/:id', async (req, res) => {
  try {
    const data = await prismaPayments.update({ where: { id: req.params.id }, data: req.body });
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: 'Gagal' });
  }
});

router.post('/upsert-many', async (req, res) => {
  try {
    const items = req.body;
    const results = [];
    for (const item of items) {
      if (item.id && /^[0-9a-fA-F-]{36}$/.test(item.id)) {
        results.push(await prismaPayments.update({ where: { id: item.id }, data: item }));
      } else {
        results.push(await prismaPayments.create({ data: item }));
      }
    }
    res.json(results);
  } catch (error) {
    res.status(500).json({ error: 'Gagal' });
  }
});

router.delete('/project/:projectId', async (req, res) => {
  try {
    await prismaPayments.deleteMany({ where: { project_id: req.params.projectId } });
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ error: 'Gagal' });
  }
});

export default router;

