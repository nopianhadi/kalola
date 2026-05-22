import React, { useState } from 'react';
import { EyeIcon, PencilIcon, Trash2Icon, ArrowUpIcon, ArrowDownIcon } from '@/constants';
import { ClientStatus, Project } from '@/types';
import { ExtendedClient } from '@/features/clients/types';

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
                            <div key={client.id} className="rounded-xl bg-white/5 border border-brand-border p-3 shadow-sm opacity-70 hover:opacity-90 transition-all">
                                <div className="flex items-start justify-between gap-2">
                                    <div className="flex-1 min-w-0">
                                        <p className="font-semibold text-sm text-brand-text-light leading-tight truncate">{client.name}</p>
                                        <p className="text-[10px] text-brand-text-secondary mt-0.5 truncate">{client.email}</p>
                                    </div>
                                    <span className="px-1.5 py-0.5 text-[9px] font-semibold rounded-full bg-gray-700 text-gray-300 flex-shrink-0">{client.status}</span>
                                </div>
                                <div className="mt-2 grid grid-cols-2 gap-y-1.5 text-xs">
                                    <span className="text-brand-text-secondary text-[10px]">Kontak Terakhir</span>
                                    <span className="text-right text-xs">{new Date(client.lastContact).toLocaleDateString('id-ID')}</span>
                                </div>
                                <div className="mt-2 pt-2 border-t border-brand-border/50 flex flex-wrap justify-end gap-1.5">
                                    <button onClick={() => onViewDetail(client)} className="inline-flex items-center space-x-1 px-2.5 py-1.5 rounded-lg bg-blue-600/10 text-blue-400 hover:bg-blue-600 hover:text-white transition-all text-[10px] font-bold shadow-sm" title="Detail">
                                        <EyeIcon className="w-3.5 h-3.5" />
                                        <span>Detail</span>
                                    </button>
                                    <button onClick={() => onEditClient(client)} className="inline-flex items-center space-x-1 px-2.5 py-1.5 rounded-lg bg-blue-600/10 text-blue-400 hover:bg-blue-600 hover:text-white transition-all text-[10px] font-bold shadow-sm" title="Edit">
                                        <PencilIcon className="w-3.5 h-3.5" />
                                        <span>Edit</span>
                                    </button>
                                    <button onClick={() => onDeleteClient(client.id)} className="inline-flex items-center space-x-1 px-2.5 py-1.5 rounded-lg bg-red-600/10 text-red-500 hover:bg-red-600 hover:text-white transition-all text-[10px] font-bold shadow-sm" title="Hapus">
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
                            <thead className="text-xs text-blue-800 uppercase bg-blue-100">
                                <tr>
                                    <th className="px-6 py-4 font-medium tracking-wider border-r border-blue-200">Pengantin</th>
                                    <th className="px-6 py-4 font-medium tracking-wider border-r border-blue-200">Status</th>
                                    <th className="px-6 py-4 font-medium tracking-wider border-r border-blue-200">Kontak Terakhir</th>
                                    <th className="px-6 py-4 font-medium tracking-wider text-center">Aksi</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-blue-200">
                                {inactiveClients.map(client => (
                                    <tr key={client.id} className="hover:bg-brand-bg transition-colors opacity-70">
                                        <td className="px-6 py-4 border-r border-blue-200">
                                            <p className="font-semibold text-brand-text-light">{client.name}</p>
                                            <p className="text-xs text-brand-text-secondary">{client.email}</p>
                                        </td>
                                        <td className="px-6 py-4 border-r border-blue-200"><span className="px-2 py-1 text-xs font-medium rounded-full bg-gray-700 text-gray-300">{client.status}</span></td>
                                        <td className="px-6 py-4 border-r border-blue-200">{new Date(client.lastContact).toLocaleDateString('id-ID')}</td>
                                        <td className="px-6 py-4 text-center">
                                            <div className="flex items-center justify-center space-x-2">
                                                <button onClick={() => onViewDetail(client)} className="inline-flex items-center space-x-2 px-3 h-8 rounded-lg bg-blue-600/10 text-blue-400 hover:bg-blue-600 hover:text-white transition-all shadow-sm group" title="Detail">
                                                    <EyeIcon className="w-4 h-4" />
                                                    <span className="text-xs font-bold">Detail</span>
                                                </button>
                                                <button onClick={() => onEditClient(client)} className="inline-flex items-center space-x-2 px-3 h-8 rounded-lg bg-blue-600/10 text-blue-400 hover:bg-blue-600 hover:text-white transition-all shadow-sm group" title="Edit">
                                                    <PencilIcon className="w-4 h-4" />
                                                    <span className="text-xs font-bold">Edit</span>
                                                </button>
                                                <button onClick={() => onDeleteClient(client.id)} className="inline-flex items-center space-x-2 px-3 h-8 rounded-lg bg-red-600/10 text-red-500 hover:bg-red-600 hover:text-white transition-all shadow-sm group" title="Hapus">
                                                    <Trash2Icon className="w-4 h-4" />
                                                    <span className="text-xs font-bold">Hapus</span>
                                                </button>
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
