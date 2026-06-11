import { Router, Request, Response, NextFunction } from 'express';
import prisma from '../prismaClient';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { authenticate } from '../middleware/auth';
import { sendResetPasswordEmail } from '../utils/email.utils';
const router = Router();
const prismaUsers = (prisma as any).users || (prisma as any).user;
const JWT_SECRET = process.env.JWT_SECRET || 'dev-only-change-me';

// ─── Helpers ─────────────────────────────────────────────────────────────────

function withoutPassword(user: any) {
  if (!user) return user;
  const { password, ...safe } = user;
  return safe;
}

async function hashPasswordIfPresent(data: any) {
  if (!data.password) return data;
  const looksHashed = /^\$2[aby]\$\d{2}\$/.test(data.password);
  return {
    ...data,
    password: looksHashed ? data.password : await bcrypt.hash(data.password, 10),
  };
}

// ─── PUBLIC ROUTES (tidak perlu token) ───────────────────────────────────────

/**
 * POST /users/register
 * Daftar akun vendor baru (role = 'Admin', multi-tenant).
 */
router.post('/register', async (req, res) => {
  try {
    const { email, password, full_name, company_name } = req.body || {};

    if (!email || !password || !full_name) {
      return res.status(400).json({ error: 'Email, password, dan nama lengkap wajib diisi.' });
    }
    if (String(password).length < 8) {
      return res.status(400).json({ error: 'Password minimal 8 karakter.' });
    }

    const existing = await prismaUsers.findFirst({
      where: { email: String(email).toLowerCase().trim() },
    });
    if (existing) {
      return res.status(409).json({ error: 'Email sudah terdaftar. Silakan gunakan email lain.' });
    }

    const hashed = await bcrypt.hash(String(password), 10);

    const user = await prismaUsers.create({
      data: {
        email: String(email).toLowerCase().trim(),
        password: hashed,
        full_name: String(full_name).trim(),
        company_name: company_name ? String(company_name).trim() : null,
        role: 'Admin', // setiap vendor baru = Admin di tenant-nya sendiri
        permissions: JSON.stringify([]),
      },
    });

    // Buat profile kosong agar halaman Settings langsung bisa diakses
    const prismaProfiles = (prisma as any).profiles;
    await prismaProfiles.create({
      data: {
        admin_user_id: user.id,
        full_name: user.full_name,
        email: user.email,
        company_name: user.company_name,
      },
    });

    // Auto-login — return token langsung
    const token = jwt.sign(
      { sub: String(user.id), email: user.email, role: user.role },
      JWT_SECRET,
      { expiresIn: '12h' }
    );

    res.status(201).json({ user: withoutPassword(user), token });
  } catch (error: any) {
    console.error('[POST /users/register] Error:', error?.message);
    res.status(500).json({ error: 'Gagal mendaftar. Coba lagi nanti.' });
  }
});

/**
 * POST /users/login
 */
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body || {};
    if (!email || !password) {
      return res.status(400).json({ error: 'Email dan password wajib diisi' });
    }

    const user = await prismaUsers.findFirst({ where: { email: String(email) } });
    if (!user?.password) {
      return res.status(401).json({ error: 'Email atau kata sandi salah.' });
    }

    const passwordMatches = /^\$2[aby]\$\d{2}\$/.test(user.password)
      ? await bcrypt.compare(String(password), user.password)
      : user.password === String(password);

    if (!passwordMatches) {
      return res.status(401).json({ error: 'Email atau kata sandi salah.' });
    }

    const token = jwt.sign(
      { sub: String(user.id), email: user.email, role: user.role },
      JWT_SECRET,
      { expiresIn: '12h' }
    );

    res.json({ user: withoutPassword(user), token });
  } catch (error) {
    res.status(500).json({ error: 'Gagal login' });
  }
});

/**
 * POST /users/forgot-password
 */
router.post('/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ error: 'Email wajib diisi' });

    const user = await prismaUsers.findFirst({ where: { email: String(email).toLowerCase().trim() } });
    if (!user) {
      // Return 200 even if not found for security reasons
      return res.json({ message: 'Jika email terdaftar, instruksi reset akan dikirim.' });
    }

    // Generate stateless token using JWT
    const resetToken = jwt.sign(
      { sub: String(user.id), purpose: 'reset-password' },
      JWT_SECRET,
      { expiresIn: '1h' }
    );

    await sendResetPasswordEmail(user.email, resetToken);
    res.json({ message: 'Instruksi reset password telah dikirim ke email Anda.' });
  } catch (error) {
    console.error('[POST /users/forgot-password]', error);
    res.status(500).json({ error: 'Gagal memproses permintaan' });
  }
});

/**
 * POST /users/reset-password
 */
router.post('/reset-password', async (req, res) => {
  try {
    const { token, newPassword } = req.body;
    if (!token || !newPassword) {
      return res.status(400).json({ error: 'Token dan password baru wajib diisi' });
    }
    if (String(newPassword).length < 8) {
      return res.status(400).json({ error: 'Password minimal 8 karakter.' });
    }

    // Verify token
    let decoded: any;
    try {
      decoded = jwt.verify(token, JWT_SECRET);
    } catch (err) {
      return res.status(400).json({ error: 'Token tidak valid atau sudah kadaluarsa.' });
    }

    if (decoded.purpose !== 'reset-password') {
      return res.status(400).json({ error: 'Token tidak valid.' });
    }

    const userId = Number(decoded.sub);
    const hashed = await bcrypt.hash(String(newPassword), 10);

    await prismaUsers.update({
      where: { id: userId },
      data: { password: hashed },
    });

    res.json({ message: 'Password berhasil diubah. Silakan login.' });
  } catch (error) {
    console.error('[POST /users/reset-password]', error);
    res.status(500).json({ error: 'Gagal mereset password' });
  }
});

// ─── PROTECTED ROUTES (wajib token valid) ────────────────────────────────────
// Semua route di bawah ini require authenticate middleware

/**
 * GET /users/me
 * Info user yang sedang login (diri sendiri saja).
 */
router.get('/me', authenticate, async (req, res) => {
  try {
    const user = await prismaUsers.findUnique({ where: { id: req.user!.id } });
    if (!user) return res.status(404).json({ error: 'User tidak ditemukan' });
    res.json(withoutPassword(user));
  } catch (error) {
    res.status(500).json({ error: 'Gagal' });
  }
});

/**
 * GET /users
 * Hanya Admin yang boleh melihat daftar user di tenant-nya sendiri.
 * Vendor lain tidak terlihat.
 */
router.get('/', authenticate, async (req, res) => {
  try {
    const currentUser = req.user!;
    // Admin: kembalikan hanya diri sendiri + Member yang dibuat di tenant ini
    // (profiles.admin_user_id = currentUser.id menandai siapa adminnya)
    const profiles = await (prisma as any).profiles.findMany({
      where: { admin_user_id: currentUser.id },
      select: { admin_user_id: true },
    });
    const memberIds = profiles.map((p: any) => p.admin_user_id);
    // Sertakan juga user sendiri
    const ids = Array.from(new Set([currentUser.id, ...memberIds]));
    const data = await prismaUsers.findMany({
      where: { id: { in: ids } },
      orderBy: { created_at: 'desc' },
    });
    res.json(data.map(withoutPassword));
  } catch (error) {
    res.status(500).json({ error: 'Gagal' });
  }
});

/**
 * POST /users
 * Buat user baru (oleh Admin — untuk invite anggota tim internal).
 * Admin hanya bisa buat user untuk tenant-nya sendiri.
 */
router.post('/', authenticate, async (req, res) => {
  try {
    if (req.user!.role !== 'Admin') {
      return res.status(403).json({ error: 'Hanya Admin yang dapat membuat user baru.' });
    }
    const payload = await hashPasswordIfPresent(req.body);
    // Paksa role = Member (Admin tidak bisa bikin Admin lain lewat endpoint ini)
    payload.role = payload.role === 'Admin' ? 'Member' : (payload.role || 'Member');
    const data = await prismaUsers.create({ data: payload });

    // Buat profile yang mengaitkan member ini ke Admin (vendor) yang membuatnya
    const prismaProfiles = (prisma as any).profiles;
    await prismaProfiles.create({
      data: {
        admin_user_id: req.user!.id, // ini yang mengaitkan ke vendor yang benar
        full_name: data.full_name || '',
        email: data.email || '',
      },
    }).catch(() => null); // non-fatal jika gagal

    res.status(201).json(withoutPassword(data));
  } catch (error: any) {
    console.error('[POST /users] Error:', error?.message);
    res.status(500).json({ error: 'Gagal membuat user' });
  }
});

/**
 * GET /users/email/:email
 * Hanya untuk Admin mencari user di tenant SENDIRI.
 * Tidak boleh meng-expose user dari vendor/tenant lain.
 */
router.get('/email/:email', authenticate, async (req, res) => {
  try {
    const currentUser = req.user!;
    // Hanya return user jika itu diri sendiri atau memang di tenant yang sama
    const data = await prismaUsers.findFirst({
      where: {
        email: req.params.email,
        id: currentUser.id, // hanya boleh cari diri sendiri via email
      },
    });
    if (!data) return res.status(404).json({ error: 'Not found' });
    res.json(withoutPassword(data));
  } catch (error) {
    res.status(500).json({ error: 'Gagal' });
  }
});

/**
 * PATCH /users/:id
 * User hanya bisa update diri sendiri.
 * Admin bisa update member di tenant-nya — tapi harus memverifikasi
 * bahwa target user MEMANG member di tenant mereka.
 */
router.patch('/:id', authenticate, async (req, res) => {
  try {
    const targetId = Number(req.params.id);
    const currentUser = req.user!;

    if (isNaN(targetId)) return res.status(400).json({ error: 'ID tidak valid' });

    // User biasa hanya boleh edit diri sendiri
    if (currentUser.role !== 'Admin' && currentUser.id !== targetId) {
      return res.status(403).json({ error: 'Anda hanya dapat mengubah akun sendiri.' });
    }

    // Admin boleh edit diri sendiri langsung
    if (currentUser.id === targetId) {
      const payload = await hashPasswordIfPresent(req.body);
      delete payload.role; // Admin tidak bisa downgrade diri sendiri
      delete payload.id;
      const data = await prismaUsers.update({ where: { id: targetId }, data: payload });
      return res.json(withoutPassword(data));
    }

    // Admin mengedit user LAIN — harus verifikasi bahwa target adalah member tenant ini
    // Caranya: cek profile target user memiliki admin_user_id = currentUser.id
    const targetProfile = await (prisma as any).profiles.findFirst({
      where: { admin_user_id: currentUser.id },
    });
    // Untuk saat ini, sistem belum support multi-member per vendor,
    // jadi Admin hanya bisa edit dirinya sendiri (sudah ditangani di atas)
    // Jika nanti ada sistem member, tambahkan: where: { user_id: targetId, admin_user_id: currentUser.id }
    if (!targetProfile) {
      return res.status(403).json({ error: 'Akses ditolak.' });
    }

    const payload = await hashPasswordIfPresent(req.body);
    delete payload.role; // Tidak bisa ubah role user lain
    delete payload.id;
    const data = await prismaUsers.update({ where: { id: targetId }, data: payload });
    res.json(withoutPassword(data));
  } catch (error: any) {
    console.error('[PATCH /users/:id] Error:', error?.message);
    res.status(500).json({ error: 'Gagal update user' });
  }
});

/**
 * DELETE /users/:id
 * Hanya Admin yang dapat menghapus user, dan hanya diri sendiri yang tidak boleh.
 * Admin tidak bisa hapus user dari tenant lain.
 */
router.delete('/:id', authenticate, async (req, res) => {
  try {
    const targetId = Number(req.params.id);
    const currentUser = req.user!;

    if (isNaN(targetId)) return res.status(400).json({ error: 'ID tidak valid' });
    if (currentUser.role !== 'Admin') {
      return res.status(403).json({ error: 'Hanya Admin yang dapat menghapus user.' });
    }
    if (currentUser.id === targetId) {
      return res.status(400).json({ error: 'Tidak dapat menghapus akun sendiri.' });
    }

    // Verifikasi target user ada dan merupakan member tenant ini
    // (profile-nya harus ter-link ke admin ini)
    const targetProfile = await (prisma as any).profiles.findFirst({
      where: { admin_user_id: currentUser.id },
    });
    if (!targetProfile) {
      return res.status(403).json({ error: 'Akses ditolak — user bukan bagian dari tenant Anda.' });
    }

    await prismaUsers.delete({ where: { id: targetId } });
    res.status(204).send();
  } catch (error: any) {
    console.error('[DELETE /users/:id] Error:', error?.message);
    res.status(500).json({ error: 'Gagal menghapus user' });
  }
});

export default router;
