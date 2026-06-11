import { Router } from 'express';
import prisma from '../prismaClient';
import { getVendorId } from '../middleware/auth';

const router = Router();

const prismaAssignments = (prisma as any).project_team_assignments;
const prismaProjects = (prisma as any).projects;

/** Helper: pastikan project_id milik vendor yang login */
async function assertProjectOwnership(projectId: number, vendorId: number): Promise<boolean> {
  const project = await prismaProjects.findFirst({
    where: { id: projectId, vendor_id: vendorId },
  });
  return !!project;
}

router.get('/:projectId', async (req, res) => {
  try {
    const vendorId = getVendorId(req);
    const projectId = Number(req.params.projectId);
    if (!await assertProjectOwnership(projectId, vendorId)) {
      return res.status(403).json({ error: 'Akses ditolak' });
    }
    const data = await prismaAssignments.findMany({ where: { project_id: projectId } });
    res.json(data);
  } catch (error: any) {
    console.error('[GET /project-team-assignments/:projectId] Error:', error?.message);
    res.status(500).json({ error: 'Gagal mengambil data assignments' });
  }
});

router.post('/:projectId/upsert', async (req, res) => {
  const { projectId } = req.params;
  const projectIdNum = Number(projectId);
  const assignments = req.body;

  try {
    const vendorId = getVendorId(req);
    if (!await assertProjectOwnership(projectIdNum, vendorId)) {
      return res.status(403).json({ error: 'Akses ditolak' });
    }

    await prisma.$transaction(async (tx: any) => {
      const ptx = tx.project_team_assignments;
      await ptx.deleteMany({ where: { project_id: projectIdNum } });

      if (assignments && Array.isArray(assignments) && assignments.length > 0) {
        const rows = assignments.map((a: any) => ({
          project_id: projectIdNum,
          member_id: Number(a.member_id || a.memberId),
          member_name: a.member_name || a.name || a.memberName,
          member_role: a.member_role || a.role || a.memberRole,
          member_category: a.member_category || a.category || 'Tim',
          fee: a.fee !== undefined ? Number(a.fee) : 0,
          sub_job: a.sub_job || a.subJob || null,
        }));
        await ptx.createMany({ data: rows });
      }
    });

    // Auto-sync team_project_payments after assignments are saved
    if (assignments && Array.isArray(assignments) && assignments.length > 0) {
      try {
        const prismaPayments = (prisma as any).team_project_payments || (prisma as any).teamProjectPayments;
        const project = await prismaProjects.findUnique({ where: { id: projectIdNum } });

        if (project) {
          const existing = await prismaPayments.findMany({ where: { project_id: projectIdNum } });
          const existingByMemberId = new Map<number, any>(
            existing.map((p: any) => [Number(p.team_member_id), p])
          );

          await prisma.$transaction(async (tx: any) => {
            const ptx = tx.team_project_payments || tx.teamProjectPayments;
            for (const a of assignments) {
              const memberId = Number(a.member_id || a.memberId);
              const prev = existingByMemberId.get(memberId);
              if (!prev) {
                await ptx.create({
                  data: {
                    project_id: projectIdNum,
                    team_member_id: memberId,
                    team_member_name: a.member_name || a.name || a.memberName,
                    date: project.date,
                    status: 'Belum Bayar',
                    fee: Number(a.fee || 0),
                    amount_paid: 0,
                  },
                });
              } else if (prev.status !== 'Lunas') {
                await ptx.update({
                  where: { id: prev.id },
                  data: {
                    team_member_name: a.member_name || a.name || a.memberName,
                    fee: Number(a.fee || 0),
                  },
                });
              }
            }

            // Remove unpaid records for members no longer assigned
            const assignedMemberIds = new Set<number>(
              assignments.map((a: any) => Number(a.member_id || a.memberId))
            );
            const toDelete = existing
              .filter((p: any) => p.status !== 'Lunas' && !assignedMemberIds.has(Number(p.team_member_id)))
              .map((p: any) => p.id);
            if (toDelete.length > 0) {
              await ptx.deleteMany({ where: { id: { in: toDelete } } });
            }
          });
        }
      } catch (syncErr: any) {
        console.warn('[POST /project-team-assignments/:projectId/upsert] team payments sync failed:', syncErr?.message);
      }
    }

    res.status(200).json({ success: true });
  } catch (error: any) {
    console.error('[POST /project-team-assignments/:projectId/upsert] Error:', error?.message || error);
    res.status(500).json({ error: 'Gagal upsert assignments', detail: error?.message });
  }
});

router.delete('/:projectId', async (req, res) => {
  try {
    const vendorId = getVendorId(req);
    const projectId = Number(req.params.projectId);
    if (!await assertProjectOwnership(projectId, vendorId)) {
      return res.status(403).json({ error: 'Akses ditolak' });
    }
    await prismaAssignments.deleteMany({ where: { project_id: projectId } });
    res.status(204).send();
  } catch (error: any) {
    console.error('[DELETE /project-team-assignments/:projectId] Error:', error?.message);
    res.status(500).json({ error: 'Gagal menghapus assignments' });
  }
});

router.post('/check-availability', async (req, res) => {
  const { memberIds, date, excludeProjectId } = req.body;
  if (!memberIds || memberIds.length === 0) return res.json([]);

  try {
    const vendorId = getVendorId(req);
    const searchDate = new Date(date);
    const startOfDay = new Date(new Date(searchDate).setHours(0, 0, 0, 0));
    const endOfDay = new Date(new Date(searchDate).setHours(23, 59, 59, 999));

    const projectsOnDate = await prismaProjects.findMany({
      where: {
        vendor_id: vendorId,
        date: { gte: startOfDay, lt: endOfDay },
      },
      select: { id: true, project_name: true },
    });

    const pids = projectsOnDate
      .map((p: any) => p.id)
      .filter((id: any) => id !== Number(excludeProjectId));

    if (pids.length === 0) return res.json([]);

    const conflicts = await prismaAssignments.findMany({
      where: {
        member_id: { in: memberIds.map((id: any) => Number(id)) },
        project_id: { in: pids },
      },
    });

    const result = conflicts.map((c: any) => {
      const pName = projectsOnDate.find((p: any) => p.id === c.project_id)?.project_name;
      return { memberId: c.member_id, memberName: c.member_name, projectName: pName };
    });

    res.json(result);
  } catch (error: any) {
    console.error('[POST /project-team-assignments/check-availability] Error:', error?.message);
    res.status(500).json({ error: 'Gagal check availability' });
  }
});

export default router;
