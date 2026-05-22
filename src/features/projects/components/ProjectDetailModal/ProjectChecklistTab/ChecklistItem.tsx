import React, { useState } from 'react';
import { CheckCircleIcon, PencilIcon, Trash2Icon, UserIcon } from 'lucide-react';
import { WeddingDayChecklist } from '@/features/projects/types/project.types';

interface ChecklistItemProps {
    item: WeddingDayChecklist;
    onToggle: (itemId: number | string, status: boolean) => void;
    onDelete: (itemId: number | string) => void;
    onSaveEdits: (itemId: number | string, name: string, pic: string) => void;
    onEditNotes: (itemId: number | string, notes: string) => void;
}

const ChecklistItem: React.FC<ChecklistItemProps> = ({ 
    item, 
    onToggle, 
    onDelete, 
    onSaveEdits, 
    onEditNotes 
}) => {
    const [isEditing, setIsEditing] = useState(false);
    const [nameDraft, setNameDraft] = useState(item.itemName);
    const [picDraft, setPicDraft] = useState(item.assignedTo || '');

    const handleSave = () => {
        onSaveEdits(item.id, nameDraft, picDraft);
        setIsEditing(false);
    };

    return (
        <div className="flex items-start gap-4 p-3 rounded-2xl hover:bg-white/5 transition-all group">
            <button
                onClick={() => onToggle(item.id, item.isCompleted)}
                className={`flex-shrink-0 mt-0.5 w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all active:scale-90
                    ${item.isCompleted ? 'bg-brand-accent border-brand-accent shadow-[0_0_8px_rgba(59,130,246,0.3)]' : 'border-brand-border bg-brand-surface hover:border-brand-accent/50'}
                `}
            >
                {item.isCompleted && <CheckCircleIcon className="w-4 h-4 text-white" />}
            </button>
            
            <div className="flex-grow min-w-0">
                {isEditing ? (
                    <div className="flex flex-col gap-2 w-full bg-brand-bg/50 p-3 rounded-xl border border-brand-border/50">
                        <input
                            value={nameDraft}
                            onChange={(e) => setNameDraft(e.target.value)}
                            className="w-full bg-brand-surface border border-brand-border rounded-xl px-3 py-2 text-sm text-brand-text-light focus:outline-none"
                            placeholder="Nama tugas"
                            autoFocus
                        />
                        <div className="flex flex-col md:flex-row gap-2">
                            <div className="relative flex-grow">
                                <UserIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-brand-text-secondary" />
                                <input
                                    value={picDraft}
                                    onChange={(e) => setPicDraft(e.target.value)}
                                    className="w-full bg-brand-surface border border-brand-border rounded-xl pl-9 pr-3 py-2 text-sm text-brand-text-light focus:outline-none"
                                    placeholder="PIC / Penanggung Jawab"
                                />
                            </div>
                            <div className="flex gap-2">
                                <button className="px-4 py-2 text-xs text-brand-text-secondary" onClick={() => setIsEditing(false)}>Batal</button>
                                <button className="px-4 py-2 bg-brand-accent text-white text-xs rounded-xl" onClick={handleSave}>Simpan</button>
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="flex items-start justify-between gap-2">
                        <div className="flex flex-col gap-1.5">
                            <p className={`text-sm font-medium transition-colors ${item.isCompleted ? 'text-brand-text-secondary line-through' : 'text-brand-text-light'}`}>
                                {item.itemName}
                            </p>
                            {item.assignedTo && (
                                <span className="w-fit inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-brand-input border border-brand-border text-[10px] sm:text-xs font-semibold text-brand-text-secondary">
                                    <UserIcon className="w-3 h-3 text-brand-accent opacity-70" />
                                    {item.assignedTo}
                                </span>
                            )}
                        </div>
                        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button onClick={() => setIsEditing(true)} className="p-1 text-brand-text-secondary hover:text-brand-accent"><PencilIcon className="w-3.5 h-3.5" /></button>
                            <button onClick={() => onDelete(item.id)} className="p-1 text-brand-text-secondary hover:text-red-400"><Trash2Icon className="w-3.5 h-3.5" /></button>
                        </div>
                    </div>
                )}
                <div className="mt-1 flex items-center gap-3">
                    <button
                        onClick={() => onEditNotes(item.id, item.notes || '')}
                        className={`text-[9px] font-bold uppercase tracking-wider hover:text-brand-accent transition-colors ${item.notes ? 'text-brand-accent' : 'text-brand-text-secondary'}`}
                    >
                        {item.notes ? '• Lihat Catatan' : '+ Catatan'}
                    </button>
                    {item.isCompleted && item.updatedAt && (
                        <span className="text-[9px] text-brand-text-secondary/50 font-medium">
                            ✓ {new Date(item.updatedAt).toLocaleTimeString('id-ID', { hour:'2-digit', minute:'2-digit' })}
                        </span>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ChecklistItem;
