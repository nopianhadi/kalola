import { PlusIcon, DollarSignIcon } from '@/constants';
import PageHeader from '@/layouts/PageHeader';

interface FinanceHeaderProps {
    onAddTransaction: () => void;
    onOpenInfoModal: () => void;
}

export const FinanceHeader: React.FC<FinanceHeaderProps> = ({
    onAddTransaction,
    onOpenInfoModal
}) => {
    return (
        <PageHeader 
            title="Keuangan & Cashflow" 
            subtitle="Pantau pemasukan, pengeluaran gaji tim, dan kesehatan finansial vendor Anda dalam satu dashboard."
            icon={<DollarSignIcon className="w-6 h-6" />}
        >
            <button 
                onClick={onOpenInfoModal} 
                className="px-4 py-2 rounded-xl bg-white/10 text-white border border-white/20 hover:bg-white/20 transition-all text-xs font-bold"
            >
                Wawasan
            </button>
            <button 
                onClick={onAddTransaction} 
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white text-blue-600 hover:bg-blue-50 transition-all text-xs sm:text-sm font-black shadow-lg shadow-blue-900/40"
            >
                <PlusIcon className="w-5 h-5" />
                <span>Tambah Transaksi</span>
            </button>
        </PageHeader>
    );
};
