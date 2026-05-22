import React from 'react';
import { Card, CardType, FinancialPocket, PocketType } from '@/types';
import { PencilIcon, Trash2Icon, ArrowUpIcon, ArrowDownIcon, HistoryIcon, PiggyBankIcon, LockIcon, UsersIcon, ClipboardListIcon, StarIcon } from '@/constants';

const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(amount);
}

const pocketIcons: Record<string, React.ReactNode> = {
    'piggy-bank': <PiggyBankIcon className="w-6 h-6" />,
    'lock': <LockIcon className="w-6 h-6" />,
    'users': <UsersIcon className="w-6 h-6" />,
    'clipboard-list': <ClipboardListIcon className="w-6 h-6" />,
    'star': <StarIcon className="w-6 h-6" />
};

export const CardWidget: React.FC<{ card: Card, onEdit: () => void, onDelete: () => void, onClick: () => void }> = ({ card, onEdit, onDelete, onClick }) => {
    const gradient = card.colorGradient || 'from-slate-200 to-slate-400';
    const isLight = gradient.includes('slate-100');
    const textColor = isLight ? 'text-gray-800' : 'text-white';

    return (
        <div className="group relative w-full cursor-pointer" onClick={onClick}>
            <div className={`relative w-full h-48 px-6 py-6 rounded-3xl ${textColor} shadow-xl flex flex-col justify-between bg-gradient-to-br ${gradient} transition-all duration-300 hover:scale-[1.02] overflow-hidden`}>
                <div className="absolute -right-8 -top-8 w-32 h-32 rounded-full bg-white/10 blur-2xl"></div>
                <div className="relative z-10 flex justify-between items-start">
                    <div>
                        <p className="font-bold text-lg mb-0.5">{card.bankName}</p>
                        <p className="text-[10px] uppercase tracking-widest opacity-70 font-bold">{card.cardType}</p>
                    </div>
                    <div className="flex gap-2">
                        <button onClick={(e) => { e.stopPropagation(); onEdit(); }} className="p-2 rounded-full bg-white/20 hover:bg-white/30 backdrop-blur-md transition-colors"><PencilIcon className="w-4 h-4" /></button>
                        {card.cardType !== CardType.TUNAI && <button onClick={(e) => { e.stopPropagation(); onDelete(); }} className="p-2 rounded-full bg-white/20 hover:bg-white/30 backdrop-blur-md transition-colors"><Trash2Icon className="w-4 h-4" /></button>}
                    </div>
                </div>
                <div className="relative z-10">
                    <p className="text-xs opacity-60 mb-1">Available Balance</p>
                    <p className="text-2xl font-black tracking-tight">{formatCurrency(card.balance)}</p>
                </div>
                <div className="relative z-10 flex justify-between items-end">
                    <p className="font-mono text-sm tracking-wider">**** **** **** {card.lastFourDigits}</p>
                    <p className="font-bold text-xs uppercase">{card.cardHolderName}</p>
                </div>
            </div>
        </div>
    );
};

export const CashWidget: React.FC<{ card: Card, onEdit: () => void, onTopUp: () => void, onClick: () => void }> = ({ card, onEdit, onTopUp, onClick }) => {
    const gradient = card.colorGradient || 'from-amber-400 to-orange-500';
    const textColor = 'text-white';

    return (
        <div className="group relative w-full cursor-pointer" onClick={onClick}>
            <div className={`relative w-full h-48 px-6 py-6 rounded-3xl ${textColor} shadow-xl flex flex-col justify-between bg-gradient-to-br ${gradient} transition-all duration-300 hover:scale-[1.02] overflow-hidden`}>
                <div className="absolute -right-8 -top-8 w-32 h-32 rounded-full bg-white/10 blur-2xl"></div>
                <div className="relative z-10 flex justify-between items-start">
                    <div>
                        <p className="font-bold text-lg mb-0.5">Uang Tunai (Cash)</p>
                        <p className="text-[10px] uppercase tracking-widest opacity-70 font-bold">Physical Assets</p>
                    </div>
                    <div className="flex gap-2">
                        <button onClick={(e) => { e.stopPropagation(); onTopUp(); }} title="Top Up Cash" className="p-2 rounded-full bg-white/20 hover:bg-white/30 backdrop-blur-md transition-colors"><ArrowUpIcon className="w-4 h-4" /></button>
                        <button onClick={(e) => { e.stopPropagation(); onEdit(); }} className="p-2 rounded-full bg-white/20 hover:bg-white/30 backdrop-blur-md transition-colors"><PencilIcon className="w-4 h-4" /></button>
                    </div>
                </div>
                <div className="relative z-10">
                    <p className="text-xs opacity-60 mb-1">Cash Balance</p>
                    <p className="text-2xl font-black tracking-tight">{formatCurrency(card.balance)}</p>
                </div>
                <div className="relative z-10 flex justify-between items-end">
                    <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-white/20 backdrop-blur-sm">
                        <div className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse"></div>
                        <span className="text-[10px] font-bold uppercase tracking-wider">Available</span>
                    </div>
                    <p className="font-bold text-xs uppercase">Liquidity</p>
                </div>
            </div>
        </div>
    );
};

export const PocketStatCard: React.FC<{
    pocket: FinancialPocket;
    amount: number;
    onClick: () => void;
    onWithdraw: () => void;
    onDeposit: () => void;
}> = ({ pocket, amount, onClick, onWithdraw, onDeposit }) => {
    const gradient = pocket.type === PocketType.SAVING ? 'from-emerald-500 to-teal-500' : 'from-rose-500 to-pink-500';
    const progress = pocket.goalAmount ? Math.min((amount / pocket.goalAmount) * 100, 100) : 0;

    return (
        <div className="group relative w-full cursor-pointer" onClick={onClick}>
            <div className={`relative w-full p-5 rounded-3xl shadow-xl bg-gradient-to-br ${gradient} text-white overflow-hidden transition-all duration-300 hover:scale-[1.01]`}>
                <div className="relative z-10 flex justify-between items-start mb-4">
                    <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
                        {pocketIcons[pocket.icon] || <PiggyBankIcon className="w-6 h-6" />}
                    </div>
                    <div className="text-right">
                        <p className="font-bold text-base">{pocket.name}</p>
                        <p className="text-[10px] opacity-80 uppercase font-bold tracking-wider">{pocket.type}</p>
                    </div>
                </div>
                <div className="relative z-10 mb-4">
                    <p className="text-2xl font-black">{formatCurrency(amount)}</p>
                    {pocket.goalAmount && (
                        <div className="mt-2">
                            <div className="h-1.5 w-full bg-white/20 rounded-full overflow-hidden">
                                <div className="h-full bg-white transition-all duration-500" style={{ width: `${progress}%` }}></div>
                            </div>
                            <p className="text-[10px] mt-1 text-right font-bold">Goal: {formatCurrency(pocket.goalAmount)}</p>
                        </div>
                    )}
                </div>
                <div className="relative z-10 grid grid-cols-2 gap-2 pt-4 border-t border-white/10">
                    <button onClick={(e) => { e.stopPropagation(); onWithdraw(); }} className="py-2 rounded-xl bg-white/10 hover:bg-white/20 text-xs font-bold transition-all">TARIK</button>
                    <button onClick={(e) => { e.stopPropagation(); onDeposit(); }} className="py-2 rounded-xl bg-white text-slate-900 hover:bg-white/90 text-xs font-bold transition-all">SETOR</button>
                </div>
            </div>
        </div>
    );
};

export const PocketProgressCard: React.FC<{
    pocket: FinancialPocket;
    sourceCard?: Card;
    onWithdraw: () => void;
    onDeposit: () => void;
    onHistory: () => void;
    actions?: React.ReactNode;
}> = ({ pocket, sourceCard, onWithdraw, onDeposit, onHistory, actions }) => {
    const amount = pocket.amount || 0;
    const gradient = pocket.type === PocketType.SAVING ? 'from-emerald-500 to-teal-500' : 'from-rose-500 to-pink-500';
    const progress = pocket.goalAmount ? Math.min((amount / pocket.goalAmount) * 100, 100) : 0;

    return (
        <div className="relative w-full h-full p-6 rounded-3xl bg-brand-surface border border-brand-border shadow-lg transition-all hover:shadow-xl group overflow-hidden">
            {/* Background design */}
            <div className={`absolute -right-8 -top-8 w-24 h-24 rounded-full bg-gradient-to-br ${gradient} opacity-20 blur-2xl group-hover:scale-150 transition-transform duration-700`}></div>
            
            <div className="relative z-10 flex justify-between items-start mb-6">
                <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${gradient} flex items-center justify-center text-white shadow-lg`}>
                    {pocketIcons[pocket.icon] || <PiggyBankIcon className="w-6 h-6" />}
                </div>
                {actions}
            </div>

            <div className="relative z-10 mb-6">
                <div className="flex justify-between items-end mb-1">
                    <div>
                        <h4 className="font-bold text-lg text-brand-text-light">{pocket.name}</h4>
                        <p className="text-[10px] uppercase tracking-widest text-brand-text-secondary font-bold">{pocket.type}</p>
                    </div>
                </div>
                <p className="text-2xl font-black text-brand-text-primary mb-2">{formatCurrency(amount)}</p>
                
                {pocket.goalAmount && (
                    <div className="space-y-1.5">
                        <div className="flex justify-between text-[10px] font-bold">
                            <span className="text-brand-text-secondary">Progress: {progress.toFixed(0)}%</span>
                            <span className="text-brand-text-light">Goal: {formatCurrency(pocket.goalAmount)}</span>
                        </div>
                        <div className="h-2 w-full bg-brand-bg rounded-full overflow-hidden p-0.5 border border-brand-border/50">
                            <div className={`h-full bg-gradient-to-r ${gradient} rounded-full transition-all duration-500`} style={{ width: `${progress}%` }}></div>
                        </div>
                    </div>
                )}
            </div>

            {sourceCard && (
                <div className="relative z-10 mb-6 p-3 rounded-2xl bg-brand-bg border border-brand-border/50 flex items-center justify-between">
                    <div>
                        <p className="text-[10px] uppercase text-brand-text-secondary font-bold">Linked Balance</p>
                        <p className="text-xs font-bold text-brand-text-light">{sourceCard.bankName} • {sourceCard.lastFourDigits}</p>
                    </div>
                    <div className="text-right">
                        <p className="text-[10px] text-brand-text-secondary italic">Available</p>
                        <p className="text-xs font-black text-brand-accent">{formatCurrency(sourceCard.balance)}</p>
                    </div>
                </div>
            )}

            <div className="relative z-10 grid grid-cols-3 gap-2">
                <button onClick={onWithdraw} className="py-2.5 rounded-xl bg-brand-input text-brand-text-primary hover:bg-brand-border text-[10px] font-bold uppercase transition-all flex items-center justify-center gap-1.5"><ArrowUpIcon className="w-3 h-3" />Tarik</button>
                <button onClick={onDeposit} className="py-2.5 rounded-xl bg-brand-accent text-brand-accent-text hover:opacity-90 text-[10px] font-bold uppercase transition-all flex items-center justify-center gap-1.5"><ArrowDownIcon className="w-3 h-3" />Setor</button>
                <button onClick={onHistory} className="py-2.5 rounded-xl bg-brand-input text-brand-text-secondary hover:text-brand-text-primary hover:bg-brand-border text-[10px] font-bold uppercase transition-all flex items-center justify-center gap-1.5"><HistoryIcon className="w-3 h-3" />Riwayat</button>
            </div>
        </div>
    );
};
