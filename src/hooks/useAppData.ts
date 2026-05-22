import { useState, useCallback, useRef } from 'react';
import type { Client, Project, TeamMember, Transaction, ClientFeedback } from '@/types';
import { apiFetch } from '@/lib/apiClient';

/** Default limit for list fetches in useAppData (dashboard/lazy load). Use listXPaginated in pages for full pagination. */
const DEFAULT_LIST_LIMIT = 100;

interface AppDataState {
  clients: Client[];
  projects: Project[];
  teamMembers: TeamMember[];
  transactions: Transaction[];
  clientFeedback: ClientFeedback[];
  contracts: any[];
  users: any[];
  totals: {
    projects: number;
    activeProjects: number;
    clients: number;
    activeClients: number;
    teamMembers: number;
    transactions: number;
    revenue: number;
    expense: number;
  };
  loading: {
    clients: boolean;
    projects: boolean;
    teamMembers: boolean;
    transactions: boolean;
    clientFeedback: boolean;
    contracts: boolean;
    users: boolean;
    totals: boolean;
  };
  loaded: {
    clients: boolean;
    projects: boolean;
    teamMembers: boolean;
    transactions: boolean;
    clientFeedback: boolean;
    contracts: boolean;
    users: boolean;
    totals: boolean;
  };
}

export function useAppData() {
  // Use refs to track loading/loaded status for stability of callbacks
  const loadingRef = useRef<Record<string, boolean>>({});
  const loadedRef = useRef<Record<string, boolean>>({});

  const [state, setState] = useState<AppDataState>({
    clients: [],
    projects: [],
    teamMembers: [],
    transactions: [],
    clientFeedback: [],
    contracts: [],
    users: [],
    totals: {
      projects: 0,
      activeProjects: 0,
      clients: 0,
      activeClients: 0,
      teamMembers: 0,
      transactions: 0,
      revenue: 0,
      expense: 0,
    },
    loading: {
      clients: false,
      projects: false,
      teamMembers: false,
      transactions: false,
      clientFeedback: false,
      contracts: false,
      users: false,
      totals: false,
    },
    loaded: {
      clients: false,
      projects: false,
      teamMembers: false,
      transactions: false,
      clientFeedback: false,
      contracts: false,
      users: false,
      totals: false,
    }
  });

  // Load clients lazily
  const loadClients = useCallback(async () => {
    if (loadingRef.current.clients || loadedRef.current.clients) return;

    loadingRef.current.clients = true;
    setState(prev => ({
      ...prev,
      loading: { ...prev.loading, clients: true }
    }));

    try {
      const { listClients } = await import('@/services/clients');
      const clients = await listClients({ limit: DEFAULT_LIST_LIMIT });

      loadedRef.current.clients = true;
      setState(prev => ({
        ...prev,
        clients,
        loading: { ...prev.loading, clients: false },
        loaded: { ...prev.loaded, clients: true }
      }));
    } catch (error) {
      console.warn('[API] Failed to fetch clients:', error);
      loadingRef.current.clients = false;
      setState(prev => ({
        ...prev,
        loading: { ...prev.loading, clients: false }
      }));
    }
  }, []);

  // Load projects lazily
  const loadProjects = useCallback(async () => {
    if (loadingRef.current.projects || loadedRef.current.projects) return;

    loadingRef.current.projects = true;
    setState(prev => ({
      ...prev,
      loading: { ...prev.loading, projects: true }
    }));

    try {
      const { listProjects } = await import('@/services/projects');
      const projects = await listProjects({ limit: DEFAULT_LIST_LIMIT });

      loadedRef.current.projects = true;
      setState(prev => ({
        ...prev,
        projects,
        loading: { ...prev.loading, projects: false },
        loaded: { ...prev.loaded, projects: true }
      }));
    } catch (error) {
      console.warn('[API] Failed to fetch projects:', error);
      loadingRef.current.projects = false;
      setState(prev => ({
        ...prev,
        loading: { ...prev.loading, projects: false }
      }));
    }
  }, []);

  // Load team members lazily
  const loadTeamMembers = useCallback(async () => {
    if (loadingRef.current.teamMembers || loadedRef.current.teamMembers) return;

    loadingRef.current.teamMembers = true;
    setState(prev => ({
      ...prev,
      loading: { ...prev.loading, teamMembers: true }
    }));

    try {
      const { listTeamMembers } = await import('@/services/teamMembers');
      const teamMembers = await listTeamMembers({ limit: DEFAULT_LIST_LIMIT });

      loadedRef.current.teamMembers = true;
      setState(prev => ({
        ...prev,
        teamMembers,
        loading: { ...prev.loading, teamMembers: false },
        loaded: { ...prev.loaded, teamMembers: true }
      }));
    } catch (error) {
      console.warn('[API] Failed to fetch team members:', error);
      loadingRef.current.teamMembers = false;
      setState(prev => ({
        ...prev,
        loading: { ...prev.loading, teamMembers: false }
      }));
    }
  }, []);

  // Load transactions lazily
  const loadTransactions = useCallback(async () => {
    if (loadingRef.current.transactions || loadedRef.current.transactions) return;

    loadingRef.current.transactions = true;
    setState(prev => ({
      ...prev,
      loading: { ...prev.loading, transactions: true }
    }));

    try {
      const { listTransactions } = await import('@/services/transactions');
      const transactions = await listTransactions({ limit: DEFAULT_LIST_LIMIT });

      loadedRef.current.transactions = true;
      setState(prev => ({
        ...prev,
        transactions,
        loading: { ...prev.loading, transactions: false },
        loaded: { ...prev.loaded, transactions: true }
      }));
    } catch (error) {
      console.warn('[API] Failed to fetch transactions:', error);
      loadingRef.current.transactions = false;
      setState(prev => ({
        ...prev,
        loading: { ...prev.loading, transactions: false }
      }));
    }
  }, []);

  // Load client feedback lazily
  const loadClientFeedback = useCallback(async () => {
    if (loadingRef.current.clientFeedback || loadedRef.current.clientFeedback) return;

    loadingRef.current.clientFeedback = true;
    setState(prev => ({
      ...prev,
      loading: { ...prev.loading, clientFeedback: true }
    }));

    try {
      const { listClientFeedback } = await import('@/services/clientFeedback');
      const clientFeedback = await listClientFeedback();

      loadedRef.current.clientFeedback = true;
      setState(prev => ({
        ...prev,
        clientFeedback,
        loading: { ...prev.loading, clientFeedback: false },
        loaded: { ...prev.loaded, clientFeedback: true }
      }));
    } catch (error) {
      console.warn('[API] Failed to fetch client feedback:', error);
      loadingRef.current.clientFeedback = false;
      setState(prev => ({
        ...prev,
        loading: { ...prev.loading, clientFeedback: false }
      }));
    }
  }, []);
  
  // Load contracts lazily
  const loadContracts = useCallback(async () => {
    if (loadingRef.current.contracts || loadedRef.current.contracts) return;

    loadingRef.current.contracts = true;
    setState(prev => ({
      ...prev,
      loading: { ...prev.loading, contracts: true }
    }));

    try {
      const { listContracts } = await import('@/services/contracts');
      const contracts = await listContracts();

      loadedRef.current.contracts = true;
      setState(prev => ({
        ...prev,
        contracts,
        loading: { ...prev.loading, contracts: false },
        loaded: { ...prev.loaded, contracts: true }
      }));
    } catch (error) {
      console.warn('[API] Failed to fetch contracts:', error);
      loadingRef.current.contracts = false;
      setState(prev => ({
        ...prev,
        loading: { ...prev.loading, contracts: false }
      }));
    }
  }, []);

  // Load users lazily
  const loadUsers = useCallback(async () => {
    if (loadingRef.current.users || loadedRef.current.users) return;

    loadingRef.current.users = true;
    setState(prev => ({
      ...prev,
      loading: { ...prev.loading, users: true }
    }));

    try {
      const { listUsers } = await import('@/services/users');
      const users = await listUsers();

      loadedRef.current.users = true;
      setState(prev => ({
        ...prev,
        users,
        loading: { ...prev.loading, users: false },
        loaded: { ...prev.loaded, users: true }
      }));
    } catch (error) {
      console.warn('[API] Failed to fetch users:', error);
      loadingRef.current.users = false;
      setState(prev => ({
        ...prev,
        loading: { ...prev.loading, users: false }
      }));
    }
  }, []);

  const loadTotals = useCallback(async () => {
    if (loadingRef.current.totals || loadedRef.current.totals) return;

    loadingRef.current.totals = true;
    setState(prev => ({
      ...prev,
      loading: { ...prev.loading, totals: true }
    }));

    try {
      const [
        projectSummary,
        transactionSummary,
        teamMembers,
        clients
      ] = await Promise.all([
        apiFetch<any>('/projects/summary'),
        apiFetch<any>('/transactions/summary'),
        apiFetch<any[]>('/team-members?limit=1000'),
        apiFetch<any[]>('/clients?limit=1000')
      ]);

      const activeProjectsCount = projectSummary.totalCount || 0; // Backend filter would be better
      const activeClientsCount = clients.filter((c: any) => c.status === 'Aktif').length;

      loadedRef.current.totals = true;
      setState(prev => ({
        ...prev,
        totals: {
          projects: projectSummary.totalCount || 0,
          activeProjects: activeProjectsCount,
          clients: clients.length,
          activeClients: activeClientsCount,
          teamMembers: teamMembers.length,
          transactions: 0, // Transaction count can be added to backend if needed
          revenue: transactionSummary.totalIncomeThisMonth || 0,
          expense: transactionSummary.totalExpenseThisMonth || 0,
        },
        loading: { ...prev.loading, totals: false },
        loaded: { ...prev.loaded, totals: true }
      }));
    } catch (err) {
      console.warn('[API] Failed to fetch global totals:', err);
      loadingRef.current.totals = false;
      setState(prev => ({
        ...prev,
        loading: { ...prev.loading, totals: false }
      }));
    }
  }, []);

  return {
    ...state,
    loadClients,
    loadProjects,
    loadTeamMembers,
    loadTransactions,
    loadClientFeedback,
    loadContracts,
    loadUsers,
    loadTotals
  };
}

export default useAppData;
