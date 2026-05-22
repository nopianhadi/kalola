import React from 'react';
import { CreditCardIcon, FileTextIcon, Trash2Icon, PencilIcon, CheckIcon, XIcon } from '@/constants';
import RupiahInput from '@/shared/form/RupiahInput';
import { Project, Transaction, Package, Card, PaymentStatus, TransactionType } from '@/types';
import { formatCurrency, normalizeTerminology, cleanProjectName } from '@/features/clients/utils/clients.utils';

interface ProjectPaymentCardProps {
    project: Project;
    transactions: Transaction[];
    packages: Package[];
    cards: Card[];
    newPayment: { amount: string, destinationCardId: string };
    newCharge: { name: string, amount: string };
    editingChargeId: string | null;
    editChargeData: { name: string, amount: string };
    onPaymentChange: (field: 'amount' | 'destinationCardId', value: string) => void;
    onPaymentSubmit: () => void;
    onChargeChange: (field: 'name' | 'amount', value: string) => void;
    onChargeSubmit: () => void;
    onDeleteCharge: (chargeId: string) => void;
    onStartEditCharge: (charge: any) => void;
    onSaveEditCharge: () => void;
    onCancelEditCharge: () => void;
    setEditChargeData: (data: any) => void;
    onViewReceipt: (transaction: Transaction) => void;
    onViewInvoice: (project: Project) => void;
    onDeleteProject: (projectId: string) => void;
}

const ProjectPaymentCard: React.FC<ProjectPaymentCardProps> = ({
    project,
    transactions,
    packages,
    cards,
    newPayment,
    newCharge,
    editingChargeId,
    editChargeData,
    onPaymentChange,
    onPaymentSubmit,
    onChargeChange,
    onChargeSubmit,
    onDeleteCharge,
    onStartEditCharge,
    onSaveEditCharge,
    onCancelEditCharge,
    setEditChargeData,
    onViewReceipt,
    onViewInvoice,
    onDeleteProject
}) => {
    const remainingBalance = project.totalCost - project.amountPaid;
    const displayProjectName = cleanProjectName(project.projectName);
    const pkg = packages.find(p => p.id === project.packageId) || null;
    const selectedAddOns = (project.addOns || []).filter(a => a && (a.name || a.id));

    const getStatusBadge = (status: PaymentStatus | null) => {
        switch (status) {
            case PaymentStatus.LUNAS:
                return <span className="px-2.5 py-1 rounded-full bg-green-500/10 text-green-400 text-[10px] font-bold border border-green-500/20 uppercase tracking-wider">Lunas</span>;
            case PaymentStatus.DP_TERBAYAR:
                return <span className="px-2.5 py-1 rounded-full bg-blue-500/10 text-blue-400 text-[10px] font-bold border border-blue-500/20 uppercase tracking-wider">DP Terbayar</span>;
            case PaymentStatus.BELUM_BAYAR:
            default:
                return <span className="px-2.5 py-1 rounded-full bg-red-500/10 text-red-400 text-[10px] font-bold border border-red-500/20 uppercase tracking-wider">Belum Bayar</span>;
        }
    };

    return (
        <div className="mb-8">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 mb-3">
                <div>
                    <h4 className="text-sm md:text-base font-bold text-brand-text-light">{displayProjectName || project.projectName}</h4>
                    <p className="text-[11px] text-brand-text-secondary">ID: #PRJ-{String(project.id).slice(-6).toUpperCase()} • {new Date(project.date).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
                </div>
                {getStatusBadge(project.paymentStatus)}
            </div>

            <div className="bg-brand-surface rounded-2xl border border-brand-border shadow-md overflow-hidden transition-all hover:shadow-lg hover:border-brand-accent/30 group">
                <div className="p-5 md:p-6 space-y-6">
                    {/* Top Info Grid */}
                    <div className="grid grid-cols-1 gap-6">
                        <div className="space-y-1">
                            <p className="text-[10px] font-black uppercase tracking-widest text-brand-text-secondary">Package Yang di Ambil</p>
                            <p className="text-sm font-semibold text-brand-text-light">{project.packageName || pkg?.name || '-'}</p>
                            {pkg && pkg.digitalItems.length > 0 && (
                                <div className="mt-1 text-[11px] text-brand-text-secondary space-y-0.5">
                                    {pkg.digitalItems.map((item, idx) => (
                                        <div key={idx} className="flex items-start gap-1.5">
                                            <span className="text-brand-accent mt-1">•</span>
                                            <span>{item}</span>
                                        </div>
                                    ))}
                                </div>
                            )}
                            {((project as any).durationSelection || '').trim() && (
                                <p className="text-[11px] text-brand-accent font-medium italic mt-1">{(project as any).durationSelection}</p>
                            )}
                        </div>
                    </div>

                    {/* Items & Costs Breakdown */}
                    <div className="bg-brand-bg/50 rounded-xl p-4 border border-brand-border/50">
                        <div className="space-y-3">
                            <div className="pb-2 border-b border-brand-border/30">
                                <div className="flex justify-between items-center text-xs mb-1">
                                    <span className="text-brand-text-secondary">Package Utama</span>
                                    <span className="font-bold text-brand-text-primary text-sm">{formatCurrency(project.totalCost - (project.customCosts?.reduce((sum, c) => sum + c.amount, 0) || 0) - (selectedAddOns.reduce((sum, a) => sum + (Number(a.price) || 0), 0)) - (Number(project.transportCost) || 0))}</span>
                                </div>
                            </div>

                            {selectedAddOns.length > 0 && (
                                <div className="space-y-2">
                                    {selectedAddOns.map((a, idx) => (
                                        <div key={a.id || a.name || idx} className="flex justify-between items-center text-xs">
                                            <span className="text-brand-text-secondary">+ {a.name} (Add-on)</span>
                                            <span className="font-semibold text-brand-text-primary">{formatCurrency(Number(a.price || 0))}</span>
                                        </div>
                                    ))}
                                </div>
                            )}

                            {project.transportCost && Number(project.transportCost) > 0 && (
                                <div className="flex justify-between items-center text-xs">
                                    <span className="text-brand-text-secondary">+ Biaya Transport</span>
                                    <span className="font-semibold text-brand-text-primary">{formatCurrency(Number(project.transportCost))}</span>
                                </div>
                            )}

                            {project.customCosts && project.customCosts.length > 0 && (
                                <div className="space-y-2 pt-1">
                                    {project.customCosts.map((c) => {
                                        const isEditing = String(editingChargeId) === String(c.id);
                                        return (
                                            <div key={c.id} className="flex flex-col gap-2 p-2 rounded-lg bg-orange-400/5 border border-orange-400/10 group/charge">
                                                {isEditing ? (
                                                    <div className="flex flex-col sm:flex-row gap-2">
                                                        <input
                                                            type="text"
                                                            value={editChargeData.name}
                                                            onChange={e => setEditChargeData({ ...editChargeData, name: e.target.value })}
                                                            className="flex-grow p-1.5 text-xs bg-brand-surface border border-brand-border rounded text-brand-text-light focus:border-brand-accent outline-none"
                                                        />
                                                        <RupiahInput
                                                            value={editChargeData.amount}
                                                            onChange={val => setEditChargeData({ ...editChargeData, amount: val })}
                                                            className="w-full sm:w-32 p-1.5 text-xs bg-brand-surface border border-brand-border rounded text-brand-text-light focus:border-brand-accent outline-none"
                                                        />
                                                        <div className="flex gap-1">
                                                            <button onClick={onSaveEditCharge} className="p-1.5 bg-green-500/20 text-green-400 rounded hover:bg-green-500/30 transition-all"><CheckIcon className="w-3.5 h-3.5" /></button>
                                                            <button onClick={onCancelEditCharge} className="p-1.5 bg-red-500/20 text-red-400 rounded hover:bg-red-500/30 transition-all"><XIcon className="w-3.5 h-3.5" /></button>
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <div className="flex justify-between items-center text-xs">
                                                        <div className="flex items-center gap-2">
                                                            <span className="text-orange-400 font-medium">+ {c.description}</span>
                                                            <div className="flex items-center opacity-0 group-hover/charge:opacity-100 transition-all">
                                                                <button onClick={() => onStartEditCharge(c)} className="p-1 text-blue-400 hover:text-blue-500 transition-all active:scale-90"><PencilIcon className="w-3 h-3" /></button>
                                                                <button onClick={() => onDeleteCharge(String(c.id))} className="p-1 text-red-400 hover:text-red-500 transition-all active:scale-90"><Trash2Icon className="w-3 h-3" /></button>
                                                            </div>
                                                        </div>
                                                        <span className="font-bold text-orange-400">{formatCurrency(c.amount)}</span>
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Financial Footer */}
                    <div className="flex flex-col md:flex-row justify-between items-end md:items-center gap-6 pt-4 border-t border-brand-border/50">
                        <div className="flex gap-4 md:gap-8 overflow-x-auto w-full md:w-auto pb-2 md:pb-0 scrollbar-hide">
                            <div className="flex-shrink-0">
                                <p className="text-[10px] font-black uppercase tracking-widest text-brand-text-secondary mb-1">Total Tagihan</p>
                                <p className="text-lg font-black text-brand-text-light tracking-tight">{formatCurrency(project.totalCost)}</p>
                            </div>
                            <div className="flex-shrink-0">
                                <p className="text-[10px] font-black uppercase tracking-widest text-green-400 mb-1">Terbayar</p>
                                <p className="text-lg font-black text-green-400 tracking-tight">{formatCurrency(project.amountPaid)}</p>
                            </div>
                            <div className="flex-shrink-0">
                                <p className="text-[10px] font-black uppercase tracking-widest text-red-400 mb-1">Sisa Tagihan</p>
                                <p className="text-lg font-black text-red-500 tracking-tight">{formatCurrency(remainingBalance)}</p>
                            </div>
                        </div>

                        <div className="flex items-center gap-2 w-full md:w-auto">
                            {project.dpProofUrl && (
                                <a href={project.dpProofUrl} target="_blank" rel="noopener noreferrer" className="flex-1 md:flex-none button-secondary !py-2 !px-4 text-xs inline-flex items-center justify-center gap-2 transition-all hover:bg-brand-surface group-hover:border-brand-accent/50">
                                    <CreditCardIcon className="w-4 h-4 text-brand-accent" /> Bukti DP
                                </a>
                            )}
                            <button 
                                onClick={() => window.location.hash = `#/client/${project.clientId}/edit?projectId=${project.id}`}
                                className="p-2.5 rounded-xl border border-brand-border text-brand-text-secondary hover:text-brand-accent hover:border-brand-accent/50 hover:bg-brand-accent/5 transition-all active:scale-95" 
                                title="Edit Rincian Paket & Acara"
                            >
                                <PencilIcon className="w-4 h-4" />
                            </button>
                            <button onClick={() => onViewInvoice(project)} className="flex-1 md:flex-none button-primary !bg-gradient-to-r from-brand-accent to-blue-600 !py-2 !px-4 text-xs inline-flex items-center justify-center gap-2 shadow-lg shadow-brand-accent/20 hover:scale-105 active:scale-95 transition-all">
                                <FileTextIcon className="w-4 h-4" /> Invoice PDF
                            </button>
                            <button onClick={() => onDeleteProject(String(project.id))} className="p-2.5 rounded-xl border border-brand-border text-brand-text-secondary hover:text-red-400 hover:border-red-400/50 hover:bg-red-400/5 transition-all active:scale-95" title="Hapus Acara Pernikahan">
                                <Trash2Icon className="w-4 h-4" />
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            <h4 className="text-sm md:text-base font-semibold text-brand-text-light mt-4 mb-1">Detail Transaksi Pembayaran</h4>
            <p className="text-xs text-brand-text-secondary mb-2">Riwayat semua pembayaran yang telah dilakukan untuk Acara Pernikahan ini</p>

            {/* Transactions Section */}
            <div className="space-y-4">
                <div className="md:hidden space-y-2">
                    {transactions.length > 0 ? transactions.map(t => (
                        <div key={t.id} className="rounded-xl bg-brand-surface border border-brand-border p-3 shadow-sm flex items-start justify-between active:scale-[0.98] transition-transform">
                            <div className="flex-1">
                                <div className="flex items-center gap-2 mb-1 flex-wrap">
                                    <p className="text-sm font-medium text-brand-text-light">{normalizeTerminology(t.description)}</p>
                                </div>
                                <p className="text-[11px] text-brand-text-secondary">{new Date(t.date).toLocaleDateString('id-ID')}</p>
                            </div>
                            <div className="text-right ml-3">
                                <p className={`text-sm font-bold mb-1.5 ${t.type === TransactionType.INCOME ? 'text-green-400' : 'text-red-400'}`}>{formatCurrency(t.amount)}</p>
                                <button onClick={() => onViewReceipt(t)} className="button-secondary !text-[10px] !px-2 !py-1 active:scale-95 transition-transform">Bukti</button>
                            </div>
                        </div>
                    )) : (
                        <p className="text-center p-4 text-brand-text-secondary bg-brand-surface rounded-xl border border-brand-border">Belum ada pembayaran.</p>
                    )}
                </div>

                <div className="hidden md:block border border-brand-border rounded-lg overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead className="bg-brand-bg"><tr><th className="p-3 text-left">Tanggal</th><th className="p-3 text-left">Deskripsi</th><th className="p-3 text-left">Kategori</th><th className="p-3 text-right">Jumlah</th><th className="p-3 text-center">Aksi</th></tr></thead>
                        <tbody>
                            {transactions.length > 0 ? transactions.map(t => (
                                <tr key={t.id} className="border-t border-brand-border hover:bg-brand-bg/50">
                                    <td className="p-3">{new Date(t.date).toLocaleDateString('id-ID')}</td>
                                    <td className="p-3 break-words min-w-[150px]">{normalizeTerminology(t.description)}</td>
                                    <td className="p-3 text-xs break-words">{normalizeTerminology(t.category || '-')}</td>
                                    <td className={`p-3 text-right font-semibold ${t.type === TransactionType.INCOME ? 'text-green-400' : 'text-red-400'}`}>{formatCurrency(t.amount)}</td>
                                    <td className="p-3 text-center">
                                        <button 
                                            onClick={() => onViewReceipt(t)} 
                                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-brand-bg border border-brand-border text-brand-text-secondary hover:text-brand-accent hover:border-brand-accent/50 transition-all active:scale-95 group/btn"
                                        >
                                            <FileTextIcon className="w-4 h-4 group-hover/btn:text-brand-accent" />
                                            <span className="text-[10px] font-black uppercase tracking-widest">Bukti</span>
                                        </button>
                                    </td>
                                </tr>
                            )) : (
                                <tr><td colSpan={5} className="text-center p-4">Belum ada pembayaran.</td></tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {remainingBalance > 0 && (
                <div className="mt-6">
                    <h4 className="text-sm text-brand-text-light font-semibold mb-3">Catat Pembayaran Baru</h4>
                    <div className="bg-brand-bg p-4 rounded-xl border border-brand-border border-dashed">
                        <div className="flex flex-col md:flex-row gap-4">
                            <div className="flex-1">
                                <RupiahInput value={newPayment.amount} onChange={val => onPaymentChange('amount', val)} className="input-field" placeholder="Jumlah" />
                            </div>
                            <div className="flex-1">
                                <select value={newPayment.destinationCardId} onChange={e => onPaymentChange('destinationCardId', e.target.value)} className="input-field">
                                    <option value="">Kartu Tujuan</option>
                                    {cards.map(c => <option key={c.id} value={c.id}>{c.bankName} {c.lastFourDigits}</option>)}
                                </select>
                            </div>
                            <button onClick={onPaymentSubmit} className="button-primary">Catat</button>
                        </div>
                    </div>
                </div>
            )}

            <div className="mt-6">
                <h4 className="text-sm text-brand-text-light font-semibold mb-3">Tambah Biaya Tambahan</h4>
                <div className="flex flex-col md:flex-row gap-4">
                    <input type="text" value={newCharge.name} onChange={e => onChargeChange('name', e.target.value)} className="input-field flex-grow" placeholder="Nama Biaya" />
                    <RupiahInput value={newCharge.amount} onChange={val => onChargeChange('amount', val)} className="input-field w-full md:w-32" placeholder="Jumlah" />
                    <button onClick={onChargeSubmit} className="button-secondary">Tambah</button>
                </div>
            </div>
        </div>
    );
};

export default ProjectPaymentCard;
