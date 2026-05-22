import { Router } from 'express';
import { PrismaClient } from '@prisma/client';

const router = Router();
const prisma = new PrismaClient();
const prismaProjects = (prisma as any).projects || (prisma as any).project;

router.post('/confirm', async (req, res) => {
  try {
    const { projectId, subStatusName, note } = req.body;
    const project = await prismaProjects.findUnique({ where: { id: projectId } });
    if (!project) return res.status(404).json({ error: 'Not found' });

    const currentStatuses = project.confirmed_sub_statuses || [];
    const currentNotes = project.client_sub_status_notes || {};

    const nextConfirmed = Array.from(new Set([...currentStatuses, subStatusName]));
    const nextNotes = { ...currentNotes };
    if (note) nextNotes[subStatusName] = note;

    await prismaProjects.update({
      where: { id: projectId },
      data: {
        confirmed_sub_statuses: nextConfirmed,
        client_sub_status_notes: nextNotes
      }
    });

    res.status(200).send();
  } catch (error) {
    res.status(500).json({ error: 'Gagal' });
  }
});

export default router;

