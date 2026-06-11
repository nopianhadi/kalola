import { apiFetch } from '@/lib/apiClient';
import { TeamProjectPayment, PaymentStatus } from '@/types';

function toRow(p: TeamProjectPayment) {
  const row: any = {
    project_id: p.projectId,
    team_member_name: p.teamMemberName,
    team_member_id: p.teamMemberId,
    date: p.date,
    status: p.status,
    fee: p.fee,
    amount_paid: p.amountPaid || 0,
  };
  return row;
}

function fromRow(row: any): TeamProjectPayment {
  return {
    id: Number(row.id),
    projectId: Number(row.project_id),
    teamMemberName: row.team_member_name,
    teamMemberId: Number(row.team_member_id),
    date: row.date,
    status: row.status as PaymentStatus,
    fee: Number(row.fee || 0),
    amountPaid: Number(row.amount_paid || 0),
  };
}

export async function listAllTeamPayments(): Promise<TeamProjectPayment[]> {
  const data = await apiFetch<any[]>('/team-project-payments');
  return data.map(fromRow);
}

export async function listTeamPaymentsByProject(projectId: number): Promise<TeamProjectPayment[]> {
  const data = await apiFetch<any[]>(`/team-project-payments/project/${projectId}`);
  return data.map(fromRow);
}

export async function upsertTeamPaymentsForProject(projectId: number, items: TeamProjectPayment[]): Promise<TeamProjectPayment[]> {
  const data = await apiFetch<any[]>(`/team-project-payments/project/${projectId}/upsert`, {
    method: 'POST',
    body: JSON.stringify(items)
  });
  return data.map(fromRow);
}

export async function markTeamPaymentStatus(id: number, status: PaymentStatus): Promise<void> {
  await apiFetch(`/team-project-payments/${id}/status`, {
    method: 'PATCH',
    body: JSON.stringify({ status })
  });
}

export async function updateTeamPaymentFee(id: number, fee: number, status: PaymentStatus): Promise<void> {
  await apiFetch(`/team-project-payments/${id}/fee`, {
    method: 'PATCH',
    body: JSON.stringify({ fee, status })
  });
}

export async function updateTeamProjectPayment(id: number, patch: Partial<TeamProjectPayment>): Promise<TeamProjectPayment> {
  const row: any = {};
  if (patch.projectId !== undefined) row.project_id = patch.projectId;
  if (patch.teamMemberName !== undefined) row.team_member_name = patch.teamMemberName;
  if (patch.teamMemberId !== undefined) row.team_member_id = patch.teamMemberId;
  if (patch.date !== undefined) row.date = patch.date;
  if (patch.status !== undefined) row.status = patch.status;
  if (patch.fee !== undefined) row.fee = patch.fee;
  if (patch.amountPaid !== undefined) row.amount_paid = patch.amountPaid;

  const data = await apiFetch<any>(`/team-project-payments/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(row)
  });
  return fromRow(data);
}

export async function updateTeamProjectPayments(items: TeamProjectPayment[]): Promise<TeamProjectPayment[]> {
  const rows = items.map(toRow);
  const data = await apiFetch<any[]>('/team-project-payments/upsert-many', {
    method: 'POST',
    body: JSON.stringify(rows)
  });
  return data.map(fromRow);
}

export async function deleteTeamPaymentsByProject(projectId: number): Promise<void> {
  await apiFetch(`/team-project-payments/project/${projectId}`, { method: 'DELETE' });
}

export async function syncTeamPaymentsFromAssignments(projectId: number): Promise<TeamProjectPayment[]> {
  const data = await apiFetch<any[]>(`/team-project-payments/sync-project/${projectId}`, {
    method: 'POST'
  });
  return data.map(fromRow);
}
