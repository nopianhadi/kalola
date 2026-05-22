import React, { useState } from 'react';
import { EyeIcon, PencilIcon, Trash2Icon, PlusIcon, ArrowUpIcon, ArrowDownIcon } from '@/constants';
import { ClientStatus } from '@/types';
import { ExtendedClient } from '@/features/clients/types';
import { formatCurrency, getPaymentStatusClass } from '@/features/clients/utils/clients.utils';
import { Button, Badge, Card, CardHeader } from '@/shared/ui';

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
                    <h3 className="text-sm md:text-base font-semibold text-brand-text-light">Pengantin Yang Aktif (sedang Berjalan & Baru ) ({activeClients.length})</h3>
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
                                    <div className="flex-1 min-w-0">
                                        <p className="font-semibold text-sm text-brand-text-light leading-tight truncate">{client.name}</p>
                                        <p className="text-[10px] text-brand-text-secondary mt-0.5 truncate">{client.email}</p>
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
                                    <Button onClick={() => onEditClient(client)} variant="ghost" size="xs" leftIcon={<PencilIcon className="w-3.5 h-3.5" />}>
                                        Edit
                                    </Button>
                                    <Button onClick={() => onDeleteClient(client.id)} variant="ghost" size="xs" leftIcon={<Trash2Icon className="w-3.5 h-3.5" />} className="text-red-500 hover:text-red-600">
                                        Hapus
                                    </Button>
                                    <Button onClick={() => onAddProject(client)} variant="ghost" size="xs" leftIcon={<PlusIcon className="w-3.5 h-3.5" />}>
                                        + Acara
                                    </Button>
                                    <Button onClick={() => onManageProjects(client)} variant="ghost" size="xs" leftIcon={
                                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
                                        </svg>
                                    }>
                                        Kelola
                                    </Button>
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
                            <thead className="text-xs text-blue-800 uppercase bg-blue-100">
                                <tr>
                                    <th className="px-6 py-4 font-medium tracking-wider border-r border-blue-200">Pengantin</th>
                                    <th className="px-6 py-4 font-medium tracking-wider border-r border-blue-200">Total Package</th>
                                    <th className="px-6 py-4 font-medium tracking-wider border-r border-blue-200">Sisa Tagihan</th>
                                    <th className="px-6 py-4 font-medium tracking-wider border-r border-blue-200">Acara Pernikahan Terbaru</th>
                                    <th className="px-6 py-4 font-medium tracking-wider text-center">Aksi</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-blue-200">
                                {activeClients.map(client => (
                                    <tr key={client.id} className="hover:bg-brand-bg transition-colors">
                                        <td className="px-6 py-4 border-r border-blue-200">
                                            <p className="font-semibold text-brand-text-light">{client.name}</p>
                                            <p className="text-xs text-brand-text-secondary">{client.email}</p>
                                        </td>
                                        <td className="px-6 py-4 font-semibold border-r border-blue-200">{formatCurrency(client.totalProjectValue)}</td>
                                        <td className="px-6 py-4 font-semibold text-red-400 border-r border-blue-200">{formatCurrency(client.balanceDue)}</td>
                                        <td className="px-6 py-4 border-r border-blue-200">
                                            <p>{client.mostRecentProject?.projectName || '-'}</p>
                                            {client.overallPaymentStatus && (
                                                <Badge 
                                                    variant={client.overallPaymentStatus === 'LUNAS' ? 'success' : client.overallPaymentStatus === 'DP_TERBAYAR' ? 'warning' : 'danger'}
                                                    size="sm"
                                                >
                                                    {client.overallPaymentStatus}
                                                </Badge>
                                            )}
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center justify-center flex-wrap gap-1.5">
                                                <Button onClick={() => onViewDetail(client)} variant="ghost" size="xs" leftIcon={<EyeIcon className="w-4 h-4" />}>
                                                    Detail
                                                </Button>
                                                <Button onClick={() => onEditClient(client)} variant="ghost" size="xs" leftIcon={<PencilIcon className="w-4 h-4" />}>
                                                    Edit
                                                </Button>
                                                <Button onClick={() => onDeleteClient(client.id)} variant="ghost" size="xs" leftIcon={<Trash2Icon className="w-4 h-4" />} className="text-red-500 hover:text-red-600">
                                                    Hapus
                                                </Button>
                                                <Button onClick={() => onAddProject(client)} variant="ghost" size="xs" leftIcon={<PlusIcon className="w-4 h-4" />}>
                                                    + Acara
                                                </Button>
                                                <Button onClick={() => onManageProjects(client)} variant="ghost" size="xs" leftIcon={
                                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
                                                    </svg>
                                                }>
                                                    Kelola
                                                </Button>
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
