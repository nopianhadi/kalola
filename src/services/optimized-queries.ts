import { apiFetch } from '@/lib/apiClient';

// Lightweight queries untuk dashboard/overview
export async function getProjectsSummary(limit: number = 10) {
  const data = await apiFetch<any[]>(`/projects?limit=${limit}`);
  return data || [];
}

export async function getClientsSummary(limit: number = 20) {
  const data = await apiFetch<any[]>(`/clients?limit=${limit}`);
  return data || [];
}

export async function getRecentActivity(limit: number = 5) {
  const data = await apiFetch<any[]>(`/projects?limit=${limit}`);
  return data || [];
}

// Dashboard stats tanpa mengambil semua data
export async function getDashboardStats() {
  const [projectSummary] = await Promise.all([
    apiFetch<any>('/projects/summary'),
    apiFetch<any[]>('/clients?limit=1')
  ]);

  // If backend doesn't have client summary, we might need to add it or just return what we have
  return {
    totalProjects: projectSummary?.totalCount || 0,
    totalClients: 0, // Need backend support or different approach
    activeProjects: 0, // Need backend support or different approach
    recentRevenue: projectSummary?.totalAmountPaid || 0
  };
}

// Optimized data loading untuk initial app load
export async function getInitialAppData() {
  const [dashboardStats, recentProjects, recentClients] = await Promise.all([
    getDashboardStats(),
    getProjectsSummary(5),
    getClientsSummary(10)
  ]);

  return {
    stats: dashboardStats,
    recentProjects,
    recentClients
  };
}

// Minimal data untuk dropdown/select options
export async function getClientsForDropdown() {
  const data = await apiFetch<any[]>('/clients?limit=1000');
  return (data || []).map(c => ({ id: c.id, name: c.name }));
}

export async function getTeamMembersForDropdown() {
  const data = await apiFetch<any[]>('/team-members?limit=1000');
  return (data || []).map(t => ({ id: t.id, name: t.name, role: t.role }));
}

export async function getPackagesForDropdown() {
  const data = await apiFetch<any[]>('/packages');
  return (data || []).map(p => ({ id: p.id, name: p.name, price: Number(p.price) }));
}
