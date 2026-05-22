import { Router } from 'express';
import { PrismaClient } from '@prisma/client';

const router = Router();
const prisma = new PrismaClient();
const prismaPockets = (prisma as any).financial_pockets || (prisma as any).financial_pocket;
const prismaCards = (prisma as any).cards || (prisma as any).card;
const prismaTransactions = (prisma as any).transactions || (prisma as any).transaction;

router.get('/', async (req, res) => {
  try {
    const data = await prismaPockets.findMany({ orderBy: { name: 'asc' } });
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: 'Gagal' });
  }
});

router.post('/', async (req, res) => {
  try {
    const data = { ...req.body };
    if (data.source_card_id) data.source_card_id = Number(data.source_card_id);
    delete data.id; // Let DB handle auto-increment
    const pocket = await prismaPockets.create({ data });
    res.status(201).json(pocket);
  } catch (error: any) {
    console.error('[POST /pockets] Error:', error?.message);
    res.status(500).json({ error: 'Gagal membuat kantong' });
  }
});

router.patch('/:id', async (req, res) => {
  try {
    const data = { ...req.body };
    if (data.source_card_id) data.source_card_id = Number(data.source_card_id);
    delete data.id;
    const pocket = await prismaPockets.update({ where: { id: Number(req.params.id) }, data });
    res.json(pocket);
  } catch (error: any) {
    console.error('[PATCH /pockets/:id] Error:', error?.message);
    res.status(500).json({ error: 'Gagal update kantong' });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    await prismaPockets.delete({ where: { id: Number(req.params.id) } });
    res.status(204).send();
  } catch (error: any) {
    console.error('[DELETE /pockets/:id] Error:', error?.message);
    res.status(500).json({ error: 'Gagal menghapus kantong' });
  }
});

router.post('/:id/close-budget', async (req, res) => {
  try {
    const { id } = req.params;
    const pocket = await prismaPockets.findUnique({ where: { id: Number(id) } });
    if (!pocket) return res.status(404).json({ error: 'Not found' });
    
    // Transfer funds logic
    let tx;
    if (pocket.source_card_id) {
       tx = await prismaTransactions.create({
         data: {
           date: new Date(),
           description: `Penutupan budget: ${pocket.name}`,
           amount: Number(pocket.amount),
           type: 'Income',
           card_id: pocket.source_card_id,
           category: 'Internal Transfer',
           method: 'Transfer'
         }
       });
       await prismaCards.update({
         where: { id: pocket.source_card_id },
         data: { balance: { increment: Number(pocket.amount) } }
       });
    }

    await prismaPockets.delete({ where: { id: Number(id) } });
    res.json({ transaction: tx || { description: 'Penutupan selesai tanpa pengembalian' } });
  } catch (error) {
    res.status(500).json({ error: 'Gagal' });
  }
});

export default router;

