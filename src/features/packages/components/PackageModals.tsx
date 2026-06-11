import React from 'react';
import Modal from '@/shared/ui/Modal';
export const PackageInfoModal: React.FC<{ isOpen: boolean; onClose: () => void }> = ({ isOpen, onClose }) => (
    <Modal isOpen={isOpen} onClose={onClose} title="Panduan Package Vendor">
        <div className="space-y-4 text-sm text-brand-text-primary text-justify leading-relaxed">
            <p>Halaman ini adalah pusat pengelolaan layanan Anda. Di sini Anda bisa mengatur Package utama dan layanan tambahan (add-ons).</p>
            <div className="space-y-3">
                <div className="p-3 bg-brand-bg rounded-xl border border-brand-border/40">
                    <h5 className="font-bold text-brand-accent mb-1">1. Package Utama</h5>
                    <p className="text-xs">Kelompokkan layanan Anda berdasarkan kategori. Anda bisa menambahkan opsi durasi dengan harga yang berbeda-beda untuk satu Package yang sama.</p>
                </div>
                <div className="p-3 bg-brand-bg rounded-xl border border-brand-border/40">
                    <h5 className="font-bold text-brand-accent mb-1">2. Opsi Durasi (Advanced)</h5>
                    <p className="text-xs">Saat mengedit Package, gunakan "Tambah Opsi Durasi" untuk membuat variasi (cth: 2 Jam, 4 Jam). Klik ikon detail pada opsi tersebut untuk mengatur tim dan item khusus untuk durasi tersebut.</p>
                </div>
                <div className="p-3 bg-brand-bg rounded-xl border border-brand-border/40">
                    <h5 className="font-bold text-brand-accent mb-1">3. Bagikan Pricelist</h5>
                    <p className="text-xs">Klik tombol "Bagikan" untuk mendapatkan tautan halaman publik Anda. Tautan ini bisa dikirimkan ke calon pengantin agar mereka bisa melihat rincian Package dan langsung melakukan booking.</p>
                </div>
            </div>
        </div>
    </Modal>
);

export const PackageShareModal: React.FC<{
    isOpen: boolean;
    onClose: () => void;
    onCopyLink: () => void;
    onCopyBookingLink: () => void;
    unionRegions?: { value: string; label: string }[];
}> = ({
    isOpen, onClose, onCopyLink, onCopyBookingLink, unionRegions = []
}) => {
        const copyToClipboard = (text: string, label: string) => {
            navigator.clipboard.writeText(text)
                .then(() => alert(`${label} berhasil disalin!`))
                .catch(err => console.error('Gagal menyalin:', err));
        };

        const baseUrl = `${window.location.origin}${window.location.pathname}`;

        return (
            <Modal isOpen={isOpen} onClose={onClose} title="Bagikan Tautan" size="2xl">
                <div className="space-y-8 max-h-[75vh] overflow-y-auto pr-2 custom-scrollbar">
                    <div className="space-y-2">
                        <p className="text-sm text-brand-text-secondary font-medium leading-relaxed">
                            Pilih atau salin tautan spesifik wilayah untuk memudahkan calon pengantin Anda.
                        </p>
                        <div className="h-1 w-20 bg-brand-accent rounded-full"></div>
                    </div>

                    <div className="space-y-8">
                        {/* General Links Section */}
                        <div className="space-y-4">
                            <h4 className="text-[10px] font-black text-brand-accent uppercase tracking-[0.2em] flex items-center gap-3">
                                <span className="shrink-0">Tautan Umum</span>
                                <div className="h-[1px] flex-grow bg-brand-accent/20"></div>
                            </h4>
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="relative group">
                                    <div className="absolute -inset-0.5 bg-gradient-to-r from-brand-accent/20 to-blue-500/20 rounded-2xl blur opacity-25 group-hover:opacity-50 transition duration-500"></div>
                                    <div className="relative p-5 bg-white/60 backdrop-blur-xl rounded-2xl border border-white/60 shadow-sm flex flex-col gap-4">
                                        <div>
                                            <p className="text-[10px] font-black text-brand-text-secondary uppercase tracking-widest mb-1">Katalog Publik</p>
                                            <p className="text-sm font-bold text-brand-text-light">Pricelist Online</p>
                                        </div>
                                        <button 
                                            onClick={onCopyLink} 
                                            className="w-full py-3 rounded-xl bg-brand-accent text-white font-black text-[10px] uppercase tracking-widest hover:scale-[1.02] active:scale-[0.98] transition-all shadow-lg shadow-brand-accent/20"
                                        >
                                            Salin Katalog
                                        </button>
                                    </div>
                                </div>

                                <div className="relative group">
                                    <div className="absolute -inset-0.5 bg-gradient-to-r from-blue-500/20 to-brand-accent/20 rounded-2xl blur opacity-25 group-hover:opacity-50 transition duration-500"></div>
                                    <div className="relative p-5 bg-white/60 backdrop-blur-xl rounded-2xl border border-white/60 shadow-sm flex flex-col gap-4">
                                        <div>
                                            <p className="text-[10px] font-black text-brand-text-secondary uppercase tracking-widest mb-1">Formulir Booking</p>
                                            <p className="text-sm font-bold text-brand-text-light">Reservasi Klien</p>
                                        </div>
                                        <button 
                                            onClick={onCopyBookingLink} 
                                            className="w-full py-3 rounded-xl bg-brand-accent text-white border border-brand-accent font-black text-[10px] uppercase tracking-widest hover:bg-brand-accent-hover transition-all shadow-sm"
                                        >
                                            Salin Booking
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Regional Links Section */}
                        <div className="space-y-4">
                            <h4 className="text-[10px] font-black text-brand-accent uppercase tracking-[0.2em] flex items-center gap-3">
                                <span className="shrink-0">Tautan Per Wilayah</span>
                                <div className="h-[1px] flex-grow bg-brand-accent/20"></div>
                            </h4>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                {unionRegions.map(region => {
                                    // Use location hash for correct routing in current setup
                                    const regPackagesUrl = `${baseUrl}#/p-packages/VEN001?region=${region.value.toLowerCase()}`;
                                    const regBookingUrl = `${baseUrl}#/b/VEN001?region=${region.value.toLowerCase()}`;

                                    return (
                                        <div key={region.value} className="relative group">
                                            <div className="absolute -inset-0.5 bg-gradient-to-r from-brand-accent/10 to-transparent rounded-2xl blur opacity-0 group-hover:opacity-100 transition duration-500"></div>
                                            <div className="relative p-5 bg-white/40 backdrop-blur-md rounded-2xl border border-brand-border/40 hover:border-brand-accent/50 transition-all">
                                                <div className="flex items-center justify-between mb-4">
                                                    <span className="text-sm font-black text-brand-text-light tracking-tight">{region.label}</span>
                                                    <span className="px-2 py-0.5 rounded-lg bg-brand-accent text-[8px] font-black text-white uppercase tracking-tighter">Region Specific</span>
                                                </div>
                                                <div className="grid grid-cols-2 gap-2">
                                                    <button
                                                        onClick={() => copyToClipboard(regPackagesUrl, `Tautan Katalog ${region.label}`)}
                                                        className="py-2.5 rounded-xl bg-blue-600 border border-blue-600 text-[9px] font-black text-white uppercase tracking-tighter hover:bg-blue-700 transition-all shadow-sm"
                                                    >
                                                        Salin Katalog
                                                    </button>
                                                    <button
                                                        onClick={() => copyToClipboard(regBookingUrl, `Tautan Booking ${region.label}`)}
                                                        className="py-2.5 rounded-xl bg-brand-accent border border-brand-accent text-[9px] font-black text-white uppercase tracking-tighter hover:bg-brand-accent-hover transition-all shadow-sm"
                                                    >
                                                        Salin Booking
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </div>

                    <div className="p-4 bg-brand-accent/5 rounded-2xl border border-brand-accent/10 flex items-start gap-3">
                        <div className="w-5 h-5 rounded-full bg-brand-accent/20 flex items-center justify-center shrink-0 mt-0.5">
                            <span className="text-[10px] font-black text-brand-accent">*</span>
                        </div>
                        <p className="text-[10px] font-bold text-brand-text-secondary leading-relaxed italic">
                            Tautan spesifik wilayah akan langsung menampilkan Paket & Add-on yang tersedia di wilayah tersebut, memudahkan klien Anda melakukan navigasi.
                        </p>
                    </div>
                </div>
            </Modal>
        );
    };
