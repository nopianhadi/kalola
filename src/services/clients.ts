import { apiFetch } from '@/lib/apiClient';
import { Client, ClientStatus, ClientType } from '@/types';

export async function syncClientStatusFromProjects(clientId: number): Promise<void> {
  // Seluruh kompleksitas query sekarang dipindah ke backend!
  await apiFetch(`/clients/${clientId}/sync-status`, { method: 'POST' });
}

export async function listClients(options: { limit?: number; offset?: number } = {}): Promise<Client[]> {
  const query = new URLSearchParams();
  if (options.limit) query.append('limit', String(options.limit));
  if (options.offset) query.append('offset', String(options.offset));
  
  const data = await apiFetch<any[]>(`/clients?${query.toString()}`);
  return data.map(normalizeClient);
}

export async function listClientsPaginated(
  page: number = 1,
  limit: number = 20,
  searchQuery?: string,
  filters?: {
    status?: string;
    clientType?: string;
  }
): Promise<{
  clients: Client[];
  total: number;
  hasMore: boolean;
}> {
  const query = new URLSearchParams({
    page: String(page),
    limit: String(limit)
  });
  
  if (searchQuery) query.append('search', searchQuery);
  if (filters?.status) query.append('status', filters.status);
  if (filters?.clientType) query.append('clientType', filters.clientType);

  const data = await apiFetch<{ clients: any[], total: number, hasMore: boolean }>(
    `/clients/paginated?${query.toString()}`
  );

  return {
    ...data,
    clients: data.clients.map(normalizeClient)
  };
}

export async function getClient(id: number): Promise<Client | null> {
  try {
    const data = await apiFetch<any>(`/clients/${id}`);
    return normalizeClient(data);
  } catch (error: any) {
    if (error.message.includes('404')) return null; // Not found
    throw error;
  }
}

export async function createClient(payload: Omit<Client, 'id'>): Promise<Client> {
  const data = await apiFetch<any>('/clients', {
    method: 'POST',
    body: JSON.stringify(denormalizeClient(payload))
  });
  return normalizeClient(data);
}

export async function updateClient(id: number, patch: Partial<Client>): Promise<Client> {
  const payload = denormalizeClient(patch);
  delete payload.id;
  const data = await apiFetch<any>(`/clients/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(payload)
  });
  return normalizeClient(data);
}

export async function deleteClient(id: number): Promise<void> {
  await apiFetch(`/clients/${id}`, { method: 'DELETE' });
}

// Helpers to map between DB row and TS type
export function normalizeClient(row: any): Client {
  return {
    id: Number(row.id),
    name: row.name,
    email: row.email,
    phone: row.phone,
    whatsapp: row.whatsapp ?? undefined,
    since: row.since || row.created_at || row.createdAt || '',
    instagram: row.instagram ?? undefined,
    status: row.status as ClientStatus,
    clientType: row.clientType || row.client_type as ClientType,
    lastContact: row.lastContact || row.last_contact,
    portalAccessId: row.portalAccessId || row.portal_access_id,
    address: row.address ?? undefined,
  };
}

function denormalizeClient(obj: Partial<Client>): any {
  const result: any = {
    ...(obj.name !== undefined ? { name: obj.name } : {}),
    ...(obj.email !== undefined ? { email: obj.email } : {}),
    ...(obj.phone !== undefined ? { phone: obj.phone } : {}),
    ...(obj.whatsapp !== undefined ? { whatsapp: obj.whatsapp } : {}),
    ...(obj.since !== undefined ? { since: obj.since } : {}),
    ...(obj.instagram !== undefined ? { instagram: obj.instagram } : {}),
    ...(obj.status !== undefined ? { status: obj.status } : {}),
    ...(obj.clientType !== undefined ? { client_type: obj.clientType } : {}),
    ...(obj.lastContact !== undefined ? { last_contact: obj.lastContact } : {}),
    ...(obj.portalAccessId !== undefined ? { portal_access_id: obj.portalAccessId } : {}),
    ...(obj.address !== undefined ? { address: obj.address } : {}),
  };
  return result;
}
