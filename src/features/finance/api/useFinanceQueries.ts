import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { listTransactions, listTransactionsPaginated, getFinanceSummary, createTransaction } from '@/services/transactions';
import { listCards, createCard, updateCard, safeDeleteCard } from '@/services/cards';
import { listPockets, createPocket, updatePocket, deletePocket } from '@/services/pockets';
import { Transaction, FinancialPocket, Card } from '@/types';

export const financeKeys = {
  all: ['finance'] as const,
  transactions: {
    all: () => [...financeKeys.all, 'transactions'] as const,
    list: (filters: string) => [...financeKeys.transactions.all(), { filters }] as const,
    paginated: (page: number, limit: number, search: string, filters: any) => [...financeKeys.transactions.all(), 'paginated', { page, limit, search, ...filters }] as const,
    detail: (id: number) => [...financeKeys.transactions.all(), id] as const,
  },
  cards: {
    all: () => [...financeKeys.all, 'cards'] as const,
    list: () => [...financeKeys.cards.all(), 'list'] as const,
  },
  pockets: {
    all: () => [...financeKeys.all, 'pockets'] as const,
    list: () => [...financeKeys.pockets.all(), 'list'] as const,
  }
};

// =====================
// TRANSACTIONS
// =====================
export function useTransactions(options?: { limit?: number; offset?: number; projectId?: number; clientId?: number }) {
  return useQuery({
    queryKey: financeKeys.transactions.list(JSON.stringify(options || {})),
    queryFn: () => listTransactions(options),
    staleTime: 5 * 60 * 1000,
  });
}

export function useTransactionsPaginated(
  page: number,
  limit: number,
  search: string = '',
  filters: { type?: string; category?: string; dateFrom?: string; dateTo?: string } = {}
) {
  return useQuery({
    queryKey: financeKeys.transactions.paginated(page, limit, search, filters),
    queryFn: () => listTransactionsPaginated(page, limit, search, filters),
    staleTime: 5 * 60 * 1000,
  });
}

export function useCreateTransaction() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (newTx: Omit<Transaction, 'id' | 'vendorSignature'>) => createTransaction(newTx),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: financeKeys.transactions.all() });
      queryClient.invalidateQueries({ queryKey: financeKeys.cards.all() });
      queryClient.invalidateQueries({ queryKey: financeKeys.pockets.all() });
    },
  });
}

// =====================
// CARDS
// =====================
export function useCards() {
  return useQuery({
    queryKey: financeKeys.cards.list(),
    queryFn: async () => {
      const rows = await listCards();
      return rows.map((row: any) => ({
        id: Number(row.id),
        cardHolderName: row.cardHolderName || row.card_holder_name,
        bankName: row.bankName || row.bank_name,
        cardType: row.cardType || row.card_type,
        lastFourDigits: (row.lastFourDigits || row.last_four_digits) ?? "",
        expiryDate: (row.expiryDate || row.expiry_date) ?? undefined,
        balance: Number(row.balance || 0),
        colorGradient: (row.colorGradient || row.color_gradient) || "from-slate-200 to-slate-400",
      })) as Card[];
    },
    staleTime: 10 * 60 * 1000,
  });
}

export function useCreateCard() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (newCard: any) => createCard(newCard),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: financeKeys.cards.all() }),
  });
}

export function useUpdateCard() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...data }: { id: number } & any) => updateCard(id, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: financeKeys.cards.all() }),
  });
}

export function useDeleteCard() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => safeDeleteCard(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: financeKeys.cards.all() });
      queryClient.invalidateQueries({ queryKey: financeKeys.transactions.all() });
    },
  });
}

// =====================
// POCKETS
// =====================
export function usePockets() {
  return useQuery({
    queryKey: financeKeys.pockets.list(),
    queryFn: listPockets,
    staleTime: 10 * 60 * 1000,
  });
}

export function useCreatePocket() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (newPocket: Omit<FinancialPocket, 'id' | 'members'>) => createPocket(newPocket),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: financeKeys.pockets.all() }),
  });
}

export function useUpdatePocket() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...data }: { id: number } & Partial<FinancialPocket>) => updatePocket(id, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: financeKeys.pockets.all() }),
  });
}

export function useDeletePocket() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => deletePocket(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: financeKeys.pockets.all() }),
  });
}

export function useFinanceSummary() {
  return useQuery({
    queryKey: [...financeKeys.all, 'summary'],
    queryFn: () => getFinanceSummary(),
    staleTime: 5 * 60 * 1000,
  });
}
