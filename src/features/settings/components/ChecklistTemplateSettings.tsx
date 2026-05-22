import React, { useState } from 'react';
import { Profile, ChecklistTemplate } from '@/types';
import { RefreshCwIcon, PlusIcon, PencilIcon, Trash2Icon } from '@/constants';
import { upsertProfile } from '@/services/profile';
import { DEFAULT_CHECKLIST_TEMPLATES } from '@/services/weddingDayChecklist';

interface ChecklistTemplateSettingsProps {
    profile: Profile;
    setProfile: React.Dispatch<React.SetStateAction<Profile>>;
    showNotification: (msg: string) => void;
}

export const ChecklistTemplateSettings: React.FC<ChecklistTemplateSettingsProps> = ({ profile, setProfile, showNotification }) => {
    const getTemplates = (): ChecklistTemplate[] => (profile.checklistTemplates && profile.checklistTemplates.length > 0) ? profile.checklistTemplates : DEFAULT_CHECKLIST_TEMPLATES;
    const [templates, setTemplates] = useState<ChecklistTemplate[]>(getTemplates);
    const [newCategoryName, setNewCategoryName] = useState('');
    const [editingCategoryIdx, setEditingCategoryIdx] = useState<number | null>(null);
    const [editingCategoryName, setEditingCategoryName] = useState('');
    const [newItemInputs, setNewItemInputs] = useState<Record<number, string>>({});
    const [editingItem, setEditingItem] = useState<{ catIdx: number; itemIdx: number } | null>(null);
    const [editingItemName, setEditingItemName] = useState('');
    const [isSaving, setIsSaving] = useState(false);

    const save = async (updated: ChecklistTemplate[]) => {
        setIsSaving(true);
        try {
            await upsertProfile({ id: profile.id, checklistTemplates: updated } as any);
            setProfile(prev => ({ ...prev, checklistTemplates: updated }));
            setTemplates(updated);
            showNotification('Template checklist berhasil disimpan.');
        } catch (e) {
            showNotification('Gagal menyimpan template.');
        } finally { setIsSaving(false); }
    };

    const handleAddCategory = () => {
        const name = newCategoryName.trim(); if (!name || templates.some(t => t.category === name)) return;
        const updated = [...templates, { category: name, items: [] }]; setTemplates(updated); save(updated); setNewCategoryName('');
    };

    const handleRenameCategory = (idx: number) => {
        const name = editingCategoryName.trim(); if (!name || templates.some((t, i) => t.category === name && i !== idx)) return;
        const updated = templates.map((t, i) => i === idx ? { ...t, category: name } : t); setTemplates(updated); save(updated); setEditingCategoryIdx(null); setEditingCategoryName('');
    };

    const handleDeleteCategory = (idx: number) => {
        if (!window.confirm(`Hapus kategori "${templates[idx].category}"?`)) return;
        const updated = templates.filter((_, i) => i !== idx); setTemplates(updated); save(updated);
    };

    const handleAddItem = (catIdx: number) => {
        const name = (newItemInputs[catIdx] || '').trim(); if (!name || templates[catIdx].items.includes(name)) return;
        const updated = templates.map((t, i) => i === catIdx ? { ...t, items: [...t.items, name] } : t); setTemplates(updated); save(updated); setNewItemInputs(prev => ({ ...prev, [catIdx]: '' }));
    };

    const handleRenameItem = (catIdx: number, itemIdx: number) => {
        const name = editingItemName.trim(); if (!name) return;
        const updated = templates.map((t, i) => i === catIdx ? { ...t, items: t.items.map((item, j) => j === itemIdx ? name : item) } : t); setTemplates(updated); save(updated); setEditingItem(null); setEditingItemName('');
    };

    const handleDeleteItem = (catIdx: number, itemIdx: number) => {
        const updated = templates.map((t, i) => i === catIdx ? { ...t, items: t.items.filter((_, j) => j !== itemIdx) } : t); setTemplates(updated); save(updated);
    };

    const handleResetToDefault = () => {
        if (!window.confirm('Reset ke template default?')) return;
        setTemplates(DEFAULT_CHECKLIST_TEMPLATES); save(DEFAULT_CHECKLIST_TEMPLATES);
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div><h3 className="text-sm md:text-lg font-semibold text-brand-text-light">Template Checklist Hari H</h3><p className="text-xs text-brand-text-secondary mt-1">Template ini digunakan saat membuat checklist baru untuk setiap project.</p></div>
                <button type="button" onClick={handleResetToDefault} className="button-secondary text-xs flex items-center gap-1"><RefreshCwIcon className="w-3.5 h-3.5" /> Reset Default</button>
            </div>
            <div className="flex gap-2">
                <input type="text" value={newCategoryName} onChange={e => setNewCategoryName(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleAddCategory()} placeholder="Nama kategori baru..." className="flex-grow px-3 py-2 rounded-lg border border-brand-border bg-white/5 text-sm text-brand-text-light focus:outline-none focus:ring-1 focus:ring-brand-accent" />
                <button type="button" onClick={handleAddCategory} disabled={isSaving} className="button-primary text-sm flex items-center gap-1"><PlusIcon className="w-4 h-4" /> Tambah Kategori</button>
            </div>
            <div className="space-y-4">
                {templates.map((template, catIdx) => (
                    <div key={catIdx} className="rounded-2xl bg-white/5 border border-brand-border p-4">
                        <div className="flex items-center justify-between mb-3 group">
                            {editingCategoryIdx === catIdx ? (
                                <div className="flex items-center gap-2 flex-grow"><input value={editingCategoryName} onChange={e => setEditingCategoryName(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleRenameCategory(catIdx)} className="flex-grow bg-brand-surface border border-brand-border rounded-lg px-3 py-1.5 text-sm text-brand-text-light" autoFocus /><button className="button-primary text-xs px-3 py-1" onClick={() => handleRenameCategory(catIdx)}>Simpan</button></div>
                            ) : (
                                <div className="flex items-center gap-2">
                                    <span className="font-semibold text-brand-accent">{template.category}</span>
                                    <span className="text-[10px] bg-brand-accent/20 px-2 py-0.5 rounded-full text-brand-accent">{template.items.length} item</span>
                                    <button onClick={() => { setEditingCategoryIdx(catIdx); setEditingCategoryName(template.category); }} className="opacity-0 group-hover:opacity-100 p-1 text-brand-text-secondary hover:text-brand-text-light hover:bg-white/10 rounded"><PencilIcon className="w-3.5 h-3.5" /></button>
                                    <button onClick={() => handleDeleteCategory(catIdx)} className="opacity-0 group-hover:opacity-100 p-1 text-red-400 hover:bg-red-400/20 rounded"><Trash2Icon className="w-3.5 h-3.5" /></button>
                                </div>
                            )}
                        </div>
                        <div className="space-y-1.5 mb-3">
                            {template.items.map((item, itemIdx) => (
                                <div key={itemIdx} className="flex items-center gap-2 group/item">
                                    {editingItem?.catIdx === catIdx && editingItem?.itemIdx === itemIdx ? (
                                        <div className="flex items-center gap-2 flex-grow"><input value={editingItemName} onChange={e => setEditingItemName(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleRenameItem(catIdx, itemIdx)} className="flex-grow bg-brand-surface border border-brand-border rounded-lg px-2 py-1 text-sm text-brand-text-light" autoFocus /><button className="button-primary text-xs px-2 py-1" onClick={() => handleRenameItem(catIdx, itemIdx)}>Simpan</button></div>
                                    ) : (
                                        <>
                                            <span className="flex-grow text-sm text-brand-text-light bg-brand-bg px-3 py-1.5 rounded-lg">{item}</span>
                                            <button onClick={() => { setEditingItem({ catIdx, itemIdx }); setEditingItemName(item); }} className="opacity-0 group-hover/item:opacity-100 p-1 text-brand-text-secondary hover:text-brand-text-light hover:bg-white/10 rounded"><PencilIcon className="w-3.5 h-3.5" /></button>
                                            <button onClick={() => handleDeleteItem(catIdx, itemIdx)} className="opacity-0 group-hover/item:opacity-100 p-1 text-red-400 hover:bg-red-400/20 rounded"><Trash2Icon className="w-3.5 h-3.5" /></button>
                                        </>
                                    )}
                                </div>
                            ))}
                        </div>
                        <input type="text" value={newItemInputs[catIdx] || ''} onChange={e => setNewItemInputs(prev => ({ ...prev, [catIdx]: e.target.value }))} onKeyDown={e => e.key === 'Enter' && handleAddItem(catIdx)} placeholder="Tambah item baru..." className="w-full bg-brand-bg border border-brand-border rounded-lg px-3 py-1.5 text-xs text-brand-text-light" />
                    </div>
                ))}
            </div>
            {templates.length === 0 && <div className="text-center py-8 text-brand-text-secondary text-sm">Belum ada kategori. Tambahkan kategori di atas.</div>}
        </div>
    );
};
