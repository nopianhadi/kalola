import React from 'react';
import Modal from '@/shared/ui/Modal';
import { FormSection, FieldLabel, inputCls, selectCls } from '@/shared/ui/FormSection';
import { Client, Project } from '@/types';
import { FileTextIcon, CalendarIcon, UserCheckIcon, UsersIcon, BriefcaseIcon, DollarSignIcon } from '@/constants';

interface ContractFormModalProps {
    isOpen: boolean;
    onClose: () => void;
    mode: 'add' | 'edit';
    formData: any;
    setFormData: React.Dispatch<React.SetStateAction<any>>;
    clients: Client[];
    availableProjects: Project[];
    selectedClientId: string;
    setSelectedClientId: (id: string) => void;
    selectedProjectId: string;
    setSelectedProjectId: (id: string) => void;
    handleFormChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
    handleSubmit: (e: React.FormEvent) => void;
    handleSaveTemplateDefaults?: () => Promise<void>;
}

export const ContractFormModal: React.FC<ContractFormModalProps> = ({
    isOpen, onClose, mode, formData, setFormData, clients,
    availableProjects, selectedClientId, setSelectedClientId,
    selectedProjectId, setSelectedProjectId, handleFormChange,
    handleSubmit, handleSaveTemplateDefaults
}) => {
    return (
        <Modal isOpen={isOpen} onClose={onClose} title={mode === 'add' ? 'Buat Kontrak Baru' : 'Edit Kontrak'} size="5xl">
            <form onSubmit={handleSubmit} className="space-y-0">

                {/* ── Pilih Klien & Proyek ── */}
                <FormSection icon={<FileTextIcon className="w-4 h-4" />} title="Pilih Klien & Proyek" subtitle="Langkah pertama untuk membuat kontrak resmi" />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                    <div>
                        <FieldLabel>Klien Utama</FieldLabel>
                        <select value={selectedClientId} onChange={e => setSelectedClientId(e.target.value)} className={selectCls + ' font-bold'} required>
                            <option value="">Pilih Klien...</option>
                            {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                        </select>
                    </div>
                    <div>
                        <FieldLabel>Project Terkait</FieldLabel>
                        <select value={selectedProjectId} onChange={e => setSelectedProjectId(e.target.value)} className={selectCls + ' font-bold disabled:opacity-50'} required disabled={!selectedClientId}>
                            <option value="">{selectedClientId ? 'Pilih Proyek...' : 'Pilih Klien Dahulu'}</option>
                            {availableProjects.map(p => <option key={p.id} value={p.id}>{p.projectName}</option>)}
                        </select>
                    </div>
                </div>

                {/* Scrollable area */}
                <div className="max-h-[55vh] overflow-y-auto custom-scrollbar mt-2 space-y-0">

                    {/* ── Detail Penandatanganan ── */}
                    <FormSection icon={<CalendarIcon className="w-4 h-4" />} title="Detail Penandatanganan" className="mt-4" />

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-3">
                        <div>
                            <FieldLabel optional>Tanggal Penandatanganan</FieldLabel>
                            <input type="date" name="signingDate" value={formData.signingDate} onChange={handleFormChange} className={inputCls + ' font-mono'} />
                        </div>
                        <div>
                            <FieldLabel optional>Lokasi Penandatanganan</FieldLabel>
                            <input type="text" name="signingLocation" value={formData.signingLocation} onChange={handleFormChange} className={inputCls} placeholder="Cth: Studio / Alamat Klien" />
                        </div>
                    </div>
                    <div className="mt-3">
                        <FieldLabel optional>Judul Layanan Utama</FieldLabel>
                        <input type="text" name="serviceTitle" value={formData.serviceTitle} onChange={handleFormChange} className={inputCls + ' font-bold'} placeholder="Contoh: JASA CORPORATE / EVENT / WEDDING" />
                    </div>

                    {/* ── Pihak Klien ── */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-x-6 mt-2">
                        <div>
                            <FormSection icon={<UserCheckIcon className="w-4 h-4" />} title="Pihak Klien 1" className="mt-4" />
                            <div className="space-y-3 mt-3">
                                <div>
                                    <FieldLabel optional>Nama Lengkap Pihak I</FieldLabel>
                                    <input type="text" name="clientName1" value={formData.clientName1} onChange={handleFormChange} className={inputCls + ' font-bold'} placeholder="Nama Klien 1" />
                                </div>
                                <div>
                                    <FieldLabel optional>No. Telepon / WhatsApp</FieldLabel>
                                    <input type="text" name="clientPhone1" value={formData.clientPhone1} onChange={handleFormChange} className={inputCls + ' font-mono'} placeholder="08xxxxxxxx" />
                                </div>
                                <div>
                                    <FieldLabel optional>Alamat Korespondensi</FieldLabel>
                                    <textarea name="clientAddress1" value={formData.clientAddress1} onChange={handleFormChange} className={inputCls + ' min-h-[70px] resize-none'} placeholder="Alamat lengkap..." />
                                </div>
                            </div>
                        </div>

                        <div>
                            <FormSection icon={<UsersIcon className="w-4 h-4" />} title="Pihak Klien 2" subtitle="Opsional" className="mt-4" />
                            <div className="space-y-3 mt-3">
                                <div>
                                    <FieldLabel optional>Nama Lengkap Pihak II</FieldLabel>
                                    <input type="text" name="clientName2" value={formData.clientName2} onChange={handleFormChange} className={inputCls + ' font-bold'} placeholder="Nama Pasangan (jika ada)" />
                                </div>
                                <div>
                                    <FieldLabel optional>No. Telepon / WhatsApp</FieldLabel>
                                    <input type="text" name="clientPhone2" value={formData.clientPhone2} onChange={handleFormChange} className={inputCls + ' font-mono'} placeholder="08xxxxxxxx" />
                                </div>
                                <div>
                                    <FieldLabel optional>Alamat Korespondensi</FieldLabel>
                                    <textarea name="clientAddress2" value={formData.clientAddress2} onChange={handleFormChange} className={inputCls + ' min-h-[70px] resize-none'} placeholder="Alamat lengkap..." />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* ── Ruang Lingkup & Teknis ── */}
                    <FormSection icon={<BriefcaseIcon className="w-4 h-4" />} title="Ruang Lingkup & Teknis" className="mt-4" />

                    <div className="mt-3 space-y-4">
                        {/* Meterai toggle */}
                        <div className="flex items-center gap-4 p-3 rounded-xl bg-blue-50/50 border border-blue-200/50">
                            <label className="flex items-center gap-2 cursor-pointer">
                                <input id="includeMeterai" type="checkbox" checked={!!formData.includeMeterai} onChange={(e) => setFormData((prev: any) => ({ ...prev, includeMeterai: e.target.checked }))} className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500 cursor-pointer" />
                                <span className="text-sm font-semibold text-brand-text-light cursor-pointer">Gunakan Meterai (Rp 10.000)</span>
                            </label>
                            {!!formData.includeMeterai && (
                                <div className="ml-auto flex gap-4">
                                    <label className="flex items-center gap-1.5 text-xs font-semibold cursor-pointer">
                                        <input type="radio" name="meteraiPlacement" value="client" checked={(formData.meteraiPlacement || 'client') === 'client'} onChange={() => setFormData((prev: any) => ({ ...prev, meteraiPlacement: 'client' }))} className="w-3.5 h-3.5 text-blue-600" />
                                        1 Sisi
                                    </label>
                                    <label className="flex items-center gap-1.5 text-xs font-semibold cursor-pointer">
                                        <input type="radio" name="meteraiPlacement" value="both" checked={formData.meteraiPlacement === 'both'} onChange={() => setFormData((prev: any) => ({ ...prev, meteraiPlacement: 'both' }))} className="w-3.5 h-3.5 text-blue-600" />
                                        2 Sisi
                                    </label>
                                </div>
                            )}
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {[
                                { name: 'shootingDuration', label: 'Durasi Liputan', placeholder: 'Cth: 8 Jam' },
                                { name: 'guaranteedPhotos', label: 'Output Foto', placeholder: 'Cth: All Files' },
                                { name: 'albumDetails', label: 'Album Fisik', placeholder: 'Cth: 1 Album 20x30' },
                                { name: 'otherItems', label: 'Item Lain', placeholder: '...' },
                                { name: 'personnelCount', label: 'Jumlah Personel', placeholder: 'Cth: 2 Fotografer' },
                                { name: 'deliveryTimeframe', label: 'Proses Editing', placeholder: 'Cth: 30 Hari Kerja' },
                            ].map(f => (
                                <div key={f.name}>
                                    <FieldLabel optional>{f.label}</FieldLabel>
                                    <input type="text" name={f.name} value={formData[f.name]} onChange={handleFormChange} className={inputCls} placeholder={f.placeholder} />
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* ── Isi & Pasal Kontrak ── */}
                    <FormSection icon={<FileTextIcon className="w-4 h-4" />} title="Isi & Pasal Kontrak" subtitle="Sesuaikan narasi jika diperlukan" className="mt-4" />

                    <div className="mt-3 space-y-4">
                        {handleSaveTemplateDefaults && (
                            <div className="flex justify-end">
                                <button type="button" onClick={handleSaveTemplateDefaults}
                                    className="px-4 py-2 rounded-xl bg-blue-50 text-blue-600 hover:bg-blue-100 transition-all font-semibold text-xs border border-blue-200">
                                    Simpan sebagai Default
                                </button>
                            </div>
                        )}
                        {(['pasal1Content', 'pasal2Content', 'pasal3Content', 'pasal4Content', 'pasal5Content', 'closingText'] as const).map((field, idx) => (
                            <div key={field}>
                                <FieldLabel>{field === 'closingText' ? 'Kalimat Penutup' : `Pasal ${idx + 1}`}</FieldLabel>
                                <textarea name={field} value={formData[field]} onChange={handleFormChange}
                                    className={inputCls + ' font-mono text-xs leading-relaxed min-h-[100px] resize-none'} />
                            </div>
                        ))}
                    </div>

                    {/* ── Pembayaran & Hukum ── */}
                    <FormSection icon={<DollarSignIcon className="w-4 h-4" />} title="Pembayaran & Hukum" className="mt-4" />

                    <div className="mt-3 space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <FieldLabel optional>Batas DP</FieldLabel>
                                <input type="date" name="dpDate" value={formData.dpDate} onChange={handleFormChange} className={inputCls + ' font-mono'} />
                            </div>
                            <div>
                                <FieldLabel optional>Batas Pelunasan</FieldLabel>
                                <input type="date" name="finalPaymentDate" value={formData.finalPaymentDate} onChange={handleFormChange} className={inputCls + ' font-mono'} />
                            </div>
                        </div>
                        <div>
                            <FieldLabel optional>Kebijakan Pembatalan</FieldLabel>
                            <textarea name="cancellationPolicy" value={formData.cancellationPolicy} onChange={handleFormChange} className={inputCls + ' min-h-[80px] resize-none'} />
                        </div>
                        <div>
                            <FieldLabel optional>Wilayah Hukum Penyelesaian Sengketa</FieldLabel>
                            <input type="text" name="jurisdiction" value={formData.jurisdiction} onChange={handleFormChange} className={inputCls + ' font-semibold'} placeholder="Cth: Pengadilan Negeri Bandung" />
                        </div>
                    </div>

                </div>{/* end scrollable */}

                {/* ── Action Buttons ── */}
                <div className="flex justify-end gap-3 pt-6 mt-2 border-t border-brand-border">
                    <button type="button" onClick={onClose}
                        className="px-6 py-2.5 rounded-xl text-sm font-semibold text-brand-text-secondary hover:bg-brand-bg transition">
                        Batal
                    </button>
                    <button type="submit"
                        className="px-8 py-2.5 rounded-xl text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 shadow-lg shadow-blue-500/20 transition active:scale-95">
                        {mode === 'add' ? 'Buat Kontrak' : 'Simpan Perubahan'}
                    </button>
                </div>
            </form>
        </Modal>
    );
};
