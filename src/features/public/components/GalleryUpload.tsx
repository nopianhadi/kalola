import React, { useState, useEffect } from 'react';
import { Profile, Gallery, GalleryImage } from '@/types';
import Modal from '@/shared/ui/Modal';
import { UploadIcon, TrashIcon, LinkIcon, MapPinIcon, PlusIcon, FileTextIcon, CameraIcon, XIcon } from '@/constants';
import { createGallery, listGalleries, uploadGalleryImages, deleteGallery, updateGallery, deleteGalleryImage, reorderGalleryImages } from '@/services/galleries';

interface GalleryUploadProps {
    userProfile: Profile;
    showNotification: (message: string) => void;
}

const GalleryUpload: React.FC<GalleryUploadProps> = ({ userProfile, showNotification }) => {
    const [galleries, setGalleries] = useState<Gallery[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
    const [isManageImagesModalOpen, setIsManageImagesModalOpen] = useState(false);
    const [isLightboxOpen, setIsLightboxOpen] = useState(false);
    const [lightboxImageIndex, setLightboxImageIndex] = useState(0);
    const [selectedGallery, setSelectedGallery] = useState<Gallery | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const [newGallery, setNewGallery] = useState({
        title: '',
        region: '',
        description: '',
        is_public: true,
        booking_link: ''
    });

    const [editGallery, setEditGallery] = useState({
        title: '',
        region: '',
        description: '',
        is_public: true,
        booking_link: ''
    });

    const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
    const [uploadProgress, setUploadProgress] = useState(0);

    useEffect(() => {
        loadGalleries();
    }, []);

    const loadGalleries = async () => {
        try {
            setIsLoading(true);
            const data = await listGalleries();
            setGalleries(data);
        } catch (error) {
            console.error('Error loading galleries:', error);
            showNotification('Gagal memuat Pricelist');
        } finally {
            setIsLoading(false);
        }
    };

    const handleCreateGallery = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newGallery.title.trim() || !newGallery.region.trim()) {
            showNotification('Judul dan daerah harus diisi');
            return;
        }

        try {
            setIsSubmitting(true);
            const gallery = await createGallery({
                user_id: userProfile.adminUserId,
                title: newGallery.title.trim(),
                region: newGallery.region.trim(),
                description: newGallery.description.trim(),
                is_public: newGallery.is_public,
                booking_link: newGallery.booking_link?.trim() || undefined,
                images: []
            });

            setGalleries(prev => [gallery, ...prev]);
            setIsCreateModalOpen(false);
            setNewGallery({ title: '', region: '', description: '', is_public: true, booking_link: '' });
            showNotification('Pricelist berhasil dibuat');
        } catch (error) {
            console.error('Error creating gallery:', error);
            showNotification('Gagal membuat Pricelist');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            const files = Array.from(e.target.files);
            const validFiles = files.filter(file => {
                if (file.size > 10 * 1024 * 1024) {
                    showNotification(`File ${file.name} terlalu besar (max 10MB)`);
                    return false;
                }
                if (!file.type.startsWith('image/')) {
                    showNotification(`File ${file.name} bukan gambar`);
                    return false;
                }
                return true;
            });
            setSelectedFiles(validFiles);
        }
    };

    const handleUploadImages = async () => {
        if (!selectedGallery || selectedFiles.length === 0) return;

        try {
            setIsSubmitting(true);
            setUploadProgress(0);

            const uploadedImages = await uploadGalleryImages(
                selectedGallery.id,
                selectedFiles,
                (progress) => setUploadProgress(progress)
            );

            setGalleries(prev => prev.map(g =>
                String(g.id) === String(selectedGallery.id)
                    ? { ...g, images: [...g.images, ...uploadedImages] }
                    : g
            ));

            setIsUploadModalOpen(false);
            setSelectedFiles([]);
            setUploadProgress(0);
            showNotification(`${uploadedImages.length} gambar berhasil diupload`);
        } catch (error) {
            console.error('Error uploading images:', error);
            showNotification('Gagal mengupload gambar');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDeleteGallery = async (galleryId: number) => {
        if (!confirm('Yakin ingin menghapus Pricelist ini? Semua gambar akan ikut terhapus.')) return;

        try {
            await deleteGallery(galleryId);
            setGalleries(prev => prev.filter(g => String(g.id) !== String(galleryId)));
            showNotification('Pricelist berhasil dihapus');
        } catch (error) {
            console.error('Error deleting gallery:', error);
            showNotification('Gagal menghapus Pricelist');
        }
    };

    const copyPublicLink = (gallery: Gallery) => {
        const link = `${window.location.origin}/#/g/${gallery.public_id}`;
        navigator.clipboard.writeText(link);
        showNotification('Link publik berhasil disalin');
    };

    const openUploadModal = (gallery: Gallery) => {
        setSelectedGallery(gallery);
        setIsUploadModalOpen(true);
        setSelectedFiles([]);
    };

    const openEditModal = (gallery: Gallery) => {
        setSelectedGallery(gallery);
        setEditGallery({
            title: gallery.title,
            region: gallery.region,
            description: gallery.description || '',
            is_public: gallery.is_public,
            booking_link: gallery.booking_link || ''
        });
        setIsEditModalOpen(true);
    };

    const handleEditGallery = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedGallery || !editGallery.title.trim() || !editGallery.region.trim()) {
            showNotification('Judul dan daerah harus diisi');
            return;
        }

        try {
            setIsSubmitting(true);
            const updated = await updateGallery(selectedGallery.id, {
                title: editGallery.title.trim(),
                region: editGallery.region.trim(),
                description: editGallery.description.trim(),
                is_public: editGallery.is_public,
                booking_link: editGallery.booking_link?.trim() || null
            });

            setGalleries(prev => prev.map(g =>
                String(g.id) === String(selectedGallery.id) ? { ...g, ...updated } : g
            ));
            setIsEditModalOpen(false);
            showNotification('Pricelist berhasil diupdate');
        } catch (error) {
            console.error('Error updating gallery:', error);
            showNotification('Gagal mengupdate Pricelist');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDeleteImage = async (galleryId: number, imageId: number) => {
        if (!confirm('Yakin ingin menghapus gambar ini?')) return;

        try {
            await deleteGalleryImage(galleryId, imageId);
            setGalleries(prev => prev.map(g =>
                String(g.id) === String(galleryId)
                    ? { ...g, images: g.images.filter(img => String(img.id) !== String(imageId)) }
                    : g
            ));
            if (selectedGallery && String(selectedGallery.id) === String(galleryId)) {
                setSelectedGallery(prev => prev ? {
                    ...prev,
                    images: prev.images.filter(img => String(img.id) !== String(imageId))
                } : null);
            }
            showNotification('Gambar berhasil dihapus');
        } catch (error) {
            console.error('Error deleting image:', error);
            showNotification('Gagal menghapus gambar');
        }
    };

    const handleReorderImages = async (galleryId: number, newOrder: GalleryImage[]) => {
        try {
            await reorderGalleryImages(galleryId, newOrder);
            setGalleries(prev => prev.map(g =>
                String(g.id) === String(galleryId) ? { ...g, images: newOrder } : g
            ));
            if (selectedGallery && String(selectedGallery.id) === String(galleryId)) {
                setSelectedGallery(prev => prev ? { ...prev, images: newOrder } : null);
            }
            showNotification('Urutan gambar berhasil diupdate');
        } catch (error) {
            console.error('Error reordering images:', error);
            showNotification('Gagal mengupdate urutan gambar');
        }
    };

    const moveImage = (galleryId: number, fromIndex: number, toIndex: number) => {
        const gallery = galleries.find(g => String(g.id) === String(galleryId));
        if (!gallery) return;

        const newImages = [...gallery.images];
        const [movedImage] = newImages.splice(fromIndex, 1);
        newImages.splice(toIndex, 0, movedImage);

        handleReorderImages(galleryId, newImages);
    };

    const openManageImagesModal = (gallery: Gallery) => {
        setSelectedGallery(gallery);
        setIsManageImagesModalOpen(true);
    };

    const openLightbox = (gallery: Gallery, imageIndex: number) => {
        setSelectedGallery(gallery);
        setLightboxImageIndex(imageIndex);
        setIsLightboxOpen(true);
    };

    const nextImage = () => {
        if (!selectedGallery) return;
        setLightboxImageIndex((prev) => 
            prev < selectedGallery.images.length - 1 ? prev + 1 : 0
        );
    };

    const prevImage = () => {
        if (!selectedGallery) return;
        setLightboxImageIndex((prev) => 
            prev > 0 ? prev - 1 : selectedGallery.images.length - 1
        );
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-accent"></div>
            </div>
        );
    }

    return (
        <div className="space-y-6 lg:space-y-8 animate-fade-in">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between md:items-center gap-4 bg-brand-surface/60 backdrop-blur-xl p-5 md:p-6 rounded-2xl border border-brand-border/50 shadow-sm">
                <div>
                    <h2 className="text-2xl font-bold text-gradient">Pricelist Upload</h2>
                    <p className="text-sm text-brand-text-secondary mt-1">Kelola Pricelist hasil Acara Pernikahan pengantin berdasarkan daerah.</p>
                </div>
                <button
                    onClick={() => setIsCreateModalOpen(true)}
                    className="button-primary whitespace-nowrap"
                >
                    <PlusIcon className="w-5 h-5 flex-shrink-0" />
                    Buat Pricelist Baru
                </button>
            </div>

            {/* Gallery Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {galleries.map(gallery => (
                    <div key={gallery.id} className="glass-card card-hover-lift rounded-2xl flex flex-col overflow-hidden border border-brand-border/50 shadow-sm group">
                        {/* Gallery Cover */}
                        <div className="h-44 bg-brand-bg relative overflow-hidden group-hover:shadow-inner transition-shadow">
                            {gallery.images.length > 0 ? (
                                <img
                                    src={gallery.images[0].url}
                                    alt={gallery.title}
                                    loading="lazy"
                                    width="400"
                                    height="300"
                                    className="w-full h-full object-cover transition-transform duration-700 ease-in-out group-hover:scale-105"
                                />
                            ) : (
                                <div className="w-full h-full flex flex-col items-center justify-center text-brand-text-secondary/40 bg-brand-input/50">
                                    <CameraIcon className="w-12 h-12 mb-2 opacity-50" />
                                    <span className="text-xs font-medium uppercase tracking-wider">Tanpa Cover</span>
                                </div>
                            )}
                            <div className="absolute top-3 right-3 bg-black/60 backdrop-blur-md text-white px-2.5 py-1 rounded-full text-xs font-medium border border-white/10 shadow-sm">
                                {gallery.images.length} foto
                            </div>
                        </div>

                        {/* Gallery Info */}
                        <div className="p-5 flex-grow flex flex-col bg-brand-surface/40">
                            <div className="flex items-start justify-between mb-3 gap-2">
                                <h3 className="font-bold text-base md:text-lg text-brand-text-light line-clamp-2 leading-tight flex-grow">{gallery.title}</h3>
                                {gallery.is_public && (
                                    <span className="flex-shrink-0 text-[10px] font-bold uppercase tracking-wider bg-green-500/10 text-green-600 border border-green-500/20 px-2 py-0.5 rounded-full mt-0.5">
                                        Publik
                                    </span>
                                )}
                            </div>

                            <p className="text-xs font-medium text-brand-accent mb-3 flex items-center gap-1.5 bg-brand-accent/5 self-start px-2.5 py-1 rounded-full border border-brand-accent/10">
                                <MapPinIcon className="w-3.5 h-3.5" />
                                {gallery.region}
                            </p>

                            {gallery.description && (
                                <p className="text-xs text-brand-text-secondary mb-4 line-clamp-2 flex items-start gap-1.5">
                                    <FileTextIcon className="w-3.5 h-3.5 flex-shrink-0 mt-0.5 opacity-60" />
                                    <span className="leading-relaxed">{gallery.description}</span>
                                </p>
                            )}

                            {/* Action Buttons */}
                            <div className="flex flex-col gap-2 mt-auto pt-4 border-t border-brand-border/50">
                                <div className="flex gap-2">
                                    <button
                                        onClick={() => openUploadModal(gallery)}
                                        className="flex-1 button-primary !py-2 !px-2 text-xs"
                                    >
                                        <UploadIcon className="w-4 h-4 flex-shrink-0" />
                                        <span className="truncate">Upload</span>
                                    </button>
                                    {gallery.images.length > 0 && (
                                        <button
                                            onClick={() => openManageImagesModal(gallery)}
                                            className="flex-1 button-secondary !py-2 !px-2 text-xs hover:bg-brand-accent hover:text-white hover:border-brand-accent"
                                        >
                                            <CameraIcon className="w-4 h-4 flex-shrink-0" />
                                            <span className="truncate">Kelola</span>
                                        </button>
                                    )}
                                </div>
                                <div className="flex gap-1.5">
                                    <button
                                        onClick={() => openEditModal(gallery)}
                                        className="flex-1 button-secondary !p-2 text-xs text-brand-text-secondary hover:text-amber-600 hover:border-amber-300 hover:bg-amber-50"
                                        title="Edit Pricelist"
                                    >
                                        <svg className="w-4 h-4 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                        </svg>
                                    </button>
                                    {gallery.is_public && (
                                        <button
                                            onClick={() => copyPublicLink(gallery)}
                                            className="flex-1 button-secondary !p-2 text-xs text-brand-text-secondary hover:text-blue-600 hover:border-blue-300 hover:bg-blue-50"
                                            title="Salin Link Publik"
                                        >
                                            <LinkIcon className="w-4 h-4 mx-auto" />
                                        </button>
                                    )}
                                    <button
                                        onClick={() => handleDeleteGallery(gallery.id)}
                                        className="flex-1 button-secondary !p-2 text-xs text-brand-text-secondary hover:text-red-600 hover:border-red-300 hover:bg-red-50"
                                        title="Hapus Pricelist"
                                    >
                                        <TrashIcon className="w-4 h-4 mx-auto" />
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {galleries.length === 0 && (
                <div className="text-center py-16 bg-brand-surface/40 backdrop-blur-md rounded-3xl border border-brand-border/50 border-dashed">
                    <div className="text-brand-text-secondary/30 mb-5 relative inline-block">
                        <div className="absolute inset-0 bg-brand-accent/20 blur-xl rounded-full"></div>
                        <CameraIcon className="w-20 h-20 mx-auto relative z-10" />
                    </div>
                    <h3 className="text-xl font-bold text-brand-text-light mb-2">Belum Ada Pricelist</h3>
                    <p className="text-brand-text-secondary mb-6 max-w-sm mx-auto">Mulai unggah foto Pricelist Anda dan kelola berdasarkan wilayah pemasaran dengan mudah.</p>
                    <button
                        onClick={() => setIsCreateModalOpen(true)}
                        className="button-primary"
                    >
                        <PlusIcon className="w-5 h-5 flex-shrink-0" />
                        Buat Pricelist Baru
                    </button>
                </div>
            )}

            {/* Create Gallery Modal */}
            <Modal isOpen={isCreateModalOpen} onClose={() => setIsCreateModalOpen(false)} title="Buat Pricelist Baru">
                <form onSubmit={handleCreateGallery} className="space-y-5 p-1">
                    <div className="input-group">
                        <input
                            type="text"
                            id="newTitle"
                            value={newGallery.title}
                            onChange={(e) => setNewGallery(prev => ({ ...prev, title: e.target.value }))}
                            className="input-field"
                            placeholder=" "
                            required
                        />
                        <label htmlFor="newTitle" className="input-label">Judul Pricelist</label>
                    </div>

                    <div className="input-group">
                        <input
                            type="text"
                            id="newRegion"
                            value={newGallery.region}
                            onChange={(e) => setNewGallery(prev => ({ ...prev, region: e.target.value }))}
                            className="input-field"
                            placeholder=" "
                            required
                        />
                        <label htmlFor="newRegion" className="input-label">Daerah/Tempat (cth: Jakarta)</label>
                    </div>

                    <div className="input-group">
                        <textarea
                            id="newDesc"
                            value={newGallery.description}
                            onChange={(e) => setNewGallery(prev => ({ ...prev, description: e.target.value }))}
                            className="input-field"
                            rows={3}
                            placeholder=" "
                        />
                        <label htmlFor="newDesc" className="input-label">Deskripsi Opsional</label>
                    </div>

                    <div className="input-group">
                        <input
                            type="url"
                            id="newLink"
                            value={newGallery.booking_link}
                            onChange={(e) => setNewGallery(prev => ({ ...prev, booking_link: e.target.value }))}
                            className="input-field"
                            placeholder=" "
                        />
                        <label htmlFor="newLink" className="input-label">Tautan Booking (opsional)</label>
                        <p className="text-[10px] text-brand-text-secondary mt-1 pl-1">Jika diisi, tombol Booking di halaman Pricelist akan dialihkan ke tautan ini.</p>
                    </div>

                    <div className="flex items-center p-3 rounded-xl border border-brand-border/50 bg-brand-bg/50">
                        <input
                            type="checkbox"
                            id="is_public"
                            checked={newGallery.is_public}
                            onChange={(e) => setNewGallery(prev => ({ ...prev, is_public: e.target.checked }))}
                            className="h-4 w-4 rounded border-brand-border text-brand-accent focus:ring-brand-accent focus:ring-offset-brand-surface"
                        />
                        <label htmlFor="is_public" className="ml-3 text-sm font-medium text-brand-text-light cursor-pointer select-none">
                            Buat Pricelist publik (dapat diakses pengantin)
                        </label>
                    </div>

                    <div className="flex gap-3 pt-6 border-t border-brand-border/50 sticky bottom-0 bg-brand-surface">
                        <button
                            type="button"
                            onClick={() => setIsCreateModalOpen(false)}
                            className="flex-1 button-secondary"
                        >
                            Batal
                        </button>
                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className="flex-1 button-primary"
                        >
                            {isSubmitting ? 'Membuat...' : 'Buat Pricelist'}
                        </button>
                    </div>
                </form>
            </Modal>

            {/* Edit Gallery Modal */}
            <Modal isOpen={isEditModalOpen} onClose={() => setIsEditModalOpen(false)} title="Edit Pricelist">
                <form onSubmit={handleEditGallery} className="space-y-5 p-1">
                    <div className="input-group">
                        <input
                            type="text"
                            id="editTitle"
                            value={editGallery.title}
                            onChange={(e) => setEditGallery(prev => ({ ...prev, title: e.target.value }))}
                            className="input-field"
                            placeholder=" "
                            required
                        />
                        <label htmlFor="editTitle" className="input-label">Judul Pricelist</label>
                    </div>

                    <div className="input-group">
                        <input
                            type="text"
                            id="editRegion"
                            value={editGallery.region}
                            onChange={(e) => setEditGallery(prev => ({ ...prev, region: e.target.value }))}
                            className="input-field"
                            placeholder=" "
                            required
                        />
                        <label htmlFor="editRegion" className="input-label">Daerah/Tempat</label>
                    </div>

                    <div className="input-group">
                        <textarea
                            id="editDesc"
                            value={editGallery.description}
                            onChange={(e) => setEditGallery(prev => ({ ...prev, description: e.target.value }))}
                            className="input-field"
                            rows={3}
                            placeholder=" "
                        />
                        <label htmlFor="editDesc" className="input-label">Deskripsi Opsional</label>
                    </div>

                    <div className="input-group">
                        <input
                            type="url"
                            id="editLink"
                            value={editGallery.booking_link}
                            onChange={(e) => setEditGallery(prev => ({ ...prev, booking_link: e.target.value }))}
                            className="input-field"
                            placeholder=" "
                        />
                        <label htmlFor="editLink" className="input-label">Tautan Booking (opsional)</label>
                        <p className="text-[10px] text-brand-text-secondary mt-1 pl-1">Kosongkan untuk memakai tautan booking default berdasarkan wilayah.</p>
                    </div>

                    <div className="flex items-center p-3 rounded-xl border border-brand-border/50 bg-brand-bg/50">
                        <input
                            type="checkbox"
                            id="edit_is_public"
                            checked={editGallery.is_public}
                            onChange={(e) => setEditGallery(prev => ({ ...prev, is_public: e.target.checked }))}
                            className="h-4 w-4 rounded border-brand-border text-brand-accent focus:ring-brand-accent focus:ring-offset-brand-surface"
                        />
                        <label htmlFor="edit_is_public" className="ml-3 text-sm font-medium text-brand-text-light cursor-pointer select-none">
                            Buat Pricelist publik (dapat diakses pengantin)
                        </label>
                    </div>

                    <div className="flex gap-3 pt-6 border-t border-brand-border/50 sticky bottom-0 bg-brand-surface">
                        <button
                            type="button"
                            onClick={() => setIsEditModalOpen(false)}
                            className="flex-1 button-secondary"
                        >
                            Batal
                        </button>
                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className="flex-1 button-primary"
                        >
                            {isSubmitting ? 'Menyimpan...' : 'Simpan Perubahan'}
                        </button>
                    </div>
                </form>
            </Modal>

            {/* Upload Images Modal */}
            <Modal
                isOpen={isUploadModalOpen}
                onClose={() => setIsUploadModalOpen(false)}
                title={`Upload ke ${selectedGallery?.title || 'Pricelist'}`}
            >
                <div className="space-y-5 p-1">
                    <div className="bg-brand-bg/50 border border-brand-border border-dashed rounded-2xl p-6 md:p-8 text-center transition-colors hover:bg-brand-bg group">
                        <input
                            type="file"
                            multiple
                            accept="image/*"
                            onChange={handleFileSelect}
                            className="hidden"
                            id="file-upload"
                        />
                        <label
                            htmlFor="file-upload"
                            className="cursor-pointer flex flex-col items-center justify-center gap-3"
                        >
                            <div className="w-16 h-16 rounded-full bg-brand-surface flex items-center justify-center shadow-sm border border-brand-border/50 group-hover:scale-110 transition-transform duration-300">
                                <UploadIcon className="w-8 h-8 text-brand-accent" />
                            </div>
                            <div>
                                <h4 className="font-semibold text-brand-text-light">Klik untuk memilih gambar</h4>
                                <p className="text-xs text-brand-text-secondary mt-1">
                                    Maksimal 10MB per file. Format: JPG, PNG, WebP
                                </p>
                            </div>
                        </label>
                    </div>

                    {selectedFiles.length > 0 && (
                        <div className="bg-brand-surface border border-brand-border/50 rounded-xl p-4">
                            <div className="flex justify-between items-center mb-3">
                                <h5 className="text-sm font-semibold text-brand-text-light flex items-center gap-2">
                                    <span className="w-6 h-6 rounded-full bg-brand-accent/10 flex items-center justify-center text-brand-accent text-[10px]">{selectedFiles.length}</span>
                                    File Siap Upload
                                </h5>
                                <button onClick={() => setSelectedFiles([])} className="text-xs text-brand-danger hover:underline font-medium">Reset</button>
                            </div>
                            <div className="max-h-40 overflow-y-auto space-y-2 pr-1 custom-scrollbar">
                                {selectedFiles.map((file, index) => (
                                    <div key={index} className="flex justify-between items-center p-2 rounded-lg bg-brand-bg text-xs">
                                        <span className="truncate flex-grow text-brand-text-primary pr-3 font-medium">{file.name}</span>
                                        <span className="flex-shrink-0 text-brand-text-secondary">{(file.size / 1024 / 1024).toFixed(1)} MB</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {uploadProgress > 0 && uploadProgress < 100 && (
                        <div className="bg-brand-surface rounded-xl p-4 border border-brand-border/50">
                            <div className="flex justify-between text-sm mb-2 font-medium">
                                <span className="text-brand-text-light flex items-center gap-2">
                                    <div className="w-4 h-4 rounded-full border-2 border-brand-accent border-t-transparent animate-spin"></div>
                                    Mengupload...
                                </span>
                                <span className="text-brand-accent">{uploadProgress}%</span>
                            </div>
                            <div className="w-full bg-brand-input rounded-full h-2.5 overflow-hidden">
                                <div
                                    className="bg-brand-accent h-full rounded-full transition-all duration-300 relative"
                                    style={{ width: `${uploadProgress}%` }}
                                >
                                    <div className="absolute inset-0 bg-white/20 animate-pulse"></div>
                                </div>
                            </div>
                        </div>
                    )}

                    <div className="flex gap-3 pt-4 border-t border-brand-border/50 sticky bottom-0 bg-brand-surface">
                        <button
                            type="button"
                            onClick={() => setIsUploadModalOpen(false)}
                            className="flex-1 button-secondary"
                        >
                            Batal
                        </button>
                        <button
                            onClick={handleUploadImages}
                            disabled={selectedFiles.length === 0 || isSubmitting}
                            className="flex-1 button-primary"
                        >
                            {isSubmitting ? 'Mengupload...' : 'Upload Gambar'}
                        </button>
                    </div>
                </div>
            </Modal>

            {/* Manage Images Modal */}
            {selectedGallery && (
                <Modal
                    isOpen={isManageImagesModalOpen}
                    onClose={() => setIsManageImagesModalOpen(false)}
                    title={`Kelola Gambar - ${selectedGallery.title}`}
                >
                    <div className="space-y-4 p-1">
                        {selectedGallery.images.length === 0 ? (
                            <div className="text-center py-12 text-brand-text-secondary">
                                <CameraIcon className="w-16 h-16 mx-auto mb-3 opacity-30" />
                                <p>Belum ada gambar</p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-2 md:grid-cols-3 gap-3 max-h-[60vh] overflow-y-auto pr-2">
                                {selectedGallery.images.map((image, index) => (
                                    <div key={image.id} className="relative group">
                                        <div 
                                            className="aspect-square rounded-xl overflow-hidden border-2 border-brand-border/50 hover:border-brand-accent transition-all cursor-pointer"
                                            onClick={() => openLightbox(selectedGallery, index)}
                                        >
                                            <img
                                                src={image.thumbnailUrl || image.url}
                                                alt={image.caption || `Image ${index + 1}`}
                                                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                                            />
                                        </div>
                                        
                                        {/* Image Controls */}
                                        <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                            {index > 0 && (
                                                <button
                                                    onClick={() => moveImage(selectedGallery.id, index, index - 1)}
                                                    className="p-1.5 bg-white/90 hover:bg-brand-accent hover:text-white rounded-lg shadow-lg transition-colors"
                                                    title="Pindah ke kiri"
                                                >
                                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                                                    </svg>
                                                </button>
                                            )}
                                            {index < selectedGallery.images.length - 1 && (
                                                <button
                                                    onClick={() => moveImage(selectedGallery.id, index, index + 1)}
                                                    className="p-1.5 bg-white/90 hover:bg-brand-accent hover:text-white rounded-lg shadow-lg transition-colors"
                                                    title="Pindah ke kanan"
                                                >
                                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                                    </svg>
                                                </button>
                                            )}
                                            <button
                                                onClick={() => handleDeleteImage(selectedGallery.id, image.id)}
                                                className="p-1.5 bg-red-500/90 hover:bg-red-600 text-white rounded-lg shadow-lg transition-colors"
                                                title="Hapus gambar"
                                            >
                                                <TrashIcon className="w-4 h-4" />
                                            </button>
                                        </div>

                                        {/* Image Number Badge */}
                                        <div className="absolute bottom-2 left-2 bg-black/60 backdrop-blur-sm text-white px-2 py-0.5 rounded-full text-xs font-medium">
                                            #{index + 1}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}

                        <div className="flex gap-3 pt-4 border-t border-brand-border/50">
                            <button
                                onClick={() => {
                                    setIsManageImagesModalOpen(false);
                                    openUploadModal(selectedGallery);
                                }}
                                className="flex-1 button-primary"
                            >
                                <UploadIcon className="w-4 h-4" />
                                Tambah Gambar
                            </button>
                            <button
                                onClick={() => setIsManageImagesModalOpen(false)}
                                className="flex-1 button-secondary"
                            >
                                Tutup
                            </button>
                        </div>
                    </div>
                </Modal>
            )}

            {/* Lightbox Modal */}
            {selectedGallery && isLightboxOpen && selectedGallery.images.length > 0 && (
                <div 
                    className="fixed inset-0 z-[9999] bg-black/95 flex items-center justify-center p-4"
                    onClick={() => setIsLightboxOpen(false)}
                >
                    <button
                        onClick={() => setIsLightboxOpen(false)}
                        className="absolute top-4 right-4 p-2 bg-white/10 hover:bg-white/20 rounded-full text-white transition-colors z-10"
                    >
                        <XIcon className="w-6 h-6" />
                    </button>

                    {selectedGallery.images.length > 1 && (
                        <>
                            <button
                                onClick={(e) => { e.stopPropagation(); prevImage(); }}
                                className="absolute left-4 p-3 bg-white/10 hover:bg-white/20 rounded-full text-white transition-colors z-10"
                            >
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                                </svg>
                            </button>
                            <button
                                onClick={(e) => { e.stopPropagation(); nextImage(); }}
                                className="absolute right-4 p-3 bg-white/10 hover:bg-white/20 rounded-full text-white transition-colors z-10"
                            >
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                </svg>
                            </button>
                        </>
                    )}

                    <div className="max-w-6xl max-h-[90vh] w-full" onClick={(e) => e.stopPropagation()}>
                        <img
                            src={selectedGallery.images[lightboxImageIndex].url}
                            alt={selectedGallery.images[lightboxImageIndex].caption || `Image ${lightboxImageIndex + 1}`}
                            className="w-full h-full object-contain rounded-lg"
                        />
                        <div className="text-center mt-4 text-white">
                            <p className="text-sm opacity-75">
                                {lightboxImageIndex + 1} / {selectedGallery.images.length}
                            </p>
                            {selectedGallery.images[lightboxImageIndex].caption && (
                                <p className="mt-2 text-base">{selectedGallery.images[lightboxImageIndex].caption}</p>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default GalleryUpload;
