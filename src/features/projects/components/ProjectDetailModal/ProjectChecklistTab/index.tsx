import React, { useState, useMemo } from 'react';
import { 
    LayoutIcon, 
    Share2Icon, 
    ZapIcon, 
    Loader2Icon,
    PlusIcon
} from 'lucide-react';
import { 
    Project, 
    WeddingDayChecklist, 
    Profile 
} from '@/features/projects/types/project.types';
import ChecklistCategory from '@/features/projects/components/ProjectDetailModal/ProjectChecklistTab/ChecklistCategory';

interface ProjectChecklistTabProps {
    selectedProject: Project;
    checklistItems: WeddingDayChecklist[];
    isInitializingChecklist: boolean;
    profile: Profile;
    handlers: {
        handleToggleChecklistItem: (itemId: number | string, status: boolean, list: WeddingDayChecklist[]) => Promise<void>;
        handleSaveChecklistNotes: (itemId: number | string, notes: string, list: WeddingDayChecklist[]) => Promise<void>;
        handleSaveItemEdits: (itemId: number | string, name: string, pic: string, list: WeddingDayChecklist[]) => Promise<void>;
        handleAddChecklistItem: (category: string, name: string, list: WeddingDayChecklist[]) => Promise<void>;
        handleDeleteChecklistItem: (itemId: number | string, list: WeddingDayChecklist[]) => Promise<void>;
        handleSaveCategoryName: (oldName: string, newName: string) => Promise<void>;
        handleDeleteCategory: (category: string) => Promise<void>;
        handleInitializeChecklist: (templates: any[]) => Promise<void>;
    };
    onOpenSharePreview: (projectId: number | string, checklist: WeddingDayChecklist[]) => void;
}

const ProjectChecklistTab: React.FC<ProjectChecklistTabProps> = ({
    selectedProject,
    checklistItems,
    isInitializingChecklist,
    profile,
    handlers,
    onOpenSharePreview
}) => {
    const [editingCategoryName, setEditingCategoryName] = useState<string | null>(null);
    const [categoryNameDraft, setCategoryNameDraft] = useState('');
    const [editingChecklistNotesId, setEditingChecklistNotesId] = useState<number | string | null>(null);
    const [checklistNotesDraft, setChecklistNotesDraft] = useState('');

    const categories = useMemo(() => {
        const groups: Record<string, WeddingDayChecklist[]> = {};
        checklistItems.forEach(item => {
            if (!groups[item.category]) groups[item.category] = [];
            groups[item.category].push(item);
        });
        return groups;
    }, [checklistItems]);

    const totalChecklist = checklistItems.length;
    const completedChecklist = checklistItems.filter(i => i.isCompleted).length;
    const overallProgress = totalChecklist > 0 ? (completedChecklist / totalChecklist) * 100 : 0;

    const handleAddCategory = () => {
        const newCat = prompt('Nama kategori baru:');
        if (newCat && newCat.trim()) {
            handlers.handleAddChecklistItem(newCat.trim(), 'Item pertama', checklistItems);
        }
    };

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            {/* Summary Header */}
            <div className="relative overflow-hidden rounded-[2.5rem] bg-gradient-to-br from-brand-accent/20 via-brand-accent/5 to-transparent border border-brand-accent/20 p-8 shadow-2xl">
                <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div>
                        <div className="flex items-center gap-3 mb-2">
                            <div className="p-2 bg-brand-accent/20 rounded-xl backdrop-blur-sm">
                                <LayoutIcon className="w-5 h-5 text-brand-accent" />
                            </div>
                            <h3 className="text-xl font-black text-brand-text-light tracking-tight">Checklist Hari H</h3>
                        </div>
                        <p className="text-sm text-brand-text-secondary font-medium max-w-md">Pantau persiapan teknis hari pernikahan secara real-time bersama tim.</p>
                    </div>
                    
                    <div className="flex flex-wrap gap-3">
                        <button
                            onClick={() => onOpenSharePreview(selectedProject.id, checklistItems)}
                            className="flex items-center gap-2 px-6 py-3 bg-brand-surface border border-brand-border rounded-2xl text-xs font-black text-brand-text-light hover:bg-brand-input hover:border-brand-accent/40 hover:-translate-y-0.5 transition-all shadow-lg active:scale-95"
                        >
                            <Share2Icon className="w-4 h-4 text-brand-accent" />
                            BAGIKAN CHECKLIST
                        </button>
                    </div>
                </div>

                <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="col-span-2 space-y-3">
                        <div className="flex justify-between items-end">
                            <span className="text-[10px] font-black text-brand-text-secondary uppercase tracking-[0.2em]">Overall Progress</span>
                            <span className="text-2xl font-black text-brand-accent">{Math.round(overallProgress)}%</span>
                        </div>
                        <div className="h-4 bg-brand-bg/50 rounded-full border border-brand-border/30 overflow-hidden backdrop-blur-md p-1">
                            <div 
                                className="h-full bg-gradient-to-r from-brand-accent to-blue-400 rounded-full shadow-[0_0_15px_rgba(59,130,246,0.5)] transition-all duration-1000 ease-out"
                                style={{ width: `${overallProgress}%` }}
                            ></div>
                        </div>
                    </div>
                    <div className="flex items-center justify-center p-4 rounded-[2rem] bg-white/5 border border-brand-border/20 backdrop-blur-md">
                        <div className="text-center">
                            <p className="text-xs font-black text-brand-text-secondary uppercase tracking-widest mb-1">Dikerjakan</p>
                            <p className="text-3xl font-black text-brand-text-light">{completedChecklist} <span className="text-sm text-brand-text-secondary opacity-50">/ {totalChecklist}</span></p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Empty State / Initialization */}
            {checklistItems.length === 0 && (
                <div className="flex flex-col items-center justify-center py-20 px-6 rounded-[2.5rem] bg-brand-surface/30 border-2 border-dashed border-brand-border">
                    <div className="w-20 h-20 rounded-full bg-brand-accent/10 border border-brand-accent/20 flex items-center justify-center mb-6">
                        <ZapIcon className="w-10 h-10 text-brand-accent animate-pulse" />
                    </div>
                    <h3 className="text-xl font-bold text-brand-text-light mb-2">Checklist Belum Dimulai</h3>
                    <p className="text-sm text-brand-text-secondary text-center max-w-sm mb-8">Pilih template checklist sesuai paket yang dipilih untuk memulai pemantauan persiapan.</p>
                    
                    <button
                        onClick={() => {
                            const customTemplates = profile.checklistTemplates && profile.checklistTemplates.length > 0
                                ? profile.checklistTemplates
                                : undefined;
                            handlers.handleInitializeChecklist(customTemplates);
                        }}
                        disabled={isInitializingChecklist}
                        className="flex items-center gap-2 px-8 py-4 bg-brand-accent text-white rounded-2xl text-sm font-black hover:bg-brand-accent/90 hover:scale-105 active:scale-95 transition-all shadow-xl shadow-brand-accent/20 disabled:opacity-50 disabled:scale-100"
                    >
                        {isInitializingChecklist ? <Loader2Icon className="w-5 h-5 animate-spin" /> : <PlusIcon className="w-5 h-5" />}
                        BUAT CHECKLIST DEFAULT
                    </button>
                </div>
            )}

            {/* Category List */}
            {checklistItems.length > 0 && (
                <div className="space-y-8 pb-10">
                    <div className="flex items-center justify-between px-2">
                        <h4 className="text-xs font-black text-brand-text-secondary uppercase tracking-[0.3em]">Kategori Persiapan</h4>
                        <button 
                            onClick={handleAddCategory}
                            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-brand-accent text-white text-[10px] font-black hover:bg-brand-accent/90 transition-all shadow-lg active:scale-95"
                        >
                            <PlusIcon className="w-3.5 h-3.5" /> TAMBAH KATEGORI
                        </button>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {Object.entries(categories).map(([category, items]) => (
                            <ChecklistCategory
                                key={category}
                                category={category}
                                items={items}
                                isEditingName={editingCategoryName === category}
                                nameDraft={categoryNameDraft}
                                setNameDraft={setCategoryNameDraft}
                                onSaveCategoryName={() => {
                                    handlers.handleSaveCategoryName(category, categoryNameDraft);
                                    setEditingCategoryName(null);
                                }}

                                onStartEditName={(name) => {
                                    setEditingCategoryName(name);
                                    setCategoryNameDraft(name);
                                }}
                                onDeleteCategory={handlers.handleDeleteCategory}
                                onToggleItem={(id, status) => handlers.handleToggleChecklistItem(id, status, checklistItems)}
                                onDeleteItem={(id) => handlers.handleDeleteChecklistItem(id, checklistItems)}
                                onSaveItemEdits={(id, name, pic) => handlers.handleSaveItemEdits(id, name, pic, checklistItems)}
                                onAddItem={(cat, name) => handlers.handleAddChecklistItem(cat, name, checklistItems)}
                                editingNotesId={editingChecklistNotesId}
                                notesDraft={checklistNotesDraft}
                                setNotesDraft={setChecklistNotesDraft}
                                onStartEditNotes={(id, notes) => {
                                    setEditingChecklistNotesId(id);
                                    setChecklistNotesDraft(notes);
                                }}
                                onSaveNotes={(id, notes) => {
                                    handlers.handleSaveChecklistNotes(id, notes, checklistItems);
                                    setEditingChecklistNotesId(null);
                                }}
                                onCancelEditNotes={() => setEditingChecklistNotesId(null)}
                            />
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

export default ProjectChecklistTab;
