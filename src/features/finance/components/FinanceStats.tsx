import React from 'react';
import { CreditCardIcon, ClipboardListIcon, ArrowUpIcon, ArrowDownIcon } from 'lucide-react';
import StatCard from '@/shared/ui/StatCard';
import { formatCurrency } from '@/features/finance/utils/finance.utils';

interface FinanceStatsProps {
    summary: {
        totalAssets: number;
        pocketsTotal: number;
        totalIncomeThisMonth: number;
        totalExpenseThisMonth: number;
    };
    onStatClick: (type: 'assets' | 'pockets' | 'income' | 'expense') => void;
}

export const FinanceStats: React.FC<FinanceStatsProps> = ({ summary, onStatClick }) => {
    return (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
            <div 
                className="widget-animate cursor-pointer transition-transform duration-200 hover:scale-105" 
                style={{ animationDelay: '100ms' }} 
                onClick={() => onStatClick('assets')}
            >
                <StatCard 
                    icon={<CreditCardIcon className="w-6 h-6" />} 
                    title="Total Aset" 
                    value={formatCurrency(summary.totalAssets)} 
                    subtitle="Total gabungan saldo di semua kartu & tunai Anda." 
                />
            </div>
            <div 
                className="widget-animate cursor-pointer transition-transform duration-200 hover:scale-105" 
                style={{ animationDelay: '200ms' }} 
                onClick={() => onStatClick('pockets')}
            >
                <StatCard 
                    icon={<ClipboardListIcon className="w-6 h-6" />} 
                    title="Dana di Kantong" 
                    value={formatCurrency(summary.pocketsTotal)} 
                    subtitle="Total dana yang dialokasikan di semua kantong." 
                />
            </div>
            <div 
                className="widget-animate cursor-pointer transition-transform duration-200 hover:scale-105" 
                style={{ animationDelay: '300ms' }} 
                onClick={() => onStatClick('income')}
            >
                <StatCard 
                    icon={<ArrowUpIcon className="w-6 h-6" />} 
                    title="Pemasukan Bulan Ini" 
                    value={formatCurrency(summary.totalIncomeThisMonth)} 
                    subtitle="Total pemasukan yang tercatat bulan ini." 
                />
            </div>
            <div 
                className="widget-animate cursor-pointer transition-transform duration-200 hover:scale-105" 
                style={{ animationDelay: '400ms' }} 
                onClick={() => onStatClick('expense')}
            >
                <StatCard 
                    icon={<ArrowDownIcon className="w-6 h-6" />} 
                    title="Pengeluaran Bulan Ini" 
                    value={formatCurrency(summary.totalExpenseThisMonth)} 
                    subtitle="Total pengeluaran yang tercatat bulan ini." 
                />
            </div>
        </div>
    );
};
