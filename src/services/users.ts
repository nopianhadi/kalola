import { apiFetch } from '@/lib/apiClient';
import { User, ViewType } from '@/types';

function safeParse<T>(val: any, fallback: T): T {
  if (!val) return fallback;
  if (typeof val !== 'string') return (val as T) || fallback;
  try {
    return JSON.parse(val) as T;
  } catch {
    return fallback;
  }
}

function fromRow(row: any): User {
  return {
    id: Number(row.id),
    email: row.email,
    password: row.password, 
    fullName: row.full_name,
    companyName: row.company_name || undefined,
    role: row.role || 'Member',
    permissions: safeParse<ViewType[]>(row.permissions, []),
  };
}

function toRow(u: Partial<User>): any {
  const result: any = {
    ...(u.email !== undefined ? { email: u.email } : {}),
    ...(u.password !== undefined ? { password: u.password } : {}),
    ...(u.fullName !== undefined ? { full_name: u.fullName } : {}),
    ...(u.companyName !== undefined ? { company_name: u.companyName } : {}),
    ...(u.role !== undefined ? { role: u.role } : {}),
    ...(u.permissions !== undefined ? { permissions: JSON.stringify(u.permissions) } : {}),
  };
  return result;
}

export async function listUsers(): Promise<User[]> {
  const data = await apiFetch<any[]>('/users');
  return data.map(fromRow);
}

export async function createUser(input: Omit<User, 'id'>): Promise<User> {
  const row = toRow(input);
  const data = await apiFetch<any>('/users', {
    method: 'POST',
    body: JSON.stringify(row)
  });
  return fromRow(data);
}

export async function updateUser(userId: number, input: Partial<Omit<User, 'id'>>): Promise<User> {
  const row = toRow(input);
  delete row.id;
  const data = await apiFetch<any>(`/users/${userId}`, {
    method: 'PATCH',
    body: JSON.stringify(row)
  });
  return fromRow(data);
}

export async function deleteUser(userId: number): Promise<void> {
  await apiFetch(`/users/${userId}`, { method: 'DELETE' });
}

export async function getUserByEmail(email: string): Promise<User | null> {
  try {
    const data = await apiFetch<any>(`/users/email/${email}`);
    return fromRow(data);
  } catch (error: any) {
    if (error.message.includes('404')) return null;
    throw error;
  }
}
