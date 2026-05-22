import React from 'react';
import Modal from '@/shared/ui/Modal';
import CollapsibleSection from '@/shared/ui/CollapsibleSection';
import RupiahInput from '@/shared/form/RupiahInput';
import { UsersIcon } from '@/constants';
import { TeamFormProps } from '../types';

export const TeamForm: React.FC<TeamFormProps> = ({
    isOpen = false,
    onClose = () => {},
    mode,
    formData,
    setFormData,
    onChange,
    onSubmit,
    selectedMember,
    inline = false
}) => {
    const formContent = (
        <form onSubmit={onSubmit} className="space-y-6">
            <CollapsibleSection title="Informasi Utama" defaultExpanded={true} variant="filled">
                <div className="space-y-4">
                    <div className="bg-blue-600/5 border border-blue-600/10 rounded-2xl p-5 mb-4">
                        <h4 className="text-sm font-bold text-blue-600 mb-2 flex items-center gap-2 uppercase tracking-wider">
                            <UsersIcon className="w-4 h-4" />
                            Informasi Tim / Vendor
                        </h4>
                        <p className="text-xs text-brand-text-secondary leading-relaxed font-medium">
                            Tambahkan data lengkap Tim / Vendor yang akan bekerja sama dengan Anda untuk manajemen proyek dan pembayaran.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label className="text-[10px] uppercase font-bold tracking-widest text-brand-text-secondary">Nama Lengkap</label>
                            <input type="text" id="name" name="name" value={formData.name} onChange={onChange} className="w-full px-4 py-3 rounded-2xl border border-brand-border bg-white placeholder:text-brand-text-secondary/30 focus:ring-2 focus:ring-blue-500 outline-none transition-all font-semibold" placeholder="Nama Lengkap" required />
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] uppercase font-bold tracking-widest text-brand-text-secondary">Peran / Jabatan</label>
                            <input type="text" id="role" name="role" value={formData.role} onChange={onChange} className="w-full px-4 py-3 rounded-2xl border border-brand-border bg-white placeholder:text-brand-text-secondary/30 focus:ring-2 focus:ring-blue-500 outline-none transition-all font-semibold" placeholder="Cth: Fotografer" required />
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label className="text-[10px] uppercase font-bold tracking-widest text-brand-text-secondary">Email</label>
                            <input type="email" id="email" name="email" value={formData.email} onChange={onChange} className="w-full px-4 py-3 rounded-2xl border border-brand-border bg-white placeholder:text-brand-text-secondary/30 focus:ring-2 focus:ring-blue-500 outline-none transition-all" placeholder="email@contoh.com" />
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] uppercase font-bold tracking-widest text-brand-text-secondary">Nomor Telepon / WhatsApp</label>
                            <input type="tel" id="p_phone" name="phone" value={formData.phone} onChange={onChange} className="w-full px-4 py-3 rounded-2xl border border-brand-border bg-white placeholder:text-brand-text-secondary/30 focus:ring-2 focus:ring-blue-500 outline-none transition-all font-mono" placeholder="08xxxxxxxx" />
                        </div>
                    </div>
                </div>
            </CollapsibleSection>

            <CollapsibleSection title="Detail Administratif" defaultExpanded={true} variant="filled">
                <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label className="text-[10px] uppercase font-bold tracking-widest text-brand-text-secondary">Fee Standar (IDR)</label>
                            <RupiahInput
                                id="standardFee"
                                name="standardFee"
                                value={String(formData.standardFee ?? '')}
                                onChange={(raw) => setFormData(prev => ({ ...prev, standardFee: Number(raw) }))}
                                className="w-full px-4 py-3 rounded-2xl border border-brand-border bg-white font-black text-blue-600 text-right text-lg"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] uppercase font-bold tracking-widest text-brand-text-secondary">Nomor Rekening / E-Wallet</label>
                            <input type="text" id="noRek" name="noRek" value={formData.noRek} onChange={onChange} className="w-full px-4 py-3 rounded-2xl border border-brand-border bg-white placeholder:text-brand-text-secondary/30 focus:ring-2 focus:ring-blue-500 outline-none transition-all font-semibold" placeholder="Cth: BCA 1234567890" />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-[10px] uppercase font-bold tracking-widest text-brand-text-secondary">Kategori</label>
                        <select
                            id="category"
                            name="category"
                            value={formData.category}
                            onChange={onChange}
                            className="w-full px-4 py-3 rounded-2xl border border-brand-border bg-white font-semibold text-brand-text-primary focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                        >
                            <option value="Tim">Tim Internal</option>
                            <option value="Vendor">Vendor Eksternal</option>
                        </select>
                        <p className="text-[10px] text-brand-text-secondary mt-1 italic font-medium">Pilih "Tim" untuk tim internal Anda, atau "Vendor" untuk pihak ketiga.</p>
                    </div>
                </div>
            </CollapsibleSection>

            <div className="flex flex-col sm:flex-row justify-end gap-3 pt-6 border-t border-brand-border/10">
                {!inline && (
                    <button type="button" onClick={onClose} className="px-10 py-4 rounded-2xl font-black text-sm uppercase tracking-widest text-brand-text-secondary hover:bg-brand-bg transition-all active:scale-95 border border-brand-border/30">Batal</button>
                )}
                <button type="submit" className="px-12 py-4 rounded-2xl font-black text-sm uppercase tracking-widest text-white bg-blue-600 hover:bg-blue-700 shadow-xl shadow-blue-500/30 transition-all active:scale-95">
                    {mode === 'add' ? 'Simpan' : 'Update'}
                </button>
            </div>
        </form>
    );

    if (inline) return formContent;

    return (
        <Modal 
            isOpen={isOpen} 
            onClose={onClose} 
            title={mode === 'add' ? 'Tambah Tim / Vendor Baru' : `Edit Data: ${selectedMember?.name}`} 
            size="2xl"
        >
            {formContent}
        </Modal>
    );
};
