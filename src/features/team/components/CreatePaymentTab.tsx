import React from 'react';
import { PencilIcon, PrinterIcon } from '@/constants';
import { TeamMember, TeamProjectPayment, Card, FinancialPocket } from '@/types';

const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(amount);
}

interface CreatePaymentTabProps {
    member: TeamMember;
    paymentDetails: { projects: TeamProjectPayment[]; total: number };
    paymentAmount: number | '';
    setPaymentAmount: React.Dispatch<React.SetStateAction<number | ''>>;
    isInstallment: boolean;
    setIsInstallment: React.Dispatch<React.SetStateAction<boolean>>;
    onPay: () => void;
    onSetTab: (tab: 'projects' | 'payments' | 'performance' | 'create-payment') => void;
    renderPaymentDetailsContent: () => React.ReactNode;
    cards: Card[];
    monthlyBudgetPocket: FinancialPocket | undefined;
    paymentSourceId: string;
    setPaymentSourceId: (id: string) => void;
    onSign: () => void;
    isSubmitting?: boolean;
}

export const CreatePaymentTab: React.FC<CreatePaymentTabProps> = ({
    paymentDetails, paymentAmount, setPaymentAmount, isInstallment, setIsInstallment, onPay, renderPaymentDetailsContent, cards,
    monthlyBudgetPocket, paymentSourceId, setPaymentSourceId, onSign, isSubmitting = false
}) => {

    const handlePayClick = () => {
        onPay();
    }

    return (
        <div>
            {renderPaymentDetailsContent()}

            <div className="mt-6 pt-6 border-t border-brand-border non-printable space-y-4 bg-white/5 backdrop-blur-md p-6 rounded-2xl shadow-lg border border-white/10">
                <div className="flex justify-between items-center mb-2">
                    <h5 className="font-semibold text-gradient text-base">Buat Pembayaran</h5>
                    <label className="flex items-center gap-2 cursor-pointer group">
                        <span className="text-xs font-medium text-brand-text-secondary group-hover:text-brand-accent transition-colors">Bayar Bertahap?</span>
                        <div className="relative inline-flex items-center cursor-pointer">
                            <input type="checkbox" className="sr-only peer" checked={isInstallment} onChange={e => setIsInstallment(e.target.checked)} />
                            <div className="w-11 h-6 bg-white/10 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-brand-accent"></div>
                        </div>
                    </label>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="input-group">
                        <input
                            type="number"
                            id="paymentAmount"
                            value={paymentAmount}
                            onChange={(e) => setPaymentAmount(e.target.value === '' ? '' : Number(e.target.value))}
                            className="input-field"
                            placeholder=" "
                            max={paymentDetails.total}
                        />
                        <label htmlFor="paymentAmount" className="input-label">Jumlah Bayar (Total: {formatCurrency(paymentDetails.total)})</label>
                    </div>
                    <div className="input-group">
                        <select
                            id="paymentSource"
                            className="input-field"
                            value={paymentSourceId}
                            onChange={e => setPaymentSourceId(e.target.value)}
                        >
                            <option value="" disabled>Pilih Sumber Pembayaran...</option>
                            {monthlyBudgetPocket && (
                                <option value={`pocket-${monthlyBudgetPocket.id}`}>
                                    {monthlyBudgetPocket.name} (Sisa: {formatCurrency(monthlyBudgetPocket.amount)})
                                </option>
                            )}
                            {cards.map(card => (
                                <option key={card.id} value={`card-${card.id}`}>
                                    {card.bankName} {card.lastFourDigits !== 'CASH' ? `**** ${card.lastFourDigits}` : ''} (Saldo: {formatCurrency(card.balance)})
                                </option>
                            ))}
                        </select>
                        <label htmlFor="paymentSource" className="input-label">Sumber Dana</label>
                    </div>
                </div>

                <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
                    <div className="flex items-center gap-2">
                        <button type="button" onClick={onSign} className="button-secondary text-sm inline-flex items-center gap-2">
                            <PencilIcon className="w-4 h-4" />
                            Tanda Tangani Slip
                        </button>
                        <button type="button" onClick={() => window.print()} className="button-secondary text-sm inline-flex items-center gap-2">
                            <PrinterIcon className="w-4 h-4" /> Cetak
                        </button>
                    </div>
                    <button
                        type="button"
                        onClick={handlePayClick}
                        className="button-primary w-full sm:w-auto disabled:cursor-not-allowed disabled:opacity-70"
                        disabled={isSubmitting}
                    >
                        {isSubmitting ? 'Memproses Pembayaran...' : 'Bayar Sekarang & Buat Catatan'}
                    </button>
                </div>
            </div>
        </div>
    );
};
