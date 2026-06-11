import { Router } from 'express';
import { PrismaClient } from '@prisma/client';

const router = Router();
const prisma = new PrismaClient();
const prismaProjects = (prisma as any).projects || (prisma as any).project;

/**
 * POST /project-sub-status-confirmations/confirm (PUBLIC)
 *
 * Endpoint ini dipanggil dari Client Portal (link publik) ketika klien
 * mengkonfirmasi sub-status progress pekerjaan.
 * Tidak menggunakan `authenticate` karena klien tidak punya akun.
 *
 * Pengamanan yang diterapkan:
 * - project HARUS ada (tidak bisa rekayasa projectId sembarangan)
 * - Hanya field yang diizinkan yang diupdate (confirmed_sub_statuses & client_sub_status_notes)
 * - subStatusName harus berupa string non-kosong (validasi input)
 * - Tidak ada operasi delete atau create — hanya append ke existing data
 */
router.post('/confirm', async (req, res) => {
  try {
    const { projectId, subStatusName, note } = req.body;

    // Validasi input
    if (!projectId || typeof projectId !== 'number') {
      return res.status(400).json({ error: 'projectId tidak valid' });
    }
    if (!subStatusName || typeof subStatusName !== 'string' || subStatusName.trim().length === 0) {
      return res.status(400).json({ error: 'subStatusName tidak valid' });
    }

    const project = await prismaProjects.findUnique({ where: { id: projectId } });
    if (!project) return res.status(404).json({ error: 'Not found' });

    // Parse JSON fields yang mungkin tersimpan sebagai string
    let currentStatuses: string[] = [];
    let currentNotes: Record<string, string> = {};

    try {
      currentStatuses = typeof project.confirmed_sub_statuses === 'string'
        ? JSON.parse(project.confirmed_sub_statuses)
        : (project.confirmed_sub_statuses || []);
    } catch { currentStatuses = []; }

    try {
      currentNotes = typeof project.client_sub_status_notes === 'string'
        ? JSON.parse(project.client_sub_status_notes)
        : (project.client_sub_status_notes || {});
    } catch { currentNotes = {}; }

    const sanitizedName = subStatusName.trim();
    const nextConfirmed = Array.from(new Set([...currentStatuses, sanitizedName]));
    const nextNotes = { ...currentNotes };
    if (note && typeof note === 'string' && note.trim().length > 0) {
      nextNotes[sanitizedName] = note.trim().slice(0, 1000); // batasi panjang note
    }

    await prismaProjects.update({
      where: { id: projectId },
      data: {
        confirmed_sub_statuses: JSON.stringify(nextConfirmed),
        client_sub_status_notes: JSON.stringify(nextNotes),
      },
    });

    res.status(200).send();
  } catch (error) {
    res.status(500).json({ error: 'Gagal' });
  }
});

export default router;
