import { Router } from 'express';
import prisma from '../prismaClient';
import { sseManager } from '../sseManager';
import { getVendorId } from '../middleware/auth';

const router = Router();

const prismaTransactions = (prisma as any).transactions;
const prismaCards = (prisma as any).cards;
const prismaPockets = (prisma as any).financial_pockets;

const mapToFrontend = (row: any) => {
  if (!row) return row;
  return {
    id: row.id,
    date: row.date,
    amount: Number(row.amount || 0),
    type: row.type,
    category: row.category,
    description: row.description,
    method: row.method,
    cardId: row.card_id,
    pocketId: row.pocket_id,
    projectId: row.project_id,
    clientId: row.client_id,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
};

const mapToDb = (body: any) => {
  const result: any = {};
  if (body.id) result.id = Number(body.id);
  if (body.date) result.date = new Date(body.date);
  if (body.amount !== undefined) result.amount = Number(body.amount);
  if (body.type) result.type = body.type;
  if (body.category) result.category = body.category;
  if (body.description) result.description = body.description;
  if (body.method) result.method = body.method;
  if (body.cardId) result.card_id = Number(body.cardId);
  if (body.pocketId) result.pocket_id = Number(body.pocketId);
  if (body.projectId) result.project_id = Number(body.projectId);
  if (body.clientId) result.client_id = Number(body.clientId);
  return result;
};

// 1. Summary
router.get('/summary', async (req, res) => {
  try {
    const vendorId = getVendorId(req);
    const now = new Date();
    const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);

    const [cards, pockets, income, expense] = await Promise.all([
      prismaCards.findMany({ where: { vendor_id: vendorId }, select: { balance: true } }),
      prismaPockets.findMany({ where: { vendor_id: vendorId }, select: { amount: true } }),
      prismaTransactions.aggregate({
        _sum: { amount: true },
        where: {
          vendor_id: vendorId,
          OR: [{ type: 'Income' }, { type: 'Pemasukan' }],
          date: { gte: firstDay },
        },
      }),
      prismaTransactions.aggregate({
        _sum: { amount: true },
        where: {
          vendor_id: vendorId,
          OR: [{ type: 'Expense' }, { type: 'Pengeluaran' }],
          date: { gte: firstDay },
        },
      }),
    ]);

    res.json({
      totalAssets: cards.reduce((sum: number, c: any) => sum + Number(c.balance || 0), 0),
      pocketsTotal: pockets.reduce((sum: number, p: any) => sum + Number(p.amount || 0), 0),
      totalIncomeThisMonth: Number(income._sum.amount || 0),
      totalExpenseThisMonth: Number(expense._sum.amount || 0),
    });
  } catch (error: any) {
    console.error('[GET /transactions/summary] Error:', error?.message);
    res.status(500).json({ error: 'Gagal' });
  }
});

// 2. Paginated List
router.get('/paginated', async (req, res) => {
  try {
    const vendorId = getVendorId(req);
    const { page = '1', limit = '20', type, category, dateFrom, dateTo, search } = req.query;
    const skip = (Number(page) - 1) * Number(limit);
    const take = Number(limit);

    const where: any = { vendor_id: vendorId };
    if (type && type !== 'all') where.type = type;
    if (category && category !== 'Semua') where.category = category;
    if (search) where.description = { contains: String(search) };
    if (dateFrom || dateTo) {
      where.date = {};
      if (dateFrom) where.date.gte = new Date(String(dateFrom));
      if (dateTo) {
        const dTo = new Date(String(dateTo));
        dTo.setHours(23, 59, 59, 999);
        where.date.lte = dTo;
      }
    }

    const [total, rows] = await Promise.all([
      prismaTransactions.count({ where }),
      prismaTransactions.findMany({ where, skip, take, orderBy: { date: 'desc' } }),
    ]);

    res.json({ transactions: rows.map(mapToFrontend), total });
  } catch (error: any) {
    console.error('[GET /transactions/paginated] Error:', error?.message);
    res.status(500).json({ error: 'Gagal' });
  }
});

// 3. Simple List
router.get('/', async (req, res) => {
  try {
    const vendorId = getVendorId(req);
    const { limit = '50', offset = '0', projectId, clientId } = req.query;
    const where: any = { vendor_id: vendorId };

    if (projectId) where.project_id = Number(projectId);
    if (clientId) {
      const clientProjects = await (prisma as any).projects.findMany({
        where: { vendor_id: vendorId, client_id: Number(clientId) },
        select: { id: true },
      });
      const projectIds = clientProjects.map((p: any) => p.id);
      where.OR = [
        { client_id: Number(clientId) },
        ...(projectIds.length > 0 ? [{ project_id: { in: projectIds } }] : []),
      ];
    }

    const rows = await prismaTransactions.findMany({
      where,
      skip: Number(offset),
      take: Math.min(500, Number(limit)),
      orderBy: { date: 'desc' },
    });
    res.json(rows.map(mapToFrontend));
  } catch (error: any) {
    console.error('[GET /transactions] Error:', error?.message);
    res.status(500).json({ error: 'Gagal' });
  }
});

// 4. Create Transaction
router.post('/', async (req, res) => {
  try {
    const vendorId = getVendorId(req);
    const data = mapToDb(req.body);
    delete data.id;
    data.vendor_id = vendorId;

    const isIncome = data.type === 'Income' || data.type === 'Pemasukan';
    const amountDelta = isIncome ? Number(data.amount) : -Number(data.amount);

    if (data.card_id) {
      // Verifikasi card milik vendor ini sebelum update balance
      const card = await prismaCards.findFirst({ where: { id: data.card_id, vendor_id: vendorId } });
      if (!card) return res.status(403).json({ error: 'Kartu tidak ditemukan atau bukan milik Anda.' });

      const [newTx] = await prisma.$transaction([
        prismaTransactions.create({ data }),
        prismaCards.update({ where: { id: data.card_id }, data: { balance: { increment: amountDelta } } }),
      ]);
      sseManager.broadcast('transactions', 'created', { id: newTx.id }, getVendorId(req));
      sseManager.broadcast('cards', 'updated', { id: data.card_id }, getVendorId(req));
      res.status(201).json(mapToFrontend(newTx));
    } else if (data.pocket_id) {
      // Verifikasi pocket milik vendor ini sebelum update balance
      const pocket = await prismaPockets.findFirst({ where: { id: data.pocket_id, vendor_id: vendorId } });
      if (!pocket) return res.status(403).json({ error: 'Kantong tidak ditemukan atau bukan milik Anda.' });

      const [newTx] = await prisma.$transaction([
        prismaTransactions.create({ data }),
        prismaPockets.update({ where: { id: data.pocket_id }, data: { amount: { increment: amountDelta } } }),
      ]);
      sseManager.broadcast('transactions', 'created', { id: newTx.id }, getVendorId(req));
      sseManager.broadcast('pockets', 'updated', { id: data.pocket_id }, getVendorId(req));
      res.status(201).json(mapToFrontend(newTx));
    } else {
      const newTx = await prismaTransactions.create({ data });
      sseManager.broadcast('transactions', 'created', { id: newTx.id }, getVendorId(req));
      res.status(201).json(mapToFrontend(newTx));
    }
  } catch (error: any) {
    console.error('[POST /transactions] Error:', error?.message || error);
    res.status(500).json({ error: 'Gagal membuat transaksi', detail: error?.message });
  }
});

// 5. Update Transaction
router.patch('/:id', async (req, res) => {
  try {
    const vendorId = getVendorId(req);
    const { id } = req.params;
    // Verify ownership
    const existing = await prismaTransactions.findFirst({
      where: { id: Number(id), vendor_id: vendorId },
    });
    if (!existing) return res.status(404).json({ error: 'Transaksi tidak ditemukan' });

    const data = mapToDb(req.body);
    delete data.id;

    const row = await prismaTransactions.update({ where: { id: Number(id) }, data });
    sseManager.broadcast('transactions', 'updated', { id: Number(id) }, getVendorId(req));
    res.json(mapToFrontend(row));
  } catch (error: any) {
    console.error('[PATCH /transactions/:id] Error:', error?.message);
    res.status(500).json({ error: 'Gagal update' });
  }
});

// 6. Delete Transaction
router.delete('/:id', async (req, res) => {
  try {
    const vendorId = getVendorId(req);
    const { id } = req.params;

    const tx = await prismaTransactions.findFirst({
      where: { id: Number(id), vendor_id: vendorId },
    });
    if (!tx) return res.status(404).json({ error: 'Transaksi tidak ditemukan' });

    const isIncome = tx.type === 'Income' || tx.type === 'Pemasukan';
    const reversalDelta = isIncome ? -Number(tx.amount) : Number(tx.amount);

    if (tx.card_id) {
      await prisma.$transaction([
        prismaCards.update({ where: { id: tx.card_id }, data: { balance: { increment: reversalDelta } } }),
        prismaTransactions.delete({ where: { id: Number(id) } }),
      ]);
      sseManager.broadcast('transactions', 'deleted', { id: Number(id) }, getVendorId(req));
      sseManager.broadcast('cards', 'updated', { id: tx.card_id }, getVendorId(req));
    } else if (tx.pocket_id) {
      await prisma.$transaction([
        prismaPockets.update({ where: { id: tx.pocket_id }, data: { amount: { increment: reversalDelta } } }),
        prismaTransactions.delete({ where: { id: Number(id) } }),
      ]);
      sseManager.broadcast('transactions', 'deleted', { id: Number(id) }, getVendorId(req));
      sseManager.broadcast('pockets', 'updated', { id: tx.pocket_id }, getVendorId(req));
    } else {
      await prismaTransactions.delete({ where: { id: Number(id) } });
      sseManager.broadcast('transactions', 'deleted', { id: Number(id) }, getVendorId(req));
    }

    res.status(204).send();
  } catch (error: any) {
    console.error('[DELETE /transactions/:id] Error:', error?.message);
    res.status(500).json({ error: 'Gagal menghapus' });
  }
});

// 7. Batch Create
router.post('/batch', async (req, res) => {
  try {
    const vendorId = getVendorId(req);
    const items = req.body;
    if (!Array.isArray(items)) return res.status(400).json({ error: 'Payload must be an array' });

    // Pre-validate semua card/pocket ID milik vendor ini sebelum memulai transaksi
    const cardIds = [...new Set(items.map((i: any) => i.cardId ? Number(i.cardId) : null).filter(Boolean))] as number[];
    const pocketIds = [...new Set(items.map((i: any) => i.pocketId ? Number(i.pocketId) : null).filter(Boolean))] as number[];

    if (cardIds.length > 0) {
      const ownedCards = await prismaCards.findMany({ where: { id: { in: cardIds }, vendor_id: vendorId }, select: { id: true } });
      const ownedCardIds = new Set(ownedCards.map((c: any) => c.id));
      const invalid = cardIds.find(id => !ownedCardIds.has(id));
      if (invalid) return res.status(403).json({ error: `Kartu ID ${invalid} bukan milik Anda.` });
    }
    if (pocketIds.length > 0) {
      const ownedPockets = await prismaPockets.findMany({ where: { id: { in: pocketIds }, vendor_id: vendorId }, select: { id: true } });
      const ownedPocketIds = new Set(ownedPockets.map((p: any) => p.id));
      const invalid = pocketIds.find(id => !ownedPocketIds.has(id));
      if (invalid) return res.status(403).json({ error: `Kantong ID ${invalid} bukan milik Anda.` });
    }

    const results: any[] = [];

    await prisma.$transaction(async (tx: any) => {
      const ptx = tx.transactions;
      const pcards = tx.cards;
      const ppockets = tx.financial_pockets;

      for (const item of items) {
        const data = mapToDb(item);
        delete data.id;
        data.vendor_id = vendorId;

        const isIncome = data.type === 'Income' || data.type === 'Pemasukan';
        const amountDelta = isIncome ? Number(data.amount) : -Number(data.amount);

        const newTx = await ptx.create({ data });
        results.push(mapToFrontend(newTx));

        if (data.card_id) {
          await pcards.update({ where: { id: data.card_id }, data: { balance: { increment: amountDelta } } });
        } else if (data.pocket_id) {
          await ppockets.update({ where: { id: data.pocket_id }, data: { amount: { increment: amountDelta } } });
        }
      }
    });

    res.status(201).json(results);
    sseManager.broadcast('transactions', 'created', undefined, getVendorId(req));
    sseManager.broadcast('cards', 'updated', undefined, getVendorId(req));
    sseManager.broadcast('pockets', 'updated', undefined, getVendorId(req));
  } catch (error: any) {
    console.error('[POST /transactions/batch] Error:', error?.message);
    res.status(500).json({ error: 'Gagal batch create' });
  }
});

// 8. Update Balance (Direct â€” tidak butuh verifikasi karena dipakai internal)
router.post('/update-balance', async (req, res) => {
  try {
    const vendorId = getVendorId(req);
    const { cardId, pocketId, delta } = req.body;
    const amountDelta = Number(delta);

    if (cardId) {
      // Verify card ownership
      const card = await prismaCards.findFirst({ where: { id: Number(cardId), vendor_id: vendorId } });
      if (!card) return res.status(403).json({ error: 'Akses ditolak' });
      const updated = await prismaCards.update({
        where: { id: Number(cardId) },
        data: { balance: { increment: amountDelta } },
      });
      return res.json({ success: true, balance: Number(updated.balance) });
    } else if (pocketId) {
      // Verify pocket ownership
      const pocket = await prismaPockets.findFirst({ where: { id: Number(pocketId), vendor_id: vendorId } });
      if (!pocket) return res.status(403).json({ error: 'Akses ditolak' });
      const updated = await prismaPockets.update({
        where: { id: Number(pocketId) },
        data: { amount: { increment: amountDelta } },
      });
      return res.json({ success: true, amount: Number(updated.amount) });
    }

    res.status(400).json({ error: 'Missing cardId or pocketId' });
  } catch (error: any) {
    console.error('[POST /transactions/update-balance] Error:', error?.message);
    res.status(500).json({ error: 'Gagal update balance' });
  }
});

export default router;

