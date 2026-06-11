import React from 'react';
import { AddOn } from '@/types';
import { PlusIcon, PencilIcon, Trash2Icon } from '@/constants';
import { formatCurrency } from '@/features/booking/utils/booking.utils';
import RupiahInput from '@/shared/form/RupiahInput';

interface AddOnSectionProps {
    addOns: AddOn[];
    regionFilter: string;
    editMode: number | null;
    formData: { name: string; price: string; region: string };
    onInputChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    onPriceChange: (raw: string) => void;
    onRegionSelect: (region: string) => void;
    onSubmit: (e: React.FormEvent) => void;
    onEdit: (addon: AddOn) => void;
    onDelete: (id: number) => void;
    onCancelEdit: () => void;
    unionRegions: { value: string; label: string }[];
}

const AddOnSection: React.FC<AddOnSectionProps> = ({
    addOns,
    regionFilter,
    editMode,
    formData,
    onInputChange,
    onPriceChange,
    onRegionSelect,
    onSubmit,
    onEdit,
    onDelete,
    onCancelEdit,
    unionRegions
}) => {
    const filteredAddOns = regionFilter ? addOns.filter(a => a.region === regionFilter) : addOns;

    return (
        <aside className="lg:col-span-1 space-y-6 lg:sticky lg:top-24">
            <div className="bg-white rounded-2xl border border-slate-100 flex flex-col shadow-xl shadow-slate-200/50">
                <div className="p-4 md:p-5 border-b border-slate-100">
                    <h3 className="font-bold text-lg text-slate-900 flex items-center gap-2">
                        <PlusIcon className="w-5 h-5 text-brand-accent" /> Layanan Tambahan
                    </h3>
                    <p className="text-xs text-slate-500 mt-1">Kelola ekstra Add-Ons.</p>
                </div>

                <div className="p-3 space-y-2 max-h-[40vh] overflow-y-auto custom-scrollbar bg-slate-50/70">
                    {filteredAddOns.map(addon => (
                        <div key={addon.id} className="group flex justify-between items-center bg-white hover:bg-blue-50/40 border border-slate-100 p-3 rounded-xl transition-all shadow-sm">
                            <div className="flex flex-col min-w-0 pr-2">
                                <span className="text-sm font-semibold text-slate-900 truncate">{addon.name}</span>
                                <span className="text-xs font-bold text-brand-accent mt-0.5">{formatCurrency(addon.price)}</span>
                            </div>
                            <div className="flex gap-1 opacity-100 lg:opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
                                <button onClick={() => onEdit(addon)} className="p-2 rounded-lg text-slate-400 hover:bg-amber-50 hover:text-amber-600 transition-colors"><PencilIcon className="w-4 h-4" /></button>
                                <button onClick={() => onDelete(addon.id)} className="p-2 rounded-lg text-slate-400 hover:bg-red-50 hover:text-red-600 transition-colors"><Trash2Icon className="w-4 h-4" /></button>
                            </div>
                        </div>
                    ))}
                    {filteredAddOns.length === 0 && (
                        <div className="text-center py-8 text-slate-400 text-sm">
                            Belum ada add-on untuk wilayah ini.
                        </div>
                    )}
                </div>

                <form onSubmit={onSubmit} className="p-4 md:p-5 border-t border-slate-100 space-y-4">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">{editMode ? 'Edit Add-On' : 'Tambah Add-On Baru'}</h4>
                    <div className="input-group">
                        <label htmlFor="addOnName" className="input-label">Nama Add-On</label>
                        <input type="text" id="addOnName" name="name" value={formData.name} onChange={onInputChange} className="input-field bg-white border-slate-200" placeholder=" " required />
                    </div>
                    <div className="input-group">
                        <label htmlFor="addOnPrice" className="input-label">Harga (IDR)</label>
                        <RupiahInput id="addOnPrice" value={formData.price.toString()} onChange={onPriceChange} className="input-field bg-white border-slate-200" placeholder=" " required />
                    </div>
                    <div className="input-group">
                        <label htmlFor="addOnRegion" className="input-label">Wilayah (opsional)</label>
                        <input
                            type="text"
                            id="addOnRegion"
                            name="region"
                            list="region-suggestions-addon"
                            value={formData.region}
                            onChange={onInputChange}
                            className="input-field bg-white border-slate-200"
                            placeholder=" "
                        />
                        <datalist id="region-suggestions-addon">
                            {unionRegions.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
                        </datalist>
                    </div>
                    <div className="flex flex-wrap gap-1.5 pt-1">
                        {unionRegions.map(r => (
                            <button type="button" key={r.value} onClick={() => onRegionSelect(r.value)} className={`px-2.5 py-1 rounded-full text-[10px] font-semibold transition-colors border ${formData.region === r.value ? 'bg-brand-accent text-white border-brand-accent shadow-sm' : 'bg-white border-slate-200 border-dashed text-slate-500 hover:border-brand-accent/50'}`}>{r.label}</button>
                        ))}
                        {formData.region && (
                            <button type="button" onClick={() => onRegionSelect('')} className="px-2.5 py-1 rounded-full text-[10px] font-semibold border bg-red-50 border-red-200 text-brand-danger">Kosongkan</button>
                        )}
                    </div>
                    <div className="flex gap-2 pt-2">
                        {editMode && <button type="button" onClick={onCancelEdit} className="flex-1 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50 transition-colors">Batal</button>}
                        <button type="submit" className="flex-[2] py-2 rounded-xl bg-brand-accent text-white text-xs font-bold shadow-md hover:bg-brand-accent/90 transition-colors">{editMode ? 'Simpan' : 'Tambah'}</button>
                    </div>
                </form>
            </div>
        </aside>
    );
};

export default AddOnSection;
