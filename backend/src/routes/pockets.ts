import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { sseManager } from '../sseManager';
import { getVendorId } from '../middleware/auth';

const router = Router();
const prisma = new PrismaClient();
const prismaPockets = (prisma as any).financial_pockets || (prisma as any).financial_pocket;
const prismaCards = (prisma as any).cards || (prisma as any).card;
const prismaTransactions = (prisma as any).transactions || (prisma as any).transaction;

router.get('/', async (req, res) => {
  try {
    const vendorId = getVendorId(req);
    const data = await prismaPockets.findMany({
      where: { vendor_id: vendorId },
      orderBy: { name: 'asc' }
    });
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: 'Gagal' });
  }
});

router.post('/', async (req, res) => {
  try {
    const vendorId = getVendorId(req);
    const data = { ...req.body, vendor_id: vendorId };
    if (data.source_card_id) {
      data.source_card_id = Number(data.source_card_id);
      // Verifikasi card milik vendor ini
      const card = await prismaCards.findFirst({ where: { id: data.source_card_id, vendor_id: vendorId } });
      if (!card) return res.status(403).json({ error: 'Kartu sumber bukan milik Anda.' });
    }
    delete data.id;
    const pocket = await prismaPockets.create({ data });
    sseManager.broadcast('pockets', 'created', { id: pocket.id }, getVendorId(req));
    res.status(201).json(pocket);
  } catch (error: any) {
    console.error('[POST /pockets] Error:', error?.message);
    res.status(500).json({ error: 'Gagal membuat kantong' });
  }
});

router.patch('/:id', async (req, res) => {
  try {
    const vendorId = getVendorId(req);
    const existing = await prismaPockets.findFirst({ where: { id: Number(req.params.id), vendor_id: vendorId } });
    if (!existing) return res.status(404).json({ error: 'Not found' });
    const data = { ...req.body };
    if (data.source_card_id) data.source_card_id = Number(data.source_card_id);
    delete data.id;
    const pocket = await prismaPockets.update({ where: { id: Number(req.params.id) }, data });
    sseManager.broadcast('pockets', 'updated', { id: Number(req.params.id) }, getVendorId(req));
    res.json(pocket);
  } catch (error: any) {
    console.error('[PATCH /pockets/:id] Error:', error?.message);
    res.status(500).json({ error: 'Gagal update kantong' });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const vendorId = getVendorId(req);
    const existing = await prismaPockets.findFirst({ where: { id: Number(req.params.id), vendor_id: vendorId } });
    if (!existing) return res.status(404).json({ error: 'Not found' });
    await prismaPockets.delete({ where: { id: Number(req.params.id) } });
    sseManager.broadcast('pockets', 'deleted', { id: Number(req.params.id) }, getVendorId(req));
    res.status(204).send();
  } catch (error: any) {
    console.error('[DELETE /pockets/:id] Error:', error?.message);
    res.status(500).json({ error: 'Gagal menghapus kantong' });
  }
});

router.post('/:id/close-budget', async (req, res) => {
  try {
    const vendorId = getVendorId(req);
    const { id } = req.params;
    const pocket = await prismaPockets.findFirst({ where: { id: Number(id), vendor_id: vendorId } });
    if (!pocket) return res.status(404).json({ error: 'Not found' });

    let tx;
    if (pocket.source_card_id) {
      // Verifikasi card juga milik vendor yang sama sebelum update balance
      const card = await prismaCards.findFirst({ where: { id: pocket.source_card_id, vendor_id: vendorId } });
      if (!card) {
        return res.status(403).json({ error: 'Kartu sumber tidak ditemukan atau bukan milik Anda.' });
      }

      tx = await prismaTransactions.create({
        data: {
          date: new Date(),
          description: `Penutupan budget: ${pocket.name}`,
          amount: Number(pocket.amount),
          type: 'Income',
          card_id: pocket.source_card_id,
          category: 'Internal Transfer',
          method: 'Transfer',
          vendor_id: vendorId,
        },
      });
      await prismaCards.update({
        where: { id: pocket.source_card_id },
        data: { balance: { increment: Number(pocket.amount) } },
      });
    }

    await prismaPockets.delete({ where: { id: Number(id) } });
    sseManager.broadcast('pockets', 'deleted', { id: Number(id) }, getVendorId(req));
    sseManager.broadcast('transactions', 'created', undefined, getVendorId(req));
    sseManager.broadcast('cards', 'updated', undefined, getVendorId(req));
    res.json({ transaction: tx || { description: 'Penutupan selesai tanpa pengembalian' } });
  } catch (error) {
    res.status(500).json({ error: 'Gagal' });
  }
});

export default router;

