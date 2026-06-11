import React, { useMemo, useRef, useState } from 'react';
import { Trash2Icon, UploadCloudIcon, FileIcon, XIcon, Loader2Icon } from 'lucide-react';
import Modal from '@/shared/ui/Modal';
import { FormSection, FieldLabel, inputCls, selectCls } from '@/shared/ui/FormSection';
import {
    ProjectFormProps,
    TeamMember,
    PrintingItem,
    SubStatusConfig,
    PaymentStatus
} from '@/features/projects/types/project.types';
import { formatCurrency } from '@/features/projects/utils/project.utils';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
const AUTH_TOKEN_KEY = 'vena-authToken';

// ─── Helper: Upload file dokumen (gambar / PDF) ke Cloudinary ─────────────────
async function uploadDocumentFile(
    file: File,
    context: 'moodboard' | 'bride_file'
): Promise<{ url: string; originalName: string; resourceType: string }> {
    const token = localStorage.getItem(AUTH_TOKEN_KEY);
    const body = new FormData();
    body.append('file', file);

    const res = await fetch(`${API_URL}/upload/document?context=${context}`, {
        method: 'POST',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        body,
    });

    if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || `Upload gagal (${res.status})`);
    }
    return res.json();
}

// ─── Sub-komponen: FileUploadField ────────────────────────────────────────────
interface FileUploadFieldProps {
    id: string;
    label: string;
    placeholder: string;
    value: string;
    context: 'moodboard' | 'bride_file';
    acceptTypes?: string;
    onChange: (url: string) => void;
}

const FileUploadField: React.FC<FileUploadFieldProps> = ({
    id, label, placeholder, value, context, acceptTypes = 'image/jpeg,image/png,image/webp', onChange
}) => {
    const fileRef = useRef<HTMLInputElement>(null);
    const [uploading, setUploading] = useState(false);
    const [uploadedName, setUploadedName] = useState<string | null>(null);

    const isPdf = (url: string) =>
        url?.toLowerCase().includes('.pdf') ||
        url?.toLowerCase().includes('/raw/upload/');

    const getPdfUrl = (url: string) => url;

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setUploading(true);
        try {
            const result = await uploadDocumentFile(file, context);
            onChange(result.url);
            setUploadedName(result.originalName);
        } catch (err: any) {
            alert('Gagal upload: ' + err.message);
        } finally {
            setUploading(false);
            if (fileRef.current) fileRef.current.value = '';
        }
    };

    const handleClear = () => {
        onChange('');
        setUploadedName(null);
    };

    return (
        <div>
            <FieldLabel htmlFor={id} optional>{label}</FieldLabel>
            <div className="flex gap-2 items-center">
                <div className="relative flex-1">
                    <input
                        type="url"
                        id={id}
                        value={value}
                        onChange={e => { onChange(e.target.value); setUploadedName(null); }}
                        className={inputCls + ' pr-8'}
                        placeholder={placeholder}
                    />
                    {value && (
                        <button
                            type="button"
                            onClick={handleClear}
                            className="absolute right-2 top-1/2 -translate-y-1/2 text-brand-text-secondary hover:text-red-400 transition"
                            title="Hapus"
                        >
                            <XIcon className="w-3.5 h-3.5" />
                        </button>
                    )}
                </div>
                {/* Tombol Upload */}
                <label
                    className={`flex-shrink-0 flex items-center gap-1.5 px-3 py-2 rounded-xl border transition text-xs font-semibold select-none
                        ${uploading
                            ? 'bg-brand-bg border-brand-border text-brand-text-secondary cursor-not-allowed'
                            : 'bg-blue-50 border-blue-200 text-blue-600 hover:bg-blue-100 cursor-pointer'
                        }`}
                    title="Upload gambar atau PDF"
                >
                    {uploading
                        ? <Loader2Icon className="w-3.5 h-3.5 animate-spin" />
                        : <UploadCloudIcon className="w-3.5 h-3.5" />
                    }
                    {uploading ? 'Uploading…' : 'Upload'}
                    <input
                        ref={fileRef}
                        type="file"
                        accept={acceptTypes}
                        className="sr-only"
                        disabled={uploading}
                        onChange={handleFileChange}
                    />
                </label>
            </div>
            {/* Preview setelah upload */}
            {value && (
                <div className="mt-2">
                    {isPdf(value) ? (
                        <a
                            href={getPdfUrl(value)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1.5 text-xs text-blue-500 hover:underline"
                        >
                            <FileIcon className="w-3.5 h-3.5 flex-shrink-0" />
                            {uploadedName ?? 'Lihat PDF'}
                        </a>
                    ) : (
                        <a href={value} target="_blank" rel="noopener noreferrer">
                            <img
                                src={value}
                                alt="preview"
                                className="h-16 w-24 object-cover rounded-lg border border-brand-border/60 hover:opacity-80 transition"
                            />
                        </a>
                    )}
                </div>
            )}
        </div>
    );
};

// ─── Main Component ───────────────────────────────────────────────────────────
const ProjectForm: React.FC<ProjectFormProps> = ({
    isOpen, onClose, mode, formData, onFormChange, onSubStatusChange, onClientChange,
    onTeamChange, onTeamFeeChange, onTeamSubJobChange,
    onCustomSubStatusChange, onAddCustomSubStatus, onRemoveCustomSubStatus,
    onSubmit, clients,
    teamProjectPayments,
    profile, teamByCategory,
    inline = false
}) => {
    const paidMemberIdsForThisProject = useMemo(() => {
        const projectId = formData?.id;
        if (!projectId) return new Set<number>();
        return new Set(
            (teamProjectPayments || [])
                .filter(p => p.projectId === projectId && p.status === PaymentStatus.LUNAS)
                .map(p => p.teamMemberId)
        );
    }, [teamProjectPayments, formData?.id]);

    const formContent = (
        <form onSubmit={onSubmit} className={`space-y-4 md:space-y-6 ${!inline ? 'form-compact form-compact--ios-scale' : ''}`}>
            <div className={`space-y-4 md:space-y-6 ${!inline ? 'max-h-[75vh] overflow-y-auto pr-2 pb-4 scrollbar-none' : ''}`}>

                {/* Section 1: Basic Info */}
                <FormSection
                    title="Informasi Dasar Acara Pernikahan"
                    status={formData.projectName && formData.projectType ? 'valid' : undefined}
                >
                    <div className="space-y-5">
                        {mode === 'add' && (
                            <div>
                                <FieldLabel htmlFor="clientId">Pengantin</FieldLabel>
                                <select id="clientId" name="clientId" value={formData.clientId} onChange={onClientChange} className={selectCls} required>
                                    <option value="">Pilih Pengantin...</option>
                                    {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                                </select>
                            </div>
                        )}
                        <div>
                            <FieldLabel htmlFor="projectName">Nama Acara Pernikahan</FieldLabel>
                            <input type="text" id="projectName" name="projectName" value={formData.projectName} onChange={onFormChange} className={inputCls} placeholder="Masukkan nama Acara Pernikahan" required />
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                                <FieldLabel htmlFor="projectType">Jenis Acara</FieldLabel>
                                <select id="projectType" name="projectType" value={formData.projectType} onChange={onFormChange} className={selectCls} required>
                                    <option value="" disabled>Pilih Jenis...</option>
                                    {profile.projectTypes.map(pt => <option key={pt} value={pt}>{pt}</option>)}
                                </select>
                            </div>
                            {mode === 'add' && (
                                <div>
                                    <FieldLabel htmlFor="status">Progres</FieldLabel>
                                    <select id="status" name="status" value={formData.status} onChange={onFormChange} className={selectCls} required>
                                        {profile.projectStatusConfig.map(s => <option key={s.id} value={s.name}>{s.name}</option>)}
                                    </select>
                                </div>
                            )}
                        </div>
                        <div>
                            <FieldLabel htmlFor="location" optional>Lokasi (Kota)</FieldLabel>
                            <input type="text" id="location" name="location" value={formData.location} onChange={onFormChange} className={inputCls} placeholder="Kota Contoh: Jakarta" />
                        </div>
                        <div>
                            <FieldLabel htmlFor="address" optional>Alamat Lengkap / Gedung</FieldLabel>
                            <textarea id="address" name="address" value={formData.address} onChange={onFormChange} className={inputCls + ' min-h-[80px] resize-none'} placeholder="Contoh: Gedung Mulia, Jl. Gatot Subroto No. 1" rows={3} />
                        </div>
                    </div>
                </FormSection>

                {/* Section 4: Team Assignment */}
                <FormSection
                    title="Tugas Tim"
                    status={formData.team.length > 0 ? 'info' : undefined}
                    statusText={formData.team.length > 0 ? `${formData.team.length} orang ditugaskan` : undefined}
                >
                    <div className="space-y-6 pt-2">
                        {(['Tim', 'Vendor'] as const).map(category => (
                            <div key={category} className="space-y-4">
                                <h5 className={`text-sm font-bold uppercase tracking-widest pb-2 border-b-2 flex items-center gap-2 ${category === 'Tim' ? 'text-blue-400 border-blue-400/20' : 'text-purple-400 border-purple-400/20'}`}>
                                    <div className={`w-2 h-2 rounded-full ${category === 'Tim' ? 'bg-blue-400' : 'bg-purple-400'}`}></div>
                                    {category === 'Tim' ? 'Pilih Tim Internal' : 'Pilih Vendor / Tim / Vendor'}
                                </h5>
                                <div className="space-y-4">
                                    {Object.entries(teamByCategory[category] || {}).map(([role, members]) => (
                                        <div key={role} className="space-y-3">
                                            <div className="flex items-center gap-2 mb-1">
                                                <h6 className="text-[10px] font-bold text-brand-text-secondary uppercase tracking-tighter">{role}</h6>
                                                <div className="h-px flex-grow bg-brand-border/30"></div>
                                            </div>
                                            {(members as TeamMember[]).map(member => {
                                                const assignedMember = formData.team.find((t: any) => String(t.memberId) === String(member.id));
                                                const isSelected = !!assignedMember;
                                                return (
                                                    <div key={member.id} className={`p-4 rounded-xl transition-all ${isSelected ? 'bg-blue-50/10 border-2 border-blue-400' : 'bg-brand-bg border border-brand-border hover:border-brand-accent/30'}`}>
                                                        <div className="flex justify-between items-center">
                                                            <label className="flex items-center gap-3 cursor-pointer flex-grow">
                                                                <input type="checkbox" checked={isSelected} onChange={() => onTeamChange(member)} className="h-5 w-5 text-blue-600 rounded-lg border-brand-border bg-white/5 focus:ring-blue-500" />
                                                                <div>
                                                                    <p className="font-semibold text-brand-text-light">{member.name}</p>
                                                                    {isSelected && <p className="text-[10px] text-brand-text-secondary mt-0.5">Pembayaran Standar: {formatCurrency(member.standardFee)}</p>}
                                                                </div>
                                                            </label>
                                                        </div>
                                                        {isSelected && (
                                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4 pt-4 border-t border-brand-border/40">
                                                                <div className="sm:col-span-2 space-y-1.5">
                                                                    <label className="block text-[10px] uppercase font-bold text-brand-text-secondary">Biaya Tim / Vendor per Acara</label>
                                                                    <input
                                                                        type="number"
                                                                        value={assignedMember.fee || 0}
                                                                        onChange={e => onTeamFeeChange(member.id, Number(e.target.value))}
                                                                        disabled={paidMemberIdsForThisProject.has(member.id)}
                                                                        className="w-full px-3 py-2 rounded-lg border border-brand-border bg-white/5 text-brand-text-primary text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all text-right font-mono"
                                                                        placeholder="0"
                                                                    />
                                                                </div>
                                                                <div className="sm:col-span-2 space-y-1.5">
                                                                    <label className="block text-[10px] uppercase font-bold text-brand-text-secondary">Keterangan Tugas Spesipik unutk tim</label>
                                                                    <input
                                                                        type="text"
                                                                        value={assignedMember.subJob || ''}
                                                                        onChange={e => onTeamSubJobChange(member.id, e.target.value)}
                                                                        className="w-full px-3 py-2 rounded-lg border border-brand-border bg-white/5 text-brand-text-primary text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                                                                        placeholder="Tugas spesifik (misal: Leader, Drone Operator, dll)"
                                                                    />
                                                                </div>
                                                            </div>
                                                        )}
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                </FormSection>

                {/* Section 2: Schedule & Details */}
                <FormSection title="Jadwal & Detail" status={formData.date ? 'valid' : undefined}>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                            <FieldLabel htmlFor="date">Tanggal Acara</FieldLabel>
                            <input type="date" id="date" name="date" value={formData.date || ''} onChange={onFormChange} className={inputCls + ' font-mono'} required />
                        </div>
                        <div>
                            <FieldLabel htmlFor="deadlineDate" optional>Deadline</FieldLabel>
                            <input type="date" id="deadlineDate" name="deadlineDate" value={formData.deadlineDate || ''} onChange={onFormChange} className={inputCls + ' font-mono'} />
                        </div>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                            <FieldLabel htmlFor="startTime" optional>Waktu Mulai</FieldLabel>
                            <input type="time" id="startTime" name="startTime" value={formData.startTime || ''} onChange={onFormChange} className={inputCls + ' font-mono'} />
                        </div>
                        <div>
                            <FieldLabel htmlFor="endTime" optional>Waktu Selesai</FieldLabel>
                            <input type="time" id="endTime" name="endTime" value={formData.endTime || ''} onChange={onFormChange} className={inputCls + ' font-mono'} />
                        </div>
                    </div>
                </FormSection>

                {/* Section 3: Links & Notes */}
                <FormSection title="Tautan & Catatan">
                    <FileUploadField
                        id="driveLink"
                        label="Link Brief/Moodboard (Internal)"
                        placeholder="https://... atau upload gambar"
                        value={formData.driveLink || ''}
                        context="moodboard"
                        acceptTypes="image/jpeg,image/png,image/webp"
                        onChange={url => onFormChange({ target: { name: 'driveLink', value: url } } as any)}
                    />
                    <FileUploadField
                        id="clientDriveLink"
                        label="Link File dari Pengantin"
                        placeholder="https://drive.google.com/... atau upload file"
                        value={formData.clientDriveLink || ''}
                        context="bride_file"
                        acceptTypes="image/jpeg,image/png,image/webp,application/pdf"
                        onChange={url => onFormChange({ target: { name: 'clientDriveLink', value: url } } as any)}
                    />
                    <div>
                        <FieldLabel htmlFor="finalDriveLink" optional>Link File Jadi (untuk Pengantin)</FieldLabel>
                        <input type="url" id="finalDriveLink" name="finalDriveLink" value={formData.finalDriveLink || ''} onChange={onFormChange} className={inputCls} placeholder="https://drive.google.com/..." />
                    </div>
                    <div>
                        <FieldLabel htmlFor="notes" optional>Catatan Tambahan</FieldLabel>
                        <textarea id="notes" name="notes" value={formData.notes || ''} onChange={onFormChange} className={inputCls + ' resize-none'} placeholder="Catatan tambahan..." rows={3} />
                    </div>
                </FormSection>

                {/* Vendor Section */}
                <FormSection title="Vendor (Allpackage)">
                    <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                        {(formData.printingDetails || []).length > 0
                            ? (formData.printingDetails || []).map((item: PrintingItem) => (
                                <div key={item.id} className="p-3 rounded-lg bg-brand-bg border border-brand-border/60 flex justify-between items-center">
                                    <p className="text-sm font-medium text-brand-text-light">{item.customName || item.type}</p>
                                </div>
                            ))
                            : <p className="text-sm text-center text-brand-text-secondary py-4">Tidak ada layanan/produk yang ditambahkan.</p>
                        }
                    </div>
                </FormSection>

                {/* Sub-Status Section (if needed) */}
                {mode === 'add' && (
                    <FormSection title={`Sub-Status untuk "${formData.status}"`}>
                        <div className="space-y-2 max-h-40 overflow-y-auto">
                            {(formData.customSubStatuses || []).map((sub: SubStatusConfig) => (
                                <label key={sub.name} className={`flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-all border ${(formData.activeSubStatuses || []).includes(sub.name) ? 'bg-blue-50/10 border-blue-400' : 'bg-brand-bg border-brand-border hover:border-brand-accent/30'}`}>
                                    <input type="checkbox" checked={(formData.activeSubStatuses || []).includes(sub.name)} onChange={e => onSubStatusChange(sub.name, e.target.checked)} className="h-4 w-4 text-blue-600 rounded flex-shrink-0" />
                                    <span className="text-sm font-medium">{sub.name}</span>
                                </label>
                            ))}
                        </div>
                        <div className="border-t border-brand-border pt-4 space-y-3">
                            {(formData.customSubStatuses || []).map((sub: SubStatusConfig, index: number) => (
                                <div key={index} className="flex gap-2 items-center">
                                    <input type="text" value={sub.name || ''} onChange={e => onCustomSubStatusChange(index, 'name', e.target.value)} placeholder="Nama Sub-Status" className={inputCls + ' flex-1'} />
                                    <button type="button" onClick={() => onRemoveCustomSubStatus(index)} className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition flex-shrink-0">
                                        <Trash2Icon className="w-4 h-4" />
                                    </button>
                                </div>
                            ))}
                            <button type="button" onClick={onAddCustomSubStatus} className="flex items-center gap-1.5 text-xs font-semibold text-brand-accent hover:text-brand-accent/80 transition">
                                + Tambah Sub-Status Baru
                            </button>
                        </div>
                    </FormSection>
                )}

            </div>

            {!inline && (
                <div className="flex flex-col md:flex-row justify-end items-stretch md:items-center gap-3 pt-6 border-t border-brand-border">
                    <button type="button" onClick={onClose} className="button-secondary w-full md:w-auto order-2 md:order-1">Batal</button>
                    <button type="submit" className="button-primary w-full md:w-auto order-1 md:order-2 active:scale-95 transition-transform">
                        {mode === 'add' ? 'Simpan Acara Pernikahan' : 'Update Acara Pernikahan'}
                    </button>
                </div>
            )}
        </form>
    );

    if (inline) return formContent;

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={mode === 'add' ? 'Tambah Acara Pernikahan Baru (Operasional)' : `Edit Acara Pernikahan: ${formData.projectName}`}
            size="4xl"
        >
            {formContent}
        </Modal>
    );
};

export default ProjectForm;
