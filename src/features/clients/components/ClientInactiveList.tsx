import React, { useState } from 'react';
import { EyeIcon, PencilIcon, Trash2Icon, ArrowUpIcon, ArrowDownIcon } from '@/constants';
import { ClientStatus, Project } from '@/types';
import { ExtendedClient } from '@/features/clients/types';
import { AvatarDisplay } from '@/shared/ui/AvatarUpload';

interface ClientInactiveListProps {
    clients: ExtendedClient[];
    onViewDetail: (client: ExtendedClient) => void;
    onEditClient: (client: ExtendedClient, project?: Project) => void;
    onDeleteClient: (clientId: string) => void;
}

export const ClientInactiveList: React.FC<ClientInactiveListProps> = ({
    clients,
    onViewDetail,
    onEditClient,
    onDeleteClient
}) => {
    const [isOpen, setIsOpen] = useState(true);
    const inactiveClients = clients.filter(c => c.status !== ClientStatus.ACTIVE);

    return (
        <div className="bg-brand-surface rounded-2xl shadow-lg border border-brand-border">
            <div className="p-3 md:p-4 border-t border-brand-border">
                <button onClick={() => setIsOpen(!isOpen)} className="w-full flex justify-between items-center">
                    <h3 className="text-sm md:text-base font-semibold text-brand-text-light">Pengantin Sudah Selesai ({inactiveClients.length})</h3>
                    {isOpen ? <ArrowUpIcon className="w-4 h-4 md:w-5 md:h-5 text-brand-text-secondary" /> : <ArrowDownIcon className="w-4 h-4 md:w-5 md:h-5 text-brand-text-secondary" />}
                </button>
            </div>
            {isOpen && (
                <>
                    {/* Mobile cards */}
                    <div className="md:hidden p-3 space-y-2">
                        {inactiveClients.map(client => (
                            <div key={client.id} className="rounded-xl bg-brand-surface border border-brand-border p-3 shadow-sm opacity-80 hover:opacity-100 transition-all">
                                <div className="flex items-start justify-between gap-2">
                                    <div className="flex items-center gap-2 flex-1 min-w-0">
                                        <AvatarDisplay avatarBase64={client.avatar} name={client.name} size="sm" variant="client" className="shrink-0" />
                                        <div className="min-w-0">
                                            <p className="font-semibold text-sm text-brand-text-light leading-tight truncate">{client.name}</p>
                                            <p className="text-[10px] text-brand-text-secondary mt-0.5 truncate">{client.email}</p>
                                        </div>
                                    </div>
                                    <span className="px-1.5 py-0.5 text-[9px] font-semibold rounded-full bg-slate-600 text-white flex-shrink-0">{client.status}</span>
                                </div>
                                <div className="mt-2 grid grid-cols-2 gap-y-1.5 text-xs">
                                    <span className="text-brand-text-secondary text-[10px]">Kontak Terakhir</span>
                                    <span className="text-right text-xs">{new Date(client.lastContact).toLocaleDateString('id-ID')}</span>
                                </div>
                                <div className="mt-2 pt-2 border-t border-brand-border/50 flex flex-wrap justify-end gap-1.5">
                                    <button onClick={() => onViewDetail(client)} className="inline-flex items-center space-x-1 px-2.5 py-1.5 rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-all text-[10px] font-bold shadow-sm" title="Detail">
                                        <EyeIcon className="w-3.5 h-3.5" />
                                        <span>Detail</span>
                                    </button>
                                    <button onClick={() => onEditClient(client)} className="inline-flex items-center space-x-1 px-2.5 py-1.5 rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 transition-all text-[10px] font-bold shadow-sm" title="Edit">
                                        <PencilIcon className="w-3.5 h-3.5" />
                                        <span>Edit</span>
                                    </button>
                                    <button onClick={() => onDeleteClient(String(client.id))} className="inline-flex items-center space-x-1 px-2.5 py-1.5 rounded-lg bg-red-600 text-white hover:bg-red-700 transition-all text-[10px] font-bold shadow-sm" title="Hapus">
                                        <Trash2Icon className="w-3.5 h-3.5" />
                                        <span>Hapus</span>
                                    </button>
                                </div>
                            </div>
                        ))}
                        {inactiveClients.length === 0 && (
                            <p className="text-center py-6 text-sm text-brand-text-secondary">Tidak ada pengantin tidak aktif.</p>
                        )}
                    </div>
                    {/* Desktop table */}
                    <div className="hidden md:block overflow-x-auto">
                        <table className="w-full text-sm text-left">
                            <thead className="text-[10px] tracking-wider text-slate-700 uppercase bg-slate-100">
                                <tr>
                                    <th className="px-4 py-3.5 font-bold border-r border-slate-300">Pengantin</th>
                                    <th className="px-4 py-3.5 font-bold border-r border-slate-300">Status</th>
                                    <th className="px-4 py-3.5 font-bold border-r border-slate-300">Kontak Terakhir</th>
                                    <th className="px-4 py-3.5 text-center font-bold">Aksi</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white/40 divide-y divide-slate-300">
                                {inactiveClients.map(client => (
                                    <tr key={client.id} className="hover:bg-brand-input/40 transition-colors opacity-70 hover:opacity-100">
                                        <td className="px-4 py-3.5 border-r border-slate-300">
                                            <div className="flex items-center gap-3">
                                                <AvatarDisplay avatarBase64={client.avatar} name={client.name} size="md" variant="client" className="shrink-0" />
                                                <div>
                                                    <p className="font-semibold text-brand-text-light">{client.name}</p>
                                                    <p className="text-xs text-brand-text-secondary">{client.email}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-4 py-3.5 border-r border-slate-300"><span className="px-2 py-0.5 text-[10px] font-semibold rounded-full bg-gray-200 text-gray-700">{client.status}</span></td>
                                        <td className="px-4 py-3.5 text-brand-text-primary border-r border-slate-300">{new Date(client.lastContact).toLocaleDateString('id-ID')}</td>
                                        <td className="px-4 py-3.5 text-center">
                                            <div className="flex items-center justify-center space-x-2">
                                                <button onClick={() => onViewDetail(client)} className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-all text-xs font-bold shadow-sm" title="Detail">
                                                    <EyeIcon className="w-3.5 h-3.5" />
                                                    <span>Detail</span>
                                                </button>
                                                
                                                {/* Dropdown context menu for secondary actions */}
                                                <details className="relative inline-block text-left">
                                                    <summary className="list-none inline-flex h-8 w-8 cursor-pointer items-center justify-center rounded-lg text-brand-text-secondary hover:bg-brand-input hover:text-brand-text-primary transition-all">
                                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h.01M12 12h.01M19 12h.01M6 12a1 1 0 11-2 0 1 1 0 012 0zm7 0a1 1 0 11-2 0 1 1 0 012 0zm7 0a1 1 0 11-2 0 1 1 0 012 0z" />
                                                        </svg>
                                                    </summary>
                                                    <div className="absolute right-0 z-30 mt-1.5 w-40 rounded-xl border border-brand-border bg-brand-surface p-1 text-left shadow-xl animate-in fade-in zoom-in-95 duration-100">
                                                        <button onClick={() => onEditClient(client)} className="w-full flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-semibold text-brand-text-primary hover:bg-brand-input transition-colors">
                                                            <PencilIcon className="w-4 h-4 text-brand-text-secondary" />
                                                            <span>Edit Pengantin</span>
                                                        </button>
                                                        <hr className="my-1 border-brand-border/60" />
                                                        <button onClick={() => onDeleteClient(String(client.id))} className="w-full flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-semibold bg-red-600 text-white hover:bg-red-700 transition-colors">
                                                            <Trash2Icon className="w-4 h-4 text-white" />
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
                </>
            )}
        </div>
    );
};
