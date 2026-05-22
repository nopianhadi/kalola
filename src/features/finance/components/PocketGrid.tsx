import React from 'react';
import { PlusIcon, ClipboardListIcon, PencilIcon, Trash2Icon } from 'lucide-react';
import { FinancialPocket, Card } from '@/types';
import { formatCurrency } from '@/features/finance/utils/finance.utils';
import { PocketProgressCard } from '@/features/finance/components/FinancialAssets';
import StatCard from '@/shared/ui/StatCard';

interface PocketGridProps {
    pockets: FinancialPocket[];
    cards: Card[];
    summary: { pocketsTotal: number };
    onWithdraw: (pocket: FinancialPocket) => void;
    onDeposit: (pocket: FinancialPocket) => void;
    onEdit: (pocket: FinancialPocket) => void;
    onDelete: (id: number) => void;
    onAddPocket: () => void;
    onViewHistory: (pocket: FinancialPocket) => void;
}

export const PocketGrid: React.FC<PocketGridProps> = ({
    pockets,
    cards,
    summary,
    onWithdraw,
    onDeposit,
    onEdit,
    onDelete,
    onAddPocket,
    onViewHistory
}) => {
    return (
        <div className="widget-animate space-y-6">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard 
                    icon={<ClipboardListIcon className="w-6 h-6" />} 
                    title="Total Dana Terlokasi" 
                    value={formatCurrency(summary.pocketsTotal)} 
                    subtitle={`${pockets.length} kantong aktif`} 
                    colorVariant="purple" 
                />
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {pockets.map(p => {
                    const sourceCard = cards.find(c => String(c.id) === String(p.sourceCardId));
                    return (
                        <div key={p.id} className="relative group">
                            <PocketProgressCard
                                pocket={p}
                                sourceCard={sourceCard}
                                onWithdraw={() => onWithdraw(p)}
                                onDeposit={() => onDeposit(p)}
                                onHistory={() => onViewHistory(p)}
                                actions={(
                                    <div className="absolute top-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <button 
                                            onClick={(e) => { e.stopPropagation(); onEdit(p); }} 
                                            className="bg-white/15 hover:bg-white/25 text-white rounded-full p-2 backdrop-blur-sm"
                                        >
                                            <PencilIcon className="w-4 h-4" />
                                        </button>
                                        <button 
                                            onClick={(e) => { e.stopPropagation(); onDelete(p.id); }} 
                                            className="bg-white/15 hover:bg-white/25 text-white rounded-full p-2 backdrop-blur-sm"
                                        >
                                            <Trash2Icon className="w-4 h-4" />
                                        </button>
                                    </div>
                                )}
                            />
                        </div>
                    );
                })}
                
                <button 
                    onClick={onAddPocket} 
                    className="border-2 border-dashed border-brand-border rounded-2xl flex flex-col items-center justify-center text-brand-text-secondary hover:bg-brand-input hover:border-brand-accent hover:text-brand-accent transition-colors min-h-[250px]"
                >
                    <PlusIcon className="w-8 h-8" />
                    <span className="mt-2 font-semibold">Buat Kantong Baru</span>
                </button>
            </div>
        </div>
    );
};
