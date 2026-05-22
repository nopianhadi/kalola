import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
    listContracts, 
    listContractsPaginated, 
    getContract, 
    createContract, 
    updateContract, 
    deleteContract,
    getContractsSummary
} from '@/services/contracts';
import { Contract } from '@/types';

export const contractKeys = {
  all: ['contracts'] as const,
  lists: () => [...contractKeys.all, 'list'] as const,
  list: (filters: any) => [...contractKeys.lists(), { filters }] as const,
  paginated: (page: number, limit: number, search: string) => [...contractKeys.all, 'paginated', { page, limit, search }] as const,
  details: () => [...contractKeys.all, 'detail'] as const,
  detail: (id: number | string) => [...contractKeys.details(), id] as const,
  summary: () => [...contractKeys.all, 'summary'] as const,
};

export function useContractsSummary() {
  return useQuery({
    queryKey: contractKeys.summary(),
    queryFn: getContractsSummary,
    staleTime: 5 * 60 * 1000,
  });
}

export function useContracts() {
  return useQuery({
    queryKey: contractKeys.lists(),
    queryFn: listContracts,
    staleTime: 5 * 60 * 1000,
  });
}

export function useContractsPaginated(page: number, limit: number, search: string = '') {
  return useQuery({
    queryKey: contractKeys.paginated(page, limit, search),
    queryFn: () => listContractsPaginated(page, limit, search),
    staleTime: 5 * 60 * 1000,
  });
}

export function useContract(id: number | string) {
  return useQuery({
    queryKey: contractKeys.detail(id),
    queryFn: () => getContract(Number(id)),
    enabled: !!id,
  });
}

export function useCreateContract() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (newContract: Omit<Contract, 'id' | 'createdAt'>) => createContract(newContract),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: contractKeys.all });
    },
  });
}

export function useUpdateContract() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, patch }: { id: number | string; patch: Partial<Contract> }) => updateContract(Number(id), patch),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: contractKeys.all });
      queryClient.invalidateQueries({ queryKey: contractKeys.detail(variables.id) });
    },
  });
}

export function useDeleteContract() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number | string) => deleteContract(Number(id)),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: contractKeys.all });
    },
  });
}
