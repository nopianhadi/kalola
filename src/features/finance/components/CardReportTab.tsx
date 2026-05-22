import React from 'react';
import { Transaction, Card, Profile, TransactionType } from '@/types';
import { useState, useMemo } from 'react';
import { PrinterIcon, ArrowUpIcon, ArrowDownIcon, DollarSignIcon } from 'lucide-react';
import { formatCurrency } from '@/features/finance/utils/finance.utils';
import StatCard from '@/shared/ui/StatCard';
import { DonutChart } from '@/features/finance/components/FinanceCharts';
import { TransactionTable } from '@/features/finance/components/TransactionTable';

interface CardReportTabProps {
    transactions: Transaction[];
    cards: Card[];
    profile: Profile;
    projects: any[];
    pockets: any[];
}

export const CardReportTab: React.FC<CardReportTabProps> = ({ transactions, cards, projects, pockets }) => {
    const [filters, setFilters] = useState({ cardId: 'all', dateFrom: '', dateTo: '' });

    const handleFilterChange = (e: React.ChangeEvent<HTMLSelectElement | HTMLInputElement>) => {
        setFilters(prev => ({ ...prev, [e.target.name]: e.target.value }));
    };

    const filteredTransactions = useMemo(() => {
        return transactions.filter(t => {
            const date = new Date(t.date);
            const from = filters.dateFrom ? new Date(filters.dateFrom) : null;
            const to = filters.dateTo ? new Date(filters.dateTo) : null;
            if (from) from.setHours(0, 0, 0, 0);
            if (to) to.setHours(23, 59, 59, 999);

            const dateMatch = (!from || date >= from) && (!to || date <= to);
            const cardMatch = filters.cardId === 'all' || String(t.cardId) === String(filters.cardId);

            return dateMatch && cardMatch;
        });
    }, [transactions, filters]);

    const reportStats = useMemo(() => {
        const income = filteredTransactions.filter(t => t.type === TransactionType.INCOME).reduce((sum, t) => sum + t.amount, 0);
        const expense = filteredTransactions.filter(t => t.type === TransactionType.EXPENSE).reduce((sum, t) => sum + t.amount, 0);
        return { income, expense, net: income - expense };
    }, [filteredTransactions]);

    const expenseDonutData = useMemo(() => {
        const expenseByCategory = filteredTransactions
            .filter(t => t.type === TransactionType.EXPENSE)
            .reduce((acc, t) => {
                acc[t.category] = (acc[t.category] || 0) + t.amount;
                return acc;
            }, {} as Record<string, number>);

        const colors = ['#f87171', '#fb923c', '#facc15', '#a3e635', '#34d399', '#22d3ee', '#60a5fa', '#a78bfa', '#f472b6'];
        return Object.entries(expenseByCategory)
            .sort((a, b) => b[1] - a[1])
            .map(([label, value], i) => ({ label, value, color: colors[i % colors.length] }));
    }, [filteredTransactions]);

    return (
        <div className="space-y-6 printable-area widget-animate">
            <div className="bg-brand-surface p-4 rounded-xl flex flex-col md:flex-row gap-4 items-center non-printable border border-brand-border">
                <h4 className="text-md font-semibold text-gradient whitespace-nowrap">Filter Laporan:</h4>
                <select name="cardId" value={filters.cardId} onChange={handleFilterChange} className="input-field !rounded-lg !border p-2.5 w-full md:w-auto">
                    <option value="all">Semua Kartu/Akun</option>
                    {cards.map(c => <option key={c.id} value={c.id}>{c.bankName} {c.lastFourDigits !== 'CASH' ? `**** ${c.lastFourDigits}` : '(Tunai)'}</option>)}
                </select>
                <input type="date" name="dateFrom" value={filters.dateFrom} onChange={handleFilterChange} className="input-field !rounded-lg !border p-2.5 w-full md:w-auto" />
                <input type="date" name="dateTo" value={filters.dateTo} onChange={handleFilterChange} className="input-field !rounded-lg !border p-2.5 w-full md:w-auto" />
                <button onClick={() => window.print()} className="ml-auto button-primary inline-flex items-center gap-2"><PrinterIcon className="w-5 h-5" />Cetak</button>
            </div>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard icon={<ArrowUpIcon className="w-6 h-6" />} title="Total Pemasukan" value={formatCurrency(reportStats.income)} colorVariant="green" />
                <StatCard icon={<ArrowDownIcon className="w-6 h-6" />} title="Total Pengeluaran" value={formatCurrency(reportStats.expense)} colorVariant="pink" />
                <StatCard icon={<DollarSignIcon className="w-6 h-6" />} title="Arus Kas Bersih" value={formatCurrency(reportStats.net)} colorVariant="blue" />
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
                <div className="lg:col-span-2 bg-brand-surface p-6 rounded-2xl border border-brand-border">
                    <h3 className="font-bold mb-4">Pengeluaran per Kategori</h3>
                    <DonutChart data={expenseDonutData} />
                </div>
                <div className="lg:col-span-3 bg-brand-surface p-6 rounded-2xl border border-brand-border">
                    <h3 className="font-bold mb-4">Rincian Transaksi</h3>
                    <div className="overflow-x-auto max-h-[400px]">
                        <TransactionTable transactions={filteredTransactions} projects={projects} cards={cards} pockets={pockets} />
                    </div>
                </div>
            </div>
        </div>
    );
};
