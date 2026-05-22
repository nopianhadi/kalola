import React from 'react';
import { Transaction, TransactionType, Project, Card, FinancialPocket } from '@/types';
import { formatCurrency, getTransactionSubDescription } from '@/features/finance/utils/finance.utils';

interface TransactionTableProps {
    transactions: Transaction[];
    projects: Project[];
    cards: Card[];
    pockets: FinancialPocket[];
}

export const TransactionTable: React.FC<TransactionTableProps> = ({ 
    transactions, 
    projects, 
    cards, 
    pockets 
}) => {
    return (
        <table className="w-full text-sm">
            <thead className="text-xs uppercase print-bg-slate bg-blue-100">
                <tr className="print-text-black">
                    <th className="p-3 text-left text-blue-800 border-r border-blue-200">Tanggal</th>
                    <th className="p-3 text-left text-blue-800 border-r border-blue-200">Deskripsi</th>
                    <th className="p-3 text-left text-blue-800 border-r border-blue-200">Kategori</th>
                    <th className="p-3 text-right text-blue-800">Jumlah</th>
                </tr>
            </thead>
            <tbody className="divide-y divide-blue-200">
                {transactions.map(t => (
                    <tr key={t.id} className="hover:bg-brand-input/30 transition-colors">
                        <td className="p-3 whitespace-nowrap border-r border-blue-200">
                            <p className="font-medium text-brand-text-light">{new Date(t.date).toLocaleDateString('id-ID')}</p>
                            <p className="text-[10px] text-brand-text-secondary">{new Date(t.date).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}</p>
                        </td>
                        <td className="p-3 border-r border-blue-200">
                            <p className="font-semibold text-brand-text-light">{t.description}</p>
                            <p className="text-[11px] text-brand-text-secondary">
                                {getTransactionSubDescription(t, projects, cards, pockets)}
                            </p>
                        </td>
                        <td className="p-3 border-r border-blue-200">
                            <span className="px-2 py-1 rounded-full text-[10px] font-bold uppercase bg-brand-bg border border-brand-border text-brand-text-secondary">
                                {t.category}
                            </span>
                        </td>
                        <td className="p-3 text-right">
                            <p className={`font-semibold text-sm ${t.type === TransactionType.INCOME ? 'text-brand-success' : 'text-brand-text-light'}`}>
                                {t.type === TransactionType.INCOME ? '+' : '-'}{formatCurrency(t.amount)}
                            </p>
                        </td>
                    </tr>
                ))}
                {transactions.length === 0 && (
                    <tr>
                        <td colSpan={4} className="text-center py-8 text-brand-text-secondary">Tidak ada transaksi ditemukan.</td>
                    </tr>
                )}
            </tbody>
        </table>
    );
};
