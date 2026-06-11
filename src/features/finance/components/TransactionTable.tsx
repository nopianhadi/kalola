import React, { useState } from 'react';
import { Transaction, TransactionType, Project, Card, FinancialPocket } from '@/types';
import { formatCurrency, getTransactionSubDescription } from '@/features/finance/utils/finance.utils';
import { PencilIcon, Trash2Icon } from 'lucide-react';

interface TransactionTableProps {
    transactions: Transaction[];
    projects: Project[];
    cards: Card[];
    pockets: FinancialPocket[];
    onEdit?: (transaction: Transaction) => void;
    onDelete?: (id: number) => void;
}

export const TransactionTable: React.FC<TransactionTableProps> = ({ 
    transactions, 
    projects, 
    cards, 
    pockets,
    onEdit,
    onDelete
}) => {
    const [confirmDeleteId, setConfirmDeleteId] = useState<number | null>(null);

    const handleDeleteClick = (id: number) => {
        setConfirmDeleteId(id);
    };

    const handleConfirmDelete = () => {
        if (confirmDeleteId !== null && onDelete) {
            onDelete(confirmDeleteId);
        }
        setConfirmDeleteId(null);
    };

    return (
        <>
            <table className="w-full text-sm">
                <thead className="text-xs uppercase print-bg-slate bg-blue-100">
                    <tr className="print-text-black">
                        <th className="p-3 text-left text-blue-800 border-r border-blue-200">Tanggal</th>
                        <th className="p-3 text-left text-blue-800 border-r border-blue-200">Deskripsi</th>
                        <th className="p-3 text-left text-blue-800 border-r border-blue-200">Kategori</th>
                        <th className="p-3 text-right text-blue-800 border-r border-blue-200">Jumlah</th>
                        {(onEdit || onDelete) && (
                            <th className="p-3 text-center text-blue-800">Aksi</th>
                        )}
                    </tr>
                </thead>
                <tbody className="divide-y divide-blue-200">
                    {transactions.map(t => (
                        <tr key={t.id} className="hover:bg-brand-input/30 transition-colors group">
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
                            <td className="p-3 text-right border-r border-blue-200">
                                <p className={`font-semibold text-sm ${t.type === TransactionType.INCOME ? 'text-brand-success' : 'text-brand-text-light'}`}>
                                    {t.type === TransactionType.INCOME ? '+' : '-'}{formatCurrency(t.amount)}
                                </p>
                            </td>
                            {(onEdit || onDelete) && (
                                <td className="p-3 text-center">
                                    <div className="flex items-center justify-center gap-1">
                                        {onEdit && (
                                            <button
                                                onClick={() => onEdit(t)}
                                                title="Edit transaksi"
                                                className="p-1.5 rounded-lg text-white bg-blue-500 hover:bg-blue-600 transition-colors"
                                            >
                                                <PencilIcon className="w-3.5 h-3.5" />
                                            </button>
                                        )}
                                        {onDelete && (
                                            <button
                                                onClick={() => handleDeleteClick(t.id)}
                                                title="Hapus transaksi"
                                                className="p-1.5 rounded-lg text-white bg-red-500 hover:bg-red-600 transition-colors"
                                            >
                                                <Trash2Icon className="w-3.5 h-3.5" />
                                            </button>
                                        )}
                                    </div>
                                </td>
                            )}
                        </tr>
                    ))}
                    {transactions.length === 0 && (
                        <tr>
                            <td colSpan={(onEdit || onDelete) ? 5 : 4} className="text-center py-8 text-brand-text-secondary">Tidak ada transaksi ditemukan.</td>
                        </tr>
                    )}
                </tbody>
            </table>

            {/* Confirm Delete Dialog */}
            {confirmDeleteId !== null && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
                    <div className="bg-brand-surface rounded-2xl shadow-2xl border border-brand-border p-6 max-w-sm w-full mx-4">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="w-10 h-10 rounded-full bg-brand-danger/10 flex items-center justify-center shrink-0">
                                <Trash2Icon className="w-5 h-5 text-brand-danger" />
                            </div>
                            <div>
                                <h3 className="font-bold text-brand-text-light">Hapus Transaksi</h3>
                                <p className="text-sm text-brand-text-secondary">Tindakan ini tidak dapat dibatalkan.</p>
                            </div>
                        </div>
                        <div className="flex justify-end gap-3 mt-6">
                            <button
                                onClick={() => setConfirmDeleteId(null)}
                                className="px-4 py-2 rounded-xl font-bold text-brand-text-secondary hover:bg-brand-bg transition-colors text-sm"
                            >
                                Batal
                            </button>
                            <button
                                onClick={handleConfirmDelete}
                                className="px-4 py-2 rounded-xl font-bold text-white bg-brand-danger hover:bg-red-700 transition-colors text-sm"
                            >
                                Ya, Hapus
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};
