import React from 'react';
import { CheckCircleIcon, PencilIcon, Trash2Icon, PlusIcon } from 'lucide-react';
import { WeddingDayChecklist } from '@/features/projects/types/project.types';
import ChecklistItem from '@/features/projects/components/ProjectDetailModal/ProjectChecklistTab/ChecklistItem';

interface ChecklistCategoryProps {
    category: string;
    items: WeddingDayChecklist[];
    isEditingName: boolean;
    nameDraft: string;
    setNameDraft: (name: string) => void;
    onSaveCategoryName: () => void;
    onStartEditName: (name: string) => void;
    onDeleteCategory: (name: string) => void;
    onToggleItem: (itemId: number | string, status: boolean) => void;
    onDeleteItem: (itemId: number | string) => void;
    onSaveItemEdits: (itemId: number | string, name: string, pic: string) => void;
    onAddItem: (category: string, name: string) => void;
    editingNotesId: number | string | null;
    notesDraft: string;
    setNotesDraft: (notes: string) => void;
    onStartEditNotes: (itemId: number | string, notes: string) => void;
    onSaveNotes: (itemId: number | string, notes: string) => void;
    onCancelEditNotes: () => void;
}

const ChecklistCategory: React.FC<ChecklistCategoryProps> = ({
    category,
    items,
    isEditingName,
    nameDraft,
    setNameDraft,
    onSaveCategoryName,
    onStartEditName,
    onDeleteCategory,
    onToggleItem,
    onDeleteItem,
    onSaveItemEdits,
    onAddItem,
    editingNotesId,
    notesDraft,
    setNotesDraft,
    onStartEditNotes,
    onSaveNotes,
    onCancelEditNotes
}) => {
    const doneCount = items.filter(i => i.isCompleted).length;
    const totalCount = items.length;
    const progress = totalCount > 0 ? (doneCount / totalCount) * 100 : 0;

    return (
        <div className="rounded-3xl bg-brand-surface border border-brand-border shadow-sm overflow-hidden animate-in fade-in slide-in-from-bottom-2 duration-300">
            <div className="bg-brand-input px-6 py-4 flex items-center justify-between border-b border-brand-border group">
                {isEditingName ? (
                    <div className="flex items-center gap-2 flex-grow">
                        <input
                            value={nameDraft}
                            onChange={(e) => setNameDraft(e.target.value)}
                            className="flex-grow bg-brand-surface border border-brand-border rounded-xl px-4 py-2 text-sm text-brand-text-light focus:outline-none focus:ring-2 focus:ring-brand-accent/50"
                            autoFocus
                        />
                        <button className="p-2 bg-brand-accent text-white rounded-lg" onClick={onSaveCategoryName}><CheckCircleIcon className="w-4 h-4" /></button>
                    </div>
                ) : (
                    <>
                        <div className="flex items-center gap-3">
                            <div className="w-2 h-2 rounded-full bg-brand-accent"></div>
                            <h4 className="font-extrabold text-brand-text-light tracking-tight uppercase text-xs">{category}</h4>
                            <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button onClick={() => onStartEditName(category)} className="p-1.5 text-brand-text-secondary hover:text-brand-accent"><PencilIcon className="w-3.5 h-3.5" /></button>
                                <button onClick={() => onDeleteCategory(category)} className="p-1.5 text-brand-text-secondary hover:text-red-400"><Trash2Icon className="w-3.5 h-3.5" /></button>
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="text-[10px] font-black text-brand-text-secondary">{doneCount}/{totalCount}</span>
                            <div className="w-16 h-1.5 bg-brand-surface rounded-full overflow-hidden">
                                <div className="h-full bg-brand-accent" style={{ width: `${progress}%` }}></div>
                            </div>
                        </div>
                    </>
                )}
            </div>

            <div className="p-4 space-y-1">
                {items.map(item => (
                    <React.Fragment key={item.id}>
                        <ChecklistItem
                            item={item}
                            onToggle={onToggleItem}
                            onDelete={onDeleteItem}
                            onSaveEdits={onSaveItemEdits}
                            onEditNotes={onStartEditNotes}
                        />
                        {String(editingNotesId) === String(item.id) && (
                            <div className="mt-2 p-4 rounded-2xl bg-brand-surface border border-brand-border shadow-inner animate-in fade-in slide-in-from-top-2">
                                <p className="text-[10px] font-bold text-brand-text-secondary uppercase tracking-widest mb-2">Item Note</p>
                                <textarea
                                    value={notesDraft}
                                    onChange={(e) => setNotesDraft(e.target.value)}
                                    rows={3}
                                    className="w-full bg-brand-input border border-brand-border rounded-xl px-4 py-3 text-sm text-brand-text-light focus:outline-none"
                                />
                                <div className="flex items-center justify-end gap-2 mt-3">
                                    <button className="px-4 py-2 text-xs text-brand-text-secondary" onClick={onCancelEditNotes}>Batal</button>
                                    <button className="px-6 py-2 bg-brand-accent text-white rounded-xl text-xs font-bold" onClick={() => onSaveNotes(item.id, notesDraft)}>Simpan</button>
                                </div>
                            </div>
                        )}
                    </React.Fragment>
                ))}

                <div className="mt-4 px-3 border-t border-brand-border/30 pt-4">
                    <div className="relative">
                        <PlusIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-brand-text-secondary" />
                        <input
                            type="text"
                            placeholder={`Tambah item ke ${category}...`}
                            className="w-full bg-brand-input border border-brand-border rounded-xl pl-10 pr-4 py-3 text-sm text-brand-text-light focus:outline-none"
                            onKeyDown={(e) => {
                                if (e.key === 'Enter' && e.currentTarget.value.trim()) {
                                    onAddItem(category, e.currentTarget.value);
                                    e.currentTarget.value = '';
                                }
                            }}
                        />
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ChecklistCategory;
