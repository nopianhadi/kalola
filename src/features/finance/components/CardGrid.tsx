import React from 'react';
import { 
    CreditCardIcon, DollarSignIcon, TrendingUpIcon, 
    PlusIcon
} from 'lucide-react';
import { Card, CardType } from '@/types';
import { formatCurrency } from '@/features/finance/utils/finance.utils';
import StatCard from '@/shared/ui/StatCard';
import { CardWidget, CashWidget } from '@/features/finance/components/FinancialAssets';

interface CardGridProps {
    cards: Card[];
    onEdit: (card: Card) => void;
    onDelete: (id: number) => void;
    onAddCard: () => void;
    onTopUp: (card: Card) => void;
    onViewHistory: (card: Card) => void;
    stats: {
        creditDebt: number;
        debitAndCashAssets: number;
        cashBalance: number;
        mostUsedCardName: string;
        mostUsedCardTxCount: number;
    };
}

const CashIcon = DollarSignIcon; // Alias for consistency with original

export const CardGrid: React.FC<CardGridProps> = ({
    cards,
    onEdit,
    onDelete,
    onAddCard,
    onTopUp,
    onViewHistory,
    stats
}) => {
    return (
        <div className="widget-animate space-y-6">
            <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
                <StatCard 
                    icon={<CreditCardIcon className="w-6 h-6" />} 
                    title="Total Utang Kartu Kredit" 
                    value={formatCurrency(Math.abs(stats.creditDebt))} 
                    subtitle="Saldo negatif kartu kredit" 
                    colorVariant="pink" 
                />
                <StatCard 
                    icon={<DollarSignIcon className="w-6 h-6" />} 
                    title="Total Aset (Debit & Tunai)" 
                    value={formatCurrency(stats.debitAndCashAssets)} 
                    subtitle="Saldo kartu debit & kas" 
                    colorVariant="green" 
                />
                <StatCard 
                    icon={<TrendingUpIcon className="w-6 h-6" />} 
                    title="Kartu Paling Sering Digunakan" 
                    value={stats.mostUsedCardName} 
                    subtitle={`${stats.mostUsedCardTxCount} transaksi`} 
                    colorVariant="blue" 
                />
                <StatCard 
                    icon={<CashIcon className="w-6 h-6" />} 
                    title="Total Saldo Tunai" 
                    value={formatCurrency(stats.cashBalance)} 
                    subtitle="Uang kas yang tersedia" 
                    colorVariant="orange" 
                />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 md:gap-8">
                {cards.map(card => {

                    return (
                        <div key={card.id}>
                            {card.cardType === CardType.TUNAI
                                ? <CashWidget 
                                    card={card} 
                                    onClick={() => onViewHistory(card)} 
                                    onTopUp={() => onTopUp(card)} 
                                    onEdit={() => onEdit(card)} 
                                  />
                                : <CardWidget 
                                    card={card} 
                                    onEdit={() => onEdit(card)} 
                                    onDelete={() => onDelete(card.id)} 
                                    onClick={() => onViewHistory(card)} 
                                  />
                            }
                        </div>
                    );
                })}
                
                <button 
                    onClick={onAddCard} 
                    className="group aspect-[1.586] border-2 border-dashed border-brand-border rounded-2xl flex flex-col items-center justify-center text-brand-text-secondary hover:bg-brand-input hover:border-brand-accent hover:text-brand-accent transition-all duration-300"
                >
                    <div className="w-16 h-16 rounded-full bg-brand-bg group-hover:bg-brand-accent/10 flex items-center justify-center transition-colors">
                        <PlusIcon className="w-8 h-8 transition-transform group-hover:scale-110" />
                    </div>
                    <span className="mt-4 font-semibold">Tambah Kartu / Akun</span>
                </button>
            </div>
        </div>
    );
};
