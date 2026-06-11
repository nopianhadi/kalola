import React from 'react';
import { PencilIcon, Share2Icon, ArrowDownIcon, CheckCircleIcon } from 'lucide-react';
import {
    Project,
    AssignedTeamMember,
    Profile
} from '@/features/projects/types/project.types';
import {
    formatCurrency,
    getStatusClass,
    formatDateFull
} from '@/features/projects/utils/project.utils';

interface ProjectDetailsTabProps {
    selectedProject: Project;
    profile: Profile;
    teamByCategory: Record<string, Record<string, AssignedTeamMember[]>>;
    handleStatusUpdate: (status: string) => Promise<void>;
    handleSubStatusToggle: (name: string, checked: boolean) => Promise<void>;
    handleOpenForm: (mode: 'edit', project: Project) => void;
    handleOpenBriefingModal: () => void;
    onClose: () => void;
}

const ProjectDetailsTab: React.FC<ProjectDetailsTabProps> = ({
    selectedProject,
    profile,
    teamByCategory,
    handleStatusUpdate,
    handleSubStatusToggle,
    handleOpenForm,
    handleOpenBriefingModal,
    onClose
}) => {
    const allSubStatusesForCurrentStatus = selectedProject.customSubStatuses ||
        profile.projectStatusConfig.find(s => s.name === selectedProject.status)?.subStatuses || [];

    return (
        <div className="space-y-6 tab-content-mobile">
            {/* Mobile View */}
            <div className="md:hidden space-y-4">
                <div className="rounded-2xl bg-white/5 border border-brand-border p-4 shadow-sm">
                    <div className="flex items-start justify-between">
                        <div>
                            <p className="text-base font-semibold text-brand-text-light leading-tight">{selectedProject.projectName}</p>
                            <p className="text-xs text-brand-text-secondary mt-0.5">{selectedProject.clientName}</p>
                        </div>
                    </div>
                    <div className="mt-3 grid grid-cols-2 gap-y-2 text-sm">
                        <span className="text-brand-text-secondary">Tanggal</span>
                        <span className="text-brand-text-light text-right">{formatDateFull(selectedProject.date)}</span>
                        <span className="text-brand-text-secondary">Lokasi</span>
                        <span className="text-brand-text-light text-right">{selectedProject.location}</span>
                        <span className="text-brand-text-secondary">Alamat</span>
                        <span className="text-brand-text-light text-right text-xs">{selectedProject.address || '-'}</span>
                    </div>
                </div>



                <div className="rounded-2xl bg-white/5 border border-brand-border p-4 shadow-sm">
                    <div className="flex items-center justify-between mb-3 pb-3 border-b border-brand-border/30">
                        <h4 className="font-semibold text-brand-text-primary">Status Progres</h4>
                        <div className="relative">
                            <select
                                value={selectedProject.status}
                                onChange={(e) => handleStatusUpdate(e.target.value)}
                                className={`appearance-none px-3 py-1.5 pr-8 text-[11px] font-bold rounded-xl border-2 bg-white/5 ${getStatusClass(selectedProject.status, profile.projectStatusConfig)}`}
                            >
                                {profile.projectStatusConfig.map(s => (
                                    <option key={s.id} value={s.name} className="bg-brand-surface text-brand-text-primary">{s.name}</option>
                                ))}
                            </select>
                            <ArrowDownIcon className="absolute right-2 top-1/2 -translate-y-1/2 w-3 h-3 opacity-60 pointer-events-none" />
                        </div>
                    </div>
                    <h4 className="font-semibold text-brand-text-primary mb-3">Sub-tahapan</h4>
                    {allSubStatusesForCurrentStatus.length > 0 ? (
                        <div className="space-y-2">
                            {allSubStatusesForCurrentStatus.map(subStatus => {
                                const isActive = selectedProject.activeSubStatuses?.includes(subStatus.name);
                                return (
                                    <label key={subStatus.name} className={`flex items-center gap-3 p-3 rounded-xl border transition-all ${isActive ? 'bg-brand-accent/10 border-brand-accent' : 'bg-brand-surface border-brand-border'}`}>
                                        <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center ${isActive ? 'bg-brand-accent border-brand-accent' : 'border-brand-border'}`}>
                                            {isActive && <CheckCircleIcon className="w-4 h-4 text-white" />}
                                        </div>
                                        <input type="checkbox" className="hidden" checked={isActive} onChange={(e) => handleSubStatusToggle(subStatus.name, e.target.checked)} />
                                        <div className="min-w-0 flex-grow">
                                            <p className={`text-sm font-semibold truncate ${isActive ? 'text-brand-text-light' : 'text-brand-text-secondary'}`}>{subStatus.name}</p>
                                        </div>
                                    </label>
                                );
                            })}
                        </div>
                    ) : (
                        <p className="text-sm text-brand-text-secondary">Tidak ada sub-status aktif.</p>
                    )}
                </div>

                <div className="rounded-2xl bg-white/5 border border-brand-border p-4 shadow-sm">
                    <h4 className="font-semibold text-brand-text-primary mb-3">Tim & Vendor</h4>
                    {(['Tim', 'Vendor'] as const).map(category => (
                        <div key={category} className="mb-6 last:mb-0">
                            <h5 className={`text-sm font-bold uppercase tracking-wider mb-3 pb-1 border-b ${category === 'Tim' ? 'text-blue-400 border-blue-400/30' : 'text-purple-400 border-purple-400/30'}`}>
                                {category === 'Tim' ? 'Tim Internal' : 'Vendor'}
                            </h5>
                            {Object.entries(teamByCategory[category]).length > 0 ? (
                                Object.entries(teamByCategory[category]).map(([role, members]) => (
                                    <div key={role} className="mb-4 last:mb-0">
                                        <h6 className="text-[10px] uppercase text-brand-text-secondary mb-1.5 ml-1">{role}</h6>
                                        <div className="space-y-2">
                                            {members.map(member => (
                                                <div key={member.memberId} className="p-3 bg-brand-bg rounded-lg flex items-center justify-between">
                                                    <div>
                                                        <p className="text-sm text-brand-text-light font-medium">{member.name}</p>
                                                        {member.subJob && <p className="text-xs text-brand-text-secondary">{member.subJob}</p>}
                                                    </div>
                                                    <span className="font-semibold text-brand-text-primary text-xs">{formatCurrency(member.fee)}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <p className="text-xs text-brand-text-secondary italic ml-1">Belum ada {category === 'Tim' ? 'tim internal' : 'vendor'} yang ditugaskan.</p>
                            )}
                        </div>
                    ))}
                </div>

                <div className="rounded-2xl bg-white/5 border border-brand-border p-4 shadow-sm flex items-center gap-3">
                    <button type="button" onClick={() => { handleOpenForm('edit', selectedProject); onClose(); }} className="flex-1 py-2 px-4 rounded-xl bg-brand-surface border border-brand-border text-xs font-bold flex items-center justify-center gap-2">
                        <PencilIcon className="w-4 h-4" /> Edit
                    </button>
                    <button type="button" onClick={handleOpenBriefingModal} className="flex-1 py-2 px-4 rounded-xl bg-brand-surface border border-brand-border text-xs font-bold flex items-center justify-center gap-2">
                        <Share2Icon className="w-4 h-4" /> Briefing
                    </button>
                </div>
            </div>

            {/* Desktop View */}
            <div className="hidden md:block space-y-6">
                <div className="text-sm space-y-2 grid grid-cols-2 gap-4">
                    <p><strong className="font-semibold text-brand-text-secondary w-32 inline-block">Nama Pengantin:</strong> {selectedProject.clientName}</p>
                    <p><strong className="font-semibold text-brand-text-secondary w-32 inline-block">Tanggal Acara:</strong> {formatDateFull(selectedProject.date)}</p>
                    <p><strong className="font-semibold text-brand-text-secondary w-32 inline-block">Lokasi:</strong> {selectedProject.location}</p>
                    <p><strong className="font-semibold text-brand-text-secondary w-32 inline-block">Alamat:</strong> {selectedProject.address || '-'}</p>
                </div>



                <div>
                    <div className="flex items-center gap-4 mb-4 p-4 bg-brand-bg rounded-xl border border-brand-border/30">
                        <strong className="font-semibold text-brand-text-secondary w-32 inline-block">Status:</strong>
                        <div className="relative inline-block w-64">
                            <select
                                value={selectedProject.status}
                                onChange={(e) => handleStatusUpdate(e.target.value)}
                                className={`appearance-none w-full px-4 py-2 pr-10 text-sm font-bold rounded-xl border-2 bg-white/5 active:scale-95 transition-all cursor-pointer ${getStatusClass(selectedProject.status, profile.projectStatusConfig)}`}
                            >
                                {profile.projectStatusConfig.map(s => (
                                    <option key={s.id} value={s.name} className="bg-brand-surface text-brand-text-primary">{s.name}</option>
                                ))}
                            </select>
                            <ArrowDownIcon className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 opacity-60 pointer-events-none" />
                        </div>
                    </div>

                    <h4 className="font-semibold text-brand-text-primary mb-3">Sub-tahapan Pengerjaan</h4>
                    {allSubStatusesForCurrentStatus.length > 0 ? (
                        <div className="grid grid-cols-2 gap-3 p-4 bg-brand-bg rounded-lg">
                            {allSubStatusesForCurrentStatus.map(subStatus => {
                                const isActive = selectedProject.activeSubStatuses?.includes(subStatus.name);
                                return (
                                    <label key={subStatus.name} className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all ${isActive ? 'bg-brand-accent/10 border-brand-accent' : 'bg-brand-surface border-brand-border hover:border-brand-accent/50'}`}>
                                        <div className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center ${isActive ? 'bg-brand-accent border-brand-accent' : 'border-brand-border'}`}>
                                            {isActive && <CheckCircleIcon className="w-4 h-4 text-white" />}
                                        </div>
                                        <input type="checkbox" className="hidden" checked={isActive} onChange={(e) => handleSubStatusToggle(subStatus.name, e.target.checked)} />
                                        <div>
                                            <p className={`font-semibold ${isActive ? 'text-brand-text-light' : 'text-brand-text-secondary'}`}>{subStatus.name}</p>
                                            {subStatus.note && <p className="text-xs text-brand-text-secondary">{subStatus.note}</p>}
                                        </div>
                                    </label>
                                );
                            })}
                        </div>
                    ) : (
                        <p className="text-sm text-brand-text-secondary p-4 bg-brand-bg rounded-lg">Tidak ada sub-status aktif.</p>
                    )}
                </div>

                <div className="grid grid-cols-2 gap-6">
                    {(['Tim', 'Vendor'] as const).map(category => (
                        <div key={category} className="space-y-4">
                            <h5 className={`font-bold uppercase tracking-widest text-xs pb-2 border-b-2 flex items-center gap-2 ${category === 'Tim' ? 'text-blue-400 border-blue-400/20' : 'text-purple-400 border-purple-400/20'}`}>
                                <div className={`w-2 h-2 rounded-full ${category === 'Tim' ? 'bg-blue-400' : 'bg-purple-400'}`}></div>
                                {category === 'Tim' ? 'Tim Internal' : 'Vendor'}
                            </h5>
                            <div className="space-y-3">
                                {Object.entries(teamByCategory[category]).length > 0 ? (
                                    Object.entries(teamByCategory[category]).map(([role, members]) => (
                                        <div key={role} className="space-y-2">
                                            <h6 className="text-[10px] uppercase text-brand-text-secondary ml-1">{role}</h6>
                                            {members.map(member => (
                                                <div key={member.memberId} className="p-3 bg-brand-bg rounded-xl flex justify-between items-center border border-transparent hover:border-brand-border/50">
                                                    <div>
                                                        <p className="text-sm text-brand-text-light font-medium">{member.name}</p>
                                                        {member.subJob && <p className="text-[10px] text-brand-text-secondary">{member.subJob}</p>}
                                                    </div>
                                                    <div className="text-right">
                                                        <span className="text-[10px] text-brand-text-secondary opacity-60 mr-2">Fee</span>
                                                        <span className="font-semibold text-brand-text-primary text-sm">{formatCurrency(member.fee)}</span>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    ))
                                ) : (
                                    <p className="text-xs text-brand-text-secondary italic text-center py-4">Belum ada tugas.</p>
                                )}
                            </div>
                        </div>
                    ))}
                </div>

                <div className="flex justify-end gap-3 pt-4">
                    <button type="button" onClick={() => { handleOpenForm('edit', selectedProject); onClose(); }} className="px-6 py-2 rounded-xl bg-brand-surface border border-brand-border text-sm font-bold flex items-center gap-2 hover:bg-brand-bg transition-colors">
                        <PencilIcon className="w-4 h-4" /> Edit Acara Pernikahan
                    </button>
                    <button type="button" onClick={handleOpenBriefingModal} className="px-6 py-2 rounded-xl bg-brand-surface border border-brand-border text-sm font-bold flex items-center gap-2 hover:bg-brand-bg transition-colors">
                        <Share2Icon className="w-4 h-4" /> Bagikan Briefing Tim
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ProjectDetailsTab;
