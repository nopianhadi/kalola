import { useMemo } from 'react';

import { useTransactionsPaginated, useCards, usePockets, useFinanceSummary } from '@/features/finance/api/useFinanceQueries';

interface UseFinanceDataProps {
    page?: number;
    limit?: number;
    search?: string;
    filters?: {
        type?: string;
        category?: string;
        dateFrom?: string;
        dateTo?: string;
    };
}

export const useFinanceData = ({
    page = 1,
    limit = 10,
    search = '',
    filters = {}
}: UseFinanceDataProps = {}) => {
    // 1. Fetch data from React Query
    const { data: paginatedData, isLoading: isTxLoading } = useTransactionsPaginated(page, limit, search, filters);
    const { data: queryCards } = useCards();
    const { data: queryPockets } = usePockets();
    const { data: financeSummary } = useFinanceSummary();

    const transactions = paginatedData?.transactions || [];
    const totalTransactions = paginatedData?.total || 0;
    const cards = queryCards || [];
    const pockets = queryPockets || [];

    const summary = useMemo(() => {
        return {
            totalAssets: financeSummary?.totalAssets || 0,
            pocketsTotal: financeSummary?.pocketsTotal || 0,
            totalIncomeThisMonth: financeSummary?.totalIncomeThisMonth || 0,
            totalExpenseThisMonth: financeSummary?.totalExpenseThisMonth || 0
        };
    }, [financeSummary]);

    return {
        transactions,
        totalTransactions,
        pockets,
        cards,
        isLoading: isTxLoading,
        summary
    };
};
