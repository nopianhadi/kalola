import { apiFetch } from '@/lib/apiClient';
import { Transaction, TransactionType } from '@/types';

/** Supabase transactions table row (snake_case). */
interface TransactionRow {
  id: number;
  date: string;
  description: string;
  amount: number;
  type: TransactionType;
  project_id: number | null;
  category: string;
  method: string;
  pocket_id: number | null;
  card_id: number | null;
  printing_item_id: number | null;
  vendor_signature: string | null;
}

export async function createTransaction(row: Omit<Transaction, 'id' | 'vendorSignature'> & { clientId?: number }): Promise<Transaction> {
  // Send camelCase keys that backend mapToDb reads
  const transactionData = {
    date: row.date,
    description: row.description,
    amount: row.amount,
    type: row.type,
    projectId: row.projectId ?? null,
    category: row.category,
    method: row.method,
    pocketId: row.pocketId ?? null,
    cardId: row.cardId ?? null,
    clientId: (row as any).clientId ?? null,
    printingItemId: row.printingItemId ?? null,
  };

  const data = await apiFetch<any>('/transactions', {
    method: 'POST',
    body: JSON.stringify(transactionData)
  });
  return normalizeTransaction(data);
}

export async function createTransactions(items: Omit<Transaction, 'id' | 'vendorSignature'>[]): Promise<Transaction[]> {
  const rows = items.map(item => denormalizeTransaction(item as Partial<Transaction>));
  const data = await apiFetch<any[]>('/transactions/batch', {
    method: 'POST',
    body: JSON.stringify(rows)
  });
  return data.map(normalizeTransaction);
}

export async function listTransactions(options: { limit?: number; offset?: number; projectId?: number; clientId?: number } = {}): Promise<Transaction[]> {
  const query = new URLSearchParams();
  if (options.limit) query.append('limit', String(options.limit));
  if (options.offset) query.append('offset', String(options.offset));
  if (options.projectId) query.append('projectId', String(options.projectId));
  if (options.clientId) query.append('clientId', String(options.clientId));
  
  const data = await apiFetch<any[]>(`/transactions?${query.toString()}`);
  return data.map(normalizeTransaction);
}

export async function listTransactionsPaginated(
  page: number = 1,
  limit: number = 10,
  searchQuery?: string,
  filters?: {
    type?: string;
    category?: string;
    dateFrom?: string;
    dateTo?: string;
    projectId?: number;
  }
): Promise<{ transactions: Transaction[]; total: number }> {
  const query = new URLSearchParams({ page: String(page), limit: String(limit) });
  if (searchQuery) query.append('search', searchQuery);
  if (filters?.type) query.append('type', filters.type);
  if (filters?.category) query.append('category', filters.category);
  if (filters?.dateFrom) query.append('dateFrom', filters.dateFrom);
  if (filters?.dateTo) query.append('dateTo', filters.dateTo);
  if (filters?.projectId) query.append('projectId', String(filters.projectId));

  const data = await apiFetch<any>(`/transactions/paginated?${query.toString()}`);
  return { ...data, transactions: data.transactions.map(normalizeTransaction) };
}

export async function getTransaction(id: number): Promise<Transaction | null> {
  try {
    const data = await apiFetch<any>(`/transactions/${id}`);
    return normalizeTransaction(data);
  } catch (error: any) {
    if (error.message.includes('404')) return null;
    throw error;
  }
}

export async function updateCardBalance(cardId: number, delta: number): Promise<void> {
  await apiFetch('/transactions/update-balance', {
    method: 'POST',
    body: JSON.stringify({ cardId, delta })
  });
}

export async function updatePocketBalance(pocketId: number, delta: number): Promise<void> {
  await apiFetch('/transactions/update-balance', {
    method: 'POST',
    body: JSON.stringify({ pocketId, delta })
  });
}

export function normalizeTransaction(row: any): Transaction {
  return {
    id: Number(row.id),
    date: String(row.date),
    description: String(row.description),
    amount: Number(row.amount),
    type: String(row.type) as TransactionType,
    projectId: (row.projectId || row.project_id) ? Number(row.projectId || row.project_id) : undefined,
    category: String(row.category),
    method: String(row.method) as Transaction['method'],
    pocketId: (row.pocketId || row.pocket_id) ? Number(row.pocketId || row.pocket_id) : undefined,
    cardId: (row.cardId || row.card_id) ? Number(row.cardId || row.card_id) : undefined,
    printingItemId: (row.printingItemId || row.printing_item_id) ? Number(row.printingItemId || row.printing_item_id) : undefined,
    vendorSignature: (row.vendorSignature || row.vendor_signature) ? String(row.vendorSignature || row.vendor_signature) : undefined,
  };
}

function denormalizeTransaction(patch: Partial<Transaction>): Partial<TransactionRow> {
  const result: any = {
    ...(patch.date !== undefined ? { date: patch.date } : {}),
    ...(patch.description !== undefined ? { description: patch.description } : {}),
    ...(patch.amount !== undefined ? { amount: patch.amount } : {}),
    ...(patch.type !== undefined ? { type: patch.type } : {}),
    ...(patch.projectId !== undefined ? { project_id: patch.projectId ?? null } : {}),
    ...(patch.category !== undefined ? { category: patch.category } : {}),
    ...(patch.method !== undefined ? { method: patch.method } : {}),
    ...(patch.pocketId !== undefined ? { pocket_id: patch.pocketId ?? null } : {}),
    ...(patch.cardId !== undefined ? { card_id: patch.cardId ?? null } : {}),
    ...(patch.printingItemId !== undefined ? { printing_item_id: patch.printingItemId ?? null } : {}),
    ...(patch.vendorSignature !== undefined ? { vendor_signature: patch.vendorSignature } : {}),
  };
  return result;
}

export async function updateTransaction(id: number, patch: Partial<Transaction>): Promise<Transaction> {
  const payload = denormalizeTransaction(patch);
  delete payload.id;
  const data = await apiFetch<any>(`/transactions/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(payload)
  });
  return normalizeTransaction(data);
}

export async function deleteTransaction(id: number): Promise<void> {
  await apiFetch(`/transactions/${id}`, { method: 'DELETE' });
}

export async function transferFunds(params: {
  fromCardId?: number;
  fromPocketId?: number;
  toCardId?: number;
  toPocketId?: number;
  amount: number;
  isCashTopup?: boolean;
}): Promise<{ transaction: Transaction }> {
  const { fromCardId, fromPocketId, amount, isCashTopup } = params;

  // This is a simplified implementation. 
  // In a real app, this should be a database transaction or a specialized RPC.
  // For now, we'll create the transaction record and the realtime sync will handle the rest.
  
  const description = isCashTopup ? 'Top-up Tunai' : 'Transfer Internal';
  const category = isCashTopup ? 'Top-up' : 'Transfer Internal';

  const transaction = await createTransaction({
    date: new Date().toISOString().split('T')[0],
    description,
    amount,
    type: TransactionType.EXPENSE, // Treat as expense from source
    category,
    method: 'Sistem',
    cardId: fromCardId,
    pocketId: fromPocketId,
  });

  return { transaction };
}

export async function getFinanceSummary(): Promise<{ 
  totalAssets: number; 
  pocketsTotal: number; 
  totalIncomeThisMonth: number; 
  totalExpenseThisMonth: number; 
}> {
  return await apiFetch<any>('/transactions/summary');
}
