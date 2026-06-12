import React, { useState, useEffect, useRef } from 'react';
import { Link, useParams } from 'react-router-dom';
import { LeadSource } from '@/types';
import { REGIONS } from '@/types';
import { getProfile } from '@/services/profile';
import { createPublicLead } from '@/services/leads';
import { Profile } from '@/types';

const SOURCE_OPTIONS = [
  { value: LeadSource.FRIENDS_FAMILY, label: 'Friends/Family' },
  { value: LeadSource.INSTAGRAM, label: 'Instagram' },
  { value: LeadSource.TIKTOK, label: 'TikTok' },
  { value: LeadSource.ADS, label: 'Ads' },
];

const CITY_OPTIONS = [
  ...REGIONS.map((r) => r.label),
  'Lainnya',
];

const PublicLeadsForm: React.FC = () => {
  const { vendorId } = useParams<{ vendorId?: string }>();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [name, setName] = useState('');
  const [city, setCity] = useState('');
  const [cityInput, setCityInput] = useState('');
  const [cityOpen, setCityOpen] = useState(false);
  const cityRef = useRef<HTMLDivElement>(null);
  const [whatsapp, setWhatsapp] = useState('');
  const [source, setSource] = useState<LeadSource>(LeadSource.INSTAGRAM);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    getProfile(vendorId ? Number(vendorId) : undefined)
      .then(setProfile)
      .catch(() => setProfile(null));
  }, [vendorId]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (cityRef.current && !cityRef.current.contains(e.target as Node)) {
        setCityOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const filteredCities = CITY_OPTIONS.filter((c) =>
    c.toLowerCase().includes(cityInput.toLowerCase())
  );

  const handleCityInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCityInput(e.target.value);
    setCity(e.target.value);
    setCityOpen(true);
  };

  const handleCitySelect = (option: string) => {
    setCity(option);
    setCityInput(option);
    setCityOpen(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!name.trim()) {
      setError('Nama pengantin wajib diisi.');
      return;
    }
    if (!city.trim()) {
      setError('Kota wajib diisi.');
      return;
    }
    if (!whatsapp.trim()) {
      setError('No. WhatsApp wajib diisi.');
    setIsSubmitting(true);
    try {
      await createPublicLead(vendorId ? Number(vendorId) : undefined, {
        name: name.trim(),
        city: city.trim(),
        whatsapp: whatsapp.trim(),
        source,
        status: 'Baru',
      });
      setIsSubmitted(true);
    } catch {
      setError('Gagal mengirim formulir. Silakan coba lagi.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSubmitted) {
    return (
      <div className="flex items-center justify-center min-h-screen p-4 bg-public-bg">
        <div className="w-full max-w-lg p-8 md:p-12 text-center bg-public-surface rounded-2xl shadow-xl border border-public-border">
          <div className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-6">
            <svg className="w-10 h-10 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h1 className="text-2xl md:text-3xl font-bold text-public-text-primary">Terima Kasih!</h1>
          <p className="mt-3 text-sm md:text-base text-public-text-secondary">
            Formulir Anda telah kami terima. Tim kami akan menghubungi Anda melalui WhatsApp segera.
          </p>
          {profile?.phone && (
            <a
              href={(() => {
                const phone = profile.phone.replace(/\D/g, '');
                const waMessage = `Halo, saya *${name}* dari *${city}*.

Saya baru saja mengisi formulir calon pengantin di halaman Anda.

📋 *Detail saya:*
• Nama: ${name}
• Kota: ${city}
• No. WhatsApp: ${whatsapp}
• Mengetahui dari: ${source}

Mohon info lebih lanjut. Terima kasih! 🙏`;
                return `https://wa.me/${phone}?text=${encodeURIComponent(waMessage)}`;
              })()}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-6 inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-green-500 text-white font-semibold hover:bg-green-600 transition-all"
            >
              Hubungi Kami via WhatsApp
            </a>
          )}
          <Link to="/" className="mt-4 text-sm text-public-text-secondary hover:underline block">
            Kembali ke Beranda
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center min-h-screen p-4 bg-public-bg">
      <div className="w-full max-w-lg p-6 md:p-8 space-y-6 bg-public-surface rounded-2xl shadow-xl border border-public-border">
        <div className="text-center space-y-2">
          {profile?.logoBase64 && (
            <img
              src={profile.logoBase64}
              alt={profile.companyName || 'Logo'}
              className="h-14 object-contain mx-auto mb-2"
            />
          )}
          <h1 className="text-2xl font-bold text-public-text-primary">
            {profile?.companyName ? `Halo dari ${profile.companyName}` : 'Formulir Calon Pengantin'}
          </h1>
          <p className="text-sm text-public-text-secondary">
            Isi formulir di bawah dan tim kami akan segera menghubungi Anda.
          </p>
        </div>

        {error && (
          <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm">
            {error}
          </div>
        )}

        <form className="space-y-4" onSubmit={handleSubmit}>
          <div>
            <label className="block text-xs font-medium text-public-text-secondary mb-1">
              Nama Pengantin <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              className="w-full px-4 py-3 rounded-xl border border-public-border bg-white text-public-text-primary focus:outline-none focus:ring-2 focus:ring-public-accent/30"
              placeholder="Contoh: Budi & Ani"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>

          <div ref={cityRef} className="relative">
            <label className="block text-xs font-medium text-public-text-secondary mb-1">
              Kota <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <input
                type="text"
                required
                autoComplete="off"
                className="w-full px-4 py-3 pr-10 rounded-xl border border-public-border bg-white text-public-text-primary focus:outline-none focus:ring-2 focus:ring-public-accent/30"
                placeholder="Ketik atau pilih kota..."
                value={cityInput}
                onChange={handleCityInputChange}
                onFocus={() => setCityOpen(true)}
              />
              <button
                type="button"
                tabIndex={-1}
                onClick={() => setCityOpen((o) => !o)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-public-text-secondary hover:text-public-text-primary transition-colors"
              >
                <svg
                  className={`w-4 h-4 transition-transform duration-200 ${cityOpen ? 'rotate-180' : ''}`}
                  fill="none" stroke="currentColor" viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
            </div>

            {cityOpen && filteredCities.length > 0 && (
              <ul className="absolute z-50 mt-1 w-full bg-white border border-public-border rounded-xl shadow-lg max-h-52 overflow-y-auto">
                {filteredCities.map((option) => (
                  <li
                    key={option}
                    onMouseDown={() => handleCitySelect(option)}
                    className={`px-4 py-2.5 text-sm cursor-pointer transition-colors ${
                      city === option
                        ? 'bg-public-accent/10 text-public-text-primary font-medium'
                        : 'text-public-text-secondary hover:bg-gray-50 hover:text-public-text-primary'
                    }`}
                  >
                    {option}
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div>
            <label className="block text-xs font-medium text-public-text-secondary mb-1">
              No. WhatsApp <span className="text-red-500">*</span>
            </label>
            <input
              type="tel"
              required
              className="w-full px-4 py-3 rounded-xl border border-public-border bg-white text-public-text-primary focus:outline-none focus:ring-2 focus:ring-public-accent/30"
              placeholder="08xxxxxxxxxx"
              value={whatsapp}
              onChange={(e) => setWhatsapp(e.target.value)}
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-public-text-secondary mb-2">
              How do you know us? <span className="text-red-500">*</span>
            </label>
            <div className="grid grid-cols-2 gap-2">
              {SOURCE_OPTIONS.map((opt) => (
                <label
                  key={opt.value}
                  className={`flex items-center gap-2 p-3 rounded-xl border cursor-pointer transition-all ${
                    source === opt.value
                      ? 'border-public-accent bg-public-accent/10 text-public-text-primary'
                      : 'border-public-border bg-white text-public-text-secondary hover:border-public-accent/50'
                  }`}
                >
                  <input
                    type="radio"
                    name="source"
                    value={opt.value}
                    checked={source === opt.value}
                    onChange={() => setSource(opt.value)}
                    className="sr-only"
                  />
                  <span className="text-sm font-medium">{opt.label}</span>
                </label>
              ))}
            </div>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-3.5 rounded-xl bg-public-accent text-white font-bold hover:opacity-90 transition-all disabled:opacity-50"
          >
            {isSubmitting ? 'Mengirim...' : 'Kirim Formulir'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default PublicLeadsForm;
