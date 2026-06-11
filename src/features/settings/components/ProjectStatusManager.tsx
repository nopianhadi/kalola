import React, { useState } from 'react';
import Modal from '@/shared/ui/Modal';
import { PencilIcon, PlusIcon, Trash2Icon } from '@/constants';
import { ProjectStatusConfig, SubStatusConfig, Project, Profile } from '@/types';
import { upsertProfile } from '@/services/profile';
import { FormSection, FieldLabel, inputCls, FormActions } from '@/shared/ui/FormSection';

interface ProjectStatusManagerProps {
    config: ProjectStatusConfig[];
    onConfigChange: (newConfig: ProjectStatusConfig[]) => void;
    projects: Project[];
    profile: Profile;
    onAddDefaultStatuses?: () => void;
}

export const ProjectStatusManager: React.FC<ProjectStatusManagerProps> = ({ config, onConfigChange, projects, profile, onAddDefaultStatuses }) => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [modalMode, setModalMode] = useState<'add' | 'edit'>('add');
    const [selectedStatus, setSelectedStatus] = useState<ProjectStatusConfig | null>(null);

    const initialFormState = {
        name: '', color: '#64748b', note: '',
        defaultProgress: undefined as number | undefined,
        subStatuses: [] as SubStatusConfig[],
    };
    const [form, setForm] = useState(initialFormState);

    const handleOpenModal = (mode: 'add' | 'edit', status?: ProjectStatusConfig) => {
        setModalMode(mode);
        if (mode === 'edit' && status) {
            setSelectedStatus(status);
            setForm({
                name: status.name, color: status.color, note: status.note,
                defaultProgress: (status as any).defaultProgress,
                subStatuses: status.subStatuses ? [...status.subStatuses] : [],
            });
        } else {
            setSelectedStatus(null);
            setForm(initialFormState);
        }
        setIsModalOpen(true);
    };

    const handleFormChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        if (name === 'defaultProgress') {
            const num = value === '' ? undefined : Math.max(0, Math.min(100, Math.round(Number(value))));
            setForm(prev => ({ ...prev, [name]: num }));
        } else {
            setForm(prev => ({ ...prev, [name]: value }));
        }
    };

    const handleSubStatusChange = (index: number, e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        const newSubStatuses = [...form.subStatuses];
        newSubStatuses[index] = { ...newSubStatuses[index], [name]: value };
        setForm(prev => ({ ...prev, subStatuses: newSubStatuses }));
    };

    const addSubStatus = () => setForm(prev => ({ ...prev, subStatuses: [...prev.subStatuses, { name: '', note: '' }] }));
    const removeSubStatus = (index: number) => {
        const newSubStatuses = [...form.subStatuses];
        newSubStatuses.splice(index, 1);
        setForm(prev => ({ ...prev, subStatuses: newSubStatuses }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        let updatedConfig: ProjectStatusConfig[];
        if (modalMode === 'add') {
            const newStatus: ProjectStatusConfig = { id: Date.now(), ...form, subStatuses: form.subStatuses.filter(s => s.name.trim() !== '') };
            updatedConfig = [...config, newStatus];
        } else {
            updatedConfig = config.map(s => String(s.id) === String(selectedStatus?.id) ? { ...s, ...form, subStatuses: form.subStatuses.filter(sub => sub.name.trim() !== '') } : s);
        }
        onConfigChange(updatedConfig);
        try {
            await upsertProfile({ id: profile.id, projectStatusConfig: updatedConfig } as any);
        } catch (err: any) {
            alert('Gagal menyimpan Progres: ' + (err?.message || 'Coba lagi.'));
        }
        setIsModalOpen(false);
    };

    const handleDelete = async (statusId: number) => {
        const status = config.find(s => String(s.id) === String(statusId));
        if (!status) return;
        if (projects.some(p => p.status === status.name)) { alert(`Status "${status.name}" sedang digunakan.`); return; }
        if (window.confirm(`Hapus status "${status.name}"?`)) {
            const newConfig = config.filter(s => String(s.id) !== String(statusId));
            onConfigChange(newConfig);
            try { await upsertProfile({ id: profile.id, projectStatusConfig: newConfig } as any); }
            catch (err: any) { alert('Gagal menghapus: ' + (err?.message || 'Coba lagi.')); }
        }
    };

    return (
        <div>
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-4 md:mb-6">
                <h3 className="text-sm md:text-lg font-semibold text-brand-text-light">Manajemen Progres Acara Pernikahan Pengantin</h3>
                <div className="flex flex-wrap gap-2 w-full sm:w-auto">
                    {onAddDefaultStatuses && <button onClick={onAddDefaultStatuses} className="button-secondary inline-flex items-center gap-2 text-sm md:text-base">+ Tambah dari saran default</button>}
                    <button onClick={() => handleOpenModal('add')} className="button-primary inline-flex items-center gap-2 w-full sm:w-auto text-sm md:text-base"><PlusIcon className="w-4 h-4 md:w-5 md:h-5" /> Tambah Status</button>
                </div>
            </div>
            <div className="space-y-3 md:space-y-4">
                {config.map(status => (
                    <div key={status.id} className="p-4 bg-white border border-brand-border/60 rounded-xl shadow-sm transition-all hover:border-brand-accent/30">
                        <div className="flex justify-between items-center">
                            <div className="flex items-center gap-2 md:gap-3">
                                <span className="w-3 h-3 md:w-4 md:h-4 rounded-full flex-shrink-0" style={{ backgroundColor: status.color }}></span>
                                <span className="font-semibold text-sm md:text-base text-brand-text-light">{status.name}</span>
                            </div>
                            <div className="flex items-center gap-1 md:gap-2">
                                <button onClick={() => handleOpenModal('edit', status)} className="p-1.5 md:p-2 text-brand-text-secondary hover:bg-brand-input rounded-full"><PencilIcon className="w-4 h-4 md:w-5 md:h-5" /></button>
                                <button onClick={() => handleDelete(status.id)} className="p-1.5 md:p-2 text-brand-text-secondary hover:bg-brand-input rounded-full"><Trash2Icon className="w-4 h-4 md:w-5 md:h-5" /></button>
                            </div>
                        </div>
                        {status.subStatuses && status.subStatuses.length > 0 && (
                            <div className="mt-2 md:mt-3 pt-2 md:pt-3 border-t border-brand-border/50 pl-5 md:pl-7 space-y-1.5 md:space-y-2">
                                {status.subStatuses.map((sub, index) => (
                                    <div key={index}><p className="text-xs md:text-sm font-medium text-brand-text-primary">{sub.name}</p><p className="text-[10px] md:text-xs text-brand-text-secondary">{sub.note}</p></div>
                                ))}
                            </div>
                        )}
                    </div>
                ))}
            </div>

            <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={modalMode === 'add' ? 'Tambah Status Baru' : `Edit Status: ${selectedStatus?.name}`} size="2xl">
            <form onSubmit={handleSubmit} className="space-y-0">

                    <FormSection icon={<PlusIcon className="w-4 h-4" />} title="Identitas Status" subtitle="Nama, warna, dan progres default" />

                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-4">
                        <div className="md:col-span-2">
                            <FieldLabel>Nama Status</FieldLabel>
                            <input type="text" name="name" value={form.name} onChange={handleFormChange} className={inputCls + ' font-bold'} required placeholder="Cth: Editing" />
                        </div>
                        <div>
                            <FieldLabel>Warna</FieldLabel>
                            <input type="color" name="color" value={form.color} onChange={handleFormChange} className="w-full h-[42px] p-1 rounded-xl border border-brand-border bg-white cursor-pointer" />
                        </div>
                        <div>
                            <FieldLabel optional>Progres Default (%)</FieldLabel>
                            <input type="number" min={0} max={100} name="defaultProgress" value={form.defaultProgress ?? ''} onChange={handleFormChange} className={inputCls + ' font-mono'} placeholder="0–100" />
                        </div>
                    </div>
                    <div className="mt-4">
                        <FieldLabel optional>Catatan / Deskripsi</FieldLabel>
                        <textarea name="note" value={form.note} onChange={e => setForm(p => ({ ...p, note: e.target.value }))} className={inputCls + ' min-h-[70px] resize-none'} placeholder="Deskripsi progres status ini..." />
                    </div>

                    <FormSection icon={<PlusIcon className="w-4 h-4" />} title="Hierarki Sub-Status" subtitle="Tambahkan langkah-langkah detail untuk status ini." className="mt-4" />

                    <div className="space-y-3 max-h-52 overflow-y-auto pr-1 custom-scrollbar mt-4">
                        {form.subStatuses.map((sub, index) => (
                            <div key={index} className="flex items-center gap-3 p-3 bg-brand-bg rounded-xl border border-brand-border">
                                <div className="w-6 h-6 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold text-xs flex-shrink-0">{index + 1}</div>
                                <div className="flex-1 space-y-2">
                                    <input type="text" name="name" value={sub.name} onChange={e => handleSubStatusChange(index, e)} placeholder="Nama Sub-Status" className={inputCls} />
                                    <input type="text" name="note" value={sub.note} onChange={e => handleSubStatusChange(index, e)} placeholder="Catatan (opsional)" className={inputCls + ' text-xs'} />
                                </div>
                                <button type="button" onClick={() => removeSubStatus(index)} className="p-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition flex-shrink-0">
                                    <Trash2Icon className="w-4 h-4" />
                                </button>
                            </div>
                        ))}
                        {form.subStatuses.length === 0 && (
                            <p className="text-xs text-brand-text-secondary text-center py-4 border-2 border-dashed border-brand-border rounded-xl">Belum ada sub-status.</p>
                        )}
                    </div>
                    <button type="button" onClick={addSubStatus} className="w-full mt-3 py-2.5 border border-dashed border-brand-border rounded-xl text-xs font-semibold text-brand-text-secondary hover:border-brand-accent hover:text-brand-accent transition">
                        + Tambah Sub-Status
                    </button>

                    <FormActions
                        onCancel={() => setIsModalOpen(false)}
                        submitLabel={modalMode === 'add' ? 'Simpan Status' : 'Update Status'}
                    />
            </form>
            </Modal>

        </div>
    );
};
