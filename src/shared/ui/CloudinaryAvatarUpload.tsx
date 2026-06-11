/**
 * CloudinaryAvatarUpload
 *
 * Drop-in replacement untuk AvatarUpload yang menyimpan gambar ke Cloudinary
 * dan mengembalikan URL (bukan base64).
 *
 * Props kompatibel dengan AvatarUpload — tinggal ganti komponen,
 * tidak perlu ubah kode lain.
 *
 * Perbedaan:
 * - `value` = URL Cloudinary (https://res.cloudinary.com/...)
 *           ATAU base64 string (untuk backwards-compat dengan data lama)
 * - `onChange(url)` dipanggil dengan URL Cloudinary setelah upload sukses
 * - `onChange(null)` dipanggil saat foto dihapus
 */

import React from 'react';
import { uploadAvatar } from '@/services/upload';

// ─── Gradient helper ──────────────────────────────────────────────────────────
const gradientStyles: Record<string, string> = {
  client: 'from-pink-500 to-rose-600',
  team:   'from-indigo-500 to-blue-600',
  vendor: 'from-purple-500 to-violet-600',
  general: 'from-slate-400 to-slate-600',
};

function getInitials(name: string): string {
  return name
    .split(' ')
    .map((w) => w[0])
    .filter(Boolean)
    .slice(0, 2)
    .join('')
    .toUpperCase();
}

// ─── AvatarDisplay (sama seperti di AvatarUpload.tsx) ────────────────────────
// Re-export supaya bisa dipakai di tempat yang sudah import dari sini

export interface AvatarDisplayProps {
  /** URL Cloudinary atau base64 string (legacy) */
  avatarBase64?: string | null;
  name: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  variant?: 'client' | 'team' | 'vendor';
}

const sizeStyles: Record<string, string> = {
  xs: 'w-6  h-6  text-[8px]',
  sm: 'w-8  h-8  text-[10px]',
  md: 'w-10 h-10 text-xs',
  lg: 'w-16 h-16 text-xl',
  xl: 'w-28 h-28 text-3xl',
};

export const AvatarDisplay: React.FC<AvatarDisplayProps> = ({
  avatarBase64,
  name,
  size = 'md',
  className = '',
  variant = 'team',
}) => {
  const baseClass = `relative shrink-0 overflow-hidden rounded-2xl ${sizeStyles[size]} ${className}`;

  if (avatarBase64) {
    return (
      <div className={baseClass}>
        <img src={avatarBase64} alt={name} className="w-full h-full object-cover" />
      </div>
    );
  }

  return (
    <div
      className={`${baseClass} bg-gradient-to-br ${gradientStyles[variant ?? 'team']} flex items-center justify-center text-white font-black shadow-sm`}
    >
      {getInitials(name)}
    </div>
  );
};

// ─── CloudinaryAvatarUpload ───────────────────────────────────────────────────

export interface CloudinaryAvatarUploadProps {
  /** URL Cloudinary saat ini (atau base64 legacy) */
  value?: string | null;
  /** Dipanggil dengan URL Cloudinary setelah upload, atau null saat hapus */
  onChange: (url: string | null) => void;
  name: string;
  size?: 'md' | 'lg' | 'xl';
  variant?: 'client' | 'team' | 'vendor';
  disabled?: boolean;
  label?: string;
  /** Context untuk folder Cloudinary: 'client' | 'team' | 'profile' */
  context?: 'client' | 'team' | 'profile';
}

const containerSizeClass: Record<string, string> = {
  md: 'w-16 h-16',
  lg: 'w-20 h-20',
  xl: 'w-28 h-28',
};

export const CloudinaryAvatarUpload: React.FC<CloudinaryAvatarUploadProps> = ({
  value,
  onChange,
  name,
  size = 'xl',
  variant = 'team',
  disabled = false,
  label = 'Foto Profil',
  context = 'general' as any,
}) => {
  const [isLoading, setIsLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const inputRef = React.useRef<HTMLInputElement>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setError('Hanya file gambar yang diperbolehkan.');
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      setError('Ukuran file maksimal 10MB.');
      return;
    }

    setError(null);
    setIsLoading(true);
    try {
      const result = await uploadAvatar(file, context as any);
      onChange(result.url);
    } catch (err: any) {
      console.error('[CloudinaryAvatarUpload] Upload gagal:', err);
      setError(err.message || 'Gagal mengupload gambar.');
    } finally {
      setIsLoading(false);
      if (inputRef.current) inputRef.current.value = '';
    }
  };

  const triggerUpload = () => {
    if (!disabled && !isLoading) inputRef.current?.click();
  };

  const initials = getInitials(name);
  const gradient = gradientStyles[variant ?? 'team'];

  return (
    <div className="flex flex-col items-center gap-3">
      <p className="text-[10px] font-black uppercase tracking-widest text-brand-text-secondary">
        {label}
      </p>

      <div
        className={`relative group ${disabled ? 'cursor-not-allowed opacity-60' : 'cursor-pointer'}`}
        onClick={triggerUpload}
      >
        {/* Avatar */}
        <div
          className={`${containerSizeClass[size]} rounded-3xl overflow-hidden border-2 border-brand-border transition-all ${
            !disabled ? 'group-hover:border-brand-accent/50' : ''
          } ${isLoading ? 'animate-pulse' : ''}`}
        >
          {value ? (
            <img src={value} alt={name} className="w-full h-full object-cover" />
          ) : (
            <div
              className={`w-full h-full bg-gradient-to-br ${gradient} flex items-center justify-center text-white font-black shadow-xl text-3xl`}
            >
              {initials}
            </div>
          )}
        </div>

        {/* Hover overlay */}
        {!disabled && (
          <div className="absolute inset-0 rounded-3xl bg-black/50 opacity-0 group-hover:opacity-100 transition-all flex items-center justify-center">
            {isLoading ? (
              <div className="w-6 h-6 border-2 border-white/40 border-t-white rounded-full animate-spin" />
            ) : (
              <svg className="w-7 h-7 text-white drop-shadow-lg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            )}
          </div>
        )}

        {/* Tombol hapus */}
        {value && !disabled && (
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); onChange(null); }}
            className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center text-sm font-bold hover:bg-red-600 transition-colors shadow-lg z-10 leading-none"
            title="Hapus foto"
          >
            ×
          </button>
        )}
      </div>

      {/* Error */}
      {error && (
        <p className="text-[10px] text-red-500 text-center">{error}</p>
      )}

      {/* Hidden input */}
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="hidden"
        onChange={handleFileChange}
        disabled={disabled || isLoading}
      />

      <p className="text-[10px] text-brand-text-secondary text-center leading-relaxed">
        {isLoading
          ? 'Mengupload...'
          : value
          ? 'Klik untuk ganti foto'
          : 'Klik untuk upload foto'}
        <br />
        <span className="opacity-60">JPG/PNG/WEBP · maks 10MB</span>
      </p>
    </div>
  );
};

export default CloudinaryAvatarUpload;
