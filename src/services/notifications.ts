import { apiFetch } from '@/lib/apiClient';
import { Notification, ViewType } from '@/types';

function safeParse<T>(val: any, fallback: T): T {
  if (!val) return fallback;
  if (typeof val !== 'string') return (val as T) || fallback;
  try {
    return JSON.parse(val) as T;
  } catch {
    return fallback;
  }
}

function normalize(row: any): Notification {
  const link = safeParse<any>(row.link, undefined);
  return {
    id: Number(row.id),
    title: row.title ?? '',
    message: row.message ?? '',
    timestamp: row.timestamp,
    isRead: Boolean(row.is_read),
    icon: row.icon as Notification['icon'],
    link: link ? ({
      view: (link.view as ViewType),
      action: link.action ?? undefined,
    }) : undefined,
  };
}

function denormalize(obj: Partial<Notification>): any {
  const result: any = {
    ...(obj.title !== undefined ? { title: obj.title } : {}),
    ...(obj.message !== undefined ? { message: obj.message } : {}),
    ...(obj.timestamp !== undefined ? { timestamp: obj.timestamp } : {}),
    ...(obj.isRead !== undefined ? { is_read: obj.isRead } : {}),
    ...(obj.icon !== undefined ? { icon: obj.icon } : {}),
    ...(obj.link !== undefined ? { link: JSON.stringify(obj.link) } : {}),
  };
  return result;
}

export async function listNotifications(): Promise<Notification[]> {
  const data = await apiFetch<any[]>('/notifications');
  return data.map(normalize);
}

export async function createNotification(payload: Omit<Notification, 'id'>): Promise<Notification> {
  const data = await apiFetch<any>('/notifications', {
    method: 'POST',
    body: JSON.stringify(denormalize(payload))
  });
  return normalize(data);
}

export async function updateNotification(id: number, patch: Partial<Notification>): Promise<Notification> {
  const payload = denormalize(patch);
  delete payload.id;
  const data = await apiFetch<any>(`/notifications/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(payload)
  });
  return normalize(data);
}

export async function deleteNotification(id: number): Promise<void> {
  await apiFetch(`/notifications/${id}`, { method: 'DELETE' });
}

export async function markNotificationAsRead(id: number): Promise<void> {
  await apiFetch(`/notifications/${id}`, {
    method: 'PATCH',
    body: JSON.stringify({ is_read: true })
  });
}

export async function markAllNotificationsAsRead(): Promise<void> {
  await apiFetch('/notifications/mark-all-read', { method: 'POST' });
}
