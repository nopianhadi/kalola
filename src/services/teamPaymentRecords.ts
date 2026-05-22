import { apiFetch } from '@/lib/apiClient';
import { TeamPaymentRecord } from '@/types';

function safeParse<T>(val: any, fallback: T): T {
  if (!val) return fallback;
  if (typeof val !== 'string') return (val as T) || fallback;
  try {
    return JSON.parse(val) as T;
  } catch {
    return fallback;
  }
}

function fromRow(row: any): TeamPaymentRecord {
  return {
    id: Number(row.id),
    recordNumber: row.record_number,
    teamMemberId: Number(row.team_member_id),
    teamMemberName: row.team_member_name || '',
    teamMemberRole: row.team_member_role || '',
    date: row.date,
    projectPaymentIds: safeParse<number[]>(row.project_payment_ids, []),
    items: safeParse<any[]>(row.items, []),
    totalAmount: Number(row.total_amount || 0),
    vendorSignature: row.vendor_signature || undefined,
    recipientSignature: row.recipient_signature || undefined,
    sourceType: row.source_type || undefined,
    sourceId: row.source_id ? Number(row.source_id) : undefined,
    sourceName: row.source_name || undefined,
    notes: row.notes || undefined,
  };
}

function toRow(input: Partial<TeamPaymentRecord>): any {
  const result: any = {
    ...(input.recordNumber !== undefined ? { record_number: input.recordNumber } : {}),
    ...(input.teamMemberId !== undefined ? { team_member_id: input.teamMemberId } : {}),
    ...(input.teamMemberName !== undefined ? { team_member_name: input.teamMemberName } : {}),
    ...(input.teamMemberRole !== undefined ? { team_member_role: input.teamMemberRole } : {}),
    ...(input.date !== undefined ? { date: input.date } : {}),
    ...(input.projectPaymentIds !== undefined ? { project_payment_ids: JSON.stringify(input.projectPaymentIds) } : {}),
    ...(input.items !== undefined ? { items: JSON.stringify(input.items) } : {}),
    ...(input.totalAmount !== undefined ? { total_amount: input.totalAmount } : {}),
    ...(input.vendorSignature !== undefined ? { vendor_signature: input.vendorSignature } : {}),
    ...(input.recipientSignature !== undefined ? { recipient_signature: input.recipientSignature } : {}),
    ...(input.sourceType !== undefined ? { source_type: input.sourceType } : {}),
    ...(input.sourceId !== undefined ? { source_id: input.sourceId } : {}),
    ...(input.sourceName !== undefined ? { source_name: input.sourceName } : {}),
    ...(input.notes !== undefined ? { notes: input.notes } : {}),
  };
  return result;
}

export async function listTeamPaymentRecords(): Promise<TeamPaymentRecord[]> {
  const data = await apiFetch<any[]>('/team-payment-records');
  return data.map(fromRow);
}

export async function createTeamPaymentRecord(payload: Omit<TeamPaymentRecord, 'id'>): Promise<TeamPaymentRecord> {
  const data = await apiFetch<any>('/team-payment-records', {
    method: 'POST',
    body: JSON.stringify(toRow(payload))
  });
  return fromRow(data);
}

export async function updateTeamPaymentRecord(id: number, patch: Partial<TeamPaymentRecord>): Promise<TeamPaymentRecord> {
  const payload = toRow(patch);
  delete payload.id;
  const data = await apiFetch<any>(`/team-payment-records/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(payload)
  });
  return fromRow(data);
}

export async function deleteTeamPaymentRecord(id: number): Promise<void> {
  await apiFetch(`/team-payment-records/${id}`, { method: 'DELETE' });
}
