import React from 'react';
import { Contract, Client, Project } from '@/types';
import { EyeIcon, PencilIcon, Trash2Icon } from '@/constants';
import { formatDate, getSignatureStatus } from '@/features/contracts/utils/contracts.utils';

interface ContractTableProps {
    contracts: Contract[];
    clients: Client[];
    projects: Project[];
    onView: (contract: Contract) => void;
    onEdit: (contract: Contract) => void;
    onDelete: (id: string) => void;
}

export const ContractTable: React.FC<ContractTableProps> = ({
    contracts,
    clients,
    projects,
    onView,
    onEdit,
    onDelete
}) => {
    return (
        <div className="hidden md:block bg-brand-surface p-4 rounded-xl shadow-lg border border-brand-border">
            <div className="overflow-x-auto">
                <table className="w-full text-sm">
                    <thead className="text-xs text-brand-text-secondary uppercase">
                        <tr>
                            <th className="px-4 py-3 text-left">No. Kontrak</th>
                            <th className="px-4 py-3 text-left">Klien & Proyek</th>
                            <th className="px-4 py-3 text-left">Tgl. Penandatanganan</th>
                            <th className="px-4 py-3 text-left">Status TTD</th>
                            <th className="px-4 py-3 text-center">Aksi</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-brand-border">
                        {contracts.map(contract => {
                            const client = clients.find(c => String(c.id) === String(contract.clientId));
                            const project = projects.find(p => String(p.id) === String(contract.projectId));
                            const signatureStatus = getSignatureStatus(contract);
                            return (
                                <tr key={contract.id} className="hover:bg-brand-bg/50 transition-colors">
                                    <td className="px-4 py-3 font-mono text-xs">{contract.contractNumber}</td>
                                    <td className="px-4 py-3">
                                        <p className="font-semibold text-brand-text-light">{client?.name || contract.clientName1}</p>
                                        <p className="text-xs text-brand-text-secondary">{project?.projectName || 'N/A'}</p>
                                    </td>
                                    <td className="px-4 py-3 text-brand-text-primary">{formatDate(contract.signingDate)}</td>
                                    <td className="px-4 py-3">
                                        <span className={`px-2 py-1 text-[10px] font-bold uppercase rounded-full tracking-wider ${signatureStatus.color}`}>
                                            {signatureStatus.text}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3">
                                        <div className="flex items-center justify-center space-x-2">
                                            <button onClick={() => onView(contract)} className="inline-flex items-center space-x-2 px-3 py-1.5 text-brand-text-secondary hover:text-brand-accent hover:bg-brand-accent/10 rounded-lg transition-all group" title="Lihat">
                                                <EyeIcon className="w-4 h-4"/>
                                                <span className="text-xs font-bold font-sans">Lihat</span>
                                            </button>
                                            <button onClick={() => onEdit(contract)} className="inline-flex items-center space-x-2 px-3 py-1.5 text-brand-text-secondary hover:text-blue-400 hover:bg-blue-400/10 rounded-lg transition-all group" title="Edit">
                                                <PencilIcon className="w-4 h-4"/>
                                                <span className="text-xs font-bold font-sans">Edit</span>
                                            </button>
                                            <button onClick={() => onDelete(contract.id)} className="inline-flex items-center space-x-2 px-3 py-1.5 text-brand-text-secondary hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-all group" title="Hapus">
                                                <Trash2Icon className="w-4 h-4"/>
                                                <span className="text-xs font-bold font-sans">Hapus</span>
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
        </div>
    );
};
