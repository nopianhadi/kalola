import { useMemo } from 'react';
import { Project, Client, TeamMember } from '@/features/projects/types/project.types';
import { useProjectsSummary } from '@/features/projects/api/useProjects';

interface UseProjectsDataProps {
    projects: Project[];
    clients: Client[];
    teamMembers: TeamMember[];
}

export const useProjectsData = ({
    projects,
    clients,
    teamMembers
}: UseProjectsDataProps) => {
    const { data: summary } = useProjectsSummary();

    const totals = useMemo(() => {
        const activeProjectsCount = projects.filter(p => p.status !== 'Selesai' && p.status !== 'Dibatalkan').length;
        const activeClientsCount = clients.filter(c => c.status === 'Aktif').length;
        
        return {
            projects: summary?.totalCount || projects.length,
            activeProjects: activeProjectsCount,
            clients: clients.length,
            activeClients: activeClientsCount,
            leads: 0,
            discussionLeads: 0,
            followUpLeads: 0,
            teamMembers: teamMembers.length,
            transactions: 0,
            revenue: summary?.totalRevenue || projects.reduce((sum, p) => sum + (p.totalCost || 0), 0),
            expense: 0
        };
    }, [projects, clients, teamMembers, summary]);

    return {
        totals
    };
};
