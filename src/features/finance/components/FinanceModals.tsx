import React from 'react';
import Modal from '@/shared/ui/Modal';
import RupiahInput from '@/shared/form/RupiahInput';
import { FormSection, FieldLabel, inputCls, selectCls } from '@/shared/ui/FormSection';
import { TransactionType, CardType, PocketType, Profile, Project, Card, FinancialPocket } from '@/types';
import { formatCurrency } from '@/features/finance/utils/finance.utils';

interface FinanceModalsProps {
    modalState: { type: any; mode: 'add' | 'edit'; data?: any };
    onClose: () => void;
    form: any;
    setForm: React.Dispatch<React.SetStateAction<any>>;
    onFormChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => void;
    onSubmit: (e: React.FormEvent) => void;
    cards: Card[];
    pockets: FinancialPocket[];
    projects: Project[];
    profile: Profile;
}

export const FinanceModals: React.FC<FinanceModalsProps> = ({
    modalState,
    onClose,
    form,
    setForm,
    onFormChange,
    onSubmit,
    cards,
    pockets,
    projects,
    profile
}) => {
    if (!modalState.type) return null;

    const renderTitle = () => {
        const { mode, type, data } = modalState;
        const prefix = mode === 'add' ? 'Tambah' : 'Edit';
        switch (type) {
            case 'transaction': return `${prefix} Transaksi`;
            case 'pocket': return `${prefix} Kantong`;
            case 'card': return `${prefix} Kartu/Akun`;
            case 'topup-cash': return 'Top-up Tunai';
            case 'transfer':
                if (form.type === 'withdraw') return `Tarik Dana dari "${data?.name}"`;
                if (form.type === 'deposit') return `Setor Dana ke "${data?.name}"`;
                return 'Transfer';
            default: return 'Modal Keuangan';
        }
    };

    return (
        <Modal isOpen={!!modalState.type} onClose={onClose} title={renderTitle()}>
            <form onSubmit={onSubmit} className="space-y-6">
                {modalState.type === 'transaction' && (
                    <FormSection title="Informasi Transaksi">
                        <div>
                            <FieldLabel>Tanggal</FieldLabel>
                            <input type="date" name="date" value={form.date || ''} onChange={onFormChange} className={inputCls + ' font-mono'} required />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <FieldLabel>Jenis</FieldLabel>
                                <select name="type" value={form.type || TransactionType.EXPENSE} onChange={onFormChange} className={selectCls + ' font-bold'}>
                                    <option value={TransactionType.EXPENSE}>Pengeluaran</option>
                                    <option value={TransactionType.INCOME}>Pemasukan</option>
                                </select>
                            </div>
                            <div>
                                <FieldLabel>Metode Pembayaran</FieldLabel>
                                <select name="method" value={form.method || 'Transfer Bank'} onChange={onFormChange} className={selectCls + ' font-bold'} required>
                                    <option value="Transfer Bank">Transfer Bank</option>
                                    <option value="Tunai">Tunai</option>
                                    <option value="E-Wallet">E-Wallet</option>
                                    <option value="Kartu">Kartu / CC</option>
                                    <option value="Sistem">Sistem</option>
                                </select>
                            </div>
                        </div>
                        <div>
                            <FieldLabel>Deskripsi</FieldLabel>
                            <input type="text" name="description" value={form.description || ''} onChange={onFormChange} className={inputCls + ' font-semibold'} placeholder="Nama transaksi..." required />
                        </div>
                        <div>
                            <FieldLabel>Jumlah (IDR)</FieldLabel>
                            <RupiahInput value={String(form.amount ?? '')} onChange={(raw) => setForm((prev: any) => ({ ...prev, amount: raw }))} className={inputCls + ' font-bold text-blue-600 text-lg'} placeholder="0" required />
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <FieldLabel>Kategori</FieldLabel>
                                <select name="category" value={form.category || ''} onChange={onFormChange} className={selectCls + ' font-bold'} required>
                                    <option value="">Pilih Kategori...</option>
                                    {(form.type === TransactionType.INCOME ? profile.incomeCategories : profile.expenseCategories).map(cat => (
                                        <option key={cat} value={cat}>{cat}</option>
                                    ))}
                                </select>
                            </div>
                            {form.type === TransactionType.INCOME ? (
                                <div>
                                    <FieldLabel>Setor Ke</FieldLabel>
                                    <select name="cardId" value={form.cardId || ''} onChange={onFormChange} className={selectCls + ' font-bold'} required>
                                        <option value="">Pilih Tujuan...</option>
                                        {cards.map(c => (
                                            <option key={c.id} value={c.id}>
                                                {c.cardHolderName} {c.cardType !== CardType.TUNAI ? `(${c.bankName} **** ${c.lastFourDigits})` : '(Tunai)'}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            ) : (
                                <div>
                                    <FieldLabel>Sumber Dana</FieldLabel>
                                    <select name="sourceId" value={form.sourceId || ''} onChange={onFormChange} className={selectCls + ' font-bold'} required>
                                        <option value="">Pilih Sumber...</option>
                                        {cards.map(c => (
                                            <option key={c.id} value={`card-${c.id}`}>{c.cardHolderName} ({c.bankName || 'Tunai'})</option>
                                        ))}
                                        {pockets.filter(p => p.type === PocketType.EXPENSE).map(p => (
                                            <option key={p.id} value={`pocket-${p.id}`}>{p.name} (Sisa: {formatCurrency(p.amount)})</option>
                                        ))}
                                    </select>
                                </div>
                            )}
                        </div>
                        <div>
                            <FieldLabel optional>Terkait Proyek</FieldLabel>
                            <select name="projectId" value={form.projectId || ''} onChange={onFormChange} className={selectCls + ' font-semibold'}>
                                <option value="">Tidak Terkait Proyek</option>
                                {projects.map(p => <option key={p.id} value={p.id}>{p.projectName} ({p.clientName})</option>)}
                            </select>
                        </div>
                    </FormSection>
                )}

                {modalState.type === 'card' && (
                    <FormSection title="Detail Rekening / Akun">
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <FieldLabel>Jenis Akun</FieldLabel>
                                <select name="cardType" value={form.cardType || CardType.DEBIT} onChange={onFormChange} className={selectCls + ' font-bold'}>
                                    {Object.values(CardType).map(ct => <option key={ct} value={ct}>{ct}</option>)}
                                </select>
                            </div>
                            <div>
                                <FieldLabel>{form.cardType === CardType.TUNAI ? 'Nama Akun Kas' : 'Nama Pemegang Kartu'}</FieldLabel>
                                <input type="text" name="cardHolderName" value={form.cardHolderName || ''} onChange={onFormChange} className={inputCls + ' font-bold'} required />
                            </div>
                        </div>
                        {modalState.mode === 'add' && (
                            <div>
                                <FieldLabel>Saldo Awal</FieldLabel>
                                <RupiahInput value={String(form.initialBalance ?? '')} onChange={(raw) => setForm((p: any) => ({ ...p, initialBalance: raw }))} className={inputCls + ' font-bold text-blue-600'} placeholder="0" />
                            </div>
                        )}
                        {form.cardType !== CardType.TUNAI && (
                            <>
                                <div>
                                    <FieldLabel>Nama Bank</FieldLabel>
                                    <input type="text" name="bankName" value={form.bankName || ''} onChange={onFormChange} className={inputCls + ' font-bold'} required />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <FieldLabel>4 Digit Terakhir</FieldLabel>
                                        <input type="text" name="lastFourDigits" value={form.lastFourDigits || ''} onChange={onFormChange} className={inputCls + ' font-mono font-bold'} maxLength={4} required placeholder="0000" />
                                    </div>
                                    <div>
                                        <FieldLabel optional>Kadaluwarsa</FieldLabel>
                                        <input type="text" name="expiryDate" value={form.expiryDate || ''} onChange={onFormChange} className={inputCls + ' font-mono'} placeholder="MM/YY" />
                                    </div>
                                </div>
                            </>
                        )}
                        {modalState.mode === 'edit' && (
                            <div className="p-4 bg-blue-600/5 rounded-xl border border-blue-600/10 mt-2">
                                <p className="text-xs font-bold text-blue-600 mb-3">Penyesuaian Saldo</p>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <FieldLabel>Jumlah</FieldLabel>
                                        <RupiahInput allowNegative value={String(form.adjustmentAmount ?? '')} onChange={(raw) => setForm((p: any) => ({ ...p, adjustmentAmount: raw }))} className={inputCls + ' font-bold text-red-500'} placeholder="0" />
                                    </div>
                                    <div>
                                        <FieldLabel>Alasan</FieldLabel>
                                        <input type="text" name="adjustmentReason" value={form.adjustmentReason || ''} onChange={onFormChange} className={inputCls + ' font-semibold'} placeholder="..." />
                                    </div>
                                </div>
                            </div>
                        )}
                    </FormSection>
                )}

                {modalState.type === 'pocket' && (
                    <FormSection title="Detail Kantong Keuangan">
                        <div>
                            <FieldLabel>Nama Kantong</FieldLabel>
                            <input type="text" name="name" value={form.name || ''} onChange={onFormChange} className={inputCls + ' font-bold'} required />
                        </div>
                        <div>
                            <FieldLabel optional>Deskripsi</FieldLabel>
                            <textarea name="description" value={form.description || ''} onChange={onFormChange} className={inputCls + ' min-h-[70px] resize-none'} placeholder="Tujuan kantong ini..." />
                        </div>
                        <div>
                            <FieldLabel>Sumber Dana Utama</FieldLabel>
                            <select name="sourceCardId" value={form.sourceCardId || ''} onChange={onFormChange} className={selectCls + ' font-bold'} required>
                                <option value="">Pilih Sumber...</option>
                                {cards.map(c => <option key={c.id} value={c.id}>{c.bankName || 'Tunai'} {c.lastFourDigits !== 'CASH' && `**** ${c.lastFourDigits}`}</option>)}
                            </select>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <FieldLabel>Tipe</FieldLabel>
                                <select name="type" value={form.type || PocketType.SAVING} onChange={onFormChange} className={selectCls + ' font-bold'}>
                                    {Object.values(PocketType).map(pt => <option key={pt} value={pt}>{pt}</option>)}
                                </select>
                            </div>
                            <div>
                                <FieldLabel optional>Target</FieldLabel>
                                <RupiahInput value={String(form.goalAmount ?? '')} onChange={(raw) => setForm((p: any) => ({ ...p, goalAmount: raw }))} className={inputCls + ' font-bold'} placeholder="0" />
                            </div>
                        </div>
                    </FormSection>
                )}

                {(modalState.type === 'transfer' || modalState.type === 'topup-cash') && (
                    <FormSection title={modalState.type === 'transfer' ? 'Transfer Antar Rekening' : 'Top-up Kas Tunai'}>
                        <div>
                            <FieldLabel>Sumber Dana</FieldLabel>
                            <select name="fromCardId" value={form.fromCardId || ''} onChange={onFormChange} className={selectCls + ' font-bold'} required>
                                <option value="">Pilih Kartu Sumber...</option>
                                {cards.filter(c => c.cardType !== CardType.TUNAI).map(c => <option key={c.id} value={c.id}>{c.bankName} **** {c.lastFourDigits} (Saldo: {formatCurrency(c.balance)})</option>)}
                            </select>
                        </div>
                        <div>
                            <FieldLabel>Jumlah (IDR)</FieldLabel>
                            <RupiahInput value={String(form.amount ?? '')} onChange={(raw) => setForm((prev: any) => ({ ...prev, amount: raw }))} className={inputCls + ' font-bold text-blue-600 text-lg'} placeholder="0" required />
                        </div>
                    </FormSection>
                )}

                <div className="flex justify-end gap-3 pt-6 border-t border-brand-border/10">
                    <button type="button" onClick={onClose} className="px-6 py-3 rounded-xl font-bold text-brand-text-secondary hover:bg-brand-bg transition-colors">Batal</button>
                    <button type="submit" className="px-8 py-3 rounded-xl font-black text-white bg-blue-600 hover:bg-blue-700 shadow-lg shadow-blue-500/20 transition-all active:scale-95">
                        {modalState.mode === 'add' ? 'Simpan Data' : 'Update Data'}
                    </button>
                </div>
            </form>
        </Modal>
    );
};
