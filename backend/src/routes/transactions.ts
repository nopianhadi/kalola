import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import crypto from 'crypto';

const router = Router();
const prisma = new PrismaClient();

const prismaTransactions = (prisma as any).transactions;
const prismaCards = (prisma as any).cards;
const prismaPockets = (prisma as any).financial_pockets;

// Field mapping for transactions
const mapToFrontend = (row: any) => {
  if (!row) return row;
  return {
    id: row.id,
    date: row.date,
    amount: Number(row.amount || 0),
    type: row.type, // 'Pemasukan' or 'Pengeluaran'
    category: row.category,
    description: row.description,
    method: row.method,
    cardId: row.card_id,
    pocketId: row.pocket_id,
    projectId: row.project_id,
    clientId: row.client_id,
    receiptUrl: row.receipt_url,
    notes: row.notes,
    createdAt: row.created_at,
    updatedAt: row.updated_at
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
  
  // IDs
  if (body.cardId) result.card_id = Number(body.cardId);
  if (body.pocketId) result.pocket_id = Number(body.pocketId);
  if (body.projectId) result.project_id = Number(body.projectId);
  if (body.clientId) result.client_id = Number(body.clientId);
  
  if (body.receiptUrl) result.receipt_url = body.receiptUrl;
  if (body.notes) result.notes = body.notes;
  
  return result;
};

// 1. Summary
router.get('/summary', async (req, res) => {
  try {
    const now = new Date();
    const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
    
    const [cards, pockets, income, expense] = await Promise.all([
      prismaCards.findMany({ select: { balance: true } }),
      prismaPockets.findMany({ select: { amount: true } }),
      prismaTransactions.aggregate({
        _sum: { amount: true },
        where: { 
            OR: [{ type: 'Income' }, { type: 'Pemasukan' }],
            date: { gte: firstDay } 
        }
      }),
      prismaTransactions.aggregate({
        _sum: { amount: true },
        where: { 
            OR: [{ type: 'Expense' }, { type: 'Pengeluaran' }],
            date: { gte: firstDay } 
        }
      })
    ]);

    res.json({
      totalAssets: cards.reduce((sum: number, c: any) => sum + Number(c.balance || 0), 0),
      pocketsTotal: pockets.reduce((sum: number, p: any) => sum + Number(p.amount || 0), 0),
      totalIncomeThisMonth: Number(income._sum.amount || 0),
      totalExpenseThisMonth: Number(expense._sum.amount || 0)
    });
  } catch (error: any) {
    console.error('[GET /transactions/summary] Error:', error?.message);
    res.status(500).json({ error: 'Gagal' });
  }
});

// 2. Paginated List
router.get('/paginated', async (req, res) => {
  try {
    const { page = '1', limit = '20', type, category, dateFrom, dateTo, search } = req.query;
    const skip = (Number(page) - 1) * Number(limit);
    const take = Number(limit);

    const where: any = {};
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
      prismaTransactions.findMany({ 
        where, 
        skip, 
        take, 
        orderBy: { date: 'desc' } 
      })
    ]);

    res.json({ 
      transactions: rows.map(mapToFrontend), 
      total 
    });
  } catch (error: any) {
    console.error('[GET /transactions/paginated] Error:', error?.message);
    res.status(500).json({ error: 'Gagal' });
  }
});

// 3. Simple List
router.get('/', async (req, res) => {
  try {
    const { limit = '50', offset = '0', projectId, clientId } = req.query;
    const where: any = {};
    if (projectId) where.project_id = Number(projectId);
    if (clientId) where.client_id = Number(clientId);
    
    const rows = await prismaTransactions.findMany({
      where,
      skip: Number(offset),
      take: Math.min(100, Number(limit)),
      orderBy: { date: 'desc' }
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
    console.log('[POST /transactions] Raw body:', JSON.stringify(req.body));
    const data = mapToDb(req.body);
    delete data.id; // Let DB handle auto-increment
    console.log('[POST /transactions] Mapped data:', JSON.stringify(data));
    
    const isIncome = data.type === 'Income' || data.type === 'Pemasukan';
    const amountDelta = isIncome ? Number(data.amount) : -Number(data.amount);

    if (data.card_id) {
      const [newTx] = await prisma.$transaction([
        prismaTransactions.create({ data }),
        prismaCards.update({
          where: { id: data.card_id },
          data: { balance: { increment: amountDelta } }
        })
      ]);
      res.status(201).json(mapToFrontend(newTx));
    } else if (data.pocket_id) {
      const [newTx] = await prisma.$transaction([
        prismaTransactions.create({ data }),
        prismaPockets.update({
          where: { id: data.pocket_id },
          data: { amount: { increment: amountDelta } }
        })
      ]);
      res.status(201).json(mapToFrontend(newTx));
    } else {
      const newTx = await prismaTransactions.create({ data });
      res.status(201).json(mapToFrontend(newTx));
    }
  } catch (error: any) {
    console.error('[POST /transactions] Error:', error?.message || error);
    res.status(500).json({ error: 'Gagal membuat transaksi', detail: error?.message });
  }
});

// 5. Update Transaction (Simplified, usually better to delete and recreate for balance consistency)
router.patch('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const data = mapToDb(req.body);
    delete data.id;

    // Note: Updating amount/type would require complex balance reversal. 
    // For now, we only update simple fields.
    const row = await prismaTransactions.update({
      where: { id: Number(id) },
      data
    });
    res.json(mapToFrontend(row));
  } catch (error: any) {
    console.error('[PATCH /transactions/:id] Error:', error?.message);
    res.status(500).json({ error: 'Gagal update' });
  }
});

// 7. Batch Create
router.post('/batch', async (req, res) => {
  try {
    const items = req.body; // array of transactions
    if (!Array.isArray(items)) return res.status(400).json({ error: 'Payload must be an array' });

    const results: any[] = [];
    // We do them one by one to ensure balance updates are handled correctly
    // or we could optimize with a single transaction block.
    // For safety and reuse of logic, let's use a loop or complex transaction.
    
    await prisma.$transaction(async (tx: any) => {
      const ptx = tx.transactions;
      const pcards = tx.cards;
      const ppockets = tx.financial_pockets;
      
      for (const item of items) {
        const data = mapToDb(item);
        delete data.id; // Let DB handle auto-increment
        
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
  } catch (error: any) {
    console.error('[POST /transactions/batch] Error:', error?.message);
    res.status(500).json({ error: 'Gagal batch create' });
  }
});

// 8. Update Balance (Direct)
router.post('/update-balance', async (req, res) => {
  try {
    const { cardId, pocketId, delta } = req.body;
    const amountDelta = Number(delta);

    if (cardId) {
      const card = await prismaCards.update({
        where: { id: Number(cardId) },
        data: { balance: { increment: amountDelta } }
      });
      return res.json({ success: true, balance: Number(card.balance) });
    } else if (pocketId) {
      const pocket = await prismaPockets.update({
        where: { id: Number(pocketId) },
        data: { amount: { increment: amountDelta } }
      });
      return res.json({ success: true, amount: Number(pocket.amount) });
    }

    res.status(400).json({ error: 'Missing cardId or pocketId' });
  } catch (error: any) {
    console.error('[POST /transactions/update-balance] Error:', error?.message);
    res.status(500).json({ error: 'Gagal update balance' });
  }
});

// 6. Delete Transaction
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    // Reverse balance update
    const tx = await prismaTransactions.findUnique({ where: { id: Number(id) } });
    if (tx) {
      const isIncome = tx.type === 'Income' || tx.type === 'Pemasukan';
      const reversalDelta = isIncome ? -Number(tx.amount) : Number(tx.amount);
      
      if (tx.card_id) {
        await prisma.$transaction([
          prismaCards.update({ where: { id: tx.card_id }, data: { balance: { increment: reversalDelta } } }),
          prismaTransactions.delete({ where: { id: Number(id) } })
        ]);
      } else if (tx.pocket_id) {
        await prisma.$transaction([
          prismaPockets.update({ where: { id: tx.pocket_id }, data: { amount: { increment: reversalDelta } } }),
          prismaTransactions.delete({ where: { id: Number(id) } })
        ]);
      } else {
        await prismaTransactions.delete({ where: { id: Number(id) } });
      }
    }
    
    res.status(204).send();
  } catch (error: any) {
    console.error('[DELETE /transactions/:id] Error:', error?.message);
    res.status(500).json({ error: 'Gagal menghapus' });
  }
});

export default router;
