import React, { useState, forwardRef, useImperativeHandle } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { PromoCode } from '@/types';
import PageHeader from '@/layouts/PageHeader';
import Modal from '@/shared/ui/Modal';
import { PlusIcon, PencilIcon, Trash2Icon, PackageIcon, DollarSignIcon, CalendarIcon } from '@/constants';
import { createPromoCode, updatePromoCode, deletePromoCode } from '@/services/promoCodes';
import CollapsibleSection from '@/shared/ui/CollapsibleSection';
import { usePromoCodes } from '@/features/promo/api/usePromoQueries';
import { useProjects } from '@/features/projects/api/useProjects';
import { useApp } from "@/app/AppContext";


const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(amount);
}

const emptyFormState = {
    code: '',
    discountType: 'percentage' as 'percentage' | 'fixed',
    discountValue: '',
    isActive: true,
    maxUsage: '',
    expiryDate: ''
};

interface PromoCodesProps {
    hideHeader?: boolean;
}


export interface PromoCodesHandle {
    openAddModal: () => void;
}

const PromoCodes = forwardRef<PromoCodesHandle, PromoCodesProps>(({ hideHeader }, ref) => {
    const queryClient = useQueryClient();
    const { showNotification } = useApp();

    // Data Hooks
    const { data: qPromoCodes } = usePromoCodes();
    const { data: qProjects } = useProjects({ limit: 1000 });

    const promoCodes = qPromoCodes || [];
    const projects = qProjects || [];

    const invalidate = () => queryClient.invalidateQueries({ queryKey: ['promoCodes'] });

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [modalMode, setModalMode] = useState<'add' | 'edit'>('add');
    const [selectedCode, setSelectedCode] = useState<PromoCode | null>(null);
    const [formData, setFormData] = useState(emptyFormState);

    const handleOpenModal = (mode: 'add' | 'edit', code?: PromoCode) => {
        setModalMode(mode);
        if (mode === 'edit' && code) {
            setSelectedCode(code);
            setFormData({
                code: code.code,
                discountType: code.discountType,
                discountValue: code.discountValue.toString(),
                isActive: code.isActive,
                maxUsage: code.maxUsage?.toString() || '',
                expiryDate: code.expiryDate || '',
            });
        } else {
            setSelectedCode(null);
            setFormData(emptyFormState);
        }
        setFormData(prev => ({ ...prev, ...emptyFormState }));
        setIsModalOpen(true);
    };

    useImperativeHandle(ref, () => ({
        openAddModal: () => handleOpenModal('add')
    }));

    const handleCloseModal = () => {
        setIsModalOpen(false);
    };

    const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value, type } = e.target;
        const isCheckbox = type === 'checkbox';
        const checked = isCheckbox ? (e.target as HTMLInputElement).checked : false;

        setFormData(prev => ({
            ...prev,
            [name]: isCheckbox ? checked : value
        }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        try {
            if (modalMode === 'add') {
                const created = await createPromoCode({
                    code: formData.code.toUpperCase(),
                    discountType: formData.discountType,
                    discountValue: Number(formData.discountValue),
                    isActive: formData.isActive,
                    maxUsage: formData.maxUsage ? Number(formData.maxUsage) : undefined,
                    expiryDate: formData.expiryDate || undefined,
                } as any);
                invalidate();
                showNotification(`Kode promo "${created.code}" berhasil dibuat.`);

            } else if (selectedCode) {
                const updated = await updatePromoCode(selectedCode.id, {
                    code: formData.code.toUpperCase(),
                    discountType: formData.discountType,
                    discountValue: Number(formData.discountValue),
                    isActive: formData.isActive,
                    maxUsage: formData.maxUsage ? Number(formData.maxUsage) : undefined,
                    expiryDate: formData.expiryDate || undefined,
                } as any);
                invalidate();
                showNotification(`Kode promo "${updated.code}" berhasil diperbarui.`);

            }
        } catch (err) {
            alert('Gagal menyimpan kode promo ke database. Coba lagi.');
            return;
        }
        handleCloseModal();
    };

    const handleDelete = async (codeId: number) => {
        const isUsed = projects.some(p => p.promoCodeId === codeId);
        if (isUsed) {
            showNotification('Kode promo tidak dapat dihapus karena sedang digunakan pada Acara Pernikahan.');
            return;
        }
        if (!window.confirm("Apakah Anda yakin ingin menghapus kode promo ini?")) return;
        try {
            await deletePromoCode(codeId);
            invalidate();
            showNotification('Kode promo berhasil dihapus.');
        } catch (err) {

            alert('Gagal menghapus kode promo di database. Coba lagi.');
        }
    };

    return (
        <div className="space-y-6">
            {!hideHeader && (
                <PageHeader 
                    title="Kode Promo & Diskon" 
                    subtitle="Buat penawaran terbatas dan kode voucher untuk menarik minat calon pengantin." 
                    icon={<PackageIcon className="w-6 h-6" />}
                >
                    <button 
                        onClick={() => handleOpenModal('add')} 
                        className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white text-blue-600 hover:bg-blue-50 transition-all text-xs sm:text-sm font-black shadow-lg shadow-blue-900/40"
                    >
                        <PlusIcon className="w-5 h-5" />
                        <span>Buat Kode Promo</span>
                    </button>
                </PageHeader>
            )}

            {/* Desktop Table View - Premium Styled */}
            <div className="hidden md:block relative group animate-in fade-in zoom-in-95 duration-500">
                <div className="absolute -inset-0.5 bg-gradient-to-r from-brand-accent/20 to-blue-500/20 rounded-2xl blur opacity-30 group-hover:opacity-50 transition duration-1000"></div>
                <div className="relative bg-white/80 backdrop-blur-xl rounded-2xl shadow-xl border border-white/60 overflow-hidden">
                    <table className="w-full">
                        <thead>
                            <tr className="bg-brand-accent/5 border-b border-brand-border/40">
                                <th className="px-6 py-4 text-left text-[10px] font-black uppercase tracking-widest text-brand-text-secondary">Kode Promo</th>
                                <th className="px-6 py-4 text-left text-[10px] font-black uppercase tracking-widest text-brand-text-secondary">Nilai Diskon</th>
                                <th className="px-6 py-4 text-left text-[10px] font-black uppercase tracking-widest text-brand-text-secondary">Status</th>
                                <th className="px-6 py-4 text-left text-[10px] font-black uppercase tracking-widest text-brand-text-secondary">Kupon Digunakan</th>
                                <th className="px-6 py-4 text-left text-[10px] font-black uppercase tracking-widest text-brand-text-secondary">Kadaluwarsa</th>
                                <th className="px-6 py-4 text-right text-[10px] font-black uppercase tracking-widest text-brand-text-secondary">Kelola</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-brand-border/20">
                            {promoCodes.map(code => (
                                <tr key={code.id} className="group/row hover:bg-brand-accent/5 transition-all duration-300">
                                    <td className="px-6 py-5">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-lg bg-brand-accent/10 flex items-center justify-center font-black text-brand-accent group-hover/row:scale-110 transition-transform">
                                                %
                                            </div>
                                            <div>
                                                <p className="font-black text-brand-text-light tracking-widest uppercase">{code.code}</p>
                                                <button 
                                                    onClick={() => {
                                                        navigator.clipboard.writeText(code.code);
                                                        showNotification('Kode promo disalin!');
                                                    }}
                                                    className="text-[9px] font-black text-brand-accent uppercase tracking-tighter hover:underline"
                                                >
                                                    Salin Kode
                                                </button>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-5">
                                        <p className="text-lg font-black text-brand-text-light">
                                            {code.discountType === 'percentage'
                                                ? `${code.discountValue}%`
                                                : formatCurrency(code.discountValue)}
                                        </p>
                                        <p className="text-[10px] font-bold text-brand-text-secondary uppercase">{code.discountType === 'percentage' ? 'Persentase' : 'Potongan Harga'}</p>
                                    </td>
                                    <td className="px-6 py-5">
                                        <div className="flex items-center gap-2">
                                            <div className={`w-2 h-2 rounded-full ${code.isActive ? 'bg-green-500 animate-pulse shadow-[0_0_8px_rgba(34,197,94,0.6)]' : 'bg-red-400'}`}></div>
                                            <span className={`text-[10px] font-black uppercase tracking-widest ${code.isActive ? 'text-green-600' : 'text-red-500'}`}>
                                                {code.isActive ? 'Berjalan' : 'Berhenti'}
                                            </span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-5">
                                        <div className="flex flex-col gap-1 w-24">
                                            <div className="flex justify-between text-[10px] font-black text-brand-text-secondary uppercase">
                                                <span>{code.usageCount} Terpakai</span>
                                                <span>{code.maxUsage ?? '∞'}</span>
                                            </div>
                                            <div className="h-1.5 w-full bg-brand-border/40 rounded-full overflow-hidden">
                                                <div 
                                                    className="h-full bg-brand-accent rounded-full" 
                                                    style={{ width: `${code.maxUsage ? Math.min((code.usageCount / code.maxUsage) * 100, 100) : 100}%` }}
                                                ></div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-5">
                                        <p className="text-xs font-black text-brand-text-secondary uppercase tracking-tighter">
                                            {code.expiryDate ? new Date(code.expiryDate).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' }) : 'Selamanya'}
                                        </p>
                                    </td>
                                    <td className="px-6 py-5">
                                        <div className="flex items-center justify-end gap-2">
                                            <button 
                                                onClick={() => handleOpenModal('edit', code)} 
                                                className="p-2 rounded-xl bg-blue-600/10 text-blue-600 hover:bg-blue-600 hover:text-white transition-all duration-300" 
                                                title="Edit"
                                            >
                                                <PencilIcon className="w-4 h-4" />
                                            </button>
                                            <button 
                                                onClick={() => handleDelete(code.id)} 
                                                className="p-2 rounded-xl bg-red-600/10 text-red-600 hover:bg-red-600 hover:text-white transition-all duration-300" 
                                                title="Hapus"
                                            >
                                                <Trash2Icon className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>


            {/* Mobile Card View - Premium Glass Style */}
            <div className="md:hidden space-y-6">
                {promoCodes.length === 0 ? (
                    <div className="bg-white/60 backdrop-blur-xl p-12 rounded-[2rem] text-center border border-white/60 shadow-lg">
                        <div className="w-16 h-16 bg-brand-accent/10 rounded-full flex items-center justify-center mx-auto mb-4">
                            <PackageIcon className="w-8 h-8 text-brand-accent opacity-50" />
                        </div>
                        <p className="text-brand-text-secondary font-bold text-sm">Belum ada promo aktif</p>
                    </div>
                ) : (
                    promoCodes.map(code => (
                        <div key={code.id} className="relative group animate-in fade-in slide-in-from-bottom-4 duration-500">
                            <div className="absolute -inset-0.5 bg-gradient-to-r from-brand-accent/20 to-blue-500/20 rounded-[2rem] blur opacity-25"></div>
                            <div className="relative bg-white/80 backdrop-blur-xl rounded-[2rem] shadow-xl border border-white/60 overflow-hidden">
                                {/* Card Header */}
                                <div className={`p-5 flex items-center justify-between ${code.isActive ? 'bg-green-500/5' : 'bg-red-500/5'}`}>
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-xl bg-brand-accent flex items-center justify-center font-black text-white shadow-lg shadow-brand-accent/20">
                                            %
                                        </div>
                                        <div>
                                            <p className="text-[10px] font-black text-brand-text-secondary uppercase tracking-widest">Kupon Promo</p>
                                            <p className="text-lg font-black text-brand-text-light tracking-widest uppercase">{code.code}</p>
                                        </div>
                                    </div>
                                    <div className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest ${code.isActive ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-500'}`}>
                                        {code.isActive ? 'Aktif' : 'Off'}
                                    </div>
                                </div>

                                {/* Card Body */}
                                <div className="p-5 space-y-4">
                                    <div className="flex items-end justify-between border-b border-brand-border/40 pb-4">
                                        <div>
                                            <p className="text-[10px] font-black text-brand-text-secondary uppercase tracking-widest mb-1">Besar Potongan</p>
                                            <p className="text-3xl font-black text-brand-accent leading-none">
                                                {code.discountType === 'percentage'
                                                    ? `${code.discountValue}%`
                                                    : formatCurrency(code.discountValue)}
                                            </p>
                                        </div>
                                        <button 
                                            onClick={() => {
                                                navigator.clipboard.writeText(code.code);
                                                showNotification('Kode disalin!');
                                            }}
                                            className="px-4 py-2 rounded-xl bg-brand-accent/10 text-brand-accent text-[10px] font-black uppercase tracking-widest hover:bg-brand-accent hover:text-white transition-all"
                                        >
                                            Salin
                                        </button>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <p className="text-[10px] font-black text-brand-text-secondary uppercase tracking-widest mb-1">Kuota</p>
                                            <p className="text-sm font-black text-brand-text-light">{code.usageCount} / {code.maxUsage ?? '∞'}</p>
                                        </div>
                                        <div>
                                            <p className="text-[10px] font-black text-brand-text-secondary uppercase tracking-widest mb-1">Berakhir</p>
                                            <p className="text-sm font-black text-brand-text-light">{code.expiryDate ? new Date(code.expiryDate).toLocaleDateString('id-ID', { day: '2-digit', month: 'short' }) : '∞'}</p>
                                        </div>
                                    </div>
                                </div>

                                {/* Card Actions */}
                                <div className="p-4 bg-brand-bg/50 border-t border-brand-border/40 flex gap-2">
                                    <button 
                                        onClick={() => handleOpenModal('edit', code)} 
                                        className="flex-1 py-3 rounded-xl bg-blue-600/10 text-blue-600 font-black text-[10px] uppercase tracking-widest hover:bg-blue-600 hover:text-white transition-all"
                                    >
                                        Edit
                                    </button>
                                    <button 
                                        onClick={() => handleDelete(code.id)} 
                                        className="flex-1 py-3 rounded-xl bg-red-600/10 text-red-600 font-black text-[10px] uppercase tracking-widest hover:bg-red-600 hover:text-white transition-all"
                                    >
                                        Hapus
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>


            <Modal isOpen={isModalOpen} onClose={handleCloseModal} title={modalMode === 'add' ? 'Buat Kode promo Baru' : 'Edit Kode promo'} size="2xl">
                <form onSubmit={handleSubmit} className="space-y-6">
                    <CollapsibleSection title="Detail Identitas promo" defaultExpanded={true} variant="filled" icon={<PackageIcon className="w-4 h-4" />}>
                        <div className="space-y-4">
                            <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 mb-4">
                                <p className="text-[10px] text-blue-600 font-black uppercase tracking-widest leading-relaxed">
                                    💡 Tip: Kode promo yang unik dan mudah diingat akan lebih menarik bagi calon pengantin Anda.
                                </p>
                            </div>

                            <div className="input-group">
                                <label className="text-[10px] uppercase font-black tracking-widest text-brand-text-secondary mb-1 block">Kode promo (Kapital)</label>
                                <input
                                    type="text"
                                    name="code"
                                    value={formData.code}
                                    onChange={handleFormChange}
                                    className="w-full px-4 py-3 rounded-xl border border-brand-border bg-white font-black text-blue-600 text-lg tracking-widest uppercase focus:ring-2 focus:ring-blue-500/20 transition-all"
                                    placeholder="CTH: PROMO2024"
                                    required
                                />
                            </div>

                            <div className="flex items-center gap-3 p-4 bg-brand-surface border border-brand-border rounded-xl">
                                <input
                                    type="checkbox"
                                    id="isActive"
                                    name="isActive"
                                    checked={formData.isActive}
                                    onChange={handleFormChange}
                                    className="w-5 h-5 rounded-lg text-blue-600 focus:ring-blue-500/20 transition-all cursor-pointer"
                                />
                                <div>
                                    <label htmlFor="isActive" className="text-xs font-black text-brand-text-light cursor-pointer block uppercase tracking-wide">Status Aktif promo</label>
                                    <p className="text-[10px] text-brand-text-secondary">Hanya promo aktif yang dapat digunakan pada transaksi.</p>
                                </div>
                            </div>
                        </div>
                    </CollapsibleSection>

                    <CollapsibleSection title="Nilai & Tipe Diskon" defaultExpanded={true} variant="filled" icon={<DollarSignIcon className="w-4 h-4" />}>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="input-group">
                                <label className="text-[10px] uppercase font-black tracking-widest text-brand-text-secondary mb-1 block">Jenis Diskon</label>
                                <select
                                    name="discountType"
                                    value={formData.discountType}
                                    onChange={handleFormChange}
                                    className="w-full px-4 py-3 rounded-xl border border-brand-border bg-white font-bold text-brand-text-light appearance-none"
                                >
                                    <option value="percentage">Persentase (%)</option>
                                    <option value="fixed">Nominal Tetap (Rp)</option>
                                </select>
                            </div>
                            <div className="input-group">
                                <label className="text-[10px] uppercase font-black tracking-widest text-brand-text-secondary mb-1 block">
                                    {formData.discountType === 'percentage' ? 'Besar Persentase' : 'Nominal Diskon'}
                                </label>
                                <div className="relative">
                                    {formData.discountType === 'fixed' && <span className="absolute left-4 top-1/2 -translate-y-1/2 font-bold text-brand-text-secondary text-sm">Rp</span>}
                                    <input
                                        type="number"
                                        name="discountValue"
                                        value={formData.discountValue}
                                        onChange={handleFormChange}
                                        className={`w-full px-4 py-3 rounded-xl border border-brand-border bg-white font-black text-brand-text-light ${formData.discountType === 'fixed' ? 'pl-10' : ''}`}
                                        placeholder="0"
                                        min="0"
                                        max={formData.discountType === 'percentage' ? '100' : undefined}
                                        required
                                    />
                                    {formData.discountType === 'percentage' && <span className="absolute right-4 top-1/2 -translate-y-1/2 font-bold text-brand-text-secondary text-sm">%</span>}
                                </div>
                            </div>
                        </div>
                    </CollapsibleSection>

                    <CollapsibleSection title="Batasan & Masa Berlaku" defaultExpanded={true} variant="filled" icon={<CalendarIcon className="w-4 h-4" />}>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="input-group">
                                <label className="text-[10px] uppercase font-black tracking-widest text-brand-text-secondary mb-1 block">Maksimal Penggunaan</label>
                                <input
                                    type="number"
                                    name="maxUsage"
                                    value={formData.maxUsage}
                                    onChange={handleFormChange}
                                    className="w-full px-4 py-3 rounded-xl border border-brand-border bg-white font-bold"
                                    placeholder="Kosongkan untuk ∞"
                                    min="0"
                                />
                            </div>
                            <div className="input-group">
                                <label className="text-[10px] uppercase font-black tracking-widest text-brand-text-secondary mb-1 block">Tanggal Kadaluwarsa</label>
                                <input
                                    type="date"
                                    name="expiryDate"
                                    value={formData.expiryDate}
                                    onChange={handleFormChange}
                                    className="w-full px-4 py-3 rounded-xl border border-brand-border bg-white font-bold"
                                />
                            </div>
                        </div>
                    </CollapsibleSection>

                    <div className="flex justify-end gap-3 pt-6 border-t border-brand-border">
                        <button type="button" onClick={handleCloseModal} className="px-8 py-3 rounded-xl font-bold text-brand-text-secondary hover:bg-brand-bg transition-colors">Batal</button>
                        <button type="submit" className="px-10 py-3 rounded-xl font-black text-white bg-blue-600 hover:bg-blue-700 shadow-xl shadow-blue-500/20 transition-all active:scale-95">
                            {modalMode === 'add' ? 'Simpan promo' : 'Update promo'}
                        </button>
                    </div>
                </form>
            </Modal>
        </div>
    );
});

export default PromoCodes;

