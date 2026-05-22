import { apiFetch } from '@/lib/apiClient';
import { PrintingItem } from '@/types';


function fromRow(row: any): PrintingItem {
  return {
    id: Number(row.id),
    type: row.item_type,
    customName: row.custom_name || undefined,
    details: row.details || '',
    cost: Number(row.cost || 0),
  };
}

export async function listPrintItemsByProject(projectId: number): Promise<PrintingItem[]> {
  const data = await apiFetch<any[]>(`/project-print-items/${projectId}`);
  return data.map(fromRow);
}

export async function upsertPrintItemsForProject(projectId: number, items: PrintingItem[]): Promise<void> {
  const toUpsert = items.map(item => ({
    ...item,
    project_id: projectId,
    item_type: item.type,
    custom_name: item.customName,
  }));
  await apiFetch(`/project-print-items/${projectId}/upsert`, {
    method: 'POST',
    body: JSON.stringify(toUpsert)
  });
}

export async function deletePrintItemsByProject(projectId: number): Promise<void> {
  await apiFetch(`/project-print-items/${projectId}`, { method: 'DELETE' });
}
