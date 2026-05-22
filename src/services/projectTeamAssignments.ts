import { apiFetch } from '@/lib/apiClient';
import { AssignedTeamMember } from '@/types';


function fromRow(row: any): AssignedTeamMember {
  return {
    memberId: Number(row.member_id),
    name: row.member_name,
    role: row.member_role,
    category: row.member_category || 'Tim',
    fee: Number(row.fee || 0),

    subJob: row.sub_job || undefined,
  };
}

export async function listAssignmentsByProject(projectId: number): Promise<AssignedTeamMember[]> {
  const data = await apiFetch<any[]>(`/project-team-assignments/${projectId}`);
  return data.map(fromRow);
}

export async function upsertAssignmentsForProject(projectId: number, assignments: AssignedTeamMember[]): Promise<void> {
  if (!assignments) return;
  const toUpsert = assignments.map(a => ({
    project_id: projectId,
    member_id: a.memberId,
    member_name: a.name,
    member_role: a.role,
    member_category: a.category,
    fee: a.fee,
    sub_job: a.subJob
  }));
  await apiFetch(`/project-team-assignments/${projectId}/upsert`, {
    method: 'POST',
    body: JSON.stringify(toUpsert)
  });
}

export async function deleteAssignmentsByProject(projectId: number): Promise<void> {
  await apiFetch(`/project-team-assignments/${projectId}`, { method: 'DELETE' });
}

export async function checkTeamAvailability(memberIds: number[], date: string, excludeProjectId?: number): Promise<{ memberId: number, memberName: string, projectName: string }[]> {
  if (!memberIds || memberIds.length === 0) return [];
  return await apiFetch<any[]>('/project-team-assignments/check-availability', {
    method: 'POST',
    body: JSON.stringify({ memberIds, date, excludeProjectId })
  });
}
