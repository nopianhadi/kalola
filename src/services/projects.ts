import { apiFetch } from '@/lib/apiClient';
import { Project, PaymentStatus, BookingStatus } from '@/types';

export type CreateProjectInput = {
  projectName: string;
  clientName: string;
  clientId: number;
  projectType: string;
  packageName: string;
  date: string; // ISO date
  location: string;
  status: string;
  progress?: number;
  totalCost: number;
  amountPaid: number;
  paymentStatus: PaymentStatus;
  bookingStatus?: BookingStatus;
  notes?: string;
  accommodation?: string;
  driveLink?: string;
  promoCodeId?: number;
  discountAmount?: number;
  printingCost?: number;
  transportCost?: number;
  completedDigitalItems?: string[];
  dpProofUrl?: string;
  addOns: { id: number; name: string; price: number }[];
  durationSelection?: string;
  unitPrice?: number;
  address?: string;
};

/** Partial project fields for updates (camelCase). Allows any Project optional field. */
export type UpdateProjectInput = Partial<CreateProjectInput> & Partial<Pick<Project,
  | 'deadlineDate' | 'progress' | 'clientDriveLink' | 'finalDriveLink' | 'startTime' | 'endTime'
  | 'printingDetails' | 'customCosts' | 'transportPaid' | 'transportNote' | 'printingCardId' | 'transportCardId'
  | 'activeSubStatuses' | 'customSubStatuses' | 'confirmedSubStatuses' | 'clientSubStatusNotes'
  | 'subStatusConfirmationSentAt' | 'invoiceSignature' | 'isEditingConfirmedByClient' | 'isPrintingConfirmedByClient'
  | 'isDeliveryConfirmedByClient' | 'durationSelection' | 'statusHistory' | 'address'
>> & { addOns?: { id: number; name: string; price: number }[] };

function safeParse<T>(val: any, fallback: T): T {
  if (!val) return fallback;
  if (typeof val !== 'string') return (val as T) || fallback;
  try {
    return JSON.parse(val) as T;
  } catch {
    return fallback;
  }
}

export function normalizeProject(row: Record<string, unknown>): Project {
  return {
    id: Number(row.id),
    projectName: String(row.project_name || row.projectName || ''),
    clientName: String(row.client_name || row.clientName || ''),
    clientId: Number(row.client_id || row.clientId || 0),
    projectType: String(row.project_type || row.projectType || ''),
    packageName: String(row.package_name || row.packageName || ''),
    packageId: Number(row.package_id || 0),
    addOns: ((row.addOns as any[]) || []).filter(Boolean),
    date: String(row.date),
    deadlineDate: row.deadline_date ? String(row.deadline_date) : undefined,
    location: row.location ? String(row.location) : '',
    progress: typeof row.progress === 'number' ? row.progress : 0,
    status: String(row.status),
    totalCost: Number(row.total_cost || row.totalCost || 0),
    amountPaid: Number(row.amount_paid || row.amountPaid || 0),
    paymentStatus: String(row.payment_status || row.paymentStatus) as PaymentStatus,
    bookingStatus: (row.booking_status || row.bookingStatus) ? (String(row.booking_status || row.bookingStatus) as BookingStatus) : undefined,
    team: (row.team as any[]) || [],
    notes: row.notes ? String(row.notes) : undefined,
    accommodation: row.accommodation ? String(row.accommodation) : undefined,
    driveLink: row.drive_link || row.driveLink ? String(row.drive_link || row.driveLink) : undefined,
    clientDriveLink: row.client_drive_link || row.clientDriveLink ? String(row.client_drive_link || row.clientDriveLink) : undefined,
    finalDriveLink: row.final_drive_link || row.finalDriveLink ? String(row.final_drive_link || row.finalDriveLink) : undefined,
    startTime: row.start_time || row.startTime ? String(row.start_time || row.startTime) : undefined,
    endTime: row.end_time || row.endTime ? String(row.end_time || row.endTime) : undefined,
    promoCodeId: (row.promo_code_id || row.promoCodeId) ? Number(row.promo_code_id || row.promoCodeId) : undefined,
    discountAmount: typeof (row.discount_amount || row.discountAmount) === 'number' ? Number(row.discount_amount || row.discountAmount) : undefined,
    printingDetails: safeParse<any[]>(row.printing_details || row.printingDetails, []),
    customCosts: safeParse<any[]>(row.custom_costs || row.customCosts, []),
    printingCost: typeof (row.printing_cost || row.printingCost) === 'number' ? Number(row.printing_cost || row.printingCost) : undefined,
    transportCost: typeof (row.transport_cost || row.transportCost) === 'number' ? Number(row.transport_cost || row.transportCost) : undefined,
    transportPaid: Boolean(row.transport_paid || row.transportPaid),
    transportNote: row.transport_note || row.transportNote ? String(row.transport_note || row.transportNote) : undefined,
    printingCardId: (row.printing_card_id || row.printingCardId) ? Number(row.printing_card_id || row.printingCardId) : undefined,
    transportCardId: (row.transport_card_id || row.transportCardId) ? Number(row.transport_card_id || row.transportCardId) : undefined,
    completedDigitalItems: safeParse<string[]>(row.completed_digital_items || row.completedDigitalItems, []),
    dpProofUrl: row.dp_proof_url || row.dpProofUrl ? String(row.dp_proof_url || row.dpProofUrl) : undefined,
    activeSubStatuses: safeParse<string[]>(row.active_sub_statuses || row.activeSubStatuses, []),
    customSubStatuses: safeParse<Array<{ name: string; note: string }>>(row.custom_sub_statuses || row.customSubStatuses, []),
    confirmedSubStatuses: safeParse<string[]>(row.confirmed_sub_statuses || row.confirmedSubStatuses, []),
    clientSubStatusNotes: safeParse<Record<string, string>>(row.client_sub_status_notes || row.clientSubStatusNotes, {}),
    subStatusConfirmationSentAt: safeParse<Record<string, string>>(row.sub_status_confirmation_sent_at || row.subStatusConfirmationSentAt, {}),
    invoiceSignature: row.invoice_signature || row.invoiceSignature ? String(row.invoice_signature || row.invoiceSignature) : undefined,
    isEditingConfirmedByClient: Boolean(row.is_editing_confirmed_by_client || row.isEditingConfirmedByClient),
    isPrintingConfirmedByClient: Boolean(row.is_printing_confirmed_by_client || row.isPrintingConfirmedByClient),
    isDeliveryConfirmedByClient: Boolean(row.is_delivery_confirmed_by_client || row.isDeliveryConfirmedByClient),
    statusHistory: safeParse<any[]>(row.status_history || row.statusHistory, []),
    address: row.address ? String(row.address) : undefined,
    weddingDayChecklist: (row.weddingDayChecklist as any[]) || [],
  };
}

function denormalizeProject(obj: UpdateProjectInput | CreateProjectInput): any {
  const result: any = { ...obj };
  
  // Remove id if it exists in Create input to let backend handle auto-increment
  if (!(obj as any).id && (obj as any).projectName) {
    delete result.id;
  }

  // Stringify all JSON fields
  const jsonFields = [
    'completedDigitalItems', 'activeSubStatuses', 'customSubStatuses', 
    'confirmedSubStatuses', 'clientSubStatusNotes', 'subStatusConfirmationSentAt', 
    'statusHistory', 'printingDetails', 'customCosts'
  ];

  jsonFields.forEach(field => {
    if (result[field] !== undefined) {
      result[field] = JSON.stringify(result[field]);
    }
  });

  return result;
}

export async function listProjects(options: { limit?: number; offset?: number } = {}): Promise<Project[]> {
  const query = new URLSearchParams();
  if (options.limit) query.append('limit', String(options.limit));
  if (options.offset) query.append('offset', String(options.offset));
  
  const data = await apiFetch<any[]>(`/projects?${query.toString()}`);
  return data.map(normalizeProject);
}

export async function listProjectsPaginated(
  page: number = 1,
  limit: number = 20,
  searchQuery?: string,
  filters?: {
    status?: string;
    clientId?: number;
    projectType?: string;
    dateFrom?: string;
    dateTo?: string;
  }
): Promise<{
  projects: Project[];
  total: number;
  hasMore: boolean;
}> {
  const query = new URLSearchParams({ page: String(page), limit: String(limit) });
  if (searchQuery) query.append('search', searchQuery);
  if (filters?.status) query.append('status', filters.status);
  if (filters?.clientId) query.append('clientId', String(filters.clientId));
  if (filters?.projectType) query.append('projectType', filters.projectType);
  if (filters?.dateFrom) query.append('dateFrom', filters.dateFrom);
  if (filters?.dateTo) query.append('dateTo', filters.dateTo);

  const data = await apiFetch<any>(`/projects/paginated?${query.toString()}`);
  return { ...data, projects: data.projects.map(normalizeProject) };
}

export async function listProjectsWithRelationsPaginated(
  page: number = 1,
  limit: number = 20,
  searchQuery?: string,
  filters?: { status?: string; clientId?: number; projectType?: string; dateFrom?: string; dateTo?: string; }
): Promise<{ projects: Project[]; total: number; hasMore: boolean; }> {
  const query = new URLSearchParams({ page: String(page), limit: String(limit), withRelations: 'true' });
  if (searchQuery) query.append('search', searchQuery);
  if (filters?.status) query.append('status', filters.status);
  if (filters?.clientId) query.append('clientId', String(filters.clientId));
  if (filters?.projectType) query.append('projectType', filters.projectType);
  if (filters?.dateFrom) query.append('dateFrom', filters.dateFrom);
  if (filters?.dateTo) query.append('dateTo', filters.dateTo);

  const data = await apiFetch<any>(`/projects/paginated?${query.toString()}`);
  return { ...data, projects: data.projects.map(normalizeProject) };
}

export async function updateProject(projectId: number, input: UpdateProjectInput): Promise<Project> {
  const data = await apiFetch<any>(`/projects/${projectId}`, {
    method: 'PATCH',
    body: JSON.stringify(denormalizeProject(input))
  });
  return normalizeProject(data);
}

export async function deleteProject(projectId: number): Promise<boolean> {
  try {
    await apiFetch(`/projects/${projectId}`, { method: 'DELETE' });
    return true;
  } catch (error) {
    return false;
  }
}

export async function createProject(input: CreateProjectInput): Promise<Project> {
  const data = await apiFetch<any>('/projects', {
    method: 'POST',
    body: JSON.stringify(denormalizeProject(input))
  });
  return normalizeProject(data);
}

export async function createProjectWithRelations(input: CreateProjectInput & {
  team?: Array<any>; activeSubStatuses?: string[]; customSubStatuses?: any[];
}): Promise<Project> {
  const data = await apiFetch<any>('/projects', {
    method: 'POST',
    body: JSON.stringify(denormalizeProject(input))
  });
  return normalizeProject(data);
}

export async function getProjectWithRelations(projectId: number): Promise<Project | null> {
  try {
    const data = await apiFetch<any>(`/projects/${projectId}/with-relations`);
    return normalizeProject(data);
  } catch (error: any) {
    if (error.message.includes('404')) return null;
    throw error;
  }
}

export async function listProjectsWithRelations(options: { limit?: number; offset?: number } = {}): Promise<Project[]> {
  const query = new URLSearchParams({ withRelations: 'true' });
  if (options.limit) query.append('limit', String(options.limit));
  if (options.offset) query.append('offset', String(options.offset));
  
  const data = await apiFetch<any[]>(`/projects?${query.toString()}`);
  return data.map(normalizeProject);
}

// Utility function to validate project data before persistence
export function validateProjectData(data: Record<string, unknown>): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];

  const projectName = String(data.projectName || '');
  if (projectName.trim() === '') {
    errors.push('Nama proyek tidak boleh kosong');
  }

  const clientName = String(data.clientName || '');
  if (clientName.trim() === '') {
    errors.push('Nama klien tidak boleh kosong');
  }

  const clientId = data.clientId;
  if (!clientId) {
    errors.push('ID klien tidak boleh kosong');
  }

  const date = String(data.date || '');
  if (!date.match(/^\d{4}-\d{2}-\d{2}/)) {
    errors.push('Tanggal Acara Pernikahan tidak valid');
  }

  const status = String(data.status || '');
  if (status.trim() === '') {
    errors.push('Status proyek tidak boleh kosong');
  }

  if (data.deadlineDate) {
    const deadline = String(data.deadlineDate);
    if (!deadline.match(/^\d{4}-\d{2}-\d{2}/)) {
      errors.push('Tanggal deadline tidak valid');
    }
  }

  if (data.totalCost !== undefined) {
    const cost = Number(data.totalCost);
    if (Number.isNaN(cost) || cost < 0) {
      errors.push('Total biaya harus berupa angka positif');
    }
  }

  if (data.amountPaid !== undefined) {
    const paid = Number(data.amountPaid);
    if (Number.isNaN(paid) || paid < 0) {
      errors.push('Jumlah yang dibayar harus berupa angka positif');
    }
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}

// Utility function to sanitize project data
export function sanitizeProjectData<T = any>(data: T): T {
  const customData = data as any;
  return {
    ...data,
    projectName: typeof customData.projectName === 'string' ? customData.projectName.trim() : '',
    clientName: typeof customData.clientName === 'string' ? customData.clientName.trim() : '',
    location: typeof customData.location === 'string' ? customData.location.trim() : '',
    notes: typeof customData.notes === 'string' ? customData.notes.trim() : undefined,
    driveLink: typeof customData.driveLink === 'string' ? customData.driveLink.trim() : undefined,
    clientDriveLink: typeof customData.clientDriveLink === 'string' ? customData.clientDriveLink.trim() : undefined,
    finalDriveLink: typeof customData.finalDriveLink === 'string' ? customData.finalDriveLink.trim() : undefined,
    totalCost: customData.totalCost ? Number(customData.totalCost) : 0,
    amountPaid: customData.amountPaid ? Number(customData.amountPaid) : 0,
    printingCost: customData.printingCost ? Number(customData.printingCost) : 0,
    transportCost: customData.transportCost ? Number(customData.transportCost) : 0,
    transportPaid: Boolean(customData.transportPaid),
    transportNote: customData.transportNote ? String(customData.transportNote).trim() : undefined,
    printingCardId: customData.printingCardId || undefined,
    transportCardId: customData.transportCardId || undefined,
    activeSubStatuses: Array.isArray(customData.activeSubStatuses) ? customData.activeSubStatuses : [],
    customSubStatuses: Array.isArray(customData.customSubStatuses) ? customData.customSubStatuses : [],
    completedDigitalItems: Array.isArray(customData.completedDigitalItems) ? customData.completedDigitalItems : [],
    printingDetails: Array.isArray(customData.printingDetails) ? customData.printingDetails : (Array.isArray(customData.printing_details) ? customData.printing_details : []),
    team: Array.isArray(customData.team) ? customData.team : [],
    isEditingConfirmedByClient: Boolean(customData.isEditingConfirmedByClient),
    isPrintingConfirmedByClient: Boolean(customData.isPrintingConfirmedByClient),
    isDeliveryConfirmedByClient: Boolean(customData.isDeliveryConfirmedByClient),
    statusHistory: Array.isArray(customData.statusHistory) ? customData.statusHistory : [],
  };
}

export async function getProjectsSummary(): Promise<{ totalCount: number; totalRevenue: number; totalAmountPaid: number }> {
  return await apiFetch<any>('/projects/summary');
}
