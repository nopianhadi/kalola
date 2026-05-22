import React from 'react';

import { PlusIcon, ChevronRightIcon, PackageIcon, GalleryHorizontalIcon } from '@/constants';
import { usePackages, emptyAddOnForm, AddOnForm } from '@/features/packages/hooks/usePackages';
import PackageCard from '@/features/packages/components/PackageCard';
import AddOnSection from '@/features/packages/components/AddOnSection';
import { PackageInfoModal, PackageShareModal } from '@/features/packages/components/PackageModals';
import { useNavigate } from 'react-router-dom';
import Modal from '@/shared/ui/Modal';

interface PackagesProps {
}


const Packages: React.FC<PackagesProps> = () => {
    const navigate = useNavigate();
    const [isRegionModalOpen, setIsRegionModalOpen] = React.useState(false);

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

    return (
        <div className="space-y-6 md:space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            {/* Header Section with Integrated Tabs */}
            <div className="relative overflow-hidden rounded-[2.5rem] bg-brand-accent/5 border border-brand-accent/10 p-6 md:p-10 mb-8">
                {/* Decorative background blur */}
                <div className="absolute -top-24 -right-24 w-64 h-64 bg-brand-accent/10 blur-[100px] rounded-full"></div>
                <div className="absolute -bottom-24 -left-24 w-64 h-64 bg-blue-400/10 blur-[100px] rounded-full"></div>

                <div className="relative flex flex-col md:flex-row md:items-end justify-between gap-8">
                    <div className="space-y-4">
                        <div className="flex items-center gap-3">
                            <div className="w-12 h-12 rounded-2xl bg-brand-accent flex items-center justify-center shadow-xl shadow-brand-accent/20">
                                <PackageIcon className="w-6 h-6 text-white" />
                            </div>
                            <div>
                                <h1 className="text-3xl md:text-4xl font-black text-brand-text-light tracking-tight leading-none">
                                    Kelola Package
                                </h1>
                                <p className="text-sm md:text-base text-brand-text-secondary mt-1 font-medium max-w-lg">
                                    Susun layanan wedding terbaik dan kelola tambahan jasa (Add-ons).
                                </p>
                            </div>
                        </div>

                        {/* Top Navigation Tabs - Segmented Style */}
                        <div className="flex p-1.5 bg-white/40 backdrop-blur-xl rounded-[1.25rem] border border-white/50 w-fit shadow-inner">
                            <button
                                onClick={() => navigate('/packages')}
                                className="px-6 py-2.5 rounded-xl text-xs md:text-sm font-black transition-all duration-500 flex items-center gap-2.5 bg-brand-accent text-white shadow-xl shadow-brand-accent/20 scale-[1.02]"
                            >
                                <PackageIcon className="w-4 h-4 transition-transform duration-500 scale-110" />
                                <span>Paket & Add-on</span>
                            </button>
                            <button
                                onClick={() => navigate('/gallery')}
                                className="px-6 py-2.5 rounded-xl text-xs md:text-sm font-black transition-all duration-500 flex items-center gap-2.5 text-brand-text-secondary hover:text-brand-accent hover:bg-white/60"
                            >
                                <GalleryHorizontalIcon className="w-4 h-4 transition-transform duration-500" />
                                <span>Pricelist</span>
                            </button>
                            <button
                                onClick={() => navigate('/promo-codes')}
                                className="px-6 py-2.5 rounded-xl text-xs md:text-sm font-black transition-all duration-500 flex items-center gap-2.5 text-brand-text-secondary hover:text-brand-accent hover:bg-white/60"
                            >
                                <PlusIcon className="w-4 h-4 transition-transform duration-500" />
                                <span>Kode Promo</span>
                            </button>
                        </div>

                        <div className="flex flex-wrap items-center gap-2">
                            <div className="px-3 py-1.5 rounded-xl bg-white/70 border border-white/70 text-[11px] font-black uppercase tracking-wider text-brand-text-primary">
                                {totalPackages} Paket
                            </div>
                            <div className="px-3 py-1.5 rounded-xl bg-white/70 border border-white/70 text-[11px] font-black uppercase tracking-wider text-brand-text-primary">
                                {addOns.length} Add-on
                            </div>
                            <div className="px-3 py-1.5 rounded-xl bg-white/70 border border-white/70 text-[11px] font-black uppercase tracking-wider text-brand-text-secondary">
                                Filter: {regionFilter ? String(regionFilter).toUpperCase() : 'Semua Wilayah'}
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        <div className="flex items-center gap-2 bg-white/40 p-1.5 rounded-2xl border border-white/60 shadow-sm">
                            <button
                                onClick={copyPackagesLinkToClipboard}
                                className="px-4 py-2 rounded-xl bg-white/80 text-brand-text-primary hover:bg-brand-accent hover:text-white transition-all text-[10px] font-black uppercase tracking-wider"
                                title="Salin Tautan Public Pricelist"
                            >
                                Link Pricelist
                            </button>
                            <button
                                onClick={copyBookingLinkToClipboard}
                                className="px-4 py-2 rounded-xl bg-white/80 text-brand-text-primary hover:bg-brand-accent hover:text-white transition-all text-[10px] font-black uppercase tracking-wider"
                                title="Salin Tautan Form Booking"
                            >
                                Link Booking
                            </button>
                            <button
                                onClick={() => setIsInfoModalOpen(true)}
                                className="px-4 py-2 rounded-xl bg-white/80 text-brand-text-primary hover:bg-brand-accent hover:text-white transition-all text-[10px] font-black uppercase tracking-wider"
                            >
                                Bantuan
                            </button>
                        </div>

                        <button
                            onClick={() => navigate('/packages/new')}
                            className="group relative px-6 py-3 rounded-2xl bg-brand-accent text-white overflow-hidden transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] shadow-2xl shadow-brand-accent/30"
                        >
                            <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
                            <div className="flex items-center gap-2 relative">
                                <PlusIcon className="w-5 h-5" />
                                <span className="font-black text-sm uppercase tracking-tight">Tambah Paket</span>
                            </div>
                        </button>
                    </div>
                </div>
            </div>


            {/* Main Content Grid */}
            <div className="space-y-6 md:space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 md:gap-8">
                    <main className="lg:col-span-3 space-y-10 md:space-y-12 pb-10">
                        {/* Region Filter - Modern Pill Style */}
                        <div className="relative group">
                            <div className="absolute -inset-1 bg-gradient-to-r from-brand-accent/20 to-blue-400/20 rounded-[2rem] blur opacity-25 group-hover:opacity-50 transition duration-1000"></div>
                            <div className="relative flex items-center gap-4 bg-white/60 backdrop-blur-xl border border-white/60 p-2 md:p-3 rounded-[2rem] overflow-x-auto no-scrollbar shadow-sm">
                                <div className="flex items-center gap-2 px-3 border-r border-brand-border/40 shrink-0">
                                    <span className="text-[10px] font-black uppercase tracking-widest text-brand-text-secondary">Wilayah</span>
                                </div>
                                <div className="flex items-center gap-2 pr-4">
                                    <button 
                                        onClick={() => setRegionFilter('')} 
                                        className={`px-5 py-2 rounded-2xl text-[11px] font-black uppercase tracking-wider transition-all duration-300 whitespace-nowrap ${!regionFilter ? 'bg-brand-accent text-white shadow-lg shadow-brand-accent/20 scale-[1.05]' : 'bg-white/40 text-brand-text-secondary hover:bg-white hover:text-brand-accent'}`}
                                    >
                                        Semua
                                    </button>
                                    {unionRegions.map(r => (
                                        <button 
                                            key={r.value} 
                                            onClick={() => setRegionFilter(r.value as any)} 
                                            className={`px-5 py-2 rounded-2xl text-[11px] font-black uppercase tracking-wider transition-all duration-300 whitespace-nowrap ${regionFilter === r.value ? 'bg-brand-accent text-white shadow-lg shadow-brand-accent/20 scale-[1.05]' : 'bg-white/40 text-brand-text-secondary hover:bg-white hover:text-brand-accent'}`}
                                        >
                                            {r.label}
                                        </button>
                                    ))}
                                    <div className="w-[1px] h-6 bg-brand-border/40 mx-2"></div>
                                    <button 
                                        onClick={() => setIsRegionModalOpen(true)} 
                                        className="px-4 py-2 rounded-2xl text-[10px] font-black uppercase tracking-wider transition-all duration-300 whitespace-nowrap bg-brand-accent/10 text-brand-accent hover:bg-brand-accent hover:text-white border border-brand-accent/20 flex items-center gap-1.5"
                                    >
                                        <PlusIcon className="w-3 h-3" />
                                        Kelola Wilayah
                                    </button>
                                </div>
                            </div>
                        </div>

                        {Object.entries(packagesByCategory).map(([category, pkgs]) => (
                            <section key={category} className="space-y-6">
                                <div className="flex items-center gap-4 group">
                                    <div className="w-10 h-10 rounded-xl bg-brand-accent/10 flex items-center justify-center border border-brand-accent/20 group-hover:bg-brand-accent/20 transition-colors">
                                        <ChevronRightIcon className="w-5 h-5 text-brand-accent" />
                                    </div>
                                    <div className="flex flex-col">
                                        <h3 className="text-xl md:text-2xl font-black text-brand-text-light tracking-tight">{category}</h3>
                                        <div className="flex items-center gap-2">
                                            <div className="h-[2px] w-12 bg-brand-accent rounded-full"></div>
                                            <span className="text-[10px] font-black text-brand-accent uppercase tracking-widest">{pkgs.length} Koleksi</span>
                                        </div>
                                    </div>
                                    <div className="h-[1px] flex-grow bg-gradient-to-r from-brand-border/60 via-brand-border/20 to-transparent"></div>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                                    {pkgs.map(pkg => (
                                        <PackageCard key={pkg.id} pkg={pkg} onEdit={(p) => navigate(`/packages/edit/${p.id}`)} onDelete={handlePackageDelete} />
                                    ))}
                                </div>
                            </section>
                        ))}

                        {Object.keys(packagesByCategory).length === 0 && (
                            <div className="glass-card rounded-[2rem] p-12 md:p-20 text-center border-2 border-dashed border-brand-border/40">
                                <div className="w-20 h-20 bg-brand-input/50 rounded-full flex items-center justify-center mx-auto mb-6 scale-110">
                                    <PlusIcon className="w-10 h-10 text-brand-text-secondary opacity-30" />
                                </div>
                                <h4 className="text-xl font-bold text-brand-text-light mb-2">Belum ada Package {regionFilter ? 'di wilayah ini' : ''}</h4>
                                <p className="text-sm text-brand-text-secondary max-w-xs mx-auto mb-8">Tambahkan package layanan pertama Anda untuk mulai membagikan Pricelist.</p>
                                <button onClick={() => navigate('/packages/new')} className="button-primary px-8 py-3 shadow-xl">Buat Package Sekarang</button>
                            </div>
                        )}
                    </main>

                    {/* Quick AddOns Sidebar */}
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

            {/* Modals */}
            <PackageInfoModal isOpen={isInfoModalOpen} onClose={() => setIsInfoModalOpen(false)} />

            <PackageShareModal
                isOpen={isShareModalOpen}
                onClose={() => setIsShareModalOpen(false)}
                onCopyLink={copyPackagesLinkToClipboard}
                onCopyBookingLink={copyBookingLinkToClipboard}
                unionRegions={unionRegions}
            />

            <Modal isOpen={isRegionModalOpen} onClose={() => setIsRegionModalOpen(false)} title="Kelola Master Wilayah">
                <div className="p-6">
                    <p className="text-sm text-brand-text-secondary mb-4">
                        Fitur pengelolaan Master Wilayah (tambah, ubah nama, hapus wilayah) akan segera hadir di sini.
                    </p>
                    <button 
                        onClick={() => setIsRegionModalOpen(false)}
                        className="w-full button-primary py-2"
                    >
                        Tutup
                    </button>
                </div>
            </Modal>
        </div>
    );
};

export default Packages;
