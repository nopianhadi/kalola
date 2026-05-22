import { Router } from 'express';
import { PrismaClient } from '@prisma/client';

const router = Router();
const prisma = new PrismaClient();

const prismaTeamMembers = (prisma as any).team_members || (prisma as any).teamMembers;

router.get('/paginated', async (req, res) => {
  try {
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 20;
    const offset = (page - 1) * limit;
    
    const { search, category } = req.query;
    
    const where: any = {};
    if (search) {
      const term = String(search);
      where.OR = [
        { name: { contains: term } },
        { role: { contains: term } }
      ];
    }
    
    if (category) {
      if (category === 'Tim') {
        where.OR = [
          ...(where.OR || []),
          { category: 'Tim' },
          { category: null }
        ];
      } else {
        where.category = String(category);
      }
    }

    const [total, teamMembers] = await Promise.all([
      prismaTeamMembers.count({ where }),
      prismaTeamMembers.findMany({
        where,
        skip: offset,
        take: limit,
        orderBy: { name: 'asc' }
      })
    ]);

    res.json({
      teamMembers,
      total,
      hasMore: (page * limit) < total
    });
  } catch (error) {
    res.status(500).json({ error: 'Gagal mengambil paginasi tim' });
  }
});

router.get('/', async (req, res) => {
  try {
    const { limit = '50', offset = '0' } = req.query;
    const members = await prismaTeamMembers.findMany({
      skip: Number(offset),
      take: Math.min(100, Number(limit)),
      orderBy: { name: 'asc' }
    });
    res.json(members);
  } catch (error) {
    res.status(500).json({ error: 'Gagal mengambil data tim' });
  }
});

router.post('/', async (req, res) => {
  try {
    const member = await prismaTeamMembers.create({ data: req.body });
    res.status(201).json(member);
  } catch (error) {
    res.status(500).json({ error: 'Gagal membuat data tim' });
  }
});

router.patch('/:id', async (req, res) => {
  try {
    const member = await prismaTeamMembers.update({
      where: { id: Number(req.params.id) },
      data: req.body
    });
    res.json(member);
  } catch (error) {
    res.status(500).json({ error: 'Gagal update data tim' });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    await prismaTeamMembers.delete({ where: { id: Number(req.params.id) } });
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ error: 'Gagal menghapus data tim' });
  }
});

export default router;

