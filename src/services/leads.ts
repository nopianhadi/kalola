import { apiFetch } from '@/lib/apiClient';
import { Lead, LeadSource, LeadStatus } from '@/types';

export interface LeadStats {
  total: number;
  bySource: Record<string, number>;
  byStatus: Record<string, number>;
  converted: number;
  newLeads: number;
}

export function normalizeLead(row: any): Lead {
  return {
    id: Number(row.id),
    name: row.name,
    city: row.city ?? undefined,
    whatsapp: row.whatsapp,
    source: row.source as LeadSource,
    status: row.status as LeadStatus,
    notes: row.notes ?? undefined,
    clientId: row.client_id ? Number(row.client_id) : undefined,
    createdAt: row.created_at || row.createdAt || '',
    updatedAt: row.updated_at || row.updatedAt || '',
  };
}

function denormalizeLead(obj: Partial<Lead>): any {
  return {
    ...(obj.name !== undefined ? { name: obj.name } : {}),
    ...(obj.city !== undefined ? { city: obj.city } : {}),
    ...(obj.whatsapp !== undefined ? { whatsapp: obj.whatsapp } : {}),
    ...(obj.source !== undefined ? { source: obj.source } : {}),
    ...(obj.status !== undefined ? { status: obj.status } : {}),
    ...(obj.notes !== undefined ? { notes: obj.notes } : {}),
    ...(obj.clientId !== undefined ? { client_id: obj.clientId } : {}),
  };
}

export async function listLeads(options: {
  limit?: number;
  offset?: number;
  source?: string;
  status?: string;
  city?: string;
} = {}): Promise<Lead[]> {
  const query = new URLSearchParams();
  if (options.limit) query.append('limit', String(options.limit));
  if (options.offset) query.append('offset', String(options.offset));
  if (options.source) query.append('source', options.source);
  if (options.status) query.append('status', options.status);
  if (options.city) query.append('city', options.city);

  const data = await apiFetch<any[]>(`/leads?${query.toString()}`);
  return data.map(normalizeLead);
}

export async function listLeadsPaginated(
  page: number = 1,
  limit: number = 20,
  searchQuery?: string,
  filters?: {
    source?: string;
    status?: string;
    city?: string;
    dateFrom?: string;
    dateTo?: string;
  }
): Promise<{ leads: Lead[]; total: number; hasMore: boolean }> {
  const query = new URLSearchParams({
    page: String(page),
    limit: String(limit),
  });
  if (searchQuery) query.append('search', searchQuery);
  if (filters?.source) query.append('source', filters.source);
  if (filters?.status) query.append('status', filters.status);
  if (filters?.city) query.append('city', filters.city);
  if (filters?.dateFrom) query.append('dateFrom', filters.dateFrom);
  if (filters?.dateTo) query.append('dateTo', filters.dateTo);

  const data = await apiFetch<{ leads: any[]; total: number; hasMore: boolean }>(
    `/leads/paginated?${query.toString()}`
  );
  return {
    ...data,
    leads: data.leads.map(normalizeLead),
  };
}

export async function getLeadStats(filters?: { dateFrom?: string; dateTo?: string }): Promise<LeadStats> {
  const query = new URLSearchParams();
  if (filters?.dateFrom) query.append('dateFrom', filters.dateFrom);
  if (filters?.dateTo) query.append('dateTo', filters.dateTo);
  const qs = query.toString();
  return apiFetch<LeadStats>(`/leads/stats${qs ? `?${qs}` : ''}`);
}

export async function createLead(payload: Omit<Lead, 'id' | 'createdAt' | 'updatedAt' | 'clientId'>): Promise<Lead> {
  const data = await apiFetch<any>('/leads', {
    method: 'POST',
    body: JSON.stringify(denormalizeLead(payload)),
  });
  return normalizeLead(data);
}

export async function updateLead(id: number, patch: Partial<Lead>): Promise<Lead> {
  const data = await apiFetch<any>(`/leads/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(denormalizeLead(patch)),
  });
  return normalizeLead(data);
}

export async function convertLeadToClient(id: number): Promise<{ lead: Lead; client: any }> {
  const data = await apiFetch<any>(`/leads/${id}/convert`, { method: 'POST' });
  return {
    lead: normalizeLead(data.lead),
    client: data.client,
  };
}

export async function deleteLead(id: number): Promise<void> {
  await apiFetch(`/leads/${id}`, { method: 'DELETE' });
}
