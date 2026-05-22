import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  listProjectsWithRelations, 
  listProjectsWithRelationsPaginated,
  createProjectWithRelations, 
  updateProject, 
  deleteProject,
  getProjectWithRelations,
  getProjectsSummary,
  CreateProjectInput,
  UpdateProjectInput
} from '@/services/projects';

export const projectKeys = {
  all: ['projects'] as const,
  lists: () => [...projectKeys.all, 'list'] as const,
  list: (filters: string) => [...projectKeys.lists(), { filters }] as const,
  details: () => [...projectKeys.all, 'detail'] as const,
  detail: (id: number) => [...projectKeys.details(), id] as const,
};

export function useProjects(options?: { limit?: number; offset?: number }) {
  return useQuery({
    queryKey: projectKeys.list(JSON.stringify(options || {})),
    queryFn: () => listProjectsWithRelations(options),
    // Projects cache is kept fresh for 5 mins
    staleTime: 5 * 60 * 1000,
  });
}

export function useProjectsPaginated(
  page: number, 
  limit: number, 
  searchQuery?: string, 
  filters?: { status?: string; clientId?: number; projectType?: string; dateFrom?: string; dateTo?: string }
) {
  return useQuery({
    queryKey: [...projectKeys.lists(), { page, limit, searchQuery, filters }],
    queryFn: () => listProjectsWithRelationsPaginated(page, limit, searchQuery, filters),
    staleTime: 5 * 60 * 1000,
  });
}

export function useCreateProject() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (newProject: CreateProjectInput & any) => createProjectWithRelations(newProject),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: projectKeys.lists() });
    },
  });
}

export function useUpdateProject() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, ...data }: { id: number } & UpdateProjectInput) => updateProject(id, data),
    onSuccess: (_, variables) => {
      // Invalidate the lists
      queryClient.invalidateQueries({ queryKey: projectKeys.lists() });
      // Invalidate specific project details if cached
      queryClient.invalidateQueries({ queryKey: projectKeys.detail(variables.id) });
    },
  });
}

export function useDeleteProject() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => deleteProject(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: projectKeys.lists() });
    },
  });
}

export function useProject(id: number | undefined) {
  return useQuery({
    queryKey: projectKeys.detail(id),
    queryFn: () => getProjectWithRelations(id),
    enabled: !!id,
    staleTime: 5 * 60 * 1000,
  });
}

export function useProjectsSummary() {
  return useQuery({
    queryKey: [...projectKeys.all, 'summary'],
    queryFn: () => getProjectsSummary(),
    staleTime: 5 * 60 * 1000,
  });
}
