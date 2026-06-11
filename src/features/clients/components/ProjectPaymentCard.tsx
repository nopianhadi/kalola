import React from 'react';
import { CreditCardIcon, FileTextIcon, Trash2Icon, PencilIcon, CheckIcon, XIcon } from '@/constants';
import { MoreHorizontalIcon } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
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
    const navigate = useNavigate();
    const [isPaymentFormOpen, setIsPaymentFormOpen] = React.useState(false);
    const [isChargeFormOpen, setIsChargeFormOpen] = React.useState(false);
    const remainingBalance = project.totalCost - project.amountPaid;
    const displayProjectName = cleanProjectName(project.projectName);
    const pkg = packages.find(p => String(p.id) === String(project.packageId)) || null;
    const selectedAddOns = (project.addOns || []).filter(a => a && (a.name || a.id));

    const getStatusBadge = (status: PaymentStatus | null) => {
        switch (status) {
            case PaymentStatus.LUNAS:
                return <span className="px-2.5 py-1 rounded-full bg-green-600 text-white text-[10px] font-bold border border-green-600 uppercase tracking-wider">Lunas</span>;
            case PaymentStatus.DP_TERBAYAR:
                return <span className="px-2.5 py-1 rounded-full bg-blue-600 text-white text-[10px] font-bold border border-blue-600 uppercase tracking-wider">DP Terbayar</span>;
            case PaymentStatus.BELUM_BAYAR:
            default:
                return <span className="px-2.5 py-1 rounded-full bg-red-600 text-white text-[10px] font-bold border border-red-600 uppercase tracking-wider">Belum Bayar</span>;
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

            <div className="bg-brand-surface/75 backdrop-blur-xl rounded-2xl border border-brand-border/60 shadow-lg overflow-hidden transition-all duration-300 hover:shadow-xl hover:border-brand-accent/40 group">
                <div className="p-5 md:p-6 space-y-6">
                    {/* Top Info Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Package Info + Description */}
                        <div className="space-y-2">
                            <p className="text-[10px] font-black uppercase tracking-widest text-brand-text-secondary">Paket Dipilih</p>
                            <p className="text-sm font-bold text-brand-text-light">{project.packageName || pkg?.name || '-'}</p>
                            {((project as any).durationSelection || '').trim() && (
                                <p className="text-[11px] text-brand-accent font-medium italic">{(project as any).durationSelection}</p>
                            )}
                            {/* Package digital items / description */}
                            {pkg && pkg.digitalItems && pkg.digitalItems.length > 0 && (
                                <div className="mt-2 pt-2 border-t border-brand-border/30">
                                    <p className="text-[9px] font-black uppercase tracking-widest text-brand-text-secondary mb-1.5">Deskripsi Paket</p>
                                    <div className="space-y-1">
                                        {pkg.digitalItems.map((item, idx) => (
                                            <div key={idx} className="flex items-start gap-1.5 text-[11px] text-brand-text-secondary">
                                                <span className="text-brand-accent mt-0.5 shrink-0">•</span>
                                                <span>{item}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                            {/* Physical items / vendor */}
                            {pkg && pkg.physicalItems && pkg.physicalItems.length > 0 && (
                                <div className="mt-2 pt-2 border-t border-brand-border/30">
                                    <p className="text-[9px] font-black uppercase tracking-widest text-brand-text-secondary mb-1.5">Vendor (Allpackage)</p>
                                    <div className="space-y-1">
                                        {pkg.physicalItems.map((item, idx) => (
                                            <div key={idx} className="flex items-start gap-1.5 text-[11px] text-brand-text-secondary">
                                                <span className="text-indigo-400 mt-0.5 shrink-0">•</span>
                                                <span>{item.name}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Add-ons */}
                        <div className="space-y-2">
                            <p className="text-[10px] font-black uppercase tracking-widest text-brand-text-secondary">Add-On Dipilih</p>
                            {selectedAddOns.length > 0 ? (
                                <div className="space-y-1.5">
                                    {selectedAddOns.map((a, idx) => (
                                        <div key={a.id || a.name || idx} className="flex justify-between items-center p-2.5 px-3 bg-brand-bg rounded-xl border border-brand-border/50 text-xs">
                                            <span className="font-semibold text-brand-text-light">{a.name}</span>
                                            <span className="font-bold text-brand-accent">{formatCurrency(Number(a.price || 0))}</span>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <p className="text-[11px] text-brand-text-secondary italic">Tidak ada add-on</p>
                            )}
                        </div>
                    </div>

                    {/* Items & Costs Breakdown */}
                    <div className="bg-brand-bg/30 backdrop-blur-sm rounded-xl p-4 border border-brand-border/40 shadow-[inset_0_1px_2px_rgba(0,0,0,0.01)]">
                        <div className="space-y-3">
                            <div className="pb-2 border-b border-brand-border/30">
                                <div className="flex justify-between items-center text-xs mb-1">
                                    <span className="text-brand-text-secondary">Paket Utama</span>
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

                            {Number(project.transportCost) > 0 && (
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
                                                            <div className="flex items-center opacity-100 md:opacity-0 md:group-hover/charge:opacity-100 transition-all">
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
                            <button onClick={() => onViewInvoice(project)} className="flex-1 md:flex-none button-primary !bg-gradient-to-r from-brand-accent to-blue-600 !py-2 !px-4 text-xs inline-flex items-center justify-center gap-2 shadow-lg shadow-brand-accent/20 hover:scale-105 active:scale-95 transition-all">
                                <FileTextIcon className="w-4 h-4" /> Invoice PDF
                            </button>
                            <details className="relative">
                                <summary className="list-none inline-flex h-10 w-10 cursor-pointer items-center justify-center rounded-xl border border-brand-border text-brand-text-secondary hover:border-brand-accent/50 hover:text-brand-accent">
                                    <MoreHorizontalIcon className="w-4 h-4" />
                                </summary>
                                <div className="absolute right-0 z-20 mt-1 w-44 rounded-xl border border-brand-border bg-brand-surface p-1 text-left shadow-xl">
                                    <button
                                        onClick={() => navigate(`/clients/edit/${project.clientId}?projectId=${project.id}`)}
                                        className="w-full flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-semibold text-brand-text-primary hover:bg-brand-bg"
                                    >
                                        <PencilIcon className="w-4 h-4" /> Edit Acara
                                    </button>
                                    <button
                                        onClick={() => onDeleteProject(String(project.id))}
                                        className="w-full flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-semibold text-red-500 hover:bg-red-500/10"
                                    >
                                        <Trash2Icon className="w-4 h-4" /> Hapus Acara
                                    </button>
                                </div>
                            </details>
                        </div>
                    </div>
                </div>
            </div>

            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mt-6 mb-4 gap-4">
                <div>
                    <h4 className="text-sm md:text-base font-semibold text-brand-text-light mb-1">Detail Transaksi Pembayaran</h4>
                    <p className="text-xs text-brand-text-secondary">Riwayat semua pembayaran yang telah dilakukan untuk Acara Pernikahan ini</p>
                </div>
                <div className="flex gap-2 w-full md:w-auto">
                    <button
                        type="button"
                        onClick={() => setIsChargeFormOpen(prev => !prev)}
                        className="button-secondary w-full md:w-auto text-xs py-2 shadow-sm"
                    >
                        {isChargeFormOpen ? 'Tutup Form Biaya' : '+ Biaya Tambahan'}
                    </button>
                    {remainingBalance > 0 && (
                        <button
                            type="button"
                            onClick={() => setIsPaymentFormOpen(prev => !prev)}
                            className="button-primary w-full md:w-auto text-xs py-2 shadow-lg shadow-brand-accent/20"
                        >
                            {isPaymentFormOpen ? 'Tutup Form Pembayaran' : 'Catat Pembayaran'}
                        </button>
                    )}
                </div>
            </div>

            {isPaymentFormOpen && remainingBalance > 0 && (
                <div className="mb-4 bg-brand-bg p-4 rounded-xl border border-brand-border border-dashed animate-in fade-in slide-in-from-top-2">
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
                        <button
                            onClick={() => {
                                onPaymentSubmit();
                                setIsPaymentFormOpen(false);
                            }}
                            className="button-primary"
                        >
                            Simpan Pembayaran
                        </button>
                    </div>
                </div>
            )}

            {isChargeFormOpen && (
                <div className="mb-4 flex flex-col md:flex-row gap-4 rounded-xl border border-brand-border border-dashed bg-brand-bg p-4 animate-in fade-in slide-in-from-top-2">
                    <input type="text" value={newCharge.name} onChange={e => onChargeChange('name', e.target.value)} className="input-field flex-grow" placeholder="Nama Biaya" />
                    <RupiahInput value={newCharge.amount} onChange={val => onChargeChange('amount', val)} className="input-field w-full md:w-32" placeholder="Jumlah" />
                    <button
                        onClick={() => {
                            onChargeSubmit();
                            setIsChargeFormOpen(false);
                        }}
                        className="button-secondary"
                    >
                        Simpan Biaya
                    </button>
                </div>
            )}

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
                                <button onClick={() => onViewReceipt(t)} title="Lihat Bukti" className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-brand-surface border border-brand-border text-brand-text-secondary active:scale-95 transition-transform"><FileTextIcon className="w-4 h-4" /></button>
                            </div>
                        </div>
                    )) : (
                        <p className="text-center p-4 text-brand-text-secondary bg-brand-surface rounded-xl border border-brand-border">Belum ada pembayaran.</p>
                    )}
                </div>

                <div className="hidden md:block rounded-xl overflow-hidden border border-brand-border/60 bg-brand-surface/40 backdrop-blur-sm shadow-sm">
                    <table className="w-full text-sm" style={{ borderCollapse: 'separate', borderSpacing: 0 }}>
                        <thead>
                            <tr className="bg-brand-bg/80 border-b border-brand-border/60">
                                <th className="p-3.5 text-left text-[10px] font-black text-brand-text-secondary uppercase tracking-wider border-b border-r border-brand-border/40 last:border-r-0">Tanggal</th>
                                <th className="p-3.5 text-left text-[10px] font-black text-brand-text-secondary uppercase tracking-wider border-b border-r border-brand-border/40 last:border-r-0">Deskripsi</th>
                                <th className="p-3.5 text-left text-[10px] font-black text-brand-text-secondary uppercase tracking-wider border-b border-r border-brand-border/40 last:border-r-0">Kategori</th>
                                <th className="p-3.5 text-right text-[10px] font-black text-brand-text-secondary uppercase tracking-wider border-b border-r border-brand-border/40 last:border-r-0">Jumlah</th>
                                <th className="p-3.5 text-center text-[10px] font-black text-brand-text-secondary uppercase tracking-wider border-b last:border-r-0">Aksi</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-brand-border/30">
                            {transactions.length > 0 ? transactions.map((t) => (
                                <tr key={t.id} className="hover:bg-brand-accent/[0.02] hover:shadow-[inset_3px_0_0_0_var(--color-accent)] transition-all duration-300">
                                    <td className="p-3.5 border-r border-brand-border/30 whitespace-nowrap text-brand-text-primary text-xs font-semibold">{new Date(t.date).toLocaleDateString('id-ID')}</td>
                                    <td className="p-3.5 break-words min-w-[150px] border-r border-brand-border/30 text-brand-text-primary text-xs font-bold">{normalizeTerminology(t.description)}</td>
                                    <td className="p-3.5 text-xs break-words border-r border-brand-border/30 text-brand-text-secondary font-medium">{normalizeTerminology(t.category || '-')}</td>
                                    <td className={`p-3.5 text-right font-black border-r border-brand-border/30 text-xs ${t.type === TransactionType.INCOME ? 'text-green-600' : 'text-rose-500'}`}>{formatCurrency(t.amount)}</td>
                                    <td className="p-3.5 text-center align-middle">
                                        <button 
                                            onClick={() => onViewReceipt(t)} 
                                            title="Lihat Bukti"
                                            className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-white border border-brand-border/60 text-brand-text-secondary hover:text-brand-accent hover:border-brand-accent/50 transition-all active:scale-95 shadow-sm"
                                        >
                                            <FileTextIcon className="w-4 h-4" />
                                        </button>
                                    </td>
                                </tr>
                            )) : (
                                <tr><td colSpan={5} className="text-center p-8 text-brand-text-secondary font-semibold text-xs">Belum ada pembayaran.</td></tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default ProjectPaymentCard;
