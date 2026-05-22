import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  listClients,
  listClientsPaginated,
  createClient,
  updateClient,
  deleteClient,
  getClient,
} from '@/services/clients';
import { Client } from '@/types';

export const clientKeys = {
  all: ['clients'] as const,
  lists: () => [...clientKeys.all, 'list'] as const,
  list: (filters: string) => [...clientKeys.lists(), { filters }] as const,
  details: () => [...clientKeys.all, 'detail'] as const,
  detail: (id: number) => [...clientKeys.details(), id] as const,
};

export function useClients(options?: { limit?: number; offset?: number }) {
  return useQuery({
    queryKey: clientKeys.list(JSON.stringify(options || {})),
    queryFn: () => listClients(options),
    // Cache is kept fresh for 5 mins
    staleTime: 5 * 60 * 1000,
  });
}

export function useClientsPaginated(
  page: number, 
  limit: number, 
  searchQuery?: string, 
  filters?: { status?: string; clientType?: string }
) {
  return useQuery({
    queryKey: [...clientKeys.lists(), { page, limit, searchQuery, filters }],
    queryFn: () => listClientsPaginated(page, limit, searchQuery, filters),
    staleTime: 5 * 60 * 1000,
  });
}

export function useClient(id: number | undefined) {
  return useQuery({
    queryKey: clientKeys.detail(id),
    queryFn: () => getClient(id),
    enabled: !!id,
    staleTime: 5 * 60 * 1000,
  });
}

export function useCreateClient() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (newClient: Omit<Client, 'id'>) => createClient(newClient),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: clientKeys.lists() });
    },
  });
}

export function useUpdateClient() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, ...data }: { id: number } & Partial<Client>) => updateClient(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: clientKeys.lists() });
      queryClient.invalidateQueries({ queryKey: clientKeys.detail(variables.id) });
    },
  });
}

export function useDeleteClient() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => deleteClient(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: clientKeys.lists() });
    },
  });
}
