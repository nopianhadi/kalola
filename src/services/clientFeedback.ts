import { apiFetch } from '@/lib/apiClient';
import { ClientFeedback, SatisfactionLevel } from '@/types';

function fromRow(row: any): ClientFeedback {
  return {
    id: Number(row.id),
    clientName: row.client_name,
    satisfaction: row.satisfaction as SatisfactionLevel,
    rating: Number(row.rating || 0),
    feedback: row.feedback,
    date: row.date,
  };
}

function toRow(cf: Partial<ClientFeedback>): any {
  const result: any = {
    ...(cf.clientName !== undefined ? { client_name: cf.clientName } : {}),
    ...(cf.satisfaction !== undefined ? { satisfaction: cf.satisfaction } : {}),
    ...(cf.rating !== undefined ? { rating: cf.rating } : {}),
    ...(cf.feedback !== undefined ? { feedback: cf.feedback } : {}),
    ...(cf.date !== undefined ? { date: cf.date } : {}),
  };
  return result;
}

export async function listClientFeedback(): Promise<ClientFeedback[]> {
  const data = await apiFetch<any[]>('/client-feedback');
  return data.map(fromRow);
}

export async function createClientFeedback(payload: Omit<ClientFeedback, 'id'>): Promise<ClientFeedback> {
  const row = toRow(payload);
  const data = await apiFetch<any>('/client-feedback', {
    method: 'POST',
    body: JSON.stringify(row)
  });
  return fromRow(data);
}
