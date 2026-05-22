import { Router } from 'express';
import { PrismaClient } from '@prisma/client';

const router = Router();
const prisma = new PrismaClient();
const prismaProfiles = (prisma as any).profiles || (prisma as any).profile;

router.get('/', async (req, res) => {
  try {
    const { id } = req.query;
    let data;
    const numericId = id ? Number(id) : NaN;
    if (!isNaN(numericId)) {
      data = await prismaProfiles.findUnique({ where: { id: numericId } });
    } else {
      data = await prismaProfiles.findFirst({ orderBy: { created_at: 'asc' } });
    }
    
    if (!data) return res.status(404).json({ error: 'Not found' });
    res.json(data);
  } catch (error) {
    console.error('[GET /profiles] Error:', error);
    res.status(500).json({ error: 'Gagal mengambil profil' });
  }
});

router.patch('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const numericId = Number(id);
    if (isNaN(numericId)) return res.status(400).json({ error: 'Invalid ID' });
    const data = await prismaProfiles.update({ where: { id: numericId }, data: req.body });
    res.json(data);
  } catch (error) {
    console.error('[PATCH /profiles/:id] Error:', error);
    res.status(500).json({ error: 'Gagal update profil' });
  }
});

export default router;

