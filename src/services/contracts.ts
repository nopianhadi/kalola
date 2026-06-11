import { apiFetch } from '@/lib/apiClient';
import { Contract } from '@/types';

function toNumber(value: unknown): number | undefined {
  const num = Number(value);
  return Number.isFinite(num) ? num : undefined;
}

function normalizeContract(row: any): Contract {
  return {
    id: Number(row.id),
    contractNumber: row.contract_number,
    clientId: Number(row.client_id),
    projectId: Number(row.project_id),
    signingDate: row.signing_date,
    signingLocation: row.signing_location || '',
    clientName1: row.client_name1,
    clientAddress1: row.client_address1 || '',
    clientPhone1: row.client_phone1 || '',
    clientName2: row.client_name2 || undefined,
    clientAddress2: row.client_address2 || undefined,
    clientPhone2: row.client_phone2 || undefined,
    shootingDuration: row.shooting_duration || '',
    guaranteedPhotos: row.guaranteed_photos || '',
    albumDetails: row.album_details || '',
    digitalFilesFormat: row.digital_files_format || 'JPG High-Resolution',
    otherItems: row.other_items || '',
    personnelCount: row.personnel_count || '',
    deliveryTimeframe: row.delivery_timeframe || '',
    dpDate: row.dp_date || '',
    finalPaymentDate: row.final_payment_date || '',
    cancellationPolicy: row.cancellation_policy || '',
    jurisdiction: row.jurisdiction || '',
    vendorSignature: row.vendor_signature || undefined,
    clientSignature: row.client_signature || undefined,
    includeMeterai: row.include_meterai ?? false,
    meteraiPlacement: (row.meterai_placement as any) || 'client',
    createdAt: row.created_at,
  };
}

export async function listContracts(): Promise<Contract[]> {
  const data = await apiFetch<any[]>('/contracts');
  return data.map(normalizeContract);
}

export async function createContract(contract: Omit<Contract, 'id' | 'createdAt'>): Promise<Contract> {
  const insertRow = {
    contract_number: contract.contractNumber,
    client_id: toNumber(contract.clientId),
    project_id: toNumber(contract.projectId),
    signing_date: contract.signingDate || null,
    signing_location: contract.signingLocation || null,
    service_title: contract.serviceTitle || null,
    client_name_1: contract.clientName1 || '',
    client_address_1: contract.clientAddress1 || null,
    client_phone_1: contract.clientPhone1 || null,
    client_name_2: contract.clientName2 || null,
    client_address_2: contract.clientAddress2 || null,
    client_phone_2: contract.clientPhone2 || null,
    shooting_duration: contract.shootingDuration || null,
    guaranteed_photos: contract.guaranteedPhotos || null,
    album_details: contract.albumDetails || null,
    digital_files_format: contract.digitalFilesFormat || 'JPG High-Resolution',
    other_items: contract.otherItems || null,
    personnel_count: contract.personnelCount || null,
    delivery_timeframe: contract.deliveryTimeframe || null,
    dp_date: contract.dpDate || null,
    final_payment_date: contract.finalPaymentDate || null,
    cancellation_policy: contract.cancellationPolicy || null,
    jurisdiction: contract.jurisdiction || null,
    pasal_1_content: contract.pasal1Content || null,
    pasal_2_content: contract.pasal2Content || null,
    pasal_3_content: contract.pasal3Content || null,
    pasal_4_content: contract.pasal4Content || null,
    pasal_5_content: contract.pasal5Content || null,
    closing_text: contract.closingText || null,
    vendor_signature: contract.vendorSignature || null,
    client_signature: contract.clientSignature || null,
    include_meterai: contract.includeMeterai ?? false,
    meterai_placement: contract.meteraiPlacement || 'client',
  };

  const data = await apiFetch<any>('/contracts', {
    method: 'POST',
    body: JSON.stringify(insertRow)
  });
  return normalizeContract(data);
}

export async function updateContract(id: number, patch: Partial<Contract>): Promise<Contract> {
  const updateRow: any = {};
  if (patch.contractNumber !== undefined) updateRow.contract_number = patch.contractNumber;
  if (patch.clientId !== undefined) updateRow.client_id = toNumber(patch.clientId);
  if (patch.projectId !== undefined) updateRow.project_id = toNumber(patch.projectId);
  if (patch.signingDate !== undefined) updateRow.signing_date = patch.signingDate;
  if (patch.signingLocation !== undefined) updateRow.signing_location = patch.signingLocation || null;
  if (patch.serviceTitle !== undefined) updateRow.service_title = patch.serviceTitle || null;
  if (patch.clientName1 !== undefined) updateRow.client_name_1 = patch.clientName1 || '';
  if (patch.clientAddress1 !== undefined) updateRow.client_address_1 = patch.clientAddress1 || null;
  if (patch.clientPhone1 !== undefined) updateRow.client_phone_1 = patch.clientPhone1 || null;
  if (patch.clientName2 !== undefined) updateRow.client_name_2 = patch.clientName2 || null;
  if (patch.clientAddress2 !== undefined) updateRow.client_address_2 = patch.clientAddress2 || null;
  if (patch.clientPhone2 !== undefined) updateRow.client_phone_2 = patch.clientPhone2 || null;
  if (patch.shootingDuration !== undefined) updateRow.shooting_duration = patch.shootingDuration || null;
  if (patch.guaranteedPhotos !== undefined) updateRow.guaranteed_photos = patch.guaranteedPhotos || null;
  if (patch.albumDetails !== undefined) updateRow.album_details = patch.albumDetails || null;
  if (patch.digitalFilesFormat !== undefined) updateRow.digital_files_format = patch.digitalFilesFormat || 'JPG High-Resolution';
  if (patch.otherItems !== undefined) updateRow.other_items = patch.otherItems || null;
  if (patch.personnelCount !== undefined) updateRow.personnel_count = patch.personnelCount || null;
  if (patch.deliveryTimeframe !== undefined) updateRow.delivery_timeframe = patch.deliveryTimeframe || null;
  if (patch.dpDate !== undefined) updateRow.dp_date = patch.dpDate || null;
  if (patch.finalPaymentDate !== undefined) updateRow.final_payment_date = patch.finalPaymentDate || null;
  if (patch.cancellationPolicy !== undefined) updateRow.cancellation_policy = patch.cancellationPolicy || null;
  if (patch.jurisdiction !== undefined) updateRow.jurisdiction = patch.jurisdiction || null;
  if (patch.pasal1Content !== undefined) updateRow.pasal_1_content = patch.pasal1Content || null;
  if (patch.pasal2Content !== undefined) updateRow.pasal_2_content = patch.pasal2Content || null;
  if (patch.pasal3Content !== undefined) updateRow.pasal_3_content = patch.pasal3Content || null;
  if (patch.pasal4Content !== undefined) updateRow.pasal_4_content = patch.pasal4Content || null;
  if (patch.pasal5Content !== undefined) updateRow.pasal_5_content = patch.pasal5Content || null;
  if (patch.closingText !== undefined) updateRow.closing_text = patch.closingText || null;
  if (patch.vendorSignature !== undefined) updateRow.vendor_signature = patch.vendorSignature || null;
  if (patch.clientSignature !== undefined) updateRow.client_signature = patch.clientSignature || null;
  if (patch.includeMeterai !== undefined) updateRow.include_meterai = patch.includeMeterai;
  if (patch.meteraiPlacement !== undefined) updateRow.meterai_placement = patch.meteraiPlacement;

  const data = await apiFetch<any>(`/contracts/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(updateRow)
  });
  return normalizeContract(data);
}

export async function deleteContract(id: number): Promise<void> {
  await apiFetch(`/contracts/${id}`, { method: 'DELETE' });
}

export async function getContract(id: number): Promise<Contract | null> {
  try {
    const data = await apiFetch<any>(`/contracts/${id}`);
    return normalizeContract(data);
  } catch (error: any) {
    if (error.message.includes('404')) return null;
    throw error;
  }
}

export async function getContractByProject(projectId: number): Promise<Contract | null> {
  try {
    const data = await apiFetch<any>(`/contracts/project/${projectId}`);
    return normalizeContract(data);
  } catch (error: any) {
    if (error.message.includes('404')) return null;
    throw error;
  }
}

export async function listContractsPaginated(
  page: number,
  limit: number,
  search: string = ''
): Promise<{ contracts: Contract[]; total: number }> {
  const query = new URLSearchParams({ page: String(page), limit: String(limit) });
  if (search) query.append('search', search);

  const data = await apiFetch<any>(`/contracts/paginated?${query.toString()}`);
  return { ...data, contracts: data.contracts.map(normalizeContract) };
}

export async function getContractsSummary(): Promise<{
  waitingForClient: number;
  waitingForVendor: number;
  totalValue: number;
}> {
  return await apiFetch<any>('/contracts/summary');
}
