import React, { useState, useEffect, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { Portfolio, PortfolioItem, Profile } from '@/types';
import { getPublicPortfolio } from '@/services/portfolios';
import { getProfile } from '@/services/profile';
import { cleanPhoneNumber } from '@/constants';
import { LazyImage } from '@/shared/ui/LazyImage';

// ─── URL Sanitizer ────────────────────────────────────────────────────────────
const sanitizeUrl = (url: string): string => {
  if (!url) return '/placeholder-image.jpg';
  if (url.startsWith('data:image/')) return url;
  try {
    const parsed = new URL(url);
    if (!['http:', 'https:'].includes(parsed.protocol)) return '/placeholder-image.jpg';
    return url;
  } catch {
    return '/placeholder-image.jpg';
  }
};

// ─── Component ────────────────────────────────────────────────────────────────
const PublicPortfolio: React.FC = () => {
  const { id: portfolioId } = useParams<{ id: string }>();

  const [portfolio, setPortfolio] = useState<Portfolio | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedImage, setSelectedImage] = useState<PortfolioItem | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    if (portfolioId) {
      loadData();
    } else {
      setIsLoading(false);
      setError('Portfolio tidak ditemukan');
    }
  }, [portfolioId]);

  const loadData = async () => {
    try {
      setIsLoading(true);
      const [portfolioData, profileData] = await Promise.all([
        getPublicPortfolio(portfolioId!),
        getProfile().catch((): null => null),
      ]);
      if (!portfolioData) {
        setError('Portfolio tidak ditemukan atau tidak dapat diakses');
        return;
      }
      setPortfolio(portfolioData);
      setProfile(profileData);
    } catch {
      setError('Portfolio tidak ditemukan atau tidak dapat diakses');
    } finally {
      setIsLoading(false);
    }
  };

  const openLightbox = (item: PortfolioItem, index: number) => {
    setSelectedImage(item);
    setCurrentIndex(index);
  };

  const closeLightbox = () => setSelectedImage(null);

  const navigate = useCallback((direction: 'prev' | 'next') => {
    if (!portfolio) return;
    setCurrentIndex(prev => {
      const next = direction === 'prev'
        ? (prev > 0 ? prev - 1 : portfolio.items.length - 1)
        : (prev < portfolio.items.length - 1 ? prev + 1 : 0);
      setSelectedImage(portfolio.items[next]);
      return next;
    });
  }, [portfolio]);

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.key === 'Escape') closeLightbox();
    if (e.key === 'ArrowLeft') navigate('prev');
    if (e.key === 'ArrowRight') navigate('next');
  }, [navigate]);

  useEffect(() => {
    if (selectedImage) {
      document.addEventListener('keydown', handleKeyDown);
      return () => document.removeEventListener('keydown', handleKeyDown);
    }
  }, [selectedImage, handleKeyDown]);

  // ─── Loading ───────────────────────────────────────────────────────────────
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-white to-slate-100" style={{ fontFamily: "'Tenor Sans', sans-serif" }}>
        <div className="text-center p-8">
          <div className="w-16 h-16 mx-auto mb-4 border-4 border-gray-900 border-t-transparent rounded-full animate-spin" />
          <p className="text-gray-600">Memuat Portfolio...</p>
        </div>
      </div>
    );
  }

  // ─── Error ─────────────────────────────────────────────────────────────────
  if (error || !portfolio) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white" style={{ fontFamily: "'Tenor Sans', sans-serif" }}>
        <div className="text-center p-8 max-w-lg mx-auto">
          <div className="w-20 h-20 mx-auto mb-6 bg-gray-100 rounded-full flex items-center justify-center">
            <svg className="w-10 h-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
          <h3 className="text-xl font-bold text-gray-900 mb-3">Portfolio Tidak Ditemukan</h3>
          <p className="text-gray-500 text-sm">{error}</p>
        </div>
      </div>
    );
  }

  const heroImage = portfolio.hero_image_url || portfolio.items[0]?.url;
  const formattedDate = portfolio.project_date
    ? new Date(portfolio.project_date).toLocaleDateString('id-ID', { year: 'numeric', month: 'long', day: 'numeric' })
    : null;

  return (
    <div className="min-h-screen bg-white" style={{ fontFamily: "'Tenor Sans', sans-serif" }}>

      {/* ─── Hero Section ──────────────────────────────────────────────────────── */}
      <section className="relative min-h-[60vh] sm:min-h-[70vh] flex items-end overflow-hidden bg-gray-900">
        {heroImage ? (
          <img
            src={sanitizeUrl(heroImage)}
            alt={portfolio.title}
            className="absolute inset-0 w-full h-full object-cover opacity-70"
          />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-gray-800 to-gray-900" />
        )}

        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

        {/* Header logo */}
        <div className="absolute top-0 left-0 right-0 flex items-center justify-between px-6 sm:px-10 py-6 z-10">
          {profile?.companyName && (
            <span className="text-white/90 font-semibold text-sm tracking-widest uppercase">
              {profile.companyName}
            </span>
          )}
          {portfolio.category && (
            <span className="text-xs font-semibold px-3 py-1 rounded-full bg-white/20 text-white backdrop-blur-sm border border-white/20">
              {portfolio.category}
            </span>
          )}
        </div>

        {/* Hero content */}
        <div className="relative z-10 w-full px-6 sm:px-10 pb-12 sm:pb-16">
          <div className="max-w-4xl">
            <h1 className="text-3xl sm:text-5xl lg:text-6xl font-bold text-white leading-tight mb-4">
              {portfolio.title}
            </h1>
            <div className="flex flex-wrap gap-4 text-sm text-white/80">
              {formattedDate && (
                <span className="flex items-center gap-1.5">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  {formattedDate}
                </span>
              )}
              {portfolio.location && (
                <span className="flex items-center gap-1.5">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  {portfolio.location}
                </span>
              )}
              {portfolio.items.length > 0 && (
                <span className="flex items-center gap-1.5">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  {portfolio.items.length} foto
                </span>
              )}
            </div>
            {portfolio.description && (
              <p className="mt-4 text-white/70 text-sm sm:text-base max-w-2xl leading-relaxed">
                {portfolio.description}
              </p>
            )}
          </div>
        </div>
      </section>

      {/* ─── Photo Grid ────────────────────────────────────────────────────────── */}
      <main className="py-12 px-6 sm:px-10">
        {portfolio.items.length === 0 ? (
          <div className="text-center py-24 px-6">
            <svg className="w-16 h-16 mx-auto text-gray-200 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <p className="text-gray-400">Belum ada foto di portfolio ini</p>
          </div>
        ) : (
          <div className="flex flex-col gap-4 max-w-4xl mx-auto">
            {portfolio.items.map((item, index) => {
              const src = item.url || item.thumbnailUrl;
              return (
                <div
                  key={item.id}
                  className="cursor-pointer group relative bg-gray-100"
                  onClick={() => openLightbox(item, index)}
                >
                  <img
                    src={sanitizeUrl(src)}
                    alt={item.caption || `Foto ${index + 1}`}
                    loading="lazy"
                    className="w-full h-auto block"
                  />
                  {item.caption && (
                    <div className="absolute bottom-0 left-0 right-0 p-3 bg-gradient-to-t from-black/70 to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
                      <p className="text-white text-xs truncate">{item.caption}</p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}


      </main>

      {/* ─── Lightbox ──────────────────────────────────────────────────────────── */}
      {selectedImage && (
        <div
          className="fixed inset-0 bg-black/97 z-50 flex items-center justify-center p-4"
          style={{ fontFamily: "'Tenor Sans', sans-serif" }}
        >
          {/* Close */}
          <button
            onClick={closeLightbox}
            className="absolute top-5 right-5 z-20 p-3 bg-white/10 rounded-full text-white hover:bg-white/20 transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>

          {/* Counter */}
          <div className="absolute top-5 left-5 text-white/60 text-sm font-medium">
            {currentIndex + 1} / {portfolio.items.length}
          </div>

          {/* Prev */}
          {portfolio.items.length > 1 && (
            <button
              onClick={() => navigate('prev')}
              className="absolute left-5 p-3 bg-white/10 rounded-full text-white hover:bg-white/20 transition-colors text-2xl leading-none"
            >
              ‹
            </button>
          )}

          {/* Image */}
          <img
            src={sanitizeUrl(selectedImage.url)}
            alt={selectedImage.caption || 'Portfolio'}
            className="max-w-full max-h-full object-contain rounded-lg shadow-2xl"
          />

          {/* Next */}
          {portfolio.items.length > 1 && (
            <button
              onClick={() => navigate('next')}
              className="absolute right-5 p-3 bg-white/10 rounded-full text-white hover:bg-white/20 transition-colors text-2xl leading-none"
            >
              ›
            </button>
          )}

          {/* Caption */}
          {selectedImage.caption && (
            <div className="absolute bottom-6 left-6 right-6 text-center">
              <p className="text-white/80 text-sm">{selectedImage.caption}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default PublicPortfolio;
