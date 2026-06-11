import React from 'react';

import { PlusIcon, PackageIcon, GalleryHorizontalIcon, PencilIcon, TrashIcon, CheckIcon, XIcon, HashtagIcon } from '@/constants';
import { usePackages, emptyAddOnForm, AddOnForm } from '@/features/packages/hooks/usePackages';
import PackageTable from '@/features/packages/components/PackageTable';
import AddOnSection from '@/features/packages/components/AddOnSection';
import { PackageInfoModal, PackageShareModal } from '@/features/packages/components/PackageModals';
import { useNavigate } from 'react-router-dom';
import Modal from '@/shared/ui/Modal';
import PageHeader from '@/layouts/PageHeader';
import { Badge, Button } from '@/shared/ui';
import { useUpdateProfile, useProfile } from '@/features/settings/api/useProfileQueries';
import { Profile } from '@/types';
import { useApp } from '@/app/AppContext';

// Lazy-load tab content so we don't pay the cost unless needed
const GalleryUpload = React.lazy(() => import('@/features/public/components/GalleryUpload'));
const PromoCodes   = React.lazy(() => import('@/features/promo/PromoCodes'));

// ─── Region Manager ──────────────────────────────────────────────────────────
interface RegionManagerProps {
    unionRegions: { value: string; label: string }[];
    profile: Profile;
    onClose: () => void;
}

const BUILT_IN_REGIONS = ['bandung', 'jabodetabek', 'banten'];

const RegionManager: React.FC<RegionManagerProps> = ({ unionRegions, profile, onClose }) => {
    const updateProfile = useUpdateProfile();
    const [input, setInput] = React.useState('');
    const [editingValue, setEditingValue] = React.useState<string | null>(null);
    const [editInput, setEditInput] = React.useState('');
    const [saving, setSaving] = React.useState(false);

    const customRegions: string[] = profile.customRegions || [];

    const save = async (updated: string[]) => {
        setSaving(true);
        try {
            await updateProfile.mutateAsync({ id: profile.id, customRegions: updated } as any);
        } finally {
            setSaving(false);
        }
    };

    const handleAdd = async () => {
        const val = input.trim().toLowerCase();
        if (!val) return;
        if (unionRegions.some(r => r.value === val)) {
            alert('Wilayah ini sudah ada.');
            return;
        }
        await save([...customRegions, val]);
        setInput('');
    };

    const handleRename = async (old: string) => {
        const val = editInput.trim().toLowerCase();
        if (!val || val === old) { setEditingValue(null); return; }
        if (unionRegions.some(r => r.value === val && r.value !== old)) {
            alert('Nama wilayah sudah digunakan.');
            return;
        }
        await save(customRegions.map(r => r === old ? val : r));
        setEditingValue(null);
        setEditInput('');
    };

    const handleDelete = async (val: string) => {
        if (!window.confirm(`Hapus wilayah "${val}"? Paket yang menggunakan wilayah ini tidak ikut terhapus.`)) return;
        await save(customRegions.filter(r => r !== val));
    };

    return (
        <div className="p-6 space-y-5">
            <p className="text-xs text-brand-text-secondary">
                Kelola daftar wilayah yang tersedia saat membuat atau mengedit Package dan Add-on.
                Wilayah bawaan (<strong>Bandung, Jabodetabek, Banten</strong>) tidak dapat dihapus.
            </p>

            {/* Add new region */}
            <div className="flex gap-2">
                <input
                    type="text"
                    value={input}
                    onChange={e => setInput(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handleAdd()}
                    placeholder="Nama wilayah baru…"
                    className="flex-1 px-4 py-2.5 rounded-xl border border-brand-border bg-brand-bg text-brand-text-primary text-sm focus:outline-none focus:ring-2 focus:ring-brand-accent/50"
                />
                <button
                    onClick={handleAdd}
                    disabled={saving || !input.trim()}
                    className="px-4 py-2.5 rounded-xl bg-brand-accent text-white text-sm font-bold disabled:opacity-50 hover:bg-brand-accent/90 transition-colors flex items-center gap-1.5"
                >
                    <PlusIcon className="w-4 h-4" /> Tambah
                </button>
            </div>

            {/* Region list */}
            <ul className="space-y-2 max-h-72 overflow-y-auto">
                {unionRegions.map(r => {
                    const isBuiltIn = BUILT_IN_REGIONS.includes(r.value.toLowerCase());
                    const isEditing = editingValue === r.value;
                    return (
                        <li key={r.value} className="flex items-center gap-3 p-3 rounded-2xl bg-brand-bg border border-brand-border/40">
                            {isEditing ? (
                                <>
                                    <input
                                        autoFocus
                                        type="text"
                                        value={editInput}
                                        onChange={e => setEditInput(e.target.value)}
                                        onKeyDown={e => { if (e.key === 'Enter') handleRename(r.value); if (e.key === 'Escape') setEditingValue(null); }}
                                        className="flex-1 px-3 py-1.5 rounded-lg border border-brand-accent bg-brand-surface text-brand-text-primary text-sm focus:outline-none"
                                    />
                                    <button onClick={() => handleRename(r.value)} disabled={saving} className="p-1.5 rounded-lg text-green-400 hover:bg-green-400/10 transition-colors"><CheckIcon className="w-4 h-4" /></button>
                                    <button onClick={() => setEditingValue(null)} className="p-1.5 rounded-lg text-brand-text-secondary hover:bg-brand-border/30 transition-colors"><XIcon className="w-4 h-4" /></button>
                                </>
                            ) : (
                                <>
                                    <span className="flex-1 text-sm font-semibold text-brand-text-light capitalize">{r.label}</span>
                                    {isBuiltIn && <span className="text-[10px] font-black uppercase tracking-widest text-brand-text-secondary bg-brand-border/30 px-2 py-0.5 rounded-full">Bawaan</span>}
                                    {!isBuiltIn && (
                                        <>
                                            <button
                                                onClick={() => { setEditingValue(r.value); setEditInput(r.value); }}
                                                className="p-1.5 rounded-lg text-brand-text-secondary hover:text-brand-accent hover:bg-brand-accent/10 transition-colors"
                                                title="Ubah nama"
                                            ><PencilIcon className="w-3.5 h-3.5" /></button>
                                            <button
                                                onClick={() => handleDelete(r.value)}
                                                disabled={saving}
                                                className="p-1.5 rounded-lg text-brand-text-secondary hover:text-red-400 hover:bg-red-400/10 transition-colors disabled:opacity-50"
                                                title="Hapus"
                                            ><TrashIcon className="w-3.5 h-3.5" /></button>
                                        </>
                                    )}
                                </>
                            )}
                        </li>
                    );
                })}
                {unionRegions.length === 0 && (
                    <li className="text-sm text-brand-text-secondary text-center py-6 italic">Belum ada wilayah.</li>
                )}
            </ul>

            <button onClick={onClose} className="w-full py-2.5 rounded-xl border border-brand-border text-sm font-bold text-brand-text-secondary hover:bg-brand-bg transition-colors">
                Selesai
            </button>
        </div>
    );
};

// ─────────────────────────────────────────────────────────────────────────────

interface PackagesProps {
}


const Packages: React.FC<PackagesProps> = () => {
    const navigate = useNavigate();
    const [isRegionModalOpen, setIsRegionModalOpen] = React.useState(false);
    // Active tab: 'packages' | 'pricelist' | 'promo'
    const [activeTab, setActiveTab] = React.useState<'packages' | 'pricelist' | 'promo'>('packages');

    const { showNotification } = useApp();
    const { data: profileData } = useProfile();
    const userProfile = profileData || ({} as Profile);

    const {
        regionFilter, setRegionFilter,
        addOnFormData, setAddOnFormData,
        addOnEditMode, setAddOnEditMode,
        isShareModalOpen, setIsShareModalOpen,
        isInfoModalOpen, setIsInfoModalOpen,
        publicPackagesUrl,
        publicBookingUrl,
        unionRegions,
        packagesByCategory,
        addOns,
        profile,
        handlePackageDelete,
        handleAddOnSubmit,
        handleAddOnDelete
    } = usePackages();

    const totalPackages = React.useMemo(
        () => Object.values(packagesByCategory).reduce((total, items) => total + items.length, 0),
        [packagesByCategory]
    );

    const copyPackagesLinkToClipboard = () => {
        navigator.clipboard.writeText(publicPackagesUrl)
            .then(() => alert('Tautan Pricelist berhasil disalin!'))
            .catch(err => console.error('Gagal menyalin tautan:', err));
    };

    const copyBookingLinkToClipboard = () => {
        navigator.clipboard.writeText(publicBookingUrl)
            .then(() => alert('Tautan Form Booking berhasil disalin!'))
            .catch(err => console.error('Gagal menyalin tautan:', err));
    };

    const packageTabs: { id: 'packages' | 'pricelist' | 'promo'; label: string; icon: React.ReactNode }[] = [
        { id: 'packages', label: 'Paket & Add-on',  icon: <PackageIcon className="w-4 h-4" /> },
        { id: 'pricelist', label: 'Pricelist',       icon: <GalleryHorizontalIcon className="w-4 h-4" /> },
        { id: 'promo',     label: 'Kode Promo',      icon: <HashtagIcon className="w-4 h-4" /> },
    ];

    return (
        <div className="space-y-6 pb-20 lg:pb-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <PageHeader
                title="Kelola Package"
                subtitle="Susun layanan wedding terbaik dan kelola tambahan jasa (Add-ons)."
                icon={<PackageIcon className="w-6 h-6" />}
            >
                {activeTab === 'packages' && (
                    <>
                        <Button onClick={copyPackagesLinkToClipboard} variant="secondary" size="sm">Link Pricelist</Button>
                        <Button onClick={copyBookingLinkToClipboard} variant="secondary" size="sm">Link Booking</Button>
                        <Button onClick={() => setIsInfoModalOpen(true)} variant="secondary" size="sm">Bantuan</Button>
                        <Button onClick={() => navigate('/packages/new')} variant="primary" size="sm" leftIcon={<PlusIcon className="w-5 h-5" />}>Tambah Paket</Button>
                    </>
                )}
            </PageHeader>

            {/* ── Tab Bar ─────────────────────────────────────────────── */}
            <div className="bg-brand-surface/60 backdrop-blur-md p-1.5 rounded-2xl border border-brand-border/40 w-full md:w-fit overflow-x-auto">
                <div className="flex gap-1 min-w-max">
                    {packageTabs.map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`flex items-center gap-2 px-4 sm:px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all duration-300 whitespace-nowrap ${
                                activeTab === tab.id
                                    ? 'bg-brand-accent text-white shadow-md shadow-brand-accent/30 scale-[1.02]'
                                    : 'text-brand-text-secondary hover:text-brand-text-light hover:bg-brand-border/20'
                            }`}
                        >
                            {tab.icon}
                            <span>{tab.label}</span>
                        </button>
                    ))}
                </div>
            </div>

            {/* ── Tab Content ─────────────────────────────────────────── */}
            <React.Suspense fallback={
                <div className="flex items-center justify-center py-20">
                    <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-brand-accent" />
                </div>
            }>
                {activeTab === 'packages' && (
                    <>
                        <div className="flex flex-wrap items-center gap-2">
                            <Badge variant="info" size="md">{totalPackages} Paket</Badge>
                            <Badge variant="primary" size="md">{addOns.length} Add-on</Badge>
                            <Badge variant="outline" size="md">Filter: {regionFilter ? String(regionFilter).toUpperCase() : 'Semua Wilayah'}</Badge>
                        </div>

                        <div className="space-y-6 md:space-y-8">
                            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 md:gap-8">
                                <main className="lg:col-span-3 space-y-10 md:space-y-12 pb-10">
                                    {/* Region filter bar */}
                                    <div className="bg-white p-3 rounded-2xl shadow-xl shadow-slate-200/50 border border-slate-100 overflow-x-auto no-scrollbar">
                                        <div className="flex items-center gap-3 min-w-max">
                                            <div className="flex items-center gap-2 px-2 pr-4 border-r border-slate-200 shrink-0">
                                                <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">Wilayah</span>
                                            </div>
                                            <div className="flex items-center gap-2 pr-4">
                                                <button
                                                    onClick={() => setRegionFilter('')}
                                                    className={`px-4 py-2 rounded-xl text-[11px] font-black uppercase tracking-wider transition-all duration-300 whitespace-nowrap ${!regionFilter ? 'bg-brand-accent text-white shadow-md shadow-blue-100' : 'bg-slate-50 text-slate-500 hover:bg-slate-100 hover:text-slate-700'}`}
                                                >
                                                    Semua
                                                </button>
                                                {unionRegions.map(r => (
                                                    <button
                                                        key={r.value}
                                                        onClick={() => setRegionFilter(r.value as any)}
                                                        className={`px-4 py-2 rounded-xl text-[11px] font-black uppercase tracking-wider transition-all duration-300 whitespace-nowrap ${regionFilter === r.value ? 'bg-brand-accent text-white shadow-md shadow-blue-100' : 'bg-slate-50 text-slate-500 hover:bg-slate-100 hover:text-slate-700'}`}
                                                    >
                                                        {r.label}
                                                    </button>
                                                ))}
                                                <div className="w-[1px] h-6 bg-slate-200 mx-2" />
                                                <button
                                                    onClick={() => setIsRegionModalOpen(true)}
                                                    className="px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all duration-300 whitespace-nowrap bg-blue-600 text-white hover:bg-blue-700 border border-blue-600 flex items-center gap-1.5 shadow-sm"
                                                >
                                                    <PlusIcon className="w-3 h-3" />
                                                    Kelola Wilayah
                                                </button>
                                            </div>
                                        </div>
                                    </div>

                                    {Object.keys(packagesByCategory).length > 0 ? (
                                        <PackageTable
                                            packagesByCategory={packagesByCategory}
                                            onEdit={(pkg) => navigate(`/packages/edit/${pkg.id}`)}
                                            onDelete={handlePackageDelete}
                                        />
                                    ) : (
                                        <div className="bg-white rounded-2xl p-12 md:p-20 text-center border-2 border-dashed border-slate-200 shadow-xl shadow-slate-200/50">
                                            <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-6">
                                                <PlusIcon className="w-10 h-10 text-slate-300" />
                                            </div>
                                            <h4 className="text-xl font-bold text-slate-900 mb-2">Belum ada Package {regionFilter ? 'di wilayah ini' : ''}</h4>
                                            <p className="text-sm text-slate-500 max-w-xs mx-auto mb-8">Tambahkan package layanan pertama Anda untuk mulai membagikan Pricelist.</p>
                                            <Button onClick={() => navigate('/packages/new')} leftIcon={<PlusIcon className="w-4 h-4" />}>Buat Package Sekarang</Button>
                                        </div>
                                    )}
                                </main>

                                {/* Add-on sidebar */}
                                <AddOnSection
                                    addOns={addOns}
                                    regionFilter={regionFilter}
                                    editMode={addOnEditMode}
                                    formData={addOnFormData}
                                    onInputChange={(e) => setAddOnFormData((prev: AddOnForm) => ({ ...prev, [e.target.name]: e.target.value }))}
                                    onPriceChange={(raw) => setAddOnFormData((prev: AddOnForm) => ({ ...prev, price: raw }))}
                                    onRegionSelect={(r) => setAddOnFormData((prev: AddOnForm) => ({ ...prev, region: r }))}
                                    onSubmit={handleAddOnSubmit}
                                    onEdit={(a) => { setAddOnEditMode(a.id); setAddOnFormData({ name: a.name, price: a.price.toString(), region: a.region || '' }); }}
                                    onDelete={handleAddOnDelete}
                                    onCancelEdit={() => { setAddOnEditMode(null); setAddOnFormData(emptyAddOnForm); }}
                                    unionRegions={unionRegions}
                                />
                            </div>
                        </div>

                        {/* Modals untuk tab packages */}
                        <PackageInfoModal isOpen={isInfoModalOpen} onClose={() => setIsInfoModalOpen(false)} />
                        <PackageShareModal
                            isOpen={isShareModalOpen}
                            onClose={() => setIsShareModalOpen(false)}
                            onCopyLink={copyPackagesLinkToClipboard}
                            onCopyBookingLink={copyBookingLinkToClipboard}
                            unionRegions={unionRegions}
                        />
                        <Modal isOpen={isRegionModalOpen} onClose={() => setIsRegionModalOpen(false)} title="Kelola Master Wilayah">
                            <RegionManager
                                unionRegions={unionRegions}
                                profile={profile}
                                onClose={() => setIsRegionModalOpen(false)}
                            />
                        </Modal>
                    </>
                )}

                {activeTab === 'pricelist' && (
                    <GalleryUpload userProfile={userProfile} showNotification={showNotification} />
                )}

                {activeTab === 'promo' && (
                    <PromoCodes hideHeader />
                )}
            </React.Suspense>
        </div>
    );
};

export default Packages;
