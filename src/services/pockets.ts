import { apiFetch } from '@/lib/apiClient';
import { FinancialPocket } from '@/types';

function fromRow(row: any): FinancialPocket {
  return {
    id: Number(row.id),
    name: row.name,
    description: row.description,
    icon: row.icon,
    type: row.type,
    amount: Number(row.amount || 0),
    goalAmount: row.goal_amount ?? undefined,
    lockEndDate: row.lock_end_date ?? undefined,
    sourceCardId: row.source_card_id ? Number(row.source_card_id) : undefined,
    // members omitted; if needed, store in another table or JSONB
  } as FinancialPocket;
}

function toRow(patch: Partial<FinancialPocket>): any {
  const result: any = {
    ...(patch.name !== undefined ? { name: patch.name } : {}),
    ...(patch.description !== undefined ? { description: patch.description } : {}),
    ...(patch.icon !== undefined ? { icon: patch.icon } : {}),
    ...(patch.type !== undefined ? { type: patch.type } : {}),
    ...(patch.amount !== undefined ? { amount: patch.amount } : {}),
    ...(patch.goalAmount !== undefined ? { goal_amount: patch.goalAmount } : {}),
    ...(patch.lockEndDate !== undefined ? { lock_end_date: patch.lockEndDate } : {}),
    ...(patch.sourceCardId !== undefined ? { source_card_id: patch.sourceCardId ?? null } : {}),
  };
  return result;
}

export async function listPockets(): Promise<FinancialPocket[]> {
  const data = await apiFetch<any[]>('/pockets');
  return data.map(fromRow);
}

export async function createPocket(payload: Omit<FinancialPocket, 'id' | 'members'>): Promise<FinancialPocket> {
  const data = await apiFetch<any>('/pockets', {
    method: 'POST',
    body: JSON.stringify(toRow(payload))
  });
  return fromRow(data);
}

export async function updatePocket(id: number, patch: Partial<FinancialPocket>): Promise<FinancialPocket> {
  const payload = toRow(patch);
  delete payload.id;
  const data = await apiFetch<any>(`/pockets/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(payload)
  });
  return fromRow(data);
}

export async function deletePocket(id: number): Promise<void> {
  await apiFetch(`/pockets/${id}`, { method: 'DELETE' });
}

export async function closePocketBudget(id: number): Promise<{ transaction: any }> {
  const data = await apiFetch<any>(`/pockets/${id}/close-budget`, { method: 'POST' });
  return { transaction: data.transaction };
}
