import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { getVendorId } from '../middleware/auth';

const router = Router();
const prisma = new PrismaClient();
const prismaProfiles = (prisma as any).profiles || (prisma as any).profile;

// GET profile for the authenticated vendor
router.get('/', async (req, res) => {
  try {
    const vendorId = getVendorId(req);
    // Cari profile berdasarkan admin_user_id = vendorId
    let data = await prismaProfiles.findFirst({
      where: { admin_user_id: vendorId }
    });
    // Jika belum ada profile, buat otomatis (first time setup)
    if (!data) {
      const user = await (prisma as any).users.findUnique({ where: { id: vendorId } });
      data = await prismaProfiles.create({
        data: {
          admin_user_id: vendorId,
          full_name: user?.full_name || '',
          email: user?.email || '',
          company_name: user?.company_name || '',
        }
      });
    }
    res.json(data);
  } catch (error) {
    console.error('[GET /profiles] Error:', error);
    res.status(500).json({ error: 'Gagal mengambil profil' });
  }
});

router.patch('/:id', async (req, res) => {
  try {
    const vendorId = getVendorId(req);
    const numericId = Number(req.params.id);
    if (isNaN(numericId)) return res.status(400).json({ error: 'Invalid ID' });
    // Pastikan profile ini milik vendor yang sedang login
    const existing = await prismaProfiles.findFirst({ where: { id: numericId, admin_user_id: vendorId } });
    if (!existing) return res.status(403).json({ error: 'Akses ditolak' });
    const data = await prismaProfiles.update({ where: { id: numericId }, data: req.body });
    res.json(data);
  } catch (error) {
    console.error('[PATCH /profiles/:id] Error:', error);
    res.status(500).json({ error: 'Gagal update profil' });
  }
});

export default router;
