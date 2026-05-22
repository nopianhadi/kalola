import { useQuery } from '@tanstack/react-query';
import { listTeamMembers, listTeamMembersPaginated } from '@/services/teamMembers';
import { listAllTeamPayments } from '@/services/teamProjectPayments';
import { listTeamPaymentRecords } from '@/services/teamPaymentRecords';
import { TeamMember, TeamProjectPayment, TeamPaymentRecord } from '@/types';

// ==============================
// Team Members Hooks
// ==============================
interface UseTeamMembersOptions {
    limit?: number;
    offset?: number;
    enabled?: boolean;
}

export const useTeamMembers = (options: UseTeamMembersOptions = {}) => {
    return useQuery<TeamMember[], Error>({
        queryKey: ['teamMembers', options],
        queryFn: async () => {
            return await listTeamMembers({
                limit: options.limit || 500,
                offset: options.offset || 0,
            });
        },
        enabled: options.enabled !== false,
        staleTime: 5 * 60 * 1000, 
    });
};

export const useTeamMembersPaginated = (
    page: number = 1, 
    limit: number = 20, 
    searchQuery?: string,
    category?: string,
    options: UseTeamMembersOptions = {}
) => {
    return useQuery({
        queryKey: ['teamMembers', 'paginated', { page, limit, searchQuery, category, ...options }],
        queryFn: () => listTeamMembersPaginated(page, limit, searchQuery, category),
        staleTime: 5 * 60 * 1000,
        enabled: options.enabled !== false,
    });
};

// ==============================
// Team Project Payments Hooks
// ==============================
export const useTeamProjectPayments = () => {
    return useQuery<TeamProjectPayment[], Error>({
        queryKey: ['teamProjectPayments'],
        queryFn: async () => {
            return await listAllTeamPayments();
        },
        staleTime: 5 * 60 * 1000,
    });
};

// ==============================
// Team Payment Records Hooks
// ==============================
export const useTeamPaymentRecords = () => {
    return useQuery<TeamPaymentRecord[], Error>({
        queryKey: ['teamPaymentRecords'],
        queryFn: async () => {
            return await listTeamPaymentRecords();
        },
        staleTime: 5 * 60 * 1000,
    });
};
