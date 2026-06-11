import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
    LayoutIcon, 
    ChevronLeftIcon,
    CalendarIcon,
    MapPinIcon,
    UsersIcon,
    BriefcaseIcon,
    ClockIcon,
    Share2Icon,
    PencilIcon,
    Link2Icon,
    SendIcon,
    StickyNoteIcon,
    ExternalLinkIcon,
    UploadCloudIcon,
    FileIcon,
    XIcon,
    Loader2Icon,
    CheckIcon,
    UserPlusIcon,
    CopyIcon
} from 'lucide-react';
import { useProject, useUpdateProject } from '@/features/projects/api/useProjects';
import { useProfile } from '@/features/settings/api/useProfileQueries';
import { useTeamProjectPayments } from '@/features/team/api/useTeamQueries';
import { useClients } from '@/features/clients/api/useClients';
import ProjectDetailsTab from '@/features/projects/components/ProjectDetailModal/ProjectDetailsTab';
import { getProgressForStatus, formatDateFull, getStatusClass } from '@/features/projects/utils/project.utils';
import { AssignedTeamMember } from '@/features/projects/types/project.types';
import { useProjectActions } from '@/features/projects/hooks/useProjectActions';
import { syncClientStatusFromProjects } from '@/services/clients';
import BriefingModal from '@/features/projects/components/BriefingModal';
import { useTeamMembers } from '@/features/team/api/useTeamQueries';
import { useTransactions, useCards, usePockets } from '@/features/finance/api/useFinanceQueries';
import { useApp } from '@/app/AppContext';
import { upsertAssignmentsForProject } from '@/services/projectTeamAssignments';
import { useQueryClient } from '@tanstack/react-query';
import { formatCurrency } from '@/features/projects/utils/project.utils';

// â”€â”€â”€ Upload helper â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
const AUTH_TOKEN_KEY = 'vena-authToken';

async function uploadDocumentFile(
    file: File,
    context: 'moodboard' | 'bride_file'
): Promise<{ url: string; originalName: string; resourceType: string }> {
    const token = localStorage.getItem(AUTH_TOKEN_KEY);
    const body = new FormData();
    body.append('file', file);
    const res = await fetch(`${API_URL}/upload/document?context=${context}`, {
        method: 'POST',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        body,
    });
    if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || `Upload gagal (${res.status})`);
    }
    return res.json();
}

// â”€â”€â”€ LinkRow: inline upload + edit URL â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
interface LinkRowProps {
    label: string;
    value: string;
    uploadContext: 'moodboard' | 'bride_file';
    acceptTypes?: string;
    onSave: (url: string) => Promise<void>;
}
const LinkRow: React.FC<LinkRowProps> = ({ label, value, uploadContext, acceptTypes = 'image/jpeg,image/png,image/webp', onSave }) => {
    const fileRef = React.useRef<HTMLInputElement>(null);
    const [editing, setEditing] = React.useState(false);
    const [tempVal, setTempVal] = React.useState('');
    const [uploading, setUploading] = React.useState(false);
    const isPdf = (url: string) => url?.toLowerCase().includes('.pdf') || url?.toLowerCase().includes('/raw/upload/');
    const getFileName = (url: string) => url.split('/').pop()?.split('?')[0] || url;

    const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]; if (!file) return;
        setUploading(true);
        try { const r = await uploadDocumentFile(file, uploadContext); await onSave(r.url); }
        catch (err: any) { alert('Gagal upload: ' + err.message); }
        finally { setUploading(false); if (fileRef.current) fileRef.current.value = ''; }
    };
    const handleSave = async () => { await onSave(tempVal); setEditing(false); };

    return (
        <div className="rounded-xl bg-brand-surface border border-brand-border/50 overflow-hidden">
            {/* Header row */}
            <div className="flex items-center justify-between px-3 py-2 gap-2">
                <span className="text-[11px] font-bold text-brand-text-secondary shrink-0">{label}</span>
                <div className="flex items-center gap-1.5 shrink-0">
                    <label className={`flex items-center gap-1 text-[10px] font-bold cursor-pointer transition ${uploading ? 'text-brand-text-secondary cursor-not-allowed' : 'text-brand-accent hover:text-brand-accent/80'}`}>
                        {uploading ? <Loader2Icon className="w-2.5 h-2.5 animate-spin" /> : <UploadCloudIcon className="w-2.5 h-2.5" />}
                        {uploading ? '...' : 'Upload'}
                        <input ref={fileRef} type="file" accept={acceptTypes} className="sr-only" disabled={uploading} onChange={handleUpload} />
                    </label>
                    {!editing && (
                        <button type="button" onClick={() => { setTempVal(value || ''); setEditing(true); }} className="flex items-center gap-1 text-[10px] font-bold text-brand-text-secondary hover:text-brand-accent transition">
                            <PencilIcon className="w-2.5 h-2.5" /> Edit
                        </button>
                    )}
                    {value && !editing && (
                        <button type="button" onClick={() => onSave('')} className="text-[10px] font-bold text-red-400 hover:text-red-500 transition" title="Hapus">
                            <XIcon className="w-2.5 h-2.5" />
                        </button>
                    )}
                </div>
            </div>

            {/* Content */}
            {editing ? (
                <div className="flex items-center gap-1.5 px-3 pb-2">
                    <input
                        type="url" value={tempVal} onChange={e => setTempVal(e.target.value)}
                        placeholder="https://..." autoFocus
                        className="flex-1 px-2 py-1.5 text-[10px] rounded-lg border border-brand-border bg-brand-bg text-brand-text-primary focus:outline-none focus:ring-1 focus:ring-brand-accent/50"
                        onKeyDown={e => { if (e.key === 'Enter') handleSave(); if (e.key === 'Escape') setEditing(false); }}
                    />
                    <button type="button" onClick={handleSave} className="text-[10px] px-2 py-1.5 bg-brand-accent text-white rounded-lg whitespace-nowrap">Simpan</button>
                    <button type="button" onClick={() => setEditing(false)} className="text-[10px] px-2 py-1.5 bg-brand-bg border border-brand-border text-brand-text-secondary rounded-lg whitespace-nowrap">Batal</button>
                </div>
            ) : value ? (
                <a
                    href={value}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 mx-3 mb-2.5 px-2.5 py-2 rounded-lg bg-brand-bg border border-brand-border/60 hover:border-brand-accent/30 hover:bg-brand-accent/5 transition group"
                >
                    <div className={`w-6 h-6 rounded-md flex items-center justify-center flex-shrink-0 ${isPdf(value) ? 'bg-red-500/10 border border-red-400/20' : 'bg-blue-500/10 border border-blue-400/20'}`}>
                        {isPdf(value)
                            ? <FileIcon className="w-3 h-3 text-red-400" />
                            : <ExternalLinkIcon className="w-3 h-3 text-blue-400" />
                        }
                    </div>
                    <span className="text-[10px] font-medium text-blue-400 group-hover:underline truncate flex-1">
                        {getFileName(value)}
                    </span>
                    <ExternalLinkIcon className="w-3 h-3 text-brand-text-secondary/40 flex-shrink-0" />
                </a>
            ) : (
                <p className="text-[10px] text-brand-text-secondary/50 italic px-3 pb-2.5">Belum ada</p>
            )}
        </div>
    );
};


// --- Helper: parse driveLink (bisa string tunggal atau JSON array) ---
function parseMoodboardUrls(raw: string): string[] {
    if (!raw) return [];
    try {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) return parsed.filter(Boolean);
    } catch { /* bukan JSON */ }
    return [raw];
}
function serializeMoodboardUrls(urls: string[]): string {
    if (urls.length === 0) return "";
    if (urls.length === 1) return urls[0];
    return JSON.stringify(urls);
}

// --- MoodboardField: multi-upload gambar dengan preview masonry + lightbox ---
interface MoodboardFieldProps {
    value: string;
    projectId: number;
    onSave: (value: string) => Promise<void>;
}
const MoodboardField: React.FC<MoodboardFieldProps> = ({ value, projectId, onSave }) => {
    const [uploadModalOpen, setUploadModalOpen] = React.useState(false);
    const [selectedFiles, setSelectedFiles] = React.useState<File[]>([]);
    const [uploading, setUploading] = React.useState(false);
    const [uploadProgress, setUploadProgress] = React.useState(0);
    const [lightboxIndex, setLightboxIndex] = React.useState<number | null>(null);
    const [copied, setCopied] = React.useState(false);
    const [dragOver, setDragOver] = React.useState(false);
    const urls = parseMoodboardUrls(value);

    const publicLink = `${window.location.origin}${window.location.pathname}#/moodboard/${projectId}`;

    const handleCopyLink = () => {
        navigator.clipboard.writeText(publicLink).then(() => {
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        });
    };

    // Keyboard nav for lightbox
    React.useEffect(() => {
        if (lightboxIndex === null) return;
        const handler = (e: KeyboardEvent) => {
            if (e.key === 'Escape') setLightboxIndex(null);
            if (e.key === 'ArrowRight') setLightboxIndex(i => i !== null ? (i + 1) % urls.length : null);
            if (e.key === 'ArrowLeft') setLightboxIndex(i => i !== null ? (i - 1 + urls.length) % urls.length : null);
        };
        window.addEventListener('keydown', handler);
        return () => window.removeEventListener('keydown', handler);
    }, [lightboxIndex, urls.length]);

    const addFiles = (files: File[]) => {
        const valid = files.filter(f =>
            ['image/jpeg', 'image/png', 'image/webp'].includes(f.type) && f.size <= 10 * 1024 * 1024
        );
        setSelectedFiles(prev => [...prev, ...valid]);
    };

    const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
        addFiles(Array.from(e.target.files || []));
        e.target.value = '';
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        setDragOver(false);
        addFiles(Array.from(e.dataTransfer.files));
    };

    const removeSelectedFile = (idx: number) => {
        setSelectedFiles(prev => prev.filter((_, i) => i !== idx));
    };

    const handleUpload = async () => {
        if (!selectedFiles.length) return;
        setUploading(true);
        setUploadProgress(0);
        try {
            const done: string[] = [];
            for (let i = 0; i < selectedFiles.length; i++) {
                const r = await uploadDocumentFile(selectedFiles[i], 'moodboard');
                done.push(r.url);
                setUploadProgress(Math.round(((i + 1) / selectedFiles.length) * 100));
            }
            const newUrls = [...urls, ...done];
            await onSave(serializeMoodboardUrls(newUrls));
            setSelectedFiles([]);
            setUploadModalOpen(false);
        } catch (err: any) {
            alert('Gagal upload: ' + err.message);
        } finally {
            setUploading(false);
            setUploadProgress(0);
        }
    };

    const handleRemove = async (idx: number) => {
        const newUrls = urls.filter((_, i) => i !== idx);
        await onSave(serializeMoodboardUrls(newUrls));
    };

    const closeModal = () => {
        if (uploading) return;
        setUploadModalOpen(false);
        setSelectedFiles([]);
        setUploadProgress(0);
    };

    return (
        <>
        <div className="rounded-2xl bg-brand-surface border border-brand-border/50 overflow-hidden">
            {/* Header bar */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-brand-border/40">
                <div className="flex items-center gap-2">
                    <span className="text-xs font-black text-brand-text-light uppercase tracking-widest">Brief / Moodboard</span>
                    {urls.length > 0 && (
                        <span className="text-[10px] font-bold text-brand-text-secondary bg-brand-bg px-2 py-0.5 rounded-full border border-brand-border/50">
                            {urls.length} foto
                        </span>
                    )}
                </div>
                <div className="flex items-center gap-2">
                    {/* Share public link — only show when there are images */}
                    {urls.length > 0 && (
                        <button
                            type="button"
                            onClick={handleCopyLink}
                            className={`flex items-center gap-1.5 text-[10px] font-bold px-3 py-1.5 rounded-xl border transition-all active:scale-95 ${
                                copied
                                    ? 'bg-green-500/10 border-green-500/30 text-green-500'
                                    : 'bg-brand-bg border-brand-border text-brand-text-secondary hover:text-brand-accent hover:border-brand-accent/40'
                            }`}
                            title="Salin link publik moodboard"
                        >
                            {copied
                                ? <><CheckIcon className="w-3 h-3" /> Tersalin!</>
                                : <><CopyIcon className="w-3 h-3" /> Link Publik</>
                            }
                        </button>
                    )}
                    <button
                        type="button"
                        onClick={() => setUploadModalOpen(true)}
                        className="flex items-center gap-1.5 text-[10px] font-bold px-3 py-1.5 rounded-xl border transition-all active:scale-95 bg-brand-accent text-white border-transparent hover:bg-brand-accent/90 shadow-sm shadow-brand-accent/20"
                    >
                        <UploadCloudIcon className="w-3 h-3" /> Upload Foto
                    </button>
                </div>
            </div>

            {/* Masonry grid — CSS columns, gap via mb-2 on each item */}
            {urls.length > 0 ? (
                <div className="p-3">
                    <div className="columns-2 sm:columns-3 lg:columns-4 gap-2">
                        {urls.map((url, i) => (
                            <div
                                key={url + i}
                                className="break-inside-avoid mb-2 relative group cursor-pointer overflow-hidden rounded-xl bg-brand-bg border border-brand-border/40 hover:border-brand-accent/40 transition-all"
                                onClick={() => setLightboxIndex(i)}
                            >
                                {/* Loading skeleton shown while image is loading */}
                                <div className="relative">
                                    <img
                                        src={url}
                                        alt={`moodboard ${i + 1}`}
                                        loading="lazy"
                                        decoding="async"
                                        className="w-full h-auto block group-hover:scale-[1.02] transition-transform duration-300"
                                    />
                                </div>
                                {/* Hover overlay */}
                                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/25 transition-all duration-200 flex items-center justify-center">
                                    <div className="opacity-0 group-hover:opacity-100 transition-all duration-200 flex gap-2">
                                        <button
                                            type="button"
                                            onClick={(e) => { e.stopPropagation(); setLightboxIndex(i); }}
                                            className="w-8 h-8 bg-white/90 backdrop-blur-sm rounded-full flex items-center justify-center shadow-lg hover:bg-white transition"
                                            title="Lihat"
                                        >
                                            <ExternalLinkIcon className="w-3.5 h-3.5 text-gray-700" />
                                        </button>
                                        <button
                                            type="button"
                                            onClick={(e) => { e.stopPropagation(); handleRemove(i); }}
                                            className="w-8 h-8 bg-red-500/90 backdrop-blur-sm rounded-full flex items-center justify-center shadow-lg hover:bg-red-500 transition"
                                            title="Hapus"
                                        >
                                            <XIcon className="w-3.5 h-3.5 text-white" />
                                        </button>
                                    </div>
                                </div>
                                {/* Nomor badge */}
                                <span className="absolute top-2 left-2 text-[9px] font-black bg-black/50 backdrop-blur-sm text-white px-1.5 py-0.5 rounded-full pointer-events-none">
                                    {i + 1}
                                </span>
                            </div>
                        ))}
                        {/* Inline "Tambah foto" tile */}
                        <button
                            type="button"
                            onClick={() => setUploadModalOpen(true)}
                            className="break-inside-avoid mb-2 aspect-[4/3] rounded-xl border-2 border-dashed border-brand-border/50 hover:border-brand-accent/60 hover:bg-brand-accent/5 flex flex-col items-center justify-center cursor-pointer transition-all group w-full"
                        >
                            <UploadCloudIcon className="w-6 h-6 text-brand-text-secondary/50 group-hover:text-brand-accent transition mb-1" />
                            <span className="text-[9px] font-bold text-brand-text-secondary/50 group-hover:text-brand-accent transition">Tambah foto</span>
                        </button>
                    </div>
                </div>
            ) : (
                /* Empty state — klik buka modal */
                <button
                    type="button"
                    onClick={() => setUploadModalOpen(true)}
                    className="w-full flex flex-col items-center justify-center py-12 px-4 text-center hover:bg-brand-bg/50 transition-colors group"
                >
                    <div className="w-14 h-14 rounded-2xl bg-brand-bg border border-brand-border/40 group-hover:border-brand-accent/40 flex items-center justify-center mb-3 transition-colors">
                        <UploadCloudIcon className="w-6 h-6 text-brand-text-secondary/50 group-hover:text-brand-accent transition-colors" />
                    </div>
                    <p className="text-sm font-bold text-brand-text-secondary group-hover:text-brand-text-primary transition-colors">Belum ada foto moodboard</p>
                    <p className="text-[10px] text-brand-text-secondary/60 mt-1">Klik untuk upload referensi gaya, warna, atau pose</p>
                    <p className="text-[9px] text-brand-text-secondary/40 mt-0.5">JPG, PNG, WebP · bisa pilih banyak sekaligus</p>
                </button>
            )}

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
                    >
                        <XIcon className="w-5 h-5" />
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

                    {/* Main image */}
                    <div
                        className="relative max-w-5xl max-h-[80vh] w-full px-16 flex items-center justify-center"
                        onClick={e => e.stopPropagation()}
                    >
                        <img
                            key={lightboxIndex}
                            src={urls[lightboxIndex]}
                            alt={`moodboard ${lightboxIndex + 1}`}
                            className="max-w-full max-h-[78vh] w-auto h-auto object-contain rounded-2xl shadow-2xl"
                        />
                    </div>

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

                    {/* Bottom action bar */}
                    <div
                        className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20 flex items-center gap-2"
                        onClick={e => e.stopPropagation()}
                    >
                        {/* Thumbnail strip */}
                        {urls.length > 1 && (
                            <div className="flex items-center gap-1 bg-black/50 backdrop-blur-sm rounded-xl px-2 py-1.5 max-w-xs overflow-x-auto">
                                {urls.map((u, i) => (
                                    <button
                                        key={i}
                                        type="button"
                                        onClick={() => setLightboxIndex(i)}
                                        className={`flex-shrink-0 w-8 h-8 rounded-lg overflow-hidden transition border-2 ${
                                            i === lightboxIndex
                                                ? 'border-white scale-110'
                                                : 'border-transparent opacity-50 hover:opacity-80'
                                        }`}
                                    >
                                        <img src={u} alt="" className="w-full h-full object-cover" loading="lazy" />
                                    </button>
                                ))}
                            </div>
                        )}
                        {/* Action buttons */}
                        <div className="flex gap-2">
                            <a
                                href={urls[lightboxIndex]}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-1 text-[11px] font-medium bg-black/60 backdrop-blur-sm text-white px-3 py-1.5 rounded-lg hover:bg-black/80 transition"
                                onClick={e => e.stopPropagation()}
                            >
                                <ExternalLinkIcon className="w-3 h-3" /> Buka penuh
                            </a>
                            <button
                                type="button"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    handleRemove(lightboxIndex);
                                    // If last item, close; otherwise stay at same index (now pointing to next)
                                    if (urls.length <= 1) {
                                        setLightboxIndex(null);
                                    } else {
                                        setLightboxIndex(i => i !== null ? Math.min(i, urls.length - 2) : null);
                                    }
                                }}
                                className="flex items-center gap-1 text-[11px] font-medium bg-red-500/80 backdrop-blur-sm text-white px-3 py-1.5 rounded-lg hover:bg-red-500 transition"
                            >
                                <XIcon className="w-3 h-3" /> Hapus
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>

        {/* Upload Modal */}
        {uploadModalOpen && (
            <div className="fixed inset-0 z-[60] flex items-center justify-center p-4" onClick={closeModal}>
                <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
                <div
                    className="relative w-full max-w-lg bg-brand-surface rounded-2xl shadow-2xl border border-brand-border/50 flex flex-col"
                    style={{ maxHeight: 'min(90vh, 600px)' }}
                    onClick={e => e.stopPropagation()}
                >
                    {/* Header */}
                    <div className="flex items-center justify-between px-6 py-4 border-b border-brand-border/40 flex-shrink-0">
                        <div>
                            <h3 className="text-sm font-bold text-brand-text-light">Upload ke Moodboard</h3>
                            <p className="text-[11px] text-brand-text-secondary mt-0.5">JPG, PNG, WebP · maks. 10MB per file</p>
                        </div>
                        <button
                            type="button"
                            onClick={closeModal}
                            disabled={uploading}
                            className="w-8 h-8 rounded-full flex items-center justify-center text-brand-text-secondary hover:text-brand-text-primary hover:bg-brand-bg transition disabled:opacity-40"
                        >
                            <XIcon className="w-4 h-4" />
                        </button>
                    </div>

                    {/* Scrollable body */}
                    <div className="flex-1 overflow-y-auto p-6 space-y-4 min-h-0">
                        {/* Dropzone */}
                        <div
                            onDragOver={e => { e.preventDefault(); setDragOver(true); }}
                            onDragLeave={() => setDragOver(false)}
                            onDrop={handleDrop}
                            className={`rounded-2xl border-2 border-dashed py-10 px-6 text-center transition-all cursor-pointer ${
                                dragOver
                                    ? 'border-brand-accent bg-brand-accent/5 scale-[1.01]'
                                    : 'border-brand-border bg-brand-bg/50 hover:border-brand-accent/60 hover:bg-brand-bg'
                            }`}
                        >
                            <input
                                type="file"
                                multiple
                                accept="image/jpeg,image/png,image/webp"
                                onChange={handleFileInput}
                                className="hidden"
                                id="moodboard-file-upload"
                                disabled={uploading}
                            />
                            <label htmlFor="moodboard-file-upload" className="cursor-pointer flex flex-col items-center gap-4">
                                <div className="w-16 h-16 rounded-2xl bg-brand-surface border border-brand-border/50 flex items-center justify-center shadow-sm">
                                    <UploadCloudIcon className="w-8 h-8 text-brand-accent" />
                                </div>
                                <div className="space-y-1">
                                    <p className="text-sm font-semibold text-brand-text-light">Klik untuk memilih gambar</p>
                                    <p className="text-xs text-brand-text-secondary">Atau drag & drop ke area ini</p>
                                    <p className="text-[11px] text-brand-text-secondary/50">Maksimal 10MB per file · Format: JPG, PNG, WebP</p>
                                </div>
                            </label>
                        </div>

                        {/* Selected files */}
                        {selectedFiles.length > 0 && (
                            <div className="rounded-xl border border-brand-border/50 overflow-hidden">
                                <div className="flex items-center justify-between px-4 py-2.5 bg-brand-bg border-b border-brand-border/30">
                                    <div className="flex items-center gap-2">
                                        <span className="w-5 h-5 rounded-full bg-brand-accent/15 text-brand-accent text-[10px] font-bold flex items-center justify-center">{selectedFiles.length}</span>
                                        <span className="text-xs font-semibold text-brand-text-light">File siap upload</span>
                                    </div>
                                    {!uploading && (
                                        <button type="button" onClick={() => setSelectedFiles([])} className="text-[11px] text-red-400 hover:text-red-500 font-medium transition">
                                            Hapus semua
                                        </button>
                                    )}
                                </div>
                                <div className="max-h-44 overflow-y-auto divide-y divide-brand-border/20 bg-brand-surface">
                                    {selectedFiles.map((file, idx) => (
                                        <div key={idx} className="flex items-center gap-3 px-4 py-2.5">
                                            <div className="w-9 h-9 rounded-lg overflow-hidden bg-brand-bg border border-brand-border/40 flex-shrink-0">
                                                <img src={URL.createObjectURL(file)} alt="" className="w-full h-full object-cover" />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-[11px] font-medium text-brand-text-primary truncate">{file.name}</p>
                                                <p className="text-[10px] text-brand-text-secondary">{(file.size / 1024 / 1024).toFixed(1)} MB</p>
                                            </div>
                                            {!uploading && (
                                                <button type="button" onClick={() => removeSelectedFile(idx)} className="flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-brand-text-secondary hover:text-red-400 hover:bg-red-400/10 transition">
                                                    <XIcon className="w-3.5 h-3.5" />
                                                </button>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Progress */}
                        {uploading && (
                            <div className="rounded-xl bg-brand-bg border border-brand-border/50 p-4">
                                <div className="flex items-center justify-between text-xs mb-3">
                                    <span className="text-brand-text-secondary flex items-center gap-2">
                                        <Loader2Icon className="w-3.5 h-3.5 animate-spin text-brand-accent" />
                                        Mengupload...
                                    </span>
                                    <span className="font-bold text-brand-accent">{uploadProgress}%</span>
                                </div>
                                <div className="w-full bg-brand-border/20 rounded-full h-2 overflow-hidden">
                                    <div
                                        className="bg-brand-accent h-full rounded-full transition-all duration-300"
                                        style={{ width: `${uploadProgress}%` }}
                                    />
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Footer — always visible */}
                    <div className="flex gap-3 px-6 py-4 border-t border-brand-border/40 bg-brand-surface flex-shrink-0">
                        <button
                            type="button"
                            onClick={closeModal}
                            disabled={uploading}
                            className="flex-1 py-2.5 text-sm font-semibold rounded-xl border border-brand-border text-brand-text-secondary hover:text-brand-text-primary hover:bg-brand-bg transition disabled:opacity-40"
                        >
                            Batal
                        </button>
                        <button
                            type="button"
                            onClick={handleUpload}
                            disabled={selectedFiles.length === 0 || uploading}
                            className="flex-1 py-2.5 text-sm font-semibold rounded-xl bg-brand-accent text-white hover:bg-brand-accent/90 transition disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                        >
                            {uploading
                                ? <><Loader2Icon className="w-4 h-4 animate-spin" /> Mengupload...</>
                                : <>Upload{selectedFiles.length > 0 && <span className="bg-white/20 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">{selectedFiles.length}</span>}</>
                            }
                        </button>
                    </div>
                </div>
            </div>
        )}
        </>
    );
};
// â”€â”€â”€ InlineTeamSection: assign/unassign tim & vendor tanpa buka form edit â”€â”€â”€â”€â”€
interface InlineTeamSectionProps {
    projectId: number;
    currentTeam: AssignedTeamMember[];
    allMembers: any[];
    onSaved: () => void;
}
const InlineTeamSection: React.FC<InlineTeamSectionProps> = ({ projectId, currentTeam, allMembers, onSaved }) => {
    const [team, setTeam] = React.useState<AssignedTeamMember[]>(currentTeam);
    const [saving, setSaving] = React.useState(false);
    const [dirty, setDirty] = React.useState(false);
    React.useEffect(() => { setTeam(currentTeam); setDirty(false); }, [currentTeam]);

    const isAssigned = (memberId: number) => team.some(t => t.memberId === memberId);
    const toggle = (member: any) => {
        setDirty(true);
        if (isAssigned(member.id)) {
            setTeam(prev => prev.filter(t => t.memberId !== member.id));
        } else {
            setTeam(prev => [...prev, { memberId: member.id, name: member.name, role: member.role, category: member.category || 'Tim', fee: member.standardFee || 0, subJob: '' }]);
        }
    };
    const updateFee = (memberId: number, fee: number) => { setDirty(true); setTeam(prev => prev.map(t => t.memberId === memberId ? { ...t, fee } : t)); };
    const updateSubJob = (memberId: number, subJob: string) => { setDirty(true); setTeam(prev => prev.map(t => t.memberId === memberId ? { ...t, subJob } : t)); };
    const handleSave = async () => {
        setSaving(true);
        try { await upsertAssignmentsForProject(projectId, team); setDirty(false); onSaved(); }
        catch (err: any) { alert('Gagal simpan tim: ' + err.message); }
        finally { setSaving(false); }
    };
    const membersByCategory = React.useMemo(() => {
        const result: Record<string, Record<string, any[]>> = { 'Tim': {}, 'Vendor': {} };
        allMembers.forEach(m => {
            const cat = m.category || 'Tim';
            if (!result[cat]) result[cat] = {};
            if (!result[cat][m.role]) result[cat][m.role] = [];
            result[cat][m.role].push(m);
        });
        return result;
    }, [allMembers]);

    return (
        <div className="space-y-4">
            {dirty && (
                <div className="sticky top-20 z-10 flex items-center justify-between bg-brand-accent/10 border border-brand-accent/30 rounded-2xl px-4 py-2.5">
                    <span className="text-xs font-bold text-brand-accent">Ada perubahan yang belum disimpan</span>
                    <button onClick={handleSave} disabled={saving} className="flex items-center gap-1.5 px-4 py-1.5 bg-brand-accent text-white rounded-xl text-xs font-bold hover:bg-brand-accent/90 transition active:scale-95 disabled:opacity-60">
                        {saving ? <Loader2Icon className="w-3.5 h-3.5 animate-spin" /> : <CheckIcon className="w-3.5 h-3.5" />}
                        {saving ? 'Menyimpan…' : 'Simpan Tim'}
                    </button>
                </div>
            )}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {(['Tim', 'Vendor'] as const).map(category => (
                    <div key={category} className="space-y-3">
                        <h5 className={`font-bold uppercase tracking-widest text-xs pb-2 border-b-2 flex items-center gap-2 ${category === 'Tim' ? 'text-blue-400 border-blue-400/20' : 'text-purple-400 border-purple-400/20'}`}>
                            <div className={`w-2 h-2 rounded-full ${category === 'Tim' ? 'bg-blue-400' : 'bg-purple-400'}`} />
                            {category === 'Tim' ? 'Tim Internal' : 'Vendor'}
                            <span className="ml-auto text-[10px] font-semibold opacity-60 normal-case tracking-normal">{team.filter(t => t.category === category).length} dipilih</span>
                        </h5>
                        {Object.keys(membersByCategory[category] || {}).length === 0
                            ? <p className="text-xs text-brand-text-secondary italic text-center py-4">Belum ada anggota {category === 'Tim' ? 'tim' : 'vendor'}.</p>
                            : Object.entries(membersByCategory[category]).map(([role, members]) => (
                                <div key={role} className="space-y-2">
                                    <h6 className="text-[10px] uppercase text-brand-text-secondary font-bold ml-1">{role}</h6>
                                    {(members as any[]).map(member => {
                                        const assigned = team.find(t => t.memberId === member.id);
                                        const selected = !!assigned;
                                        return (
                                            <div key={member.id} className={`rounded-xl border transition-all ${selected ? 'border-brand-accent bg-brand-accent/5' : 'border-brand-border bg-brand-bg hover:border-brand-border/80'}`}>
                                                <label className="flex items-center gap-3 p-3 cursor-pointer">
                                                    <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center flex-shrink-0 transition-all ${selected ? 'bg-brand-accent border-brand-accent' : 'border-brand-border'}`}>
                                                        {selected && <CheckIcon className="w-3 h-3 text-white" />}
                                                    </div>
                                                    <input type="checkbox" checked={selected} onChange={() => toggle(member)} className="hidden" />
                                                    <div className="flex-1 min-w-0">
                                                        <p className={`text-sm font-semibold truncate ${selected ? 'text-brand-text-light' : 'text-brand-text-secondary'}`}>{member.name}</p>
                                                        <p className="text-[10px] text-brand-text-secondary">Standar: {formatCurrency(member.standardFee || 0)}</p>
                                                    </div>
                                                </label>
                                                {selected && (
                                                    <div className="px-3 pb-3 pt-1 border-t border-brand-border/30 space-y-2">
                                                        <div>
                                                            <label className="block text-[10px] uppercase font-bold text-brand-text-secondary mb-1">Fee untuk acara ini</label>
                                                            <input type="number" value={assigned!.fee || 0} onChange={e => updateFee(member.id, Number(e.target.value))} className="w-full px-3 py-1.5 rounded-lg border border-brand-border bg-brand-surface text-brand-text-primary text-xs text-right font-mono focus:outline-none focus:ring-1 focus:ring-brand-accent/50" placeholder="0" />
                                                        </div>
                                                        <div>
                                                            <label className="block text-[10px] uppercase font-bold text-brand-text-secondary mb-1">Tugas spesifik</label>
                                                            <input type="text" value={assigned!.subJob || ''} onChange={e => updateSubJob(member.id, e.target.value)} className="w-full px-3 py-1.5 rounded-lg border border-brand-border bg-brand-surface text-brand-text-primary text-xs focus:outline-none focus:ring-1 focus:ring-brand-accent/50" placeholder="Cth: Leader, Drone Operator, dll" />
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                            ))
                        }
                    </div>
                ))}
            </div>
        </div>
    );
};

const ProjectDetailPage: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const queryClient = useQueryClient();

    const { data: project, isLoading: isProjectLoading } = useProject(id ? Number(id) : undefined);
    const { data: profile } = useProfile();

    const { data: teamProjectPayments = [] } = useTeamProjectPayments();
    const { data: clientsData } = useClients({ limit: 500 });
    const { data: teamMembers = [] } = useTeamMembers();
    const { data: transactions = [] } = useTransactions();
    const { data: cards = [] } = useCards();
    const { data: pockets = [] } = usePockets();

    const updateProjectMutation = useUpdateProject();
    const clients = clientsData || [];

    const { showNotification } = useApp();
    const projectActions = useProjectActions({
        projects: project ? [project] : [],
        clients,
        teamMembers,
        teamProjectPayments,
        setTeamProjectPayments: () => {},
        transactions,
        cards,
        pockets,
        profile: profile || {} as any,
        showNotification
    });

    const [isEditingFinalLink, setIsEditingFinalLink] = React.useState(false);
    const [tempFinalLink, setTempFinalLink] = React.useState('');

    const teamByCategory = React.useMemo(() => {
        if (!project) return { 'Tim': {}, 'Vendor': {} };
        const categories: Record<string, Record<string, AssignedTeamMember[]>> = { 'Tim': {}, 'Vendor': {} };
        (project.team || []).forEach(m => {
            const cat = ('category' in m ? (m as any).category : 'Tim') || 'Tim';
            if (!categories[cat]) categories[cat] = {};
            if (!categories[cat][m.role]) categories[cat][m.role] = [];
            categories[cat][m.role].push(m);
        });
        return categories;
    }, [project]);

    if (isProjectLoading || !project || !profile) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-brand-bg">
                <div className="flex flex-col items-center gap-4">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-accent"></div>
                    <p className="text-brand-text-secondary text-sm font-medium animate-pulse">Memuat Detail Acara Pernikahan...</p>
                </div>
            </div>
        );
    }

    const handleStatusUpdate = async (newStatus: string) => {
        try {
            const nextProgress = getProgressForStatus(newStatus, profile.projectStatusConfig);
            await updateProjectMutation.mutateAsync({
                id: project.id,
                status: newStatus,
                progress: nextProgress,
                activeSubStatuses: []
            });
            
            // Sync client status after project status update
            try {
                console.log(`ðŸ”„ Syncing client status for client ID: ${project.clientId}`);
                await syncClientStatusFromProjects(project.clientId);
                console.log(`âœ… Client status sync completed for client ID: ${project.clientId}`);
            } catch (syncErr) {
                console.error('âŒ Failed to sync client status:', syncErr);
            }
        } catch (err) {
            console.error('Failed to update status:', err);
        }
    };

    const handleSubStatusToggle = async (name: string, checked: boolean) => {
        try {
            const nextActive = checked 
                ? [...(project.activeSubStatuses || []), name]
                : (project.activeSubStatuses || []).filter(s => s !== name);
            
            await updateProjectMutation.mutateAsync({
                id: project.id,
                activeSubStatuses: nextActive
            });
        } catch (err) {
            console.error('Failed to update sub-status:', err);
        }
    };

    const handleSaveFinalLink = async (link: string) => {
        try {
            await updateProjectMutation.mutateAsync({
                id: project.id,
                finalDriveLink: link
            });
        } catch (err) {
            console.error('Failed to save link:', err);
        }
    };

    const handleSaveDriveLink = async (link: string) => {
        try {
            await updateProjectMutation.mutateAsync({
                id: project.id,
                driveLink: link
            });
        } catch (err) {
            console.error('Failed to save driveLink:', err);
        }
    };

    const handleSaveClientDriveLink = async (link: string) => {
        try {
            await updateProjectMutation.mutateAsync({
                id: project.id,
                clientDriveLink: link
            });
        } catch (err) {
            console.error('Failed to save clientDriveLink:', err);
        }
    };

    const handleSendFinalLink = () => {
        const client = clients.find(c => String(c.id) === String(project.clientId));
        if (!project.finalDriveLink || !client?.phone) {
            alert('Nomor telepon pengantin atau link belum tersedia.');
            return;
        }
        const message = `Halo Kak, file dokumentasi pernikahan sudah siap ya. Silakan akses di link berikut: ${project.finalDriveLink}. Terima kasih!`;
        window.open(`https://wa.me/${client.phone.replace(/\D/g, '')}?text=${encodeURIComponent(message)}`, '_blank');
    };

    return (
        <div className="min-h-screen bg-brand-bg relative overflow-x-hidden">
            {/* Background Decorative Elements */}
            <div className="absolute top-0 left-0 w-full h-[400px] bg-gradient-to-b from-brand-accent/10 to-transparent pointer-events-none"></div>
            <div className="absolute top-[-10%] right-[-5%] w-[40%] h-[40%] bg-brand-accent/5 rounded-full blur-[120px] pointer-events-none"></div>

            {/* Header / Nav */}
            <header className="sticky top-0 z-40 bg-brand-bg/60 backdrop-blur-xl border-b border-brand-border/50">
                <div className="w-full mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
                    <div className="flex items-center gap-6">
                        <button 
                            onClick={() => navigate('/project')}
                            className="group flex items-center gap-2 p-2 rounded-2xl hover:bg-brand-surface transition-all active:scale-95 border border-transparent hover:border-brand-border"
                        >
                            <div className="p-2 rounded-xl bg-brand-surface border border-brand-border group-hover:bg-brand-accent group-hover:text-white transition-all">
                                <ChevronLeftIcon className="w-5 h-5" />
                            </div>
                            <span className="text-sm font-bold text-brand-text-secondary group-hover:text-brand-text-light hidden sm:block transition-colors">Kembali ke Daftar</span>
                        </button>
                        
                        <div className="h-8 w-[1px] bg-brand-border hidden sm:block"></div>

                        <div className="flex items-center gap-4">
                            <div className="hidden sm:flex w-12 h-12 rounded-2xl bg-gradient-to-br from-brand-accent to-blue-600 items-center justify-center shadow-xl shadow-brand-accent/20">
                                <LayoutIcon className="w-6 h-6 text-white" />
                            </div>
                            <div>
                                <h1 className="text-xl font-black text-brand-text-light tracking-tight truncate max-w-[200px] md:max-w-md">Detail Acara Pernikahan</h1>
                                <div className="flex items-center gap-2 mt-0.5">
                                    <span className={`text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full ${getStatusClass(project.status, profile.projectStatusConfig)}`}>
                                        {project.status}
                                    </span>
                                    <span className="text-brand-text-secondary text-[10px] font-bold">â€¢</span>
                                    <p className="text-[10px] text-brand-text-secondary font-bold uppercase tracking-widest truncate max-w-[150px]">{project.projectName}</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </header>

            <main className="w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 md:py-8 relative z-10">
                <div className="space-y-6">
                    {/* Unified Project Header Box */}
                    <div className="bg-brand-surface border border-brand-border rounded-[2.5rem] p-6 shadow-sm relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none">
                            <BriefcaseIcon className="w-48 h-48 text-brand-accent -mr-12 -mt-12 rotate-12" />
                        </div>
                        
                        <div className="relative z-10">
                            {/* Top Header: Title + Progress */}
                            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
                                <div>
                                    <h2 className="text-2xl md:text-3xl font-black text-brand-text-light">{project.projectName}</h2>
                                    <p className="text-sm font-semibold text-brand-text-secondary flex items-center gap-2 mt-1">
                                        <UsersIcon className="w-4 h-4 text-brand-accent" />
                                        {project.clientName}
                                    </p>
                                </div>
                                
                                {/* Compact Progress */}
                                <div className="flex items-center gap-4 bg-brand-bg/60 px-5 py-3 rounded-2xl border border-brand-border/50">
                                    <div className="text-right">
                                        <p className="text-[10px] font-black text-brand-text-secondary uppercase tracking-widest">{project.status}</p>
                                        <p className="text-lg font-black text-brand-text-light leading-none mt-0.5">{project.progress}%</p>
                                    </div>
                                    <div className="w-24 md:w-32 h-2.5 bg-brand-surface border border-brand-border rounded-full overflow-hidden">
                                        <div className="h-full bg-gradient-to-r from-brand-accent to-blue-500 rounded-full shadow-sm" style={{width: `${project.progress}%`}}></div>
                                    </div>
                                </div>
                            </div>

                            {/* Body: 2 Columns (Info & Links) */}
                            <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
                                {/* Left: Metadata & Notes (Col 8) */}
                                <div className="md:col-span-7 lg:col-span-8 flex flex-col justify-between space-y-4">
                                    <div className="flex flex-wrap gap-2">
                                        {/* Date */}
                                        <div className="flex items-center gap-2 bg-brand-bg/50 px-3 py-2 rounded-xl border border-brand-border/30">
                                            <CalendarIcon className="w-4 h-4 text-brand-accent" />
                                            <span className="text-xs font-bold text-brand-text-light">{formatDateFull(project.date)}</span>
                                        </div>
                                        {/* Location */}
                                        <div className="flex items-center gap-2 bg-brand-bg/50 px-3 py-2 rounded-xl border border-brand-border/30">
                                            <MapPinIcon className="w-4 h-4 text-blue-400" />
                                            <span className="text-xs font-bold text-brand-text-light max-w-[200px] truncate" title={project.location}>{project.location || 'Lokasi belum diatur'}</span>
                                        </div>
                                        {/* Time */}
                                        {project.startTime && (
                                        <div className="flex items-center gap-2 bg-brand-bg/50 px-3 py-2 rounded-xl border border-brand-border/30">
                                            <ClockIcon className="w-4 h-4 text-orange-400" />
                                            <span className="text-xs font-bold text-brand-text-light">{project.startTime} {project.endTime ? `- ${project.endTime}` : ''}</span>
                                        </div>
                                        )}
                                    </div>
                                    
                                    {/* Notes */}
                                    <div className="bg-brand-bg/30 p-3.5 rounded-2xl border border-brand-border/30 flex-1">
                                        <p className="text-[10px] font-black text-brand-text-secondary uppercase tracking-widest mb-1.5 flex items-center gap-1.5"><StickyNoteIcon className="w-3.5 h-3.5 text-brand-accent" /> Catatan Acara</p>
                                        {project.notes ? (
                                            <p className="text-xs text-brand-text-light leading-relaxed">{project.notes}</p>
                                        ) : (
                                            <p className="text-xs text-brand-text-secondary italic">Tidak ada catatan khusus untuk acara ini.</p>
                                        )}
                                    </div>

                                    {/* Actions */}
                                    <div className="flex gap-3 pt-1">
                                        <button 
                                            onClick={() => navigate(`/project/${project.id}/edit`)}
                                            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-brand-bg border border-brand-border text-xs font-bold text-brand-text-light hover:bg-brand-surface transition-all active:scale-95"
                                        >
                                            <PencilIcon className="w-3.5 h-3.5" />
                                            Edit Acara
                                        </button>
                                        <button 
                                            onClick={() => projectActions.handleOpenBriefingModal(project)}
                                            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-brand-accent text-white text-xs font-bold shadow-lg shadow-brand-accent/20 hover:bg-brand-accent/90 transition-all active:scale-95"
                                        >
                                            <Share2Icon className="w-3.5 h-3.5" />
                                            Briefing Tim
                                        </button>
                                    </div>
                                </div>

                                {/* Right: Links (Col 4) */}
                                <div className="md:col-span-5 lg:col-span-4 bg-brand-bg/40 p-5 rounded-[1.5rem] border border-brand-border/40">
                                    <h3 className="text-[10px] font-black text-brand-text-secondary uppercase tracking-widest mb-4 flex items-center gap-1.5">
                                        <Link2Icon className="w-3.5 h-3.5 text-brand-accent" /> Tautan Proyek
                                    </h3>
                                    
                                    <div className="space-y-3">
                                        {/* Brief / Moodboard — multi-foto, full-width */}
                                        <MoodboardField
                                            value={project.driveLink || ''}
                                            projectId={project.id}
                                            onSave={handleSaveDriveLink}
                                        />

                                        {/* File Pengantin + File Jadi — 2 kolom compact */}
                                        <div className="grid grid-cols-2 gap-2">
                                        {/* File Pengantin */}
                                        <LinkRow
                                            label="File Pengantin"
                                            value={project.clientDriveLink || ''}
                                            uploadContext="bride_file"
                                            acceptTypes="image/jpeg,image/png,image/webp,application/pdf"
                                            onSave={handleSaveClientDriveLink}
                                        />

                                        {/* File Jadi */}
                                        <div className="rounded-xl bg-brand-surface border border-brand-border/50 overflow-hidden">
                                            <div className="flex items-center justify-between px-3 py-2 gap-2">
                                                <span className="text-[11px] font-bold text-brand-text-secondary shrink-0">File Jadi</span>
                                                <div className="flex items-center gap-1.5 shrink-0">
                                                    {project.finalDriveLink && !isEditingFinalLink && (
                                                        <button
                                                            type="button"
                                                            onClick={handleSendFinalLink}
                                                            className="flex items-center gap-1 text-[10px] font-bold text-green-400 hover:text-green-500 transition"
                                                        >
                                                            <SendIcon className="w-2.5 h-2.5" /> WA
                                                        </button>
                                                    )}
                                                    {!isEditingFinalLink && (
                                                        <button
                                                            type="button"
                                                            onClick={() => { setTempFinalLink(project.finalDriveLink || ''); setIsEditingFinalLink(true); }}
                                                            className="flex items-center gap-1 text-[10px] font-bold text-brand-text-secondary hover:text-brand-accent transition"
                                                        >
                                                            <PencilIcon className="w-2.5 h-2.5" /> Edit
                                                        </button>
                                                    )}
                                                    {project.finalDriveLink && !isEditingFinalLink && (
                                                        <button
                                                            type="button"
                                                            onClick={() => handleSaveFinalLink('')}
                                                            className="text-[10px] font-bold text-red-400 hover:text-red-500 transition"
                                                            title="Hapus"
                                                        >
                                                            <XIcon className="w-2.5 h-2.5" />
                                                        </button>
                                                    )}
                                                </div>
                                            </div>

                                            {isEditingFinalLink ? (
                                                <div className="flex items-center gap-1.5 px-3 pb-2">
                                                    <input
                                                        type="url"
                                                        value={tempFinalLink}
                                                        onChange={e => setTempFinalLink(e.target.value)}
                                                        placeholder="https://drive..."
                                                        className="flex-1 px-2 py-1.5 text-[10px] rounded-lg border border-brand-border bg-brand-bg text-brand-text-primary focus:outline-none focus:ring-1 focus:ring-brand-accent/50 w-full"
                                                        autoFocus
                                                    />
                                                    <button
                                                        type="button"
                                                        onClick={async () => { await handleSaveFinalLink(tempFinalLink); setIsEditingFinalLink(false); }}
                                                        className="text-[10px] px-2 py-1.5 bg-brand-accent text-white rounded-lg whitespace-nowrap"
                                                    >Simpan</button>
                                                </div>
                                            ) : project.finalDriveLink ? (
                                                <a
                                                    href={project.finalDriveLink}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="flex items-center gap-2 mx-3 mb-2.5 px-2.5 py-2 rounded-lg bg-brand-bg border border-brand-border/60 hover:border-brand-accent/30 hover:bg-brand-accent/5 transition group"
                                                >
                                                    <div className="w-6 h-6 rounded-md bg-blue-500/10 border border-blue-400/20 flex items-center justify-center flex-shrink-0">
                                                        <ExternalLinkIcon className="w-3 h-3 text-blue-400" />
                                                    </div>
                                                    <span className="text-[10px] font-medium text-blue-400 group-hover:underline truncate flex-1">
                                                        {project.finalDriveLink.split('/').pop()?.split('?')[0] || project.finalDriveLink}
                                                    </span>
                                                </a>
                                            ) : (
                                                <p className="text-[10px] text-brand-text-secondary/50 italic px-3 pb-2.5">Belum ada</p>
                                            )}
                                        </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Tim & Vendor â€” Inline Assignment */}
                    <div className="w-full">
                        <div className="bg-brand-surface border border-brand-border rounded-[2.5rem] shadow-sm overflow-hidden">
                            <div className="h-1.5 w-full bg-gradient-to-r from-blue-400/20 via-blue-400 to-purple-400/20"></div>
                            <div className="p-4 md:p-8">
                                <div className="flex items-center gap-2 mb-5">
                                    <UserPlusIcon className="w-4 h-4 text-blue-400" />
                                    <h3 className="text-sm font-black text-brand-text-light uppercase tracking-widest">Penugasan Tim & Vendor</h3>
                                </div>
                                <InlineTeamSection
                                    projectId={project.id}
                                    currentTeam={project.team || []}
                                    allMembers={teamMembers}
                                    onSaved={() => queryClient.invalidateQueries()}
                                />
                            </div>
                        </div>
                    </div>

                    {/* Sub-tahapan & Detail Lainnya */}
                    <div className="w-full">
                        <div className="bg-brand-surface border border-brand-border rounded-[2.5rem] shadow-sm overflow-hidden min-h-[300px] flex flex-col w-full">
                            <div className="h-1.5 w-full bg-gradient-to-r from-brand-accent/20 via-brand-accent to-blue-500/20"></div>
                            <div className="p-4 md:p-8 flex-1 w-full overflow-x-auto">
                                <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 min-w-[600px]">
                                    <ProjectDetailsTab
                                        selectedProject={project}
                                        profile={profile}
                                        teamByCategory={teamByCategory}
                                        handleStatusUpdate={handleStatusUpdate}
                                        handleSubStatusToggle={handleSubStatusToggle}
                                        handleOpenForm={projectActions.handleOpenForm}
                                        handleOpenBriefingModal={() => projectActions.handleOpenBriefingModal(project)}
                                        onClose={() => {}}
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </main>

            {/* Modals from projectActions */}

            {projectActions.isBriefingModalOpen && (
                <BriefingModal
                    isOpen={projectActions.isBriefingModalOpen}
                    onClose={() => projectActions.setIsBriefingModalOpen(false)}
                    briefingText={projectActions.briefingText}
                />
            )}
            
            {/* Footer Padding for Mobile Bottom Bar if any */}
            <div className="h-20 lg:hidden"></div>
        </div>
    );
};

export default ProjectDetailPage;
