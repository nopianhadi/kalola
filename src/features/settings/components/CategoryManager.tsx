import React from 'react';
import { PencilIcon, Trash2Icon } from '@/constants';
import { FieldLabel, inputCls } from '@/shared/ui/FormSection';

interface CategoryManagerProps {
    title: string;
    categories: string[];
    inputValue: string;
    onInputChange: (value: string) => void;
    onAddOrUpdate: () => void;
    onEdit: (value: string) => void;
    onDelete: (value: string) => void;
    editingValue: string | null;
    onCancelEdit: () => void;
    placeholder: string;
    /** Daftar saran yang bisa diklik langsung untuk ditambahkan */
    suggestedDefaults?: string[];
    /** Callback saat user klik tombol "Tambah Semua Saran" */
    onAddSuggested?: () => void;
    /** Callback saat user klik chip saran individual */
    onAddSuggestedItem?: (item: string) => void;
}

export const CategoryManager: React.FC<CategoryManagerProps> = ({
    title, categories, inputValue, onInputChange, onAddOrUpdate, onEdit, onDelete,
    editingValue, onCancelEdit, placeholder, suggestedDefaults, onAddSuggested, onAddSuggestedItem
}) => {
    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            onAddOrUpdate();
        }
    };

    const hasSuggestions = (suggestedDefaults?.filter(s => !categories.includes(s)) ?? []).length > 0;

    return (
        <div className="space-y-4">
            {/* Input + Tombol Tambah */}
            <div className="flex flex-col sm:flex-row gap-2">
                <div className="flex-grow">
                    <FieldLabel htmlFor={`input-${title.replace(/\s/g, '')}`}>{placeholder}</FieldLabel>
                    <input
                        type="text"
                        id={`input-${title.replace(/\s/g, '')}`}
                        value={inputValue}
                        onChange={e => onInputChange(e.target.value)}
                        onKeyDown={handleKeyDown}
                        className={inputCls}
                        placeholder={placeholder}
                    />
                </div>
                <div className="flex items-end gap-2">
                    <button
                        type="button"
                        onClick={onAddOrUpdate}
                        className="px-5 py-2.5 rounded-xl text-sm font-bold text-white bg-brand-accent hover:opacity-90 shadow-sm transition active:scale-95 whitespace-nowrap"
                    >
                        {editingValue ? 'Update' : 'Tambah'}
                    </button>
                    {editingValue && (
                        <button
                            type="button"
                            onClick={onCancelEdit}
                            className="px-4 py-2.5 rounded-xl text-sm font-semibold text-brand-text-secondary hover:bg-brand-bg transition whitespace-nowrap"
                        >
                            Batal
                        </button>
                    )}
                </div>
            </div>

            {/* Tombol saran default */}
            {hasSuggestions && onAddSuggested && (
                <button
                    type="button"
                    onClick={onAddSuggested}
                    className="text-xs font-semibold text-brand-accent hover:underline"
                >
                    + Tambah dari saran default
                </button>
            )}

            {/* Daftar item */}
            <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                {categories && categories.length > 0 ? categories.map(cat => (
                    <div key={cat} className="flex items-center justify-between px-3 py-2 bg-white border border-brand-border/60 rounded-xl shadow-sm transition-all hover:border-brand-accent/30">
                        <span className="text-xs md:text-sm text-brand-text-primary truncate flex-1 mr-2">{cat}</span>
                        <div className="flex items-center gap-1 flex-shrink-0">
                            <button type="button" onClick={() => onEdit(cat)} className="p-1.5 text-brand-text-secondary hover:text-brand-accent rounded-lg hover:bg-brand-bg transition" title="Edit">
                                <PencilIcon className="w-3.5 h-3.5" />
                            </button>
                            <button type="button" onClick={() => onDelete(cat)} className="p-1.5 text-brand-text-secondary hover:text-brand-danger rounded-lg hover:bg-red-50 transition" title="Hapus">
                                <Trash2Icon className="w-3.5 h-3.5" />
                            </button>
                        </div>
                    </div>
                )) : (
                    <div className="text-center text-brand-text-secondary text-xs py-6 border-2 border-dashed border-brand-border rounded-xl">
                        Belum ada {title.toLowerCase()}
                    </div>
                )}
            </div>
        </div>
    );
};
