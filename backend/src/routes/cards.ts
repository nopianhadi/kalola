import { Router } from 'express';
import { PrismaClient } from '@prisma/client';

const router = Router();
const prisma = new PrismaClient();

// Prisma model accessor
const prismaCards = (prisma as any).cards;
const prismaTransactions = (prisma as any).transactions;
const prismaPockets = (prisma as any).financial_pockets;

// Field mapping for cards
const mapToFrontend = (row: any) => {
  if (!row) return row;
  return {
    id: row.id,
    cardHolderName: row.card_holder_name,
    bankName: row.bank_name,
    cardType: row.card_type,
    lastFourDigits: row.last_four_digits,
    expiryDate: row.expiry_date,
    balance: Number(row.balance || 0),
    colorGradient: row.color_gradient,
  };
};

const mapToDb = (body: any) => {
  const result: any = {};
  if (body.id) result.id = Number(body.id);
  if (body.cardHolderName !== undefined || body.card_holder_name !== undefined) 
    result.card_holder_name = body.cardHolderName ?? body.card_holder_name;
  if (body.bankName !== undefined || body.bank_name !== undefined) 
    result.bank_name = body.bankName ?? body.bank_name;
  if (body.cardType !== undefined || body.card_type !== undefined) 
    result.card_type = body.cardType ?? body.card_type;
  if (body.lastFourDigits !== undefined || body.last_four_digits !== undefined) 
    result.last_four_digits = body.lastFourDigits ?? body.last_four_digits;
  if (body.expiryDate !== undefined || body.expiry_date !== undefined) 
    result.expiry_date = body.expiryDate ?? body.expiry_date;
  if (body.balance !== undefined) result.balance = Number(body.balance);
  if (body.colorGradient !== undefined || body.color_gradient !== undefined) 
    result.color_gradient = body.colorGradient ?? body.color_gradient;
  return result;
};

router.get('/', async (req, res) => {
  try {
    const data = await prismaCards.findMany({ orderBy: { bank_name: 'asc' } });
    res.json(data.map(mapToFrontend));
  } catch (error: any) {
    console.error('[GET /cards] Error:', error?.message || error);
    res.status(500).json({ error: 'Gagal mengambil data kartu' });
  }
});

router.post('/find', async (req, res) => {
  try {
    const { bankName, lastFourDigits } = req.body;
    const card = await prismaCards.findFirst({
      where: { bank_name: bankName, last_four_digits: lastFourDigits },
    });
    res.json({ id: card?.id || null });
  } catch (error: any) {
    console.error('[POST /cards/find] Error:', error?.message || error);
    res.status(500).json({ error: 'Gagal mencari kartu' });
  }
});

router.post('/', async (req, res) => {
  try {
    const data = mapToDb(req.body);
    delete data.id; // Pastikan id tidak dikirim agar autoincrement bekerja
    console.log('[POST /cards] Payload:', data);
    const card = await prismaCards.create({ data });
    res.status(201).json(mapToFrontend(card));
  } catch (error: any) {
    console.error('[POST /cards] CRITICAL ERROR:', error);
    if (error.code) console.error('[POST /cards] Prisma Error Code:', error.code);
    if (error.meta) console.error('[POST /cards] Prisma Error Meta:', error.meta);
    res.status(500).json({ error: 'Gagal membuat kartu', details: error?.message || String(error), code: error?.code || 'UNKNOWN' });
  }
});

router.patch('/:id', async (req, res) => {
  try {
    const data = mapToDb(req.body);
    delete data.id; // id tidak boleh diupdate
    const card = await prismaCards.update({ where: { id: Number(req.params.id) }, data });
    res.json(mapToFrontend(card));
  } catch (error: any) {
    console.error('[PATCH /cards/:id] Error:', error?.message || error);
    res.status(500).json({ error: 'Gagal update kartu' });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const isSafe = req.query.safe === 'true';

    if (isSafe) {
      await prisma.$transaction([
        prismaTransactions.updateMany({ where: { card_id: Number(id) }, data: { card_id: null } }),
        prismaPockets.updateMany({ where: { source_card_id: Number(id) }, data: { source_card_id: null } }),
        prismaCards.delete({ where: { id: Number(id) } }),
      ]);
    } else {
      await prismaCards.delete({ where: { id: Number(id) } });
    }
    res.status(204).send();
  } catch (error: any) {
    console.error('[DELETE /cards/:id] Error:', error?.message || error);
    res.status(500).json({ error: 'Gagal menghapus kartu' });
  }
});

export default router;
