import React, { useState, useEffect } from 'react';
import { Profile, Portfolio, PortfolioItem } from '@/types';
import { useApp } from '@/app/AppContext';
import Modal from '@/shared/ui/Modal';
import {
  UploadIcon,
  TrashIcon,
  LinkIcon,
  PlusIcon,
  CameraIcon,
  XIcon,
} from '@/constants';
import {
  createPortfolio,
  listPortfolios,
  uploadPortfolioImages,
  deletePortfolio,
  updatePortfolio,
  deletePortfolioItem,
} from '@/services/portfolios';

interface PortfolioManagerProps {
  userProfile: Profile;
  showNotification: (message: string) => void;
}

const CATEGORIES = ['Wedding', 'Pre-Wedding', 'Engagement', 'Maternity', 'Event', 'Corporate', 'Lainnya'];

const PortfolioManager: React.FC<PortfolioManagerProps> = ({ userProfile, showNotification }) => {
  const { currentUser } = useApp();
  const vendorId = currentUser?.id ?? userProfile?.id ?? userProfile?.adminUserId ?? null;

  const [portfolios, setPortfolios] = useState<Portfolio[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [isManageImagesModalOpen, setIsManageImagesModalOpen] = useState(false);
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);
  const [selectedPortfolio, setSelectedPortfolio] = useState<Portfolio | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const emptyForm = {
    title: '',
    category: 'Wedding',
    description: '',
    is_public: true,
    project_date: '',
    location: '',
  };

  const [newPortfolio, setNewPortfolio] = useState({ ...emptyForm });
  const [editPortfolio, setEditPortfolio] = useState({ ...emptyForm });
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [uploadProgress, setUploadProgress] = useState(0);

  useEffect(() => {
    loadPortfolios();
  }, []);

  const loadPortfolios = async () => {
    try {
      setIsLoading(true);
      setLoadError(null);
      const data = await listPortfolios();
      setPortfolios(data);
    } catch (error: any) {
      console.error('Error loading portfolios:', error);
      const message = error?.message || 'Gagal memuat Portfolio';
      setLoadError(message);
      showNotification(message);
    } finally {
      setIsLoading(false);
    }
  };

  // ─── Create ───────────────────────────────────────────────────────────────
  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPortfolio.title.trim()) {
      showNotification('Judul portfolio harus diisi');
      return;
    }
    try {
      setIsSubmitting(true);
      const portfolio = await createPortfolio({
        title: newPortfolio.title.trim(),
        category: newPortfolio.category || undefined,
        description: newPortfolio.description.trim() || undefined,
        is_public: newPortfolio.is_public,
        project_date: newPortfolio.project_date || undefined,
        location: newPortfolio.location.trim() || undefined,
        items: [],
      });
      setPortfolios(prev => [portfolio, ...prev]);
      setIsCreateModalOpen(false);
      setNewPortfolio({ ...emptyForm });
      showNotification('Portfolio berhasil dibuat');
    } catch (error) {
      console.error('Error creating portfolio:', error);
      showNotification('Gagal membuat portfolio');
    } finally {
      setIsSubmitting(false);
    }
  };

  // ─── Edit ─────────────────────────────────────────────────────────────────
  const openEditModal = (portfolio: Portfolio) => {
    setSelectedPortfolio(portfolio);
    setEditPortfolio({
      title: portfolio.title,
      category: portfolio.category || 'Wedding',
      description: portfolio.description || '',
      is_public: portfolio.is_public,
      project_date: portfolio.project_date ? portfolio.project_date.split('T')[0] : '',
      location: portfolio.location || '',
    });
    setIsEditModalOpen(true);
  };

  const handleEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPortfolio || !editPortfolio.title.trim()) {
      showNotification('Judul portfolio harus diisi');
      return;
    }
    try {
      setIsSubmitting(true);
      const updated = await updatePortfolio(selectedPortfolio.id, {
        title: editPortfolio.title.trim(),
        category: editPortfolio.category || undefined,
        description: editPortfolio.description.trim() || undefined,
        is_public: editPortfolio.is_public,
        project_date: editPortfolio.project_date || undefined,
        location: editPortfolio.location.trim() || undefined,
      });
      // Merge updated metadata tapi pertahankan items yang sudah ada
      const merged = { ...updated, items: selectedPortfolio.items };
      setPortfolios(prev => prev.map(p => p.id === updated.id ? merged : p));
      setSelectedPortfolio(merged);
      setIsEditModalOpen(false);
      showNotification('Portfolio berhasil diperbarui');
    } catch (error) {
      console.error('Error updating portfolio:', error);
      showNotification('Gagal mengupdate portfolio');
    } finally {
      setIsSubmitting(false);
    }
  };

  // ─── Upload Images ────────────────────────────────────────────────────────
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;
    const files = Array.from(e.target.files).filter(file => {
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
    setSelectedFiles(prev => [...prev, ...files]);
  };

  const handleUpload = async () => {
    if (!selectedPortfolio || selectedFiles.length === 0) return;
    try {
      setIsSubmitting(true);
      setUploadProgress(0);
      const newItems = await uploadPortfolioImages(
        selectedPortfolio.id,
        selectedFiles,
        setUploadProgress
      );
      setPortfolios(prev =>
        prev.map(p =>
          p.id === selectedPortfolio.id
            ? { ...p, items: [...p.items, ...newItems] }
            : p
        )
      );
      setSelectedFiles([]);
      setUploadProgress(0);
      setIsUploadModalOpen(false);
      showNotification(`${newItems.length} foto berhasil diupload`);
    } catch (error) {
      console.error('Error uploading images:', error);
      showNotification('Gagal mengupload foto');
    } finally {
      setIsSubmitting(false);
    }
  };

  // ─── Delete Image ─────────────────────────────────────────────────────────
  const handleDeleteItem = async (portfolioId: number, itemId: number) => {
    if (!confirm('Hapus foto ini?')) return;
    try {
      await deletePortfolioItem(portfolioId, itemId);
      setPortfolios(prev =>
        prev.map(p =>
          p.id === portfolioId
            ? { ...p, items: p.items.filter(i => i.id !== itemId) }
            : p
        )
      );
      if (selectedPortfolio?.id === portfolioId) {
        setSelectedPortfolio(prev =>
          prev ? { ...prev, items: prev.items.filter(i => i.id !== itemId) } : null
        );
      }
      showNotification('Foto berhasil dihapus');
    } catch {
      showNotification('Gagal menghapus foto');
    }
  };

  // ─── Delete Portfolio ─────────────────────────────────────────────────────
  const handleDeletePortfolio = async (portfolioId: number) => {
    if (!confirm('Hapus portfolio ini? Semua foto akan ikut terhapus.')) return;
    try {
      await deletePortfolio(portfolioId);
      setPortfolios(prev => prev.filter(p => p.id !== portfolioId));
      showNotification('Portfolio berhasil dihapus');
    } catch {
      showNotification('Gagal menghapus portfolio');
    }
  };

  // ─── Copy Link ────────────────────────────────────────────────────────────
  const copyPublicLink = (publicId: string) => {
    const link = `${window.location.origin}${window.location.pathname}#/portfolio/${publicId}`;
    navigator.clipboard.writeText(link);
    showNotification('Link portfolio berhasil disalin');
  };

  // ─── Lightbox ─────────────────────────────────────────────────────────────
  const openLightbox = (index: number) => {
    setLightboxIndex(index);
    setIsLightboxOpen(true);
  };

  // ─── Render ───────────────────────────────────────────────────────────────
  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-3">
        <div className="w-8 h-8 border-4 border-brand-accent border-t-transparent rounded-full animate-spin" />
        <p className="text-sm text-brand-text-secondary">Memuat portfolio...</p>
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4 text-center px-4">
        <p className="text-red-500 font-medium">{loadError}</p>
        <p className="text-sm text-brand-text-secondary max-w-md">
          Pastikan backend berjalan di port 5000, lalu coba muat ulang.
        </p>
        <button
          type="button"
          onClick={loadPortfolios}
          className="px-4 py-2 rounded-xl bg-brand-accent text-white text-sm font-semibold hover:bg-brand-accent/90"
        >
          Coba Lagi
        </button>
      </div>
    );
  }

  const currentItems = selectedPortfolio?.items ?? [];

  return (
    <div className="space-y-6 p-4 sm:p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-brand-text-light">Portfolio</h1>
          <p className="text-sm text-brand-text-secondary mt-1">
            Kelola portfolio proyek foto per project dengan link publik
          </p>
        </div>
        <div className="flex items-center gap-2">
          <a
            href={`${window.location.origin}${window.location.pathname}#/portfolio/v/${vendorId ?? ''}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 px-4 py-2.5 bg-brand-input border border-brand-border text-brand-text-primary rounded-xl font-semibold hover:bg-brand-border/30 transition-colors text-sm"
          >
            <LinkIcon className="w-4 h-4" />
            Halaman Publik
          </a>
          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-brand-accent text-white rounded-xl font-semibold hover:bg-brand-accent/90 transition-colors shadow-sm"
          >
            <PlusIcon className="w-5 h-5" />
            Buat Portfolio
          </button>
        </div>
      </div>

      {/* Portfolio Grid */}
      {portfolios.length === 0 ? (
        <div className="text-center py-20 bg-brand-input/30 rounded-2xl border border-dashed border-brand-border">
          <CameraIcon className="w-16 h-16 mx-auto text-brand-text-secondary/40 mb-4" />
          <h3 className="text-lg font-semibold text-brand-text-primary mb-2">Belum ada Portfolio</h3>
          <p className="text-brand-text-secondary text-sm mb-6">
            Buat portfolio pertamamu dan bagikan link publiknya ke calon klien
          </p>
          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="px-6 py-2.5 bg-brand-accent text-white rounded-xl font-semibold hover:bg-brand-accent/90 transition-colors"
          >
            Buat Portfolio Pertama
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {portfolios.map(portfolio => {
            const heroImage = portfolio.hero_image_url || portfolio.items[0]?.thumbnailUrl || portfolio.items[0]?.url;
            return (
              <div
                key={portfolio.id}
                className="bg-white rounded-2xl shadow-sm border border-brand-border overflow-hidden hover:shadow-md transition-shadow"
              >
                {/* Cover */}
                <div className="relative h-44 bg-gradient-to-br from-slate-100 to-slate-200 overflow-hidden">
                  {heroImage ? (
                    <img src={heroImage} alt={portfolio.title} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <CameraIcon className="w-12 h-12 text-slate-300" />
                    </div>
                  )}
                  {/* Badge */}
                  <div className="absolute top-3 left-3 flex gap-2 flex-wrap">
                    <span className={`text-xs font-semibold px-2 py-1 rounded-full ${portfolio.is_public ? 'bg-green-500/90 text-white' : 'bg-gray-500/90 text-white'}`}>
                      {portfolio.is_public ? 'Publik' : 'Privat'}
                    </span>
                    {portfolio.category && (
                      <span className="text-xs font-semibold px-2 py-1 rounded-full bg-brand-accent/90 text-white">
                        {portfolio.category}
                      </span>
                    )}
                  </div>
                  {/* Photo count */}
                  <div className="absolute bottom-3 right-3 bg-black/60 text-white text-xs px-2 py-1 rounded-full">
                    {portfolio.items.length} foto
                  </div>
                </div>

                {/* Content */}
                <div className="p-4 space-y-3">
                  <div>
                    <h3 className="font-bold text-brand-text-light text-base leading-tight truncate">{portfolio.title}</h3>
                    {portfolio.location && (
                      <p className="text-xs text-brand-text-secondary mt-0.5 truncate">📍 {portfolio.location}</p>
                    )}
                    {portfolio.description && (
                      <p className="text-xs text-brand-text-secondary mt-1 line-clamp-2">{portfolio.description}</p>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex flex-wrap gap-2 pt-1">
                    <button
                      onClick={() => { setSelectedPortfolio(portfolio); setIsUploadModalOpen(true); }}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-brand-accent/10 text-brand-accent text-xs font-semibold rounded-lg hover:bg-brand-accent/20 transition-colors"
                    >
                      <UploadIcon className="w-3.5 h-3.5" />
                      Upload
                    </button>
                    <button
                      onClick={() => { setSelectedPortfolio(portfolio); setIsManageImagesModalOpen(true); }}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 text-blue-600 text-xs font-semibold rounded-lg hover:bg-blue-100 transition-colors"
                    >
                      <CameraIcon className="w-3.5 h-3.5" />
                      Kelola Foto
                    </button>
                    <button
                      onClick={() => openEditModal(portfolio)}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-50 text-gray-600 text-xs font-semibold rounded-lg hover:bg-gray-100 transition-colors"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => copyPublicLink(portfolio.public_id)}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-50 text-gray-600 text-xs font-semibold rounded-lg hover:bg-gray-100 transition-colors"
                      title="Salin link publik"
                    >
                      <LinkIcon className="w-3.5 h-3.5" />
                      Link
                    </button>
                    <button
                      onClick={() => handleDeletePortfolio(portfolio.id)}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-red-50 text-red-600 text-xs font-semibold rounded-lg hover:bg-red-100 transition-colors"
                    >
                      <TrashIcon className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ─── Create Modal ─────────────────────────────────────────────────────── */}
      <Modal isOpen={isCreateModalOpen} onClose={() => setIsCreateModalOpen(false)} title="Buat Portfolio Baru">
        <form onSubmit={handleCreate} className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-brand-text-primary mb-1">Judul Portfolio *</label>
            <input
              type="text"
              value={newPortfolio.title}
              onChange={e => setNewPortfolio(prev => ({ ...prev, title: e.target.value }))}
              className="w-full px-3 py-2.5 rounded-xl border border-brand-border bg-brand-input text-brand-text-light focus:outline-none focus:ring-2 focus:ring-brand-accent/50"
              placeholder="Cth: Wedding Anisa & Budi"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-semibold text-brand-text-primary mb-1">Kategori</label>
              <select
                value={newPortfolio.category}
                onChange={e => setNewPortfolio(prev => ({ ...prev, category: e.target.value }))}
                className="w-full px-3 py-2.5 rounded-xl border border-brand-border bg-brand-input text-brand-text-light focus:outline-none focus:ring-2 focus:ring-brand-accent/50"
              >
                {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold text-brand-text-primary mb-1">Tanggal Project</label>
              <input
                type="date"
                value={newPortfolio.project_date}
                onChange={e => setNewPortfolio(prev => ({ ...prev, project_date: e.target.value }))}
                className="w-full px-3 py-2.5 rounded-xl border border-brand-border bg-brand-input text-brand-text-light focus:outline-none focus:ring-2 focus:ring-brand-accent/50"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-semibold text-brand-text-primary mb-1">Lokasi</label>
            <input
              type="text"
              value={newPortfolio.location}
              onChange={e => setNewPortfolio(prev => ({ ...prev, location: e.target.value }))}
              className="w-full px-3 py-2.5 rounded-xl border border-brand-border bg-brand-input text-brand-text-light focus:outline-none focus:ring-2 focus:ring-brand-accent/50"
              placeholder="Cth: Bandung, Jawa Barat"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-brand-text-primary mb-1">Deskripsi</label>
            <textarea
              value={newPortfolio.description}
              onChange={e => setNewPortfolio(prev => ({ ...prev, description: e.target.value }))}
              rows={3}
              className="w-full px-3 py-2.5 rounded-xl border border-brand-border bg-brand-input text-brand-text-light focus:outline-none focus:ring-2 focus:ring-brand-accent/50 resize-none"
              placeholder="Ceritakan sedikit tentang project ini..."
            />
          </div>
          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              id="new-is-public"
              checked={newPortfolio.is_public}
              onChange={e => setNewPortfolio(prev => ({ ...prev, is_public: e.target.checked }))}
              className="w-4 h-4 accent-brand-accent"
            />
            <label htmlFor="new-is-public" className="text-sm font-medium text-brand-text-primary">
              Tampilkan ke publik
            </label>
          </div>
          <div className="flex gap-3 justify-end pt-2">
            <button type="button" onClick={() => setIsCreateModalOpen(false)}
              className="px-4 py-2 rounded-xl text-sm font-semibold text-brand-text-secondary hover:bg-brand-input transition-colors">
              Batal
            </button>
            <button type="submit" disabled={isSubmitting}
              className="px-5 py-2 rounded-xl text-sm font-semibold bg-brand-accent text-white hover:bg-brand-accent/90 disabled:opacity-50 transition-colors">
              {isSubmitting ? 'Menyimpan...' : 'Buat Portfolio'}
            </button>
          </div>
        </form>
      </Modal>

      {/* ─── Edit Modal ───────────────────────────────────────────────────────── */}
      <Modal isOpen={isEditModalOpen} onClose={() => setIsEditModalOpen(false)} title="Edit Portfolio">
        <form onSubmit={handleEdit} className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-brand-text-primary mb-1">Judul Portfolio *</label>
            <input
              type="text"
              value={editPortfolio.title}
              onChange={e => setEditPortfolio(prev => ({ ...prev, title: e.target.value }))}
              className="w-full px-3 py-2.5 rounded-xl border border-brand-border bg-brand-input text-brand-text-light focus:outline-none focus:ring-2 focus:ring-brand-accent/50"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-semibold text-brand-text-primary mb-1">Kategori</label>
              <select
                value={editPortfolio.category}
                onChange={e => setEditPortfolio(prev => ({ ...prev, category: e.target.value }))}
                className="w-full px-3 py-2.5 rounded-xl border border-brand-border bg-brand-input text-brand-text-light focus:outline-none focus:ring-2 focus:ring-brand-accent/50"
              >
                {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold text-brand-text-primary mb-1">Tanggal Project</label>
              <input
                type="date"
                value={editPortfolio.project_date}
                onChange={e => setEditPortfolio(prev => ({ ...prev, project_date: e.target.value }))}
                className="w-full px-3 py-2.5 rounded-xl border border-brand-border bg-brand-input text-brand-text-light focus:outline-none focus:ring-2 focus:ring-brand-accent/50"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-semibold text-brand-text-primary mb-1">Lokasi</label>
            <input
              type="text"
              value={editPortfolio.location}
              onChange={e => setEditPortfolio(prev => ({ ...prev, location: e.target.value }))}
              className="w-full px-3 py-2.5 rounded-xl border border-brand-border bg-brand-input text-brand-text-light focus:outline-none focus:ring-2 focus:ring-brand-accent/50"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-brand-text-primary mb-1">Deskripsi</label>
            <textarea
              value={editPortfolio.description}
              onChange={e => setEditPortfolio(prev => ({ ...prev, description: e.target.value }))}
              rows={3}
              className="w-full px-3 py-2.5 rounded-xl border border-brand-border bg-brand-input text-brand-text-light focus:outline-none focus:ring-2 focus:ring-brand-accent/50 resize-none"
            />
          </div>
          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              id="edit-is-public"
              checked={editPortfolio.is_public}
              onChange={e => setEditPortfolio(prev => ({ ...prev, is_public: e.target.checked }))}
              className="w-4 h-4 accent-brand-accent"
            />
            <label htmlFor="edit-is-public" className="text-sm font-medium text-brand-text-primary">
              Tampilkan ke publik
            </label>
          </div>
          <div className="flex gap-3 justify-end pt-2">
            <button type="button" onClick={() => setIsEditModalOpen(false)}
              className="px-4 py-2 rounded-xl text-sm font-semibold text-brand-text-secondary hover:bg-brand-input transition-colors">
              Batal
            </button>
            <button type="submit" disabled={isSubmitting}
              className="px-5 py-2 rounded-xl text-sm font-semibold bg-brand-accent text-white hover:bg-brand-accent/90 disabled:opacity-50 transition-colors">
              {isSubmitting ? 'Menyimpan...' : 'Simpan Perubahan'}
            </button>
          </div>
        </form>
      </Modal>

      {/* ─── Upload Modal ─────────────────────────────────────────────────────── */}
      <Modal
        isOpen={isUploadModalOpen}
        onClose={() => { setIsUploadModalOpen(false); setSelectedFiles([]); setUploadProgress(0); }}
        title={`Upload Foto — ${selectedPortfolio?.title || ''}`}
      >
        <div className="space-y-4">
          {/* Dropzone */}
          <label className="block border-2 border-dashed border-brand-border rounded-2xl p-8 text-center cursor-pointer hover:border-brand-accent/50 hover:bg-brand-accent/5 transition-colors">
            <UploadIcon className="w-10 h-10 mx-auto text-brand-text-secondary/50 mb-3" />
            <p className="font-semibold text-brand-text-primary text-sm">Klik untuk pilih foto</p>
            <p className="text-xs text-brand-text-secondary mt-1">JPG, PNG, WebP — maks 10MB per file</p>
            <input
              type="file"
              multiple
              accept="image/*"
              onChange={handleFileSelect}
              className="hidden"
            />
          </label>

          {/* Selected Files Preview */}
          {selectedFiles.length > 0 && (
            <div className="space-y-2">
              <p className="text-sm font-semibold text-brand-text-primary">{selectedFiles.length} file dipilih:</p>
              <div className="flex flex-wrap gap-2 max-h-40 overflow-y-auto">
                {selectedFiles.map((file, i) => (
                  <div key={i} className="relative">
                    <img
                      src={URL.createObjectURL(file)}
                      alt={file.name}
                      className="w-16 h-16 object-cover rounded-lg border border-brand-border"
                    />
                    <button
                      onClick={() => setSelectedFiles(prev => prev.filter((_, idx) => idx !== i))}
                      className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white rounded-full flex items-center justify-center text-xs"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Progress */}
          {isSubmitting && uploadProgress > 0 && (
            <div className="space-y-1">
              <div className="flex justify-between text-xs text-brand-text-secondary">
                <span>Mengupload...</span>
                <span>{uploadProgress}%</span>
              </div>
              <div className="w-full bg-brand-input rounded-full h-2">
                <div
                  className="bg-brand-accent h-2 rounded-full transition-all duration-300"
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
            </div>
          )}

          <div className="flex gap-3 justify-end">
            <button
              onClick={() => { setIsUploadModalOpen(false); setSelectedFiles([]); }}
              className="px-4 py-2 rounded-xl text-sm font-semibold text-brand-text-secondary hover:bg-brand-input transition-colors"
            >
              Batal
            </button>
            <button
              onClick={handleUpload}
              disabled={isSubmitting || selectedFiles.length === 0}
              className="px-5 py-2 rounded-xl text-sm font-semibold bg-brand-accent text-white hover:bg-brand-accent/90 disabled:opacity-50 transition-colors flex items-center gap-2"
            >
              <UploadIcon className="w-4 h-4" />
              {isSubmitting ? 'Mengupload...' : `Upload ${selectedFiles.length} Foto`}
            </button>
          </div>
        </div>
      </Modal>

      {/* ─── Manage Images Modal ──────────────────────────────────────────────── */}
      <Modal
        isOpen={isManageImagesModalOpen}
        onClose={() => { setIsManageImagesModalOpen(false); setSelectedPortfolio(null); }}
        title={`Kelola Foto — ${selectedPortfolio?.title || ''}`}
      >
        <div className="space-y-4">
          {currentItems.length === 0 ? (
            <div className="text-center py-10">
              <CameraIcon className="w-12 h-12 mx-auto text-brand-text-secondary/30 mb-3" />
              <p className="text-sm text-brand-text-secondary">Belum ada foto. Klik Upload untuk menambahkan.</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 max-h-[60vh] overflow-y-auto">
              {currentItems.map((item, index) => (
                <div key={item.id} className="relative group rounded-xl overflow-hidden border border-brand-border">
                  <img
                    src={item.thumbnailUrl || item.url}
                    alt={item.caption || `Foto ${index + 1}`}
                    className="w-full aspect-square object-cover cursor-pointer"
                    onClick={() => openLightbox(index)}
                  />
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
                    <button
                      onClick={() => selectedPortfolio && handleDeleteItem(selectedPortfolio.id, item.id)}
                      className="p-2 bg-red-500 text-white rounded-full"
                    >
                      <TrashIcon className="w-4 h-4" />
                    </button>
                  </div>
                  {item.caption && (
                    <div className="absolute bottom-0 left-0 right-0 bg-black/60 text-white text-xs p-1.5 truncate">
                      {item.caption}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
          <div className="flex gap-3 justify-between">
            <button
              onClick={() => {
                setIsManageImagesModalOpen(false);
                setIsUploadModalOpen(true);
              }}
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold bg-brand-accent/10 text-brand-accent hover:bg-brand-accent/20 transition-colors"
            >
              <UploadIcon className="w-4 h-4" />
              Upload Lebih Banyak
            </button>
            <button
              onClick={() => setIsManageImagesModalOpen(false)}
              className="px-4 py-2 rounded-xl text-sm font-semibold text-brand-text-secondary hover:bg-brand-input transition-colors"
            >
              Tutup
            </button>
          </div>
        </div>
      </Modal>

      {/* ─── Lightbox ─────────────────────────────────────────────────────────── */}
      {isLightboxOpen && selectedPortfolio && currentItems.length > 0 && (
        <div
          className="fixed inset-0 bg-black/95 z-50 flex items-center justify-center p-4"
          onClick={() => setIsLightboxOpen(false)}
        >
          <button
            className="absolute top-4 right-4 p-2 bg-white/10 rounded-full text-white hover:bg-white/20"
            onClick={() => setIsLightboxOpen(false)}
          >
            <XIcon className="w-6 h-6" />
          </button>
          <img
            src={currentItems[lightboxIndex]?.url}
            alt={currentItems[lightboxIndex]?.caption || 'Foto'}
            className="max-w-full max-h-full object-contain rounded-lg"
            onClick={e => e.stopPropagation()}
          />
          {currentItems.length > 1 && (
            <>
              <button
                className="absolute left-4 p-2 bg-white/10 rounded-full text-white hover:bg-white/20"
                onClick={e => { e.stopPropagation(); setLightboxIndex(i => (i > 0 ? i - 1 : currentItems.length - 1)); }}
              >
                ‹
              </button>
              <button
                className="absolute right-4 p-2 bg-white/10 rounded-full text-white hover:bg-white/20"
                onClick={e => { e.stopPropagation(); setLightboxIndex(i => (i < currentItems.length - 1 ? i + 1 : 0)); }}
              >
                ›
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default PortfolioManager;
