import React, { useState, useEffect, useCallback } from 'react';
import { useParams } from 'react-router-dom';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

interface MoodboardData {
    id: number;
    projectName: string;
    clientName: string;
    driveLink: string;
}

// Sanitize URLs to prevent XSS
const sanitizeUrl = (url: string): string => {
    if (!url) return '';
    if (url.startsWith('data:image/')) return url;
    try {
        const parsed = new URL(url);
        if (!['http:', 'https:'].includes(parsed.protocol)) return '';
        return url;
    } catch {
        return '';
    }
};

const parseMoodboardUrls = (raw: string): string[] => {
    if (!raw) return [];
    try {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) return parsed.filter(Boolean);
    } catch { /* single URL */ }
    return [raw];
};

const PublicMoodboard: React.FC = () => {
    const { projectId } = useParams<{ projectId: string }>();

    const [data, setData] = useState<MoodboardData | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

    useEffect(() => {
        if (!projectId) { setIsLoading(false); setError('Link tidak valid'); return; }
        fetch(`${API_URL}/public/moodboard/${projectId}`)
            .then(res => res.ok ? res.json() : res.json().then(e => Promise.reject(e.error || 'Gagal memuat')))
            .then(setData)
            .catch(err => setError(typeof err === 'string' ? err : 'Moodboard tidak ditemukan'))
            .finally(() => setIsLoading(false));
    }, [projectId]);

    const urls = data ? parseMoodboardUrls(data.driveLink) : [];

    // Keyboard navigation
    const handleKeyDown = useCallback((e: KeyboardEvent) => {
        if (lightboxIndex === null) return;
        if (e.key === 'Escape') setLightboxIndex(null);
        if (e.key === 'ArrowRight') setLightboxIndex(i => i !== null ? (i + 1) % urls.length : 0);
        if (e.key === 'ArrowLeft') setLightboxIndex(i => i !== null ? (i - 1 + urls.length) % urls.length : 0);
    }, [lightboxIndex, urls.length]);

    useEffect(() => {
        document.addEventListener('keydown', handleKeyDown);
        return () => document.removeEventListener('keydown', handleKeyDown);
    }, [handleKeyDown]);

    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-black" style={{ fontFamily: "'Tenor Sans', sans-serif" }}>
                <div className="text-center p-8">
                    <div className="w-16 h-16 mx-auto mb-4 border-4 border-white/30 border-t-white rounded-full animate-spin" />
                    <p className="text-white/60 text-sm">Memuat moodboard...</p>
                </div>
            </div>
        );
    }

    if (error || !data) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-black" style={{ fontFamily: "'Tenor Sans', sans-serif" }}>
                <div className="text-center p-8 max-w-lg mx-auto">
                    <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-white/5 border border-white/10 flex items-center justify-center">
                        <svg className="w-10 h-10 text-white/30" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                    </div>
                    <h3 className="text-xl font-bold text-white mb-3">Moodboard Tidak Ditemukan</h3>
                    <p className="text-white/50 text-sm">{error}</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-black" style={{ fontFamily: "'Tenor Sans', sans-serif" }}>
            {/* Header */}
            <header className="bg-white">
                <div className="max-w-7xl mx-auto px-4 py-8 text-center">
                    <p className="text-xs font-semibold uppercase tracking-widest text-gray-400 mb-2">Brief / Moodboard</p>
                    <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">{data.projectName}</h1>
                    {data.clientName && (
                        <p className="text-sm text-gray-500 mt-1">{data.clientName}</p>
                    )}
                </div>
            </header>

            {/* Gallery */}
            <main className="max-w-7xl mx-auto px-0 py-0">
                {urls.length === 0 ? (
                    <div className="text-center py-24">
                        <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-white/5 border border-white/10 flex items-center justify-center">
                            <svg className="w-10 h-10 text-white/30" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                        </div>
                        <h3 className="text-lg font-bold text-white/70 mb-2">Moodboard Kosong</h3>
                        <p className="text-white/40 text-sm">Belum ada foto di moodboard ini</p>
                    </div>
                ) : (
                    <div className="columns-1 sm:columns-2 lg:columns-3 xl:columns-4 gap-0">
                        {urls.map((url, index) => {
                            const safe = sanitizeUrl(url);
                            return (
                                <div
                                    key={index}
                                    className="break-inside-avoid cursor-pointer group overflow-hidden relative bg-gray-900"
                                    onClick={() => setLightboxIndex(index)}
                                >
                                    {safe ? (
                                        <img
                                            src={safe}
                                            alt={`Moodboard ${index + 1}`}
                                            loading="lazy"
                                            decoding="async"
                                            className="w-full h-auto block group-hover:opacity-90 transition-opacity duration-200"
                                        />
                                    ) : (
                                        <div className="w-full aspect-square bg-gray-800 flex items-center justify-center">
                                            <svg className="w-8 h-8 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                            </svg>
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                )}

                {/* Footer */}
                <div className="px-4 py-12 bg-white text-center">
                    <p className="text-xs text-gray-400 uppercase tracking-widest">Imagenic</p>
                </div>
            </main>

            {/* Lightbox */}
            {lightboxIndex !== null && urls[lightboxIndex] && (
                <div
                    className="fixed inset-0 z-50 bg-black/95 backdrop-blur-sm flex items-center justify-center"
                    onClick={() => setLightboxIndex(null)}
                >
                    {/* Close */}
                    <button
                        type="button"
                        className="absolute top-4 right-4 z-20 w-10 h-10 bg-white/10 backdrop-blur-sm rounded-full flex items-center justify-center text-white hover:bg-white/20 transition"
                        onClick={() => setLightboxIndex(null)}
                        aria-label="Tutup"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>

                    {/* Counter */}
                    <div className="absolute top-4 left-1/2 -translate-x-1/2 z-20 bg-black/50 backdrop-blur-sm text-white text-xs font-bold px-3 py-1.5 rounded-full">
                        {lightboxIndex + 1} / {urls.length}
                    </div>

                    {/* Prev */}
                    {urls.length > 1 && (
                        <button
                            type="button"
                            className="absolute left-3 z-20 w-11 h-11 bg-white/10 backdrop-blur-sm rounded-full flex items-center justify-center text-white hover:bg-white/25 active:scale-95 transition"
                            onClick={(e) => { e.stopPropagation(); setLightboxIndex(i => i !== null ? (i - 1 + urls.length) % urls.length : 0); }}
                            aria-label="Sebelumnya"
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
                            </svg>
                        </button>
                    )}

                    {/* Image */}
                    <div
                        className="relative max-w-5xl max-h-[88vh] w-full px-16 flex items-center justify-center"
                        onClick={e => e.stopPropagation()}
                    >
                        <img
                            key={lightboxIndex}
                            src={sanitizeUrl(urls[lightboxIndex])}
                            alt={`Moodboard ${lightboxIndex + 1}`}
                            className="max-w-full max-h-[86vh] w-auto h-auto object-contain rounded-2xl shadow-2xl"
                        />
                    </div>

                    {/* Thumbnail strip */}
                    {urls.length > 1 && (
                        <div
                            className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20 flex items-center gap-1 bg-black/50 backdrop-blur-sm rounded-xl px-2 py-1.5 max-w-sm overflow-x-auto"
                            onClick={e => e.stopPropagation()}
                        >
                            {urls.map((u, i) => (
                                <button
                                    key={i}
                                    type="button"
                                    onClick={() => setLightboxIndex(i)}
                                    className={`flex-shrink-0 w-8 h-8 rounded-lg overflow-hidden transition border-2 ${
                                        i === lightboxIndex ? 'border-white scale-110' : 'border-transparent opacity-50 hover:opacity-80'
                                    }`}
                                    aria-label={`Foto ${i + 1}`}
                                >
                                    <img src={sanitizeUrl(u)} alt="" className="w-full h-full object-cover" loading="lazy" />
                                </button>
                            ))}
                        </div>
                    )}

                    {/* Next */}
                    {urls.length > 1 && (
                        <button
                            type="button"
                            className="absolute right-3 z-20 w-11 h-11 bg-white/10 backdrop-blur-sm rounded-full flex items-center justify-center text-white hover:bg-white/25 active:scale-95 transition"
                            onClick={(e) => { e.stopPropagation(); setLightboxIndex(i => i !== null ? (i + 1) % urls.length : 0); }}
                            aria-label="Berikutnya"
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
                            </svg>
                        </button>
                    )}
                </div>
            )}
        </div>
    );
};

export default PublicMoodboard;
