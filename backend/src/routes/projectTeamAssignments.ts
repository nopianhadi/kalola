import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import crypto from 'crypto';

const router = Router();
const prisma = new PrismaClient();

// Use the correct Prisma model names
const prismaAssignments = (prisma as any).project_team_assignments;
const prismaProjects = (prisma as any).projects;

router.get('/:projectId', async (req, res) => {
  try {
    const data = await prismaAssignments.findMany({ where: { project_id: Number(req.params.projectId) } });
    res.json(data);
  } catch (error: any) {
    console.error('[GET /project-team-assignments/:projectId] Error:', error?.message);
    res.status(500).json({ error: 'Gagal mengambil data assignments' });
  }
});

router.post('/:projectId/upsert', async (req, res) => {
  const { projectId } = req.params;
  const assignments = req.body; // array of assignments

  try {
    await prisma.$transaction(async (tx: any) => {
      const ptx = tx.project_team_assignments;
      
      // Delete existing assignments for this project
      await ptx.deleteMany({ where: { project_id: Number(projectId) } });
      
      if (assignments && Array.isArray(assignments) && assignments.length > 0) {
        const rows = assignments.map((a: any) => ({
          project_id: Number(projectId),
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
    res.status(200).json({ success: true });
  } catch (error: any) {
    console.error('[POST /project-team-assignments/:projectId/upsert] Error:', error?.message || error);
    res.status(500).json({ error: 'Gagal upsert assignments', detail: error?.message });
  }
});

router.delete('/:projectId', async (req, res) => {
  try {
    await prismaAssignments.deleteMany({ where: { project_id: Number(req.params.projectId) } });
    res.status(204).send();
  } catch (error: any) {
    console.error('[DELETE /project-team-assignments/:projectId] Error:', error?.message);
    res.status(500).json({ error: 'Gagal menghapus assignments' });
  }
});

// Check availability
router.post('/check-availability', async (req, res) => {
  const { memberIds, date, excludeProjectId } = req.body;
  if (!memberIds || memberIds.length === 0) return res.json([]);

  try {
    const searchDate = new Date(date);
    const startOfDay = new Date(searchDate.setHours(0, 0, 0, 0));
    const endOfDay = new Date(searchDate.setHours(23, 59, 59, 999));

    const projectsOnDate = await prismaProjects.findMany({
      where: { 
        date: {
            gte: startOfDay,
            lt: endOfDay
        } 
      },
      select: { id: true, project_name: true }
    });
    
    const pids = projectsOnDate.map((p:any) => p.id).filter((id:any) => id !== Number(excludeProjectId));
    
    if (pids.length === 0) return res.json([]);

    const conflicts = await prismaAssignments.findMany({
      where: {
         member_id: { in: memberIds.map((id: any) => Number(id)) },
         project_id: { in: pids }
      }
    });

    const result = conflicts.map((c: any) => {
       const pName = projectsOnDate.find((p:any) => p.id === c.project_id)?.project_name;
       return {
         memberId: c.member_id,
         memberName: c.member_name,
         projectName: pName
       };
     });
    res.json(result);
  } catch (error: any) {
    console.error('[POST /project-team-assignments/check-availability] Error:', error?.message);
    res.status(500).json({ error: 'Gagal check availability' });
  }
});

export default router;
