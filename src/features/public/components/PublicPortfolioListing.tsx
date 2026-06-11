import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Portfolio } from '@/types';
import { getPublicPortfolioListing, PortfolioListingData } from '@/services/portfolios';

// ─── Helpers ──────────────────────────────────────────────────────────────────
const CATEGORY_COLORS: Record<string, string> = {
  'Wedding':     'bg-rose-100 text-rose-700',
  'Pre-Wedding': 'bg-pink-100 text-pink-700',
  'Engagement':  'bg-purple-100 text-purple-700',
  'Maternity':   'bg-amber-100 text-amber-700',
  'Event':       'bg-blue-100 text-blue-700',
  'Corporate':   'bg-slate-100 text-slate-700',
};

const getCategoryColor = (cat?: string) =>
  cat ? (CATEGORY_COLORS[cat] || 'bg-gray-100 text-gray-600') : 'bg-gray-100 text-gray-600';

const sanitizeUrl = (url: string): string => {
  if (!url) return '';
  if (url.startsWith('data:image/')) return url;
  try {
    const p = new URL(url);
    return ['http:', 'https:'].includes(p.protocol) ? url : '';
  } catch { return ''; }
};

// ─── Portfolio Card ───────────────────────────────────────────────────────────
const PortfolioCard: React.FC<{ portfolio: Portfolio; onClick: () => void }> = ({ portfolio, onClick }) => {
  const coverUrl = sanitizeUrl(
    portfolio.hero_image_url ||
    portfolio.items[0]?.thumbnailUrl ||
    portfolio.items[0]?.url ||
    ''
  );

  const formattedDate = portfolio.project_date
    ? new Date(portfolio.project_date).toLocaleDateString('id-ID', { year: 'numeric', month: 'long' })
    : null;

  return (
    <article
      onClick={onClick}
      className="group cursor-pointer bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-1 border border-gray-100"
    >
      {/* Cover Image */}
      <div className="relative overflow-hidden bg-gray-100 aspect-[4/3]">
        {coverUrl ? (
          <img
            src={coverUrl}
            alt={portfolio.title}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-200">
            <svg className="w-12 h-12 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
        )}

        {/* Category badge */}
        {portfolio.category && (
          <span className={`absolute top-3 left-3 text-[11px] font-bold px-2.5 py-1 rounded-full ${getCategoryColor(portfolio.category)}`}>
            {portfolio.category}
          </span>
        )}

        {/* Photo count */}
        {portfolio.items.length > 0 && (
          <span className="absolute bottom-3 right-3 text-xs font-medium px-2.5 py-1 rounded-full bg-black/50 text-white backdrop-blur-sm">
            {portfolio.items.length} foto
          </span>
        )}
      </div>

      {/* Content */}
      <div className="p-4">
        <h3 className="font-bold text-gray-900 text-base leading-snug group-hover:text-gray-700 transition-colors line-clamp-2">
          {portfolio.title}
        </h3>

        <div className="flex flex-wrap gap-x-3 gap-y-1 mt-2">
          {portfolio.location && (
            <span className="flex items-center gap-1 text-xs text-gray-400">
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              {portfolio.location}
            </span>
          )}
          {formattedDate && (
            <span className="flex items-center gap-1 text-xs text-gray-400">
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              {formattedDate}
            </span>
          )}
        </div>

        {portfolio.description && (
          <p className="mt-2 text-xs text-gray-400 line-clamp-2 leading-relaxed">
            {portfolio.description}
          </p>
        )}

        {/* View arrow */}
        <div className="mt-3 flex items-center gap-1 text-xs font-semibold text-gray-400 group-hover:text-gray-700 transition-colors">
          Lihat Portfolio
          <svg className="w-3.5 h-3.5 transition-transform group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </div>
      </div>
    </article>
  );
};

// ─── Filter Bar ───────────────────────────────────────────────────────────────
const CATEGORIES = ['Semua', 'Wedding', 'Pre-Wedding', 'Engagement', 'Maternity', 'Event', 'Corporate', 'Lainnya'];

// ─── Main Component ───────────────────────────────────────────────────────────
const PortfolioListingPage: React.FC = () => {
  const { vendorId } = useParams<{ vendorId?: string }>();
  const navigate = useNavigate();

  const [data, setData] = useState<PortfolioListingData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeCategory, setActiveCategory] = useState('Semua');

  useEffect(() => {
    loadData();
  }, [vendorId]); // eslint-disable-line react-hooks/exhaustive-deps

  const loadData = async () => {
    try {
      setIsLoading(true);
      const result = await getPublicPortfolioListing(vendorId ? Number(vendorId) : undefined);
      setData(result);
    } catch {
      setError('Gagal memuat portfolio');
    } finally {
      setIsLoading(false);
    }
  };

  // Derive available categories from actual data
  const availableCategories = React.useMemo(() => {
    if (!data) return ['Semua'];
    const cats = new Set(data.portfolios.map(p => p.category).filter(Boolean) as string[]);
    return ['Semua', ...CATEGORIES.slice(1).filter(c => cats.has(c)), ...Array.from(cats).filter(c => !CATEGORIES.includes(c))];
  }, [data]);

  const filtered = React.useMemo(() => {
    if (!data) return [];
    if (activeCategory === 'Semua') return data.portfolios;
    return data.portfolios.filter(p => p.category === activeCategory);
  }, [data, activeCategory]);

  // ─── Loading ────────────────────────────────────────────────────────────────
  if (isLoading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center" style={{ fontFamily: "'Tenor Sans', sans-serif" }}>
        <div className="text-center">
          <div className="w-12 h-12 border-3 border-gray-200 border-t-gray-800 rounded-full animate-spin mx-auto mb-4" style={{ borderWidth: 3 }} />
          <p className="text-gray-400 text-sm tracking-wider">Memuat portfolio...</p>
        </div>
      </div>
    );
  }

  // ─── Error ──────────────────────────────────────────────────────────────────
  if (error || !data) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center" style={{ fontFamily: "'Tenor Sans', sans-serif" }}>
        <div className="text-center p-8">
          <p className="text-gray-400">{error || 'Portfolio tidak ditemukan'}</p>
        </div>
      </div>
    );
  }

  const { profile, portfolios } = data;
  const companyName = profile?.company_name || profile?.full_name || 'Portfolio';
  const logoUrl = profile?.logo_base64 ? sanitizeUrl(profile.logo_base64) : null;

  return (
    <div className="min-h-screen bg-white" style={{ fontFamily: "'Tenor Sans', sans-serif" }}>

      {/* ─── Sticky Header ───────────────────────────────────────────────────── */}
      <header className="sticky top-0 z-20 bg-white/90 backdrop-blur-md border-b border-gray-100">
        <div className="max-w-6xl mx-auto px-5 sm:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {logoUrl ? (
              <img src={logoUrl} alt={companyName} className="h-8 w-auto object-contain" />
            ) : (
              <span className="font-bold text-gray-900 text-lg tracking-tight">{companyName}</span>
            )}
          </div>
          <a
            href={`${window.location.origin}${window.location.pathname}#/public-leads${vendorId ? `/${vendorId}` : ''}`}
            className="text-xs font-semibold px-4 py-2 rounded-full bg-gray-900 text-white hover:bg-gray-700 transition-colors"
          >
            Booking
          </a>
        </div>
      </header>

      {/* ─── Hero / Profile Section ───────────────────────────────────────────── */}
      <section className="max-w-6xl mx-auto px-5 sm:px-8 pt-16 pb-12 text-center">
        {logoUrl && (
          <div className="w-20 h-20 mx-auto mb-5 rounded-2xl overflow-hidden border border-gray-100 shadow-sm">
            <img src={logoUrl} alt={companyName} className="w-full h-full object-contain" />
          </div>
        )}
        <h1 className="text-4xl sm:text-5xl font-bold text-gray-900 tracking-tight">
          {companyName}
        </h1>
        {profile?.bio && (
          <p className="mt-4 text-gray-500 text-base leading-relaxed max-w-xl mx-auto">
            {profile.bio}
          </p>
        )}
        <div className="flex flex-wrap justify-center gap-4 mt-5">
          {profile?.address && (
            <span className="flex items-center gap-1.5 text-sm text-gray-400">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              {profile.address}
            </span>
          )}
          {profile?.website && (
            <a
              href={profile.website.startsWith('http') ? profile.website : `https://${profile.website}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 text-sm text-gray-400 hover:text-blue-500 transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
              </svg>
              {profile.website.replace(/^https?:\/\//, '')}
            </a>
          )}
        </div>

        {/* Stats */}
        {portfolios.length > 0 && (
          <div className="mt-6 inline-flex items-center gap-1.5 text-sm text-gray-400">
            <span className="font-bold text-gray-900 text-lg">{portfolios.length}</span>
            Portfolio
          </div>
        )}
      </section>

      {/* ─── Category Filter ──────────────────────────────────────────────────── */}
      {availableCategories.length > 1 && (
        <div className="sticky top-16 z-10 bg-white/90 backdrop-blur-md border-b border-gray-100">
          <div className="max-w-6xl mx-auto px-5 sm:px-8">
            <div className="flex gap-2 overflow-x-auto py-3 scrollbar-none">
              {availableCategories.map(cat => (
                <button
                  key={cat}
                  onClick={() => setActiveCategory(cat)}
                  className={`flex-shrink-0 px-4 py-1.5 rounded-full text-sm font-semibold transition-all duration-200 ${
                    activeCategory === cat
                      ? 'bg-gray-900 text-white shadow-sm'
                      : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                  }`}
                >
                  {cat}
                  {cat !== 'Semua' && (
                    <span className="ml-1.5 text-xs opacity-60">
                      {data.portfolios.filter(p => p.category === cat).length}
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ─── Portfolio Grid ───────────────────────────────────────────────────── */}
      <main className="max-w-6xl mx-auto px-5 sm:px-8 py-10">
        {filtered.length === 0 ? (
          <div className="text-center py-20">
            <svg className="w-14 h-14 mx-auto text-gray-200 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <p className="text-gray-400 text-sm">
              {activeCategory === 'Semua' ? 'Belum ada portfolio' : `Belum ada portfolio kategori ${activeCategory}`}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6">
            {filtered.map(portfolio => (
              <PortfolioCard
                key={portfolio.id}
                portfolio={portfolio}
                onClick={() => navigate(`/portfolio/${portfolio.public_id}`)}
              />
            ))}
          </div>
        )}
      </main>

      {/* ─── Testimonial Section ─────────────────────────────────────────────── */}
      {data?.feedbacks && data.feedbacks.length > 0 && (
        <section className="bg-white py-16 border-t border-gray-100">
          <div className="max-w-6xl mx-auto px-5 sm:px-8">
            <div className="text-center mb-10">
              <h2 className="text-2xl font-bold text-gray-900">Kata Mereka</h2>
              <p className="text-gray-500 mt-2 text-sm">Cerita bahagia dari klien yang telah mempercayakan momen mereka pada kami.</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {data.feedbacks.map((testi: any, i: number) => (
                <div key={i} className="bg-gray-50 p-6 rounded-2xl border border-gray-100">
                  <div className="flex text-yellow-400 mb-4">
                    {[...Array(5)].map((_, j) => (
                      <svg key={j} className={`w-4 h-4 ${j < (testi.rating || 5) ? 'fill-current' : 'text-gray-300 fill-current'}`} viewBox="0 0 20 20">
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                      </svg>
                    ))}
                  </div>
                  <p className="text-gray-600 text-sm italic mb-4 leading-relaxed">"{testi.feedback}"</p>
                  <div>
                    <p className="font-bold text-gray-900 text-sm">{testi.client_name || testi.clientName}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ─── Footer CTA ───────────────────────────────────────────────────────── */}
      <footer className="border-t border-gray-100 bg-gray-50 py-14">
        <div className="max-w-2xl mx-auto px-5 text-center space-y-4">
          <h2 className="text-2xl font-bold text-gray-900">Wujudkan Momen Terbaik Anda</h2>
          <p className="text-gray-500 text-sm leading-relaxed">
            Setiap cerita layak diabadikan dengan indah. Hubungi kami untuk mendiskusikan project Anda.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center mt-6">
            <button
              onClick={() => {
                const url = `${window.location.origin}${window.location.pathname}#/public-leads${vendorId ? `/${vendorId}` : ''}`;
                window.open(url, '_blank');
              }}
              className="inline-flex items-center gap-2 px-8 py-3.5 bg-gray-900 text-white font-semibold rounded-full hover:bg-gray-800 transition-colors shadow-md w-full sm:w-auto justify-center"
            >
              Booking Sekarang
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
              </svg>
            </button>
            {profile?.phone && (
              <a
                href={`https://wa.me/${profile.phone.replace(/\D/g, '')}?text=${encodeURIComponent('Halo, saya tertarik dengan layanan fotografi Anda.')}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-8 py-3.5 bg-green-500 text-white font-semibold rounded-full hover:bg-green-600 transition-colors shadow-md w-full sm:w-auto justify-center"
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/>
                  <path d="M12 0C5.373 0 0 5.373 0 12c0 2.123.556 4.116 1.528 5.845L0 24l6.335-1.505A11.945 11.945 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 22c-1.907 0-3.694-.497-5.24-1.368l-.376-.22-3.762.893.946-3.658-.245-.389A9.956 9.956 0 012 12C2 6.477 6.477 2 12 2s10 4.477 10 10-4.477 10-10 10z"/>
                </svg>
                WhatsApp Kami
              </a>
            )}
          </div>
          {companyName && (
            <p className="text-xs text-gray-300 pt-8">© {new Date().getFullYear()} {companyName}</p>
          )}
        </div>
      </footer>
    </div>
  );
};

export default PortfolioListingPage;
