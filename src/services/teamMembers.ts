import { apiFetch } from '@/lib/apiClient';
import { TeamMember, PerformanceNote } from '@/types';

function safeParse<T>(val: any, fallback: T): T {
  if (!val) return fallback;
  if (typeof val !== 'string') return (val as T) || fallback;
  try {
    return JSON.parse(val) as T;
  } catch {
    return fallback;
  }
}

function normalize(row: Record<string, unknown>): TeamMember {
  return {
    id: Number(row.id),
    name: String(row.name),
    role: String(row.role),
    email: String(row.email),
    phone: String(row.phone),
    standardFee: Number(row.standardFee || row.standard_fee || 0),
    noRek: row.noRek || row.no_rek ? String(row.noRek || row.no_rek) : undefined,
    bankName: row.bankName || row.bank_name ? String(row.bankName || row.bank_name) : undefined,
    specialization: row.specialization ? String(row.specialization) : undefined,
    location: row.location ? String(row.location) : undefined,
    emergencyContact: row.emergencyContact || row.emergency_contact ? String(row.emergencyContact || row.emergency_contact) : undefined,
    rating: Number(row.rating || 0),
    performanceNotes: safeParse<PerformanceNote[]>(row.performance_notes || row.performanceNotes, []),
    portalAccessId: String(row.portalAccessId || row.portal_access_id),
    category: row.category ? (String(row.category) as 'Tim' | 'Vendor') : 'Tim',
  };
}

function denormalize(obj: Partial<TeamMember>): Record<string, unknown> {
  const result: any = {
    ...(obj.name !== undefined ? { name: obj.name } : {}),
    ...(obj.role !== undefined ? { role: obj.role } : {}),
    ...(obj.email !== undefined ? { email: obj.email } : {}),
    ...(obj.phone !== undefined ? { phone: obj.phone } : {}),
    ...(obj.standardFee !== undefined ? { standard_fee: obj.standardFee } : {}),
    ...(obj.noRek !== undefined ? { no_rek: obj.noRek } : {}),
    ...(obj.bankName !== undefined ? { bank_name: obj.bankName } : {}),
    ...(obj.specialization !== undefined ? { specialization: obj.specialization } : {}),
    ...(obj.location !== undefined ? { location: obj.location } : {}),
    ...(obj.emergencyContact !== undefined ? { emergency_contact: obj.emergencyContact } : {}),
    ...(obj.rating !== undefined ? { rating: obj.rating } : {}),
    ...(obj.performanceNotes !== undefined ? { performance_notes: JSON.stringify(obj.performanceNotes) } : {}),
    ...(obj.portalAccessId !== undefined ? { portal_access_id: obj.portalAccessId } : {}),
    ...(obj.category !== undefined ? { category: obj.category } : {}),
  };
  return result;
}

export async function listTeamMembers(options: { limit?: number; offset?: number } = {}): Promise<TeamMember[]> {
  const query = new URLSearchParams();
  if (options.limit) query.append('limit', String(options.limit));
  if (options.offset) query.append('offset', String(options.offset));
  
  const data = await apiFetch<any[]>(`/team-members?${query.toString()}`);
  return data.map(row => normalize(row));
}

export async function listTeamMembersPaginated(
  page: number = 1, 
  limit: number = 20,
  searchQuery?: string,
  category?: string
): Promise<{
  teamMembers: TeamMember[];
  total: number;
  hasMore: boolean;
}> {
  const query = new URLSearchParams({
    page: String(page),
    limit: String(limit)
  });
  
  if (searchQuery) query.append('search', searchQuery);
  if (category) query.append('category', category);

  const data = await apiFetch<{ teamMembers: any[], total: number, hasMore: boolean }>(
    `/team-members/paginated?${query.toString()}`
  );

  return {
    ...data,
    teamMembers: data.teamMembers.map(row => normalize(row))
  };
}

export async function createTeamMember(payload: Omit<TeamMember, 'id'>): Promise<TeamMember> {
  const data = await apiFetch<any>('/team-members', {
    method: 'POST',
    body: JSON.stringify(denormalize(payload))
  });
  return normalize(data);
}

export async function updateTeamMember(id: number, patch: Partial<TeamMember>): Promise<TeamMember> {
  const payload = denormalize(patch);
  delete payload.id;
  const data = await apiFetch<any>(`/team-members/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(payload)
  });
  return normalize(data);
}

export async function deleteTeamMember(id: number): Promise<void> {
  await apiFetch(`/team-members/${id}`, { method: 'DELETE' });
}
