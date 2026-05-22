import React from 'react';
import { Project, TeamMember, TeamProjectPayment, PaymentStatus } from '@/types';
import { EyeIcon } from '@/constants';

interface FreelancerProjectsProps {
    projects: Project[];
    teamProjectPayments: TeamProjectPayment[];
    member: TeamMember;
    formatCurrency: (amount: number) => string;
    formatDate: (dateString: string) => string;
    projectsToPay?: number[];
    onToggleProject?: (paymentId: number) => void;
    showOnlyUnpaid?: boolean;
}

export const FreelancerProjects: React.FC<FreelancerProjectsProps> = ({ 
    projects, 
    teamProjectPayments, 
    member,
    formatCurrency,
    formatDate,
    projectsToPay = [],
    onToggleProject,
    showOnlyUnpaid = false
}) => {
    const memberPayments = teamProjectPayments.filter(p => {
        const isMember = String(p.teamMemberId) === String(member.id);
        if (!isMember) return false;
        if (showOnlyUnpaid) return p.status === PaymentStatus.BELUM_BAYAR;
        return true;
    });
    
    const projectMap = new Map(projects.map(p => [p.id, p] as const));

    if (memberPayments.length === 0) {
        return (
            <div className="text-center py-12 bg-white/5 rounded-2xl border border-dashed border-white/10">
                <p className="text-brand-text-secondary">
                    {showOnlyUnpaid ? 'Tidak ada acara yang belum dibayar.' : 'Belum ada proyek yang ditugaskan.'}
                </p>
            </div>
        );
    }

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {memberPayments.map(payment => {
                const project = projectMap.get(payment.projectId);
                if (!project) return null;
                
                const isSelected = projectsToPay.includes(payment.id);

                return (
                    <div 
                        key={payment.id} 
                        className={`bg-white/5 backdrop-blur-md rounded-2xl border p-5 transition-all group shadow-lg ${
                            isSelected ? 'border-brand-accent ring-1 ring-brand-accent/50' : 'border-white/10 hover:border-brand-accent/30'
                        }`}
                    >
                        <div className="flex justify-between items-start mb-4">
                            <div className="flex-1">
                                <h3 className="font-bold text-lg text-brand-text-primary group-hover:text-brand-accent transition-colors">
                                    {project.projectName}
                                </h3>
                                <p className="text-xs text-brand-text-secondary mt-1">{formatDate(project.date)}</p>
                            </div>
                            <div className="flex flex-col items-end gap-2">
                                <div className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                                    payment.status === PaymentStatus.LUNAS 
                                    ? 'bg-green-500/20 text-green-400 border border-green-500/30' 
                                    : 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30'
                                }`}>
                                    {payment.status}
                                </div>
                                {onToggleProject && payment.status === PaymentStatus.BELUM_BAYAR && (
                                    <input
                                        type="checkbox"
                                        checked={isSelected}
                                        onChange={() => onToggleProject(payment.id)}
                                        className="w-5 h-5 rounded border-brand-border text-brand-accent focus:ring-brand-accent bg-transparent cursor-pointer"
                                    />
                                )}
                            </div>
                        </div>

                        <div className="space-y-3 mb-6">
                            <div className="flex justify-between items-center text-sm">
                                <span className="text-brand-text-secondary">Fee</span>
                                <span className="font-bold text-brand-text-primary">{formatCurrency(payment.fee)}</span>
                            </div>
                            <div className="flex justify-between items-center text-sm">
                                <span className="text-brand-text-secondary">Lokasi</span>
                                <span className="text-brand-text-primary truncate max-w-[150px]">{project.location}</span>
                            </div>
                        </div>

                        <button className="w-full py-2.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-xs font-bold text-brand-text-primary flex items-center justify-center gap-2 transition-all">
                            <EyeIcon className="w-4 h-4" />
                            Detail Proyek
                        </button>
                    </div>
                );
            })}
        </div>
    );
};

export default FreelancerProjects;
