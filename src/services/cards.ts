import { apiFetch } from '@/lib/apiClient';
import { Card, CardType } from '@/types';

export function normalizeCard(row: any): Card {
  return {
    id: Number(row.id),
    cardHolderName: row.card_holder_name || row.cardHolderName || '',
    bankName: row.bank_name || row.bankName || '',
    cardType: (row.card_type || row.cardType) as CardType,
    lastFourDigits: row.last_four_digits || row.lastFourDigits || '',
    expiryDate: row.expiry_date || row.expiryDate || undefined,
    balance: Number(row.balance || 0),
    colorGradient: row.color_gradient || row.colorGradient || '',
  };
}

export function denormalizeCard(obj: Partial<Card>): any {
  const result: any = {
    ...(obj.cardHolderName !== undefined ? { card_holder_name: obj.cardHolderName } : {}),
    ...(obj.bankName !== undefined ? { bank_name: obj.bankName } : {}),
    ...(obj.cardType !== undefined ? { card_type: obj.cardType } : {}),
    ...(obj.lastFourDigits !== undefined ? { last_four_digits: obj.lastFourDigits } : {}),
    ...(obj.expiryDate !== undefined ? { expiry_date: obj.expiryDate } : {}),
    ...(obj.balance !== undefined ? { balance: obj.balance } : {}),
    ...(obj.colorGradient !== undefined ? { color_gradient: obj.colorGradient } : {}),
  };
  return result;
}

export async function listCards(): Promise<Card[]> {
  const data = await apiFetch<any[]>('/cards');
  return data.map(normalizeCard);
}

export async function findCardIdByMeta(bankName: string, lastFourDigits: string): Promise<number | null> {
  const data = await apiFetch<any>('/cards/find', {
    method: 'POST',
    body: JSON.stringify({ bankName, lastFourDigits })
  });
  return data.id ? Number(data.id) : null;
}

export async function createCard(input: Partial<Card>): Promise<Card> {
  const payload = denormalizeCard(input);
  const data = await apiFetch<any>('/cards', {
    method: 'POST',
    body: JSON.stringify(payload)
  });
  return normalizeCard(data);
}

export async function updateCard(id: number, patch: Partial<Card>): Promise<Card> {
  const payload = denormalizeCard(patch);
  delete payload.id; // Primary key cannot be updated in Prisma data object
  const data = await apiFetch<any>(`/cards/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(payload)
  });
  return normalizeCard(data);
}

export async function deleteCard(id: number): Promise<void> {
  await apiFetch(`/cards/${id}`, { method: 'DELETE' });
}

export async function safeDeleteCard(id: number): Promise<void> {
  await apiFetch(`/cards/${id}?safe=true`, { method: 'DELETE' });
}
