import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  listLeads,
  listLeadsPaginated,
  getLeadStats,
  createLead,
  updateLead,
  deleteLead,
  convertLeadToClient,
} from '@/services/leads';
import { Lead } from '@/types';
import { useApp } from '@/app/AppContext';

export const leadKeys = {
  all: ['leads'] as const,
  lists: () => [...leadKeys.all, 'list'] as const,
  list: (filters: string) => [...leadKeys.lists(), { filters }] as const,
  stats: (filters: string) => [...leadKeys.all, 'stats', { filters }] as const,
};

export function useLeads(options?: { limit?: number; source?: string; status?: string }) {
  const { isAuthenticated, currentUser } = useApp();
  return useQuery({
    queryKey: leadKeys.list(JSON.stringify(options || {})),
    queryFn: () => listLeads(options),
    staleTime: 2 * 60 * 1000,
    enabled: isAuthenticated && !!currentUser,
  });
}

export function useLeadsPaginated(
  page: number,
  limit: number,
  searchQuery?: string,
  filters?: { source?: string; status?: string; city?: string; dateFrom?: string; dateTo?: string }
) {
  return useQuery({
    queryKey: [...leadKeys.lists(), { page, limit, searchQuery, filters }],
    queryFn: () => listLeadsPaginated(page, limit, searchQuery, filters),
    staleTime: 2 * 60 * 1000,
  });
}

export function useLeadStats(filters?: { dateFrom?: string; dateTo?: string }) {
  const { isAuthenticated, currentUser } = useApp();
  return useQuery({
    queryKey: leadKeys.stats(JSON.stringify(filters || {})),
    queryFn: () => getLeadStats(filters),
    staleTime: 2 * 60 * 1000,
    enabled: isAuthenticated && !!currentUser,
  });
}

export function useCreateLead() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: Omit<Lead, 'id' | 'createdAt' | 'updatedAt' | 'clientId'>) => createLead(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: leadKeys.all });
    },
  });
}

export function useUpdateLead() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...data }: { id: number } & Partial<Lead>) => updateLead(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: leadKeys.all });
    },
  });
}

export function useConvertLead() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => convertLeadToClient(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: leadKeys.all });
      queryClient.invalidateQueries({ queryKey: ['clients'] });
    },
  });
}

export function useDeleteLead() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => deleteLead(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: leadKeys.all });
    },
  });
}
