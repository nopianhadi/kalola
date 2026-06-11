import React, { useState } from 'react';
import { EyeIcon, PencilIcon, Trash2Icon, PlusIcon, ArrowUpIcon, ArrowDownIcon } from '@/constants';
import { MoreHorizontalIcon } from 'lucide-react';
import { ClientStatus } from '@/types';
import { ExtendedClient } from '@/features/clients/types';
import { formatCurrency, getPaymentStatusClass } from '@/features/clients/utils/clients.utils';
import { Button, Badge, Card, CardHeader } from '@/shared/ui';
import { AvatarDisplay } from '@/shared/ui/AvatarUpload';

interface ClientActiveListProps {
    clients: ExtendedClient[];
    onViewDetail: (client: ExtendedClient) => void;
    onEditClient: (client: ExtendedClient) => void;
    onDeleteClient: (clientId: string) => void;
    onAddProject: (client: ExtendedClient) => void;
    onManageProjects: (client: ExtendedClient) => void;
    // Pagination
    page?: number;
    setPage?: (page: number) => void;
    limit?: number;
    totalItems?: number;
    isLoading?: boolean;
}

export const ClientActiveList: React.FC<ClientActiveListProps> = ({
    clients,
    onViewDetail,
    onEditClient,
    onDeleteClient,
    onAddProject,
    onManageProjects,
    page = 1,
    setPage,
    limit = 10,
    totalItems = 0,
    isLoading = false
}) => {
    const [isOpen, setIsOpen] = useState(true);
    const activeClients = clients.filter(c => c.status === ClientStatus.ACTIVE);
    const totalPages = Math.ceil(totalItems / limit);

    if (isLoading) {
        return (
            <div className="bg-brand-surface rounded-2xl shadow-lg border border-brand-border p-8 flex justify-center items-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-accent"></div>
            </div>
        );
    }

    return (
        <div className="bg-brand-surface rounded-2xl shadow-lg border border-brand-border">
            <div className="p-3 md:p-4 border-b border-brand-border">
                <button onClick={() => setIsOpen(!isOpen)} className="w-full flex justify-between items-center">
                    <h3 className="text-sm md:text-base font-semibold text-brand-text-light">Pengantin Aktif ({activeClients.length})</h3>
                    {isOpen ? <ArrowUpIcon className="w-4 h-4 md:w-5 md:h-5 text-brand-text-secondary" /> : <ArrowDownIcon className="w-4 h-4 md:w-5 md:h-5 text-brand-text-secondary" />}
                </button>
            </div>
            {isOpen && (
                <>
                    {/* Mobile cards */}
                    <div className="md:hidden p-3 space-y-2">
                        {activeClients.map(client => (
                            <div key={client.id} className="rounded-xl bg-white/5 border border-brand-border p-3 shadow-sm hover:shadow-md transition-all">
                                <div className="flex items-start justify-between gap-2">
                                    <div className="flex items-center gap-2 flex-1 min-w-0">
                                        <AvatarDisplay
                                            avatarBase64={client.avatar}
                                            name={client.name}
                                            size="sm"
                                            variant="client"
                                            className="shrink-0"
                                        />
                                        <div className="min-w-0">
                                            <p className="font-semibold text-sm text-brand-text-light leading-tight truncate">{client.name}</p>
                                            <p className="text-[10px] text-brand-text-secondary mt-0.5 truncate">{client.email}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-1 flex-shrink-0">
                                        {client.overallPaymentStatus && (
                                            <Badge 
                                                variant={client.overallPaymentStatus === 'LUNAS' ? 'success' : client.overallPaymentStatus === 'DP_TERBAYAR' ? 'warning' : 'danger'}
                                                size="xs"
                                            >
                                                {client.overallPaymentStatus}
                                            </Badge>
                                        )}
                                    </div>
                                </div>
                                <div className="mt-2 grid grid-cols-2 gap-y-1.5 text-xs">
                                    <span className="text-brand-text-secondary text-[10px]">Total Nilai</span>
                                    <span className="text-right font-semibold text-xs">{formatCurrency(client.totalProjectValue)}</span>
                                    <span className="text-brand-text-secondary text-[10px]">Sisa Tagihan</span>
                                    <span className="text-right font-bold text-xs text-brand-danger">{formatCurrency(client.balanceDue)}</span>
                                    <span className="text-brand-text-secondary text-[10px]">Acara Pernikahan Terbaru</span>
                                    <span className="text-right text-xs truncate">{client.mostRecentProject?.projectName || '-'}</span>
                                </div>
                                <div className="mt-2 pt-2 border-t border-brand-border/50 flex flex-wrap justify-end gap-1.5">
                                    <Button onClick={() => onViewDetail(client)} variant="ghost" size="xs" leftIcon={<EyeIcon className="w-3.5 h-3.5" />}>
                                        Detail
                                    </Button>
                                    <Button onClick={() => onManageProjects(client)} variant="ghost" size="xs" leftIcon={
                                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
                                        </svg>
                                    }>
                                        Kelola
                                    </Button>
                                    <details className="relative">
                                        <summary className="list-none inline-flex items-center justify-center w-8 h-8 rounded-lg text-brand-text-secondary hover:bg-brand-surface hover:text-brand-text-primary cursor-pointer">
                                            <MoreHorizontalIcon className="w-4 h-4" />
                                        </summary>
                                        <div className="absolute right-0 z-20 mt-1 w-36 rounded-xl border border-brand-border bg-brand-surface p-1 shadow-xl">
                                            <button onClick={() => onEditClient(client)} className="w-full flex items-center gap-2 rounded-lg px-3 py-2 text-left text-xs font-semibold text-brand-text-primary hover:bg-brand-bg">
                                                <PencilIcon className="w-3.5 h-3.5" /> Edit
                                            </button>
                                            <button onClick={() => onAddProject(client)} className="w-full flex items-center gap-2 rounded-lg px-3 py-2 text-left text-xs font-semibold text-brand-text-primary hover:bg-brand-bg">
                                                <PlusIcon className="w-3.5 h-3.5" /> Tambah Acara
                                            </button>
                                            <button onClick={() => onDeleteClient(client.id)} className="w-full flex items-center gap-2 rounded-lg px-3 py-2 text-left text-xs font-semibold text-red-500 hover:bg-red-500/10">
                                                <Trash2Icon className="w-3.5 h-3.5" /> Hapus
                                            </button>
                                        </div>
                                    </details>
                                </div>
                            </div>
                        ))}
                        {activeClients.length === 0 && (
                            <p className="text-center py-8 text-xs text-brand-text-secondary">Tidak ada pengantin aktif.</p>
                        )}
                    </div>
                    {/* Desktop table */}
                    <div className="hidden md:block overflow-x-auto">
                        <table className="w-full text-sm text-left">
                            <thead className="text-[10px] tracking-wider text-slate-700 uppercase bg-slate-100">
                                <tr>
                                    <th className="px-4 py-3.5 font-bold border-r border-slate-300">Pengantin</th>
                                    <th className="px-4 py-3.5 font-bold border-r border-slate-300">Total Package</th>
                                    <th className="px-4 py-3.5 font-bold border-r border-slate-300">Sisa Tagihan</th>
                                    <th className="px-4 py-3.5 font-bold border-r border-slate-300">Acara Pernikahan Terbaru</th>
                                    <th className="px-4 py-3.5 text-center font-bold">Aksi</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white/40 divide-y divide-slate-300">
                                {activeClients.map(client => (
                                    <tr key={client.id} className="hover:bg-brand-input/40 transition-colors">
                                        <td className="px-4 py-3.5 border-r border-slate-300">
                                            <div className="flex items-center gap-3">
                                                <AvatarDisplay
                                                    avatarBase64={client.avatar}
                                                    name={client.name}
                                                    size="md"
                                                    variant="client"
                                                    className="shrink-0"
                                                />
                                                <div>
                                                    <p className="font-semibold text-brand-text-light">{client.name}</p>
                                                    <p className="text-xs text-brand-text-secondary">{client.email}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-4 py-3.5 font-semibold text-brand-text-light border-r border-slate-300">{formatCurrency(client.totalProjectValue)}</td>
                                        <td className="px-4 py-3.5 font-semibold text-brand-danger border-r border-slate-300">{formatCurrency(client.balanceDue)}</td>
                                        <td className="px-4 py-3.5 text-brand-text-primary border-r border-slate-300">
                                            <p className="font-medium text-brand-text-light">{client.mostRecentProject?.projectName || '-'}</p>
                                            {client.overallPaymentStatus && (
                                                <Badge 
                                                    variant={client.overallPaymentStatus === 'LUNAS' ? 'success' : client.overallPaymentStatus === 'DP_TERBAYAR' ? 'warning' : 'danger'}
                                                    size="xs"
                                                    className="mt-1"
                                                >
                                                    {client.overallPaymentStatus}
                                                </Badge>
                                            )}
                                        </td>
                                        <td className="px-4 py-3.5">
                                            <div className="flex items-center justify-center space-x-1.5">
                                                <Button onClick={() => onViewDetail(client)} variant="ghost" size="xs" leftIcon={<EyeIcon className="w-3.5 h-3.5" />}>
                                                    Detail
                                                </Button>
                                                <Button onClick={() => onManageProjects(client)} variant="ghost" size="xs" leftIcon={
                                                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
                                                    </svg>
                                                }>
                                                    Kelola
                                                </Button>
                                                <details className="relative inline-block text-left">
                                                    <summary className="list-none inline-flex h-8 w-8 cursor-pointer items-center justify-center rounded-lg text-brand-text-secondary hover:bg-brand-input hover:text-brand-text-primary transition-all">
                                                        <MoreHorizontalIcon className="w-4 h-4" />
                                                    </summary>
                                                    <div className="absolute right-0 z-30 mt-1.5 w-40 rounded-xl border border-brand-border bg-brand-surface p-1 text-left shadow-xl animate-in fade-in zoom-in-95 duration-100">
                                                        <button onClick={() => onEditClient(client)} className="w-full flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-semibold text-brand-text-primary hover:bg-brand-input transition-colors">
                                                            <PencilIcon className="w-4 h-4 text-brand-text-secondary" /> 
                                                            <span>Edit Pengantin</span>
                                                        </button>
                                                        <button onClick={() => onAddProject(client)} className="w-full flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-semibold text-brand-text-primary hover:bg-brand-input transition-colors">
                                                            <PlusIcon className="w-4 h-4 text-brand-text-secondary" />
                                                            <span>Tambah Acara</span>
                                                        </button>
                                                        <hr className="my-1 border-brand-border/60" />
                                                        <button onClick={() => onDeleteClient(client.id)} className="w-full flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-semibold text-brand-danger hover:bg-red-500/10 transition-colors">
                                                            <Trash2Icon className="w-4 h-4 text-brand-danger" /> 
                                                            <span>Hapus Pengantin</span>
                                                        </button>
                                                    </div>
                                                </details>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination Controls */}
                    {totalPages > 1 && setPage && (
                        <div className="p-4 border-t border-brand-border flex items-center justify-between">
                            <div className="text-xs text-brand-text-secondary">
                                Menampilkan {((page - 1) * limit) + 1} - {Math.min(page * limit, totalItems)} dari {totalItems} pengantin
                            </div>
                            <div className="flex items-center gap-1">
                                <Button
                                    onClick={() => setPage(Math.max(1, page - 1))}
                                    disabled={page === 1}
                                    variant="outline"
                                    size="xs"
                                >
                                    Sebelumnya
                                </Button>
                                {[...Array(totalPages)].map((_, i) => {
                                    const p = i + 1;
                                    // Show first, last, and pages around current
                                    if (p === 1 || p === totalPages || (p >= page - 1 && p <= page + 1)) {
                                        return (
                                            <Button
                                                key={p}
                                                onClick={() => setPage(p)}
                                                variant={page === p ? 'primary' : 'outline'}
                                                size="xs"
                                                className="w-8 h-8 p-0"
                                            >
                                                {p}
                                            </Button>
                                        );
                                    }
                                    if (p === page - 2 || p === page + 2) {
                                        return <span key={p} className="px-1 text-brand-text-secondary">...</span>;
                                    }
                                    return null;
                                })}
                                <Button
                                    onClick={() => setPage(Math.min(totalPages, page + 1))}
                                    disabled={page === totalPages}
                                    variant="outline"
                                    size="xs"
                                >
                                    Selanjutnya
                                </Button>
                            </div>
                        </div>
                    )}
                </>
            )}
        </div>
    );
};
