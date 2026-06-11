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
    onNavigateToProject?: (projectId: number) => void;
}

export const FreelancerProjects: React.FC<FreelancerProjectsProps> = ({ 
    projects, 
    teamProjectPayments, 
    member,
    formatCurrency,
    formatDate,
    projectsToPay = [],
    onToggleProject,
    showOnlyUnpaid = false,
    onNavigateToProject,
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

    const getClientPaymentBadge = (project: Project) => {
        switch (project.paymentStatus) {
            case PaymentStatus.LUNAS:
                return { label: 'Klien Lunas', cls: 'bg-emerald-600 text-white border-emerald-600' };
            case PaymentStatus.DP_TERBAYAR:
                return { label: 'DP Terbayar', cls: 'bg-blue-600 text-white border-blue-600' };
            default:
                return { label: 'Klien Belum Bayar', cls: 'bg-red-600 text-white border-red-600' };
        }
    };

    return (
        <div className="overflow-hidden rounded-2xl border border-brand-border bg-brand-surface">
            <div className="overflow-x-auto">
                <table className="w-full min-w-[980px] text-left">
                    <thead className="bg-brand-bg/80">
                        <tr className="border-b border-brand-border/60">
                            {onToggleProject && <th className="w-12 px-4 py-4" />}
                            <th className="px-4 py-4 text-[11px] font-black uppercase tracking-widest text-brand-text-secondary">Proyek</th>
                            <th className="px-4 py-4 text-[11px] font-black uppercase tracking-widest text-brand-text-secondary">Tanggal</th>
                            <th className="px-4 py-4 text-[11px] font-black uppercase tracking-widest text-brand-text-secondary">Honor</th>
                            <th className="px-4 py-4 text-[11px] font-black uppercase tracking-widest text-brand-text-secondary">Pengantin</th>
                            <th className="px-4 py-4 text-[11px] font-black uppercase tracking-widest text-brand-text-secondary">Bayar Klien</th>
                            <th className="px-4 py-4 text-[11px] font-black uppercase tracking-widest text-brand-text-secondary text-right">Sisa Tagihan</th>
                            <th className="px-4 py-4 text-[11px] font-black uppercase tracking-widest text-brand-text-secondary text-right">Honor Tim</th>
                            <th className="px-4 py-4 text-[11px] font-black uppercase tracking-widest text-brand-text-secondary">Lokasi</th>
                            <th className="w-16 px-4 py-4 text-right text-[11px] font-black uppercase tracking-widest text-brand-text-secondary">Aksi</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-brand-border/40">
                        {memberPayments.map(payment => {
                            const project = projectMap.get(payment.projectId);
                            if (!project) return null;

                            const isSelected = projectsToPay.includes(payment.id);
                            const clientBadge = getClientPaymentBadge(project);
                            const remainingBill = Math.max(0, project.totalCost - project.amountPaid);
                            const packageName = project.packageName ? ` (${project.packageName})` : '';

                            return (
                                <tr
                                    key={payment.id}
                                    className={`transition-colors hover:bg-blue-50 ${isSelected ? 'bg-blue-100' : ''}`}
                                >
                                    {onToggleProject && (
                                        <td className="px-4 py-4 align-middle">
                                            {payment.status === PaymentStatus.BELUM_BAYAR && (
                                                <input
                                                    type="checkbox"
                                                    checked={isSelected}
                                                    onChange={() => onToggleProject(payment.id)}
                                                    aria-label={`Pilih ${project.projectName} untuk dibayar`}
                                                    className="h-4 w-4 rounded border-brand-border bg-transparent text-brand-accent focus:ring-brand-accent"
                                                />
                                            )}
                                        </td>
                                    )}
                                    <td className="px-4 py-4 align-middle">
                                        <p className="max-w-[240px] truncate text-sm font-black text-brand-text-primary" title={`${project.projectName}${packageName}`}>
                                            {project.projectName}{packageName}
                                        </p>
                                    </td>
                                    <td className="px-4 py-4 align-middle text-sm font-medium text-brand-text-secondary whitespace-nowrap">
                                        {formatDate(project.date)}
                                    </td>
                                    <td className="px-4 py-4 align-middle">
                                        <span className={`inline-flex rounded-full border px-2.5 py-1 text-[10px] font-black uppercase tracking-wider ${
                                            payment.status === PaymentStatus.LUNAS
                                                ? 'border-green-600 bg-green-600 text-white'
                                                : 'border-amber-500 bg-amber-500 text-white'
                                        }`}>
                                            {payment.status}
                                        </span>
                                    </td>
                                    <td className="px-4 py-4 align-middle text-sm font-bold text-brand-text-primary">
                                        <span className="block max-w-[150px] truncate" title={project.clientName}>{project.clientName}</span>
                                    </td>
                                    <td className="px-4 py-4 align-middle">
                                        <span className={`inline-flex rounded-full border px-2.5 py-1 text-[10px] font-black uppercase tracking-wider ${clientBadge.cls}`}>
                                            {clientBadge.label.replace('Klien ', '')}
                                        </span>
                                    </td>
                                    <td className="px-4 py-4 align-middle text-right text-sm font-black text-red-400 whitespace-nowrap">
                                        {remainingBill > 0 ? formatCurrency(remainingBill) : '-'}
                                    </td>
                                    <td className="px-4 py-4 align-middle text-right text-sm font-black text-brand-text-primary whitespace-nowrap">
                                        {formatCurrency(payment.fee)}
                                    </td>
                                    <td className="px-4 py-4 align-middle text-sm font-medium text-brand-text-secondary">
                                        <span className="block max-w-[160px] truncate" title={project.location}>{project.location || '-'}</span>
                                    </td>
                                    <td className="px-4 py-4 align-middle text-right">
                                        <button
                                            type="button"
                                            onClick={() => onNavigateToProject && onNavigateToProject(project.id)}
                                            className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-brand-accent bg-brand-accent text-white shadow-sm transition-all hover:bg-brand-accent-hover"
                                            title="Detail Proyek"
                                            aria-label={`Buka detail ${project.projectName}`}
                                        >
                                            <EyeIcon className="h-4 w-4" />
                                        </button>
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

export default FreelancerProjects;
