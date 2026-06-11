import React, { useRef } from 'react';
import RupiahInput from '@/shared/form/RupiahInput';
import { Trash2Icon, ChevronDownIcon, PackageIcon, ClockIcon, UsersIcon, ListIcon, ImageIcon, PlusIcon, CheckIcon } from '@/constants';
import { Profile } from '@/types';

interface PackageFormProps {
    onSubmit: (e: React.FormEvent) => void;
    mode: 'add' | 'edit';
    formData: any;
    onInputChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => void;
    onPriceChange: (raw: string) => void;
    onCoverImageChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    onDurationOptionChange: (index: number, field: string, value: any) => void;
    addDurationOption: () => void;
    removeDurationOption: (index: number) => void;
    expandedDurationIndex: number | null;
    setExpandedDurationIndex: (index: number | null) => void;
    onDurationDetailChange: (optIndex: number, type: 'digital' | 'physical', itemIndex: number, field: string, value: any) => void;
    addDurationDetail: (optIndex: number, type: 'digital' | 'physical') => void;
    removeDurationDetail: (optIndex: number, type: 'digital' | 'physical', itemIndex: number) => void;
    onListChange: (type: 'digital' | 'physical', index: number, field: string, value: any) => void;
    addListItem: (type: 'digital' | 'physical') => void;
    removeListItem: (type: 'digital' | 'physical', index: number) => void;
    profile: Profile;
    unionRegions: { value: string; label: string }[];
    inline?: boolean;
    onCancel?: () => void;
}

// Reusable field label
const FieldLabel: React.FC<{ children: React.ReactNode; optional?: boolean }> = ({ children, optional }) => (
    <label className="block text-xs font-semibold text-brand-text-secondary mb-1.5">
        {children}
        {optional && <span className="ml-1 font-normal text-brand-text-secondary/60">(opsional)</span>}
    </label>
);

// Reusable section header — table-style with left accent bar
const SectionHeader: React.FC<{ icon: React.ReactNode; title: string; subtitle?: string }> = ({ icon, title, subtitle }) => (
    <div className="flex items-center gap-3 mb-3 -mx-6 md:-mx-8 px-5 md:px-7 py-3 bg-slate-100/80 border-y border-slate-200">
        {/* left accent bar */}
        <div className="w-1 h-8 rounded-full bg-brand-accent flex-shrink-0" />
        <div className="w-7 h-7 rounded-lg bg-brand-accent/15 text-brand-accent flex items-center justify-center flex-shrink-0">
            {icon}
        </div>
        <div className="flex-1 min-w-0">
            <h3 className="text-sm font-bold text-brand-text-light leading-none">{title}</h3>
            {subtitle && <p className="text-xs text-brand-text-secondary/80 mt-0.5">{subtitle}</p>}
        </div>
    </div>
);


export const PackageForm: React.FC<PackageFormProps> = ({
    onSubmit, mode, formData,
    onInputChange, onPriceChange, onCoverImageChange,
    onDurationOptionChange, addDurationOption, removeDurationOption,
    expandedDurationIndex, setExpandedDurationIndex,
    onDurationDetailChange, addDurationDetail, removeDurationDetail,
    onListChange, addListItem, removeListItem,
    profile, unionRegions, onCancel
}) => {
    const fileInputRef = useRef<HTMLInputElement>(null);
    const hasValidOptions = Array.isArray(formData.durationOptions) &&
        formData.durationOptions.some((o: any) =>
            String(o.label || '').trim() !== '' && String(o.price || '') !== ''
        );

    return (
        <form onSubmit={onSubmit} className="space-y-6 -mt-6 md:-mt-8">

            {/* ── SECTION 1: Informasi Utama ── */}
            <SectionHeader
                icon={<PackageIcon className="w-4 h-4" />}
                title="Informasi Utama"
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 -mt-2">
                <div>
                    <FieldLabel>Nama Package</FieldLabel>
                    <input
                        type="text"
                        name="name"
                        value={formData.name}
                        onChange={onInputChange}
                        className="w-full px-4 py-2.5 rounded-xl border border-brand-border bg-white text-sm font-semibold text-brand-text-light focus:outline-none focus:ring-2 focus:ring-brand-accent/30 focus:border-brand-accent transition"
                        placeholder="Cth: Wedding Gold Package"
                        required
                    />
                </div>
                <div>
                    <FieldLabel>Harga Dasar (IDR)</FieldLabel>
                    {hasValidOptions ? (
                        <div className="w-full px-4 py-2.5 rounded-xl border border-brand-border bg-brand-bg text-sm text-brand-text-secondary italic">
                            Mengikut opsi durasi
                        </div>
                    ) : (
                        <RupiahInput
                            value={formData.price.toString()}
                            onChange={onPriceChange}
                            className="w-full px-4 py-2.5 rounded-xl border border-brand-border bg-white text-sm font-bold text-blue-600 focus:outline-none focus:ring-2 focus:ring-brand-accent/30 focus:border-brand-accent transition"
                            placeholder="0"
                        />
                    )}
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <FieldLabel>Kategori</FieldLabel>
                    <select
                        name="category"
                        value={formData.category}
                        onChange={onInputChange}
                        className="w-full px-4 py-2.5 rounded-xl border border-brand-border bg-white text-sm font-medium text-brand-text-light focus:outline-none focus:ring-2 focus:ring-brand-accent/30 focus:border-brand-accent transition"
                        required
                    >
                        <option value="">Pilih kategori...</option>
                        {(profile?.packageCategories || []).map(cat => (
                            <option key={cat} value={cat}>{cat}</option>
                        ))}
                    </select>
                </div>
                <div>
                    <FieldLabel optional>Wilayah</FieldLabel>
                    <input
                        type="text"
                        name="region"
                        list="region-suggestions-pkg"
                        value={formData.region}
                        onChange={onInputChange}
                        className="w-full px-4 py-2.5 rounded-xl border border-brand-border bg-white text-sm text-brand-text-light focus:outline-none focus:ring-2 focus:ring-brand-accent/30 focus:border-brand-accent transition"
                        placeholder="Cth: Bandung"
                    />
                    <datalist id="region-suggestions-pkg">
                        {unionRegions.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
                    </datalist>
                </div>
            </div>

            {/* ── SECTION 2: Visual & Tim ── */}
            <SectionHeader
                icon={<UsersIcon className="w-4 h-4" />}
                title="Visual & Tim"
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <FieldLabel optional>Default Jumlah Tim</FieldLabel>
                    <input
                        type="text"
                        name="photographers"
                        value={formData.photographers}
                        onChange={onInputChange}
                        className="w-full px-4 py-2.5 rounded-xl border border-brand-border bg-white text-sm text-brand-text-light focus:outline-none focus:ring-2 focus:ring-brand-accent/30 focus:border-brand-accent transition"
                        placeholder="Cth: 2 Fotografer, 1 Asisten, 2 Videografer"
                    />
                </div>

                {/* Cover Image — custom styled */}
                <div>
                    <FieldLabel optional>Gambar Sampul</FieldLabel>
                    <div
                        className="relative flex items-center gap-3 w-full px-4 py-2.5 rounded-xl border border-brand-border bg-white cursor-pointer hover:border-brand-accent/60 transition group"
                        onClick={() => fileInputRef.current?.click()}
                    >
                        {formData.coverImage ? (
                            <>
                                <img
                                    src={formData.coverImage}
                                    alt="Cover"
                                    className="w-8 h-8 rounded-lg object-cover flex-shrink-0 border border-brand-border"
                                />
                                <span className="text-sm text-brand-text-light font-medium truncate flex-1">Gambar dipilih</span>
                                <CheckIcon className="w-4 h-4 text-green-500 flex-shrink-0" />
                            </>
                        ) : (
                            <>
                                <div className="w-8 h-8 rounded-lg bg-brand-bg border border-brand-border flex items-center justify-center flex-shrink-0">
                                    <ImageIcon className="w-4 h-4 text-brand-text-secondary" />
                                </div>
                                <span className="text-sm text-brand-text-secondary flex-1">Pilih gambar...</span>
                            </>
                        )}
                        <input
                            ref={fileInputRef}
                            type="file"
                            onChange={onCoverImageChange}
                            className="hidden"
                            accept="image/*"
                        />
                    </div>
                    <p className="text-xs text-brand-text-secondary/60 mt-1">Maks. 2MB · JPG, PNG, WEBP</p>
                </div>
            </div>

            {/* ── SECTION 3: Opsi Durasi & Harga ── */}
            <SectionHeader
                icon={<ClockIcon className="w-4 h-4" />}
                title="Opsi Durasi & Harga"
                subtitle="Tambahkan variasi durasi dengan harga berbeda."
            />

            <div className="space-y-3">
                {formData.durationOptions?.map((opt: any, index: number) => (
                    <div key={index} className="border border-brand-border rounded-xl overflow-hidden bg-white">
                        {/* Row utama opsi */}
                        <div className="flex items-center gap-2 px-3 py-2.5">
                            <input
                                type="text"
                                value={opt.label}
                                onChange={e => onDurationOptionChange(index, 'label', e.target.value)}
                                className="flex-1 min-w-0 px-3 py-2 rounded-lg border border-brand-border text-sm font-semibold bg-brand-bg/40 focus:outline-none focus:ring-2 focus:ring-brand-accent/20 focus:border-brand-accent transition"
                                placeholder="Label (cth: 8 Jam)"
                            />
                            <RupiahInput
                                value={opt.price.toString()}
                                onChange={(raw) => onDurationOptionChange(index, 'price', raw)}
                                className="flex-1 min-w-0 px-3 py-2 rounded-lg border border-brand-border text-sm font-bold text-blue-600 bg-brand-bg/40 focus:outline-none focus:ring-2 focus:ring-brand-accent/20 focus:border-brand-accent transition"
                                placeholder="Harga"
                            />
                            {/* Default radio */}
                            <label
                                className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border cursor-pointer text-xs font-semibold transition flex-shrink-0 ${opt.default ? 'bg-blue-50 border-blue-300 text-blue-600' : 'border-brand-border text-brand-text-secondary hover:border-brand-accent/40'}`}
                                title="Jadikan default"
                            >
                                <input
                                    type="radio"
                                    name={`durationDefault`}
                                    checked={!!opt.default}
                                    onChange={() => onDurationOptionChange(index, 'default', true)}
                                    className="sr-only"
                                />
                                {opt.default ? <CheckIcon className="w-3 h-3" /> : <span className="w-3 h-3 rounded-full border border-current inline-block" />}
                                Default
                            </label>
                            {/* Expand detail */}
                            <button
                                type="button"
                                onClick={() => setExpandedDurationIndex(expandedDurationIndex === index ? null : index)}
                                className={`p-1.5 rounded-lg border transition flex-shrink-0 ${expandedDurationIndex === index ? 'bg-brand-accent/10 border-brand-accent/30 text-brand-accent' : 'border-brand-border text-brand-text-secondary hover:border-brand-accent/40 hover:text-brand-accent'}`}
                                title="Detail"
                            >
                                <ChevronDownIcon className={`w-4 h-4 transition-transform duration-200 ${expandedDurationIndex === index ? 'rotate-180' : ''}`} />
                            </button>
                            {/* Remove */}
                            <button
                                type="button"
                                onClick={() => removeDurationOption(index)}
                                className="p-1.5 rounded-lg border border-brand-border text-brand-text-secondary hover:border-red-300 hover:text-red-500 hover:bg-red-50 transition flex-shrink-0"
                                title="Hapus"
                            >
                                <Trash2Icon className="w-4 h-4" />
                            </button>
                        </div>

                        {/* Detail expanded */}
                        {expandedDurationIndex === index && (
                            <div className="border-t border-brand-border bg-brand-bg/30 p-4 space-y-4">
                                <div>
                                    <FieldLabel optional>Jumlah Tim (untuk opsi ini)</FieldLabel>
                                    <input
                                        type="text"
                                        value={opt.photographers || ''}
                                        onChange={e => onDurationOptionChange(index, 'photographers', e.target.value)}
                                        className="w-full px-3 py-2 rounded-lg border border-brand-border bg-white text-sm focus:outline-none focus:ring-2 focus:ring-brand-accent/20 focus:border-brand-accent transition"
                                        placeholder="Cth: 2 Fotografer, 1 Videografer"
                                    />
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {/* Deskripsi */}
                                    <div>
                                        <FieldLabel>Deskripsi Detail</FieldLabel>
                                        <div className="space-y-2">
                                            {(opt.digitalItems || ['']).map((item: string, i: number) => (
                                                <div key={i} className="flex gap-2">
                                                    <input
                                                        type="text"
                                                        value={item}
                                                        onChange={e => onDurationDetailChange(index, 'digital', i, '', e.target.value)}
                                                        className="flex-1 px-3 py-2 rounded-lg border border-brand-border bg-white text-xs focus:outline-none focus:ring-2 focus:ring-brand-accent/20 focus:border-brand-accent transition"
                                                        placeholder="Deskripsi..."
                                                    />
                                                    <button type="button" onClick={() => removeDurationDetail(index, 'digital', i)} className="p-1.5 text-brand-text-secondary hover:text-red-500 transition">
                                                        <Trash2Icon className="w-3.5 h-3.5" />
                                                    </button>
                                                </div>
                                            ))}
                                            <button
                                                type="button"
                                                onClick={() => addDurationDetail(index, 'digital')}
                                                className="flex items-center gap-1 text-xs font-semibold text-brand-accent hover:text-brand-accent/80 transition"
                                            >
                                                <PlusIcon className="w-3 h-3" /> Tambah Detail
                                            </button>
                                        </div>
                                    </div>
                                    {/* Vendor */}
                                    <div>
                                        <FieldLabel>Vendor / Item</FieldLabel>
                                        <div className="space-y-2">
                                            {(opt.physicalItems || [{ name: '', price: 0 }]).map((item: any, i: number) => (
                                                <div key={i} className="flex gap-2">
                                                    <input
                                                        type="text"
                                                        value={item.name || ''}
                                                        onChange={e => onDurationDetailChange(index, 'physical', i, 'name', e.target.value)}
                                                        className="flex-1 px-3 py-2 rounded-lg border border-brand-border bg-white text-xs focus:outline-none focus:ring-2 focus:ring-brand-accent/20 focus:border-brand-accent transition"
                                                        placeholder="Nama Vendor/Barang"
                                                    />
                                                    <button type="button" onClick={() => removeDurationDetail(index, 'physical', i)} className="p-1.5 text-brand-text-secondary hover:text-red-500 transition">
                                                        <Trash2Icon className="w-3.5 h-3.5" />
                                                    </button>
                                                </div>
                                            ))}
                                            <button
                                                type="button"
                                                onClick={() => addDurationDetail(index, 'physical')}
                                                className="flex items-center gap-1 text-xs font-semibold text-brand-accent hover:text-brand-accent/80 transition"
                                            >
                                                <PlusIcon className="w-3 h-3" /> Tambah Vendor
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                ))}

                {/* Add duration button */}
                <button
                    type="button"
                    onClick={addDurationOption}
                    className="w-full flex items-center justify-center gap-2 py-2.5 border border-dashed border-brand-border rounded-xl text-sm font-semibold text-brand-text-secondary hover:border-brand-accent hover:text-brand-accent transition"
                >
                    <PlusIcon className="w-4 h-4" />
                    Tambah Opsi Durasi
                </button>
            </div>

            {/* ── SECTION 4: Deskripsi & Vendor Default ── */}
            <SectionHeader
                icon={<ListIcon className="w-4 h-4" />}
                title="Deskripsi & Vendor Default"
                subtitle="Data default jika tidak ada opsi durasi spesifik."
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Kelengkapan Package */}
                <div>
                    <FieldLabel>Kelengkapan Package</FieldLabel>
                    <div className="space-y-2">
                        {formData.digitalItems.map((item: string, index: number) => (
                            <div key={index} className="flex items-center gap-2">
                                <input
                                    type="text"
                                    value={item}
                                    onChange={e => onListChange('digital', index, '', e.target.value)}
                                    className="flex-1 px-3 py-2 rounded-lg border border-brand-border bg-white text-xs focus:outline-none focus:ring-2 focus:ring-brand-accent/20 focus:border-brand-accent transition"
                                    placeholder="Cth: Box Kayu Eksklusif"
                                />
                                <button type="button" onClick={() => removeListItem('digital', index)} className="p-1.5 text-brand-text-secondary hover:text-red-500 transition flex-shrink-0">
                                    <Trash2Icon className="w-3.5 h-3.5" />
                                </button>
                            </div>
                        ))}
                        <button
                            type="button"
                            onClick={() => addListItem('digital')}
                            className="flex items-center gap-1 text-xs font-semibold text-brand-accent hover:text-brand-accent/80 transition"
                        >
                            <PlusIcon className="w-3 h-3" /> Tambah Kelengkapan
                        </button>
                    </div>
                </div>

                {/* Rincian Vendor */}
                <div>
                    <FieldLabel>Rincian Vendor</FieldLabel>
                    <div className="space-y-2">
                        {formData.physicalItems.map((item: any, index: number) => (
                            <div key={index} className="flex items-center gap-2">
                                <input
                                    type="text"
                                    value={item.name}
                                    onChange={e => onListChange('physical', index, 'name', e.target.value)}
                                    className="flex-1 px-3 py-2 rounded-lg border border-brand-border bg-white text-xs focus:outline-none focus:ring-2 focus:ring-brand-accent/20 focus:border-brand-accent transition"
                                    placeholder="Nama Vendor"
                                />
                                <button type="button" onClick={() => removeListItem('physical', index)} className="p-1.5 text-brand-text-secondary hover:text-red-500 transition flex-shrink-0">
                                    <Trash2Icon className="w-3.5 h-3.5" />
                                </button>
                            </div>
                        ))}
                        <button
                            type="button"
                            onClick={() => addListItem('physical')}
                            className="flex items-center gap-1 text-xs font-semibold text-brand-accent hover:text-brand-accent/80 transition"
                        >
                            <PlusIcon className="w-3 h-3" /> Tambah Vendor
                        </button>
                    </div>
                </div>
            </div>

            {/* ── ACTION BUTTONS ── */}
            <div className="flex items-center justify-end gap-3 pt-6 border-t border-brand-border">
                <button
                    type="button"
                    onClick={onCancel}
                    className="px-6 py-2.5 rounded-xl text-sm font-semibold text-brand-text-secondary hover:bg-brand-bg hover:text-brand-text-light transition"
                >
                    Batal
                </button>
                <button
                    type="submit"
                    className="px-8 py-2.5 rounded-xl text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 shadow-lg shadow-blue-500/20 transition active:scale-95"
                >
                    {mode === 'add' ? 'Simpan Package' : 'Update Package'}
                </button>
            </div>
        </form>
    );
};
