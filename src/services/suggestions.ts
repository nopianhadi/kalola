import { apiFetch } from '@/lib/apiClient';

export type Suggestion = {
  id: number;
  name: string;
  contact: string;
  message: string;
  date: string; // ISO string
  channel?: string;
};

function fromRow(row: any): Suggestion {
  return {
    id: Number(row.id),
    name: row.name,
    contact: row.contact,
    message: row.message,
    date: row.date,
    channel: row.channel || undefined,
  };
}

function toRow(input: Partial<Suggestion>): any {
  const result: any = {
    ...(input.name !== undefined ? { name: input.name } : {}),
    ...(input.contact !== undefined ? { contact: input.contact } : {}),
    ...(input.message !== undefined ? { message: input.message } : {}),
    ...(input.date !== undefined ? { date: input.date } : {}),
    ...(input.channel !== undefined ? { channel: input.channel } : {}),
  };
  return result;
}

export async function listSuggestions(): Promise<Suggestion[]> {
  const data = await apiFetch<any[]>('/suggestions');
  return data.map(fromRow);
}

export async function createSuggestion(payload: Omit<Suggestion, 'id'>): Promise<Suggestion> {
  const row = toRow(payload);
  const data = await apiFetch<any>('/suggestions', {
    method: 'POST',
    body: JSON.stringify(row)
  });
  return fromRow(data);
}
