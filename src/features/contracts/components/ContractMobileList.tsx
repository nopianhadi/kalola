import React from 'react';
import { Contract, Client, Project } from '@/types';
import { EyeIcon, PencilIcon, Trash2Icon, FileTextIcon } from '@/constants';
import { formatDate, getSignatureStatus, formatDisplayCurrency } from '@/features/contracts/utils/contracts.utils';

interface ContractMobileListProps {
    contracts: Contract[];
    clients: Client[];
    projects: Project[];
    onView: (contract: Contract) => void;
    onEdit: (contract: Contract) => void;
    onDelete: (id: string) => void;
}

export const ContractMobileList: React.FC<ContractMobileListProps> = ({
    contracts,
    clients,
    projects,
    onView,
    onEdit,
    onDelete
}) => {
    if (contracts.length === 0) {
        return (
            <div className="bg-brand-surface p-8 rounded-xl text-center border border-brand-border">
                <FileTextIcon className="w-12 h-12 text-brand-text-secondary mx-auto mb-3 opacity-50" />
                <p className="text-brand-text-secondary">Belum ada kontrak. Klik tombol "Buat Kontrak" untuk memulai.</p>
            </div>
        );
    }

    return (
        <div className="md:hidden space-y-4">
            {contracts.map(contract => {
                const client = clients.find(c => String(c.id) === String(contract.clientId));
                const project = projects.find(p => String(p.id) === String(contract.projectId));
                const signatureStatus = getSignatureStatus(contract);
                return (
                    <div key={contract.id} className="bg-brand-surface rounded-xl shadow-lg border border-brand-border overflow-hidden">
                        {/* Header */}
                        <div className="bg-blue-50 p-4 border-b border-brand-border">
                            <div className="flex items-start justify-between mb-2">
                                <div className="flex-1">
                                    <p className="text-[10px] text-brand-text-secondary uppercase tracking-widest mb-1">No. Kontrak</p>
                                    <p className="font-mono text-sm font-bold text-brand-text-light">{contract.contractNumber}</p>
                                </div>
                                <span className={`px-2 py-1 text-[10px] font-bold uppercase rounded-full flex items-center gap-1 ${signatureStatus.color}`}>
                                    {signatureStatus.icon}
                                    {signatureStatus.text}
                                </span>
                            </div>
                        </div>

                        {/* Content */}
                        <div className="p-4 space-y-3">
                            <div>
                                <p className="text-[10px] text-brand-text-secondary uppercase tracking-widest mb-1">Klien</p>
                                <p className="font-bold text-brand-text-light">{client?.name || contract.clientName1}</p>
                            </div>
                            <div>
                                <p className="text-[10px] text-brand-text-secondary uppercase tracking-widest mb-1">Proyek</p>
                                <p className="text-sm text-brand-text-primary">{project?.projectName || 'N/A'}</p>
                            </div>
                            <div className="flex justify-between items-end">
                                <div>
                                    <p className="text-[10px] text-brand-text-secondary uppercase tracking-widest mb-1">Tanggal TTD</p>
                                    <p className="text-sm text-brand-text-primary">{formatDate(contract.signingDate)}</p>
                                </div>
                                {project && (
                                    <div className="text-right">
                                        <p className="text-[10px] text-brand-text-secondary uppercase tracking-widest mb-1">Nilai</p>
                                        <p className="text-base font-bold text-brand-accent">{formatDisplayCurrency(project.totalCost)}</p>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Actions */}
                        <div className="p-3 bg-brand-bg border-t border-brand-border">
                            <div className="grid grid-cols-3 gap-2">
                                <button 
                                    onClick={() => onView(contract)} 
                                    className="flex flex-col items-center justify-center p-2 bg-blue-600 text-white hover:bg-blue-700 rounded-lg transition-colors shadow-sm"
                                >
                                    <EyeIcon className="w-5 h-5 mb-1"/>
                                    <span className="text-[10px] font-bold uppercase">Lihat</span>
                                </button>
                                <button 
                                    onClick={() => onEdit(contract)} 
                                    className="flex flex-col items-center justify-center p-2 bg-indigo-600 text-white hover:bg-indigo-700 rounded-lg transition-colors shadow-sm"
                                >
                                    <PencilIcon className="w-5 h-5 mb-1"/>
                                    <span className="text-[10px] font-bold uppercase">Edit</span>
                                </button>
                                <button 
                                    onClick={() => onDelete(contract.id)} 
                                    className="flex flex-col items-center justify-center p-2 bg-red-600 text-white hover:bg-red-700 rounded-lg transition-colors shadow-sm"
                                >
                                    <Trash2Icon className="w-5 h-5 mb-1"/>
                                    <span className="text-[10px] font-bold uppercase">Hapus</span>
                                </button>
                            </div>
                        </div>
                    </div>
                );
            })}
        </div>
    );
};
