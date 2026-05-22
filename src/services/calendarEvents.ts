import { apiFetch } from '@/lib/apiClient';
import { AssignedTeamMember, PaymentStatus, Project } from '@/types';

export type CalendarEventRow = {
  id: number;
  title: string;
  event_type: string;
  date: string; // ISO date
  start_time?: string | null;
  end_time?: string | null;
  notes?: string | null;
  team?: AssignedTeamMember[] | null; // jsonb
  image?: string | null;
  location?: string | null;
  created_at?: string;
};

function safeParse<T>(val: any, fallback: T): T {
  if (!val) return fallback;
  if (typeof val !== 'string') return (val as T) || fallback;
  try {
    return JSON.parse(val) as T;
  } catch {
    return fallback;
  }
}

function toProjectLike(row: CalendarEventRow): Project {
  return {
    id: Number(row.id),
    projectName: row.title,
    clientName: 'Acara Pernikahan Internal',
    clientId: 0,
    projectType: row.event_type,
    packageName: '',
    packageId: 0,
    addOns: [],
    date: row.date,
    deadlineDate: undefined,
    location: row.location || '',
    progress: 100,
    status: 'Dikonfirmasi',
    totalCost: 0,
    amountPaid: 0,
    paymentStatus: PaymentStatus.LUNAS,
    team: safeParse<AssignedTeamMember[]>(row.team, []),
    notes: row.notes || undefined,
    startTime: row.start_time || undefined,
    endTime: row.end_time || undefined,
    image: row.image || undefined,
  } as Project;
}

export async function listCalendarEvents(): Promise<Project[]> {
  const data = await apiFetch<any[]>('/calendar-events');
  return data.map(toProjectLike);
}

export async function listCalendarEventsInRange(fromDate: string, toDate: string): Promise<Project[]> {
  const data = await apiFetch<any[]>(`/calendar-events/range?from=${fromDate}&to=${toDate}`);
  return data.map(toProjectLike);
}

export type CreateCalendarEventInput = {
  title: string;
  eventType: string;
  date: string;
  startTime?: string;
  endTime?: string;
  notes?: string;
  team?: AssignedTeamMember[];
  image?: string;
  location?: string;
};

export async function createCalendarEvent(input: CreateCalendarEventInput): Promise<Project> {
  const payload = {
    title: input.title,
    event_type: input.eventType,
    date: input.date,
    start_time: input.startTime ?? null,
    end_time: input.endTime ?? null,
    notes: input.notes ?? null,
    team: JSON.stringify(input.team ?? []),
    image: input.image ?? null,
    location: input.location ?? null,
  } as any;

  const data = await apiFetch<any>('/calendar-events', {
    method: 'POST',
    body: JSON.stringify(payload)
  });
  return toProjectLike(data);
}

export type UpdateCalendarEventInput = Partial<CreateCalendarEventInput>;

export async function updateCalendarEvent(id: number, input: UpdateCalendarEventInput): Promise<Project> {
  const payload: any = {
    ...(input.title !== undefined ? { title: input.title } : {}),
    ...(input.eventType !== undefined ? { event_type: input.eventType } : {}),
    ...(input.date !== undefined ? { date: input.date } : {}),
    ...(input.startTime !== undefined ? { start_time: input.startTime } : {}),
    ...(input.endTime !== undefined ? { end_time: input.endTime } : {}),
    ...(input.notes !== undefined ? { notes: input.notes } : {}),
    ...(input.team !== undefined ? { team: JSON.stringify(input.team) } : {}),
    ...(input.image !== undefined ? { image: input.image } : {}),
    ...(input.location !== undefined ? { location: input.location } : {}),
  };

  const data = await apiFetch<any>(`/calendar-events/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(payload)
  });
  return toProjectLike(data);
}

export async function deleteCalendarEvent(id: number): Promise<void> {
  await apiFetch(`/calendar-events/${id}`, { method: 'DELETE' });
}
