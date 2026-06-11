import { useState, useMemo } from 'react';
import { Transaction, TransactionType } from '@/types';

export const useFinanceFilterState = () => {
    const [filters, setFilters] = useState({
        searchTerm: '',
        dateFrom: '',
        dateTo: ''
    });

    const [categoryFilter, setCategoryFilter] = useState<{
        type: TransactionType | 'all';
        category: string;
    }>({ type: 'all', category: 'Semua' });

    const [page, setPage] = useState(1);
    const [limit] = useState(10);

    const handleFilterChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFilters(prev => ({ ...prev, [e.target.name]: e.target.value }));
    };

    return {
        filters,
        setFilters,
        categoryFilter,
        setCategoryFilter,
        page,
        setPage,
        limit,
        handleFilterChange
    };
};

interface UseFinanceFilterLogicProps {
    transactions: Transaction[];
    filters: {
        searchTerm: string;
        dateFrom: string;
        dateTo: string;
    };
    categoryFilter: {
        type: TransactionType | 'all';
        category: string;
    };
}

export const useFinanceFilterLogic = ({ 
    transactions, 
    filters, 
    categoryFilter 
}: UseFinanceFilterLogicProps) => {
    const filteredTransactions = useMemo(() => {
        // Since the server already filters most of this, 
        // this client-side filter acts as a safety or for additional 
        // in-memory filtering if needed.
        return transactions.filter(t => {
            const date = new Date(t.date);
            const from = filters.dateFrom ? new Date(filters.dateFrom) : null;
            const to = filters.dateTo ? new Date(filters.dateTo) : null;
            if (from) from.setHours(0, 0, 0, 0);
            if (to) to.setHours(23, 59, 59, 999);

            const searchMatch = (
                t.description.toLowerCase().includes(filters.searchTerm.toLowerCase()) ||
                t.category.toLowerCase().includes(filters.searchTerm.toLowerCase())
            );
            const dateMatch = (!from || date >= from) && (!to || date <= to);

            let categoryMatch = true;
            if (categoryFilter.type !== 'all') {
                if (t.type !== categoryFilter.type) {
                    categoryMatch = false;
                } else if (categoryFilter.category !== 'Semua' && t.category !== categoryFilter.category) {
                    categoryMatch = false;
                }
            }

            return searchMatch && dateMatch && categoryMatch;
        });
    }, [transactions, filters, categoryFilter]);

    const filteredSummary = useMemo(() => {
        const income = filteredTransactions
            .filter(t => t.type === TransactionType.INCOME)
            .reduce((sum, t) => sum + t.amount, 0);
        const expense = filteredTransactions
            .filter(t => t.type === TransactionType.EXPENSE)
            .reduce((sum, t) => sum + t.amount, 0);
        return { income, expense, net: income - expense };
    }, [filteredTransactions]);

    const categoryTotals = useMemo(() => {
        const income: Record<string, number> = {};
        const expense: Record<string, number> = {};

        transactions.forEach(t => {
            if (t.type === TransactionType.INCOME) {
                income[t.category] = (income[t.category] || 0) + t.amount;
            } else {
                expense[t.category] = (expense[t.category] || 0) + t.amount;
            }
        });

        return { income, expense };
    }, [transactions]);

    return {
        categoryTotals,
        filteredTransactions,
        filteredSummary
    };
};

// Backward compatibility (deprecated)
export const useFinanceFilters = ({ transactions }: { transactions: Transaction[] }) => {
    const state = useFinanceFilterState();
    const logic = useFinanceFilterLogic({ 
        transactions, 
        filters: state.filters, 
        categoryFilter: state.categoryFilter 
    });

    return {
        ...state,
        ...logic
    };
};
