import React, { useEffect, useMemo, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { LoadingState, Badge } from '@/shared/ui';

import { Project, Client, Transaction, TransactionType, ViewType, TeamMember, ClientFeedback, ClientStatus, NavigationAction, User, Profile, PaymentStatus } from '@/types';
import StatCard from '@/shared/ui/StatCard';
import StatCardModal from '@/shared/ui/StatCardModal';
import Modal from '@/shared/ui/Modal';
import { 
    DollarSignIcon, UsersIcon, BriefcaseIcon, 
    ChevronRightIcon, CalendarIcon, StarIcon, 
    TrendingUpIcon, AlertCircleIcon, MessageSquareIcon, 
    PhoneIcon 
} from '@/constants';
import DonutChart from '@/shared/ui/DonutChart';
import DashboardFilters, { DateRange } from './components/DashboardFilters';

import { useProjects } from '@/features/projects/api/useProjects';
import { useClients } from '@/features/clients/api/useClients';
import { useTeamMembers } from '@/features/team/api/useTeamQueries';
import { useProfile } from '@/features/settings/api/useProfileQueries';

import { useUIStore } from '@/store/uiStore';
import { useFinanceData } from '@/features/finance/hooks/useFinanceData';
import { listClientFeedback } from '@/services/clientFeedback';
import ClientDetailModal from '@/features/clients/components/ClientDetailModal';
import { usePackages } from '@/features/packages/api/usePackagesQueries';

// Helper Functions
const formatCurrency = (amount: number, minimumFractionDigits = 0) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits }).format(amount);
};



// --- Sub-components for Dashboard ---

const IncomeChartWidget: React.FC<{ transactions: Transaction[], dateRange: DateRange }> = ({ transactions, dateRange }) => {
    const [chartView, setChartView] = useState<'monthly' | 'yearly'>('monthly');

    const filteredTransactions = useMemo(() => {
        if (!dateRange.startDate) return transactions;
        return transactions.filter(t => {
            const d = new Date(t.date);
            return d >= dateRange.startDate! && d <= (dateRange.endDate || new Date());
        });
    }, [transactions, dateRange]);

    const chartData = useMemo(() => {
        const currentYear = new Date().getFullYear();
        if (chartView === 'yearly') {
            const totals: { [year: string]: { income: number, expense: number } } = {};
            filteredTransactions.forEach(t => {
                const year = new Date(t.date).getFullYear().toString();
                if (!totals[year]) totals[year] = { income: 0, expense: 0 };
                if (t.type === TransactionType.INCOME) totals[year].income += t.amount;
                else totals[year].expense += t.amount;
            });
            return Object.entries(totals)
                .sort(([yearA], [yearB]) => parseInt(yearA) - parseInt(yearB))
                .map(([year, values]) => ({ name: year, ...values }));
        } else {
            const months = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Ags", "Sep", "Okt", "Nov", "Des"];
            const data = months.map(month => ({ name: month, income: 0, expense: 0 }));
            filteredTransactions.forEach(t => {
                const d = new Date(t.date);
                if (d.getFullYear() === currentYear) {
                    const m = d.getMonth();
                    if (t.type === TransactionType.INCOME) data[m].income += t.amount;
                    else data[m].expense += t.amount;
                }
            });
            return data;
        }
    }, [filteredTransactions, chartView]);

    const maxVal = Math.max(...chartData.map(d => Math.max(d.income, d.expense)), 1);

    return (
        <div className="bg-brand-surface p-6 rounded-2xl shadow-lg h-full border border-brand-border">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h3 className="font-black text-sm uppercase tracking-widest text-brand-text-light">Analisis Kas & Profit</h3>
                    <div className="flex items-center gap-4 mt-2">
                        <div className="flex items-center gap-1.5">
                            <div className="w-2 h-2 rounded-full bg-brand-accent"></div>
                            <span className="text-[10px] text-brand-text-secondary uppercase font-bold tracking-tight">Income</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                            <div className="w-2 h-2 rounded-full bg-rose-500"></div>
                            <span className="text-[10px] text-brand-text-secondary uppercase font-bold tracking-tight">Expense</span>
                        </div>
                    </div>
                </div>
                <div className="p-1 bg-brand-bg rounded-lg flex items-center h-fit">
                    {(['monthly', 'yearly'] as const).map(view => (
                        <button
                            key={view}
                            onClick={() => setChartView(view)}
                            className={`px-3 py-1.5 text-[10px] font-black uppercase tracking-tighter rounded-md transition-all ${chartView === view ? 'bg-brand-accent text-white shadow-lg' : 'text-brand-text-secondary hover:text-brand-text-light'}`}
                        >
                            {view === 'monthly' ? 'Bulanan' : 'Tahunan'}
                        </button>
                    ))}
                </div>
            </div>
            <div className="h-56 flex justify-between items-end gap-2 mt-4">
                {chartData.map(item => (
                    <div key={item.name} className="flex-1 flex flex-col items-center justify-end h-full group relative">
                        <div className="absolute -top-12 left-1/2 -translate-x-1/2 hidden group-hover:flex flex-col items-center z-20">
                            <div className="bg-brand-surface border border-brand-border shadow-2xl p-2 rounded-lg text-[9px] whitespace-nowrap">
                                <p className="text-brand-accent font-bold">In: {formatCurrency(item.income, 0)}</p>
                                <p className="text-rose-400 font-bold">Out: {formatCurrency(item.expense, 0)}</p>
                            </div>
                            <div className="w-2 h-2 bg-brand-surface border-r border-b border-brand-border rotate-45 -mt-1"></div>
                        </div>
                        <div className="w-full flex items-end gap-0.5 h-full">
                            <div className="flex-1 bg-brand-accent/30 rounded-t-sm group-hover:bg-brand-accent transition-all duration-300 shadow-[0_0_15px_-5px_rgba(var(--brand-accent-rgb),0.4)]" style={{ height: `${(item.income / maxVal) * 100}%` }}></div>
                            <div className="flex-1 bg-rose-500/30 rounded-t-sm group-hover:bg-rose-500 transition-all duration-300 shadow-[0_0_15px_-5px_rgba(244,63,94,0.4)]" style={{ height: `${(item.expense / maxVal) * 100}%` }}></div>
                        </div>
                        <span className="text-[9px] font-black text-brand-text-secondary mt-3 uppercase tracking-tighter">{item.name}</span>
                    </div>
                ))}
            </div>
        </div>
    );
};



const RecentTransactionsWidget: React.FC<{ transactions: Transaction[], dateRange: DateRange }> = ({ transactions, dateRange }) => {
    const filtered = useMemo(() => {
        if (!dateRange.startDate) return transactions.slice(0, 6);
        return transactions.filter(t => {
            const d = new Date(t.date);
            return d >= dateRange.startDate! && d <= (dateRange.endDate || new Date());
        }).slice(0, 6);
    }, [transactions, dateRange]);

    return (
        <div className="bg-brand-surface p-6 rounded-2xl shadow-lg border border-brand-border h-full">
            <div className="flex justify-between items-center mb-6">
                <h3 className="font-black text-sm uppercase tracking-widest text-brand-text-light">Transaksi Terbaru</h3>
                <div className="p-2 bg-brand-bg rounded-lg text-brand-text-secondary">
                    <DollarSignIcon className="w-4 h-4" />
                </div>
            </div>
            <div className="space-y-4">
                {filtered.map(t => (
                    <div key={t.id} className="flex items-center gap-4 group p-2 hover:bg-white/5 rounded-xl transition-all">
                        <div className={`w-10 h-10 rounded-xl flex-shrink-0 flex items-center justify-center ${t.type === TransactionType.INCOME ? 'bg-brand-success/10' : 'bg-brand-danger/10'}`}>
                            <TrendingUpIcon className={`w-4 h-4 ${t.type === TransactionType.INCOME ? 'text-brand-success' : 'text-brand-danger'}`} />
                        </div>
                        <div className="flex-grow overflow-hidden">
                            <p className="font-bold text-brand-text-light truncate text-xs uppercase tracking-tight">{t.description}</p>
                            <p className="text-[10px] text-brand-text-secondary font-medium uppercase tracking-tighter mt-0.5">{new Date(t.date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}</p>
                        </div>
                        <div className={`font-black text-xs ${t.type === TransactionType.INCOME ? 'text-brand-success' : 'text-brand-text-light'}`}>
                            {t.type === TransactionType.INCOME ? '+' : '-'}{formatCurrency(t.amount, 0)}
                        </div>
                    </div>
                ))}
                {filtered.length === 0 && (
                    <div className="py-12 text-center">
                        <p className="text-xs text-brand-text-secondary font-bold uppercase tracking-widest">Tidak ada transaksi di periode ini</p>
                    </div>
                )}
            </div>
        </div>
    );
};

const PackageDistributionWidget: React.FC<{ projects: Project[], dateRange: DateRange }> = ({ projects, dateRange }) => {
    const filtered = useMemo(() => {
        if (!dateRange.startDate) return projects;
        return projects.filter(p => {
            const d = new Date(p.date);
            return d >= dateRange.startDate! && d <= (dateRange.endDate || new Date());
        });
    }, [projects, dateRange]);

    const distribution = useMemo(() => {
        const counts: Record<string, number> = {};
        filtered.forEach(p => {
            counts[p.packageName] = (counts[p.packageName] || 0) + 1;
        });
        const total = filtered.length || 1;
        return Object.entries(counts)
            .sort(([, a], [, b]) => b - a)
            .map(([name, count]) => ({ name, count, percentage: (count / total) * 100 }));
    }, [filtered]);

    return (
        <div className="bg-brand-surface p-6 rounded-2xl shadow-lg border border-brand-border h-full">
            <h3 className="font-black text-sm uppercase tracking-widest text-brand-text-light mb-6">Popularitas Paket</h3>
            <div className="space-y-5">
                {distribution.slice(0, 5).map((pkg, idx) => (
                    <div key={pkg.name}>
                        <div className="flex justify-between text-[11px] mb-2">
                            <span className="text-brand-text-light font-black uppercase tracking-tight truncate pr-4">{pkg.name}</span>
                            <span className="text-brand-text-secondary font-bold">{pkg.count} Booking</span>
                        </div>
                        <div className="w-full bg-brand-bg rounded-full h-2 overflow-hidden border border-brand-border/30">
                            <div 
                                className="h-full rounded-full bg-brand-accent transition-all duration-1000" 
                                style={{ width: `${pkg.percentage}%`, opacity: 1 - (idx * 0.15) }}
                            ></div>
                        </div>
                    </div>
                ))}
                {filtered.length === 0 && <p className="text-center text-xs text-brand-text-secondary py-8 font-bold uppercase">No Data</p>}
            </div>
        </div>
    );
};





const BusinessHealthWidget: React.FC<{ projects: Project[], transactions: Transaction[], dateRange: DateRange }> = ({ projects, transactions, dateRange }) => {
    const filteredProjects = useMemo(() => {
        if (!dateRange.startDate) return projects;
        return projects.filter(p => {
            const d = new Date(p.date);
            return d >= dateRange.startDate! && d <= (dateRange.endDate || new Date());
        });
    }, [projects, dateRange]);

    const filteredTransactions = useMemo(() => {
        if (!dateRange.startDate) return transactions;
        return transactions.filter(t => {
            const d = new Date(t.date);
            return d >= dateRange.startDate! && d <= (dateRange.endDate || new Date());
        });
    }, [transactions, dateRange]);

    const stats = useMemo(() => {
        const income = filteredTransactions.filter(t => t.type === TransactionType.INCOME).reduce((s, t) => s + t.amount, 0);
        const expense = filteredTransactions.filter(t => t.type === TransactionType.EXPENSE).reduce((s, t) => s + t.amount, 0);
        const margin = income > 0 ? ((income - expense) / income) * 100 : 0;
        
        const completed = filteredProjects.filter(p => p.status === 'Selesai').length;
        const total = filteredProjects.length || 1;
        const successRate = (completed / total) * 100;

        return [
            { label: 'Profit Margin', value: `${margin.toFixed(1)}%`, icon: <TrendingUpIcon className="w-4 h-4" />, color: 'text-brand-success', bg: 'bg-brand-success/10' },
            { label: 'Project Success', value: `${successRate.toFixed(1)}%`, icon: <StarIcon className="w-4 h-4" />, color: 'text-brand-accent', bg: 'bg-brand-accent/10' },
            { label: 'Average Revenue', value: formatCurrency(income / total, 0), icon: <DollarSignIcon className="w-4 h-4" />, color: 'text-brand-text-light', bg: 'bg-white/5' },
        ];
    }, [filteredProjects, filteredTransactions]);

    return (
        <div className="bg-brand-surface p-6 rounded-2xl shadow-lg border border-brand-border h-full">
            <h3 className="font-black text-sm uppercase tracking-widest text-brand-text-light mb-8">Statistik Vital Bisnis</h3>
            <div className="space-y-4">
                {stats.map(stat => (
                    <div key={stat.label} className="flex items-center justify-between p-4 bg-brand-bg rounded-2xl border border-brand-border/50 hover:border-brand-accent/30 transition-all hover:scale-[1.02] group">
                        <div className="flex items-center gap-4">
                            <div className={`p-2.5 rounded-xl transition-transform group-hover:scale-110 ${stat.bg} ${stat.color}`}>{stat.icon}</div>
                            <span className="text-xs font-black uppercase tracking-widest text-brand-text-secondary">{stat.label}</span>
                        </div>
                        <span className={`text-lg font-black tracking-tight ${stat.color}`}>{stat.value}</span>
                    </div>
                ))}
            </div>
        </div>
    );
};







const ProjectValueByTypeWidget: React.FC<{ projects: Project[], dateRange: DateRange }> = ({ projects, dateRange }) => {
    const filtered = useMemo(() => {
        if (!dateRange.startDate) return projects;
        return projects.filter(p => {
            const d = new Date(p.date);
            return d >= dateRange.startDate! && d <= (dateRange.endDate || new Date());
        });
    }, [projects, dateRange]);

    const valueData = useMemo(() => {
        const distribution: Record<string, number> = {};
        filtered.forEach(p => {
            const type = p.projectType || 'Standard';
            distribution[type] = (distribution[type] || 0) + p.totalCost;
        });

        const palette = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4'];
        return Object.entries(distribution)
            .sort(([, a], [, b]) => b - a)
            .map(([label, value], idx) => ({ 
                label, 
                value, 
                color: palette[idx % palette.length] 
            }));
    }, [filtered]);

    return (
        <div className="bg-brand-surface p-6 rounded-2xl shadow-lg border border-brand-border h-full flex flex-col">
            <h3 className="font-black text-sm uppercase tracking-widest text-brand-text-light mb-6">Segmentasi Proyek</h3>
            <div className="flex-grow flex items-center justify-center p-4">
                <DonutChart data={valueData} className="w-full" showValues={true} />
            </div>
        </div>
    );
};

const TeamWorkloadWidget: React.FC<{ teamMembers: TeamMember[], projects: Project[], dateRange: DateRange }> = ({ teamMembers, projects, dateRange }) => {
    const filteredProjects = useMemo(() => {
        if (!dateRange.startDate) return projects;
        return projects.filter(p => {
            const d = new Date(p.date);
            return d >= dateRange.startDate! && d <= (dateRange.endDate || new Date());
        });
    }, [projects, dateRange]);

    const workload = useMemo(() => {
        const counts: Record<string, number> = {};
        filteredProjects.forEach(p => {
            p.team?.forEach(member => {
                counts[member.memberId] = (counts[member.memberId] || 0) + 1;
            });
        });

        return teamMembers.map(m => ({
            name: m.name,
            role: m.role,
            count: counts[m.id] || 0
        })).sort((a, b) => b.count - a.count).slice(0, 6);
    }, [teamMembers, filteredProjects]);

    const maxCount = Math.max(...workload.map(w => w.count), 1);

    return (
        <div className="bg-brand-surface p-6 rounded-2xl shadow-lg border border-brand-border h-full">
            <h3 className="font-black text-sm uppercase tracking-widest text-brand-text-light mb-8">Kapasitas & Beban Kerja Tim</h3>
            <div className="space-y-6">
                {workload.map(member => (
                    <div key={member.name}>
                        <div className="flex justify-between items-center mb-2">
                            <div>
                                <span className="text-[11px] font-black uppercase text-brand-text-light tracking-tight">{member.name}</span>
                                <span className="text-[9px] font-bold text-brand-text-secondary uppercase ml-2 tracking-tighter opacity-70">{member.role}</span>
                            </div>
                            <span className="text-[10px] font-black text-brand-accent">{member.count} Proyek</span>
                        </div>
                        <div className="w-full bg-brand-bg rounded-full h-1.5 border border-brand-border/30">
                            <div className="h-full bg-brand-accent rounded-full transition-all duration-1000 shadow-[0_0_10px_rgba(var(--brand-accent-rgb),0.3)]" style={{ width: `${(member.count / maxCount) * 100}%` }}></div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

// --- Client Insights & Status Widgets ---

const ClientDrilldownModal: React.FC<{
    isOpen: boolean;
    onClose: () => void;
    title: string;
    description: string;
    clients: Client[];
    onViewDetail: (client: Client) => void;
}> = ({ isOpen, onClose, title, description, clients, onViewDetail }) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-brand-bg/80 backdrop-blur-md" onClick={onClose}></div>
            <div className="relative bg-brand-surface w-full max-w-2xl max-h-[85vh] rounded-3xl border border-brand-border shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
                <div className="p-6 border-b border-brand-border flex justify-between items-center bg-gradient-to-r from-brand-accent/5 to-transparent">
                    <div>
                        <h2 className="text-xl font-black text-brand-text-light uppercase tracking-tight">{title}</h2>
                        <p className="text-xs text-brand-text-secondary font-bold uppercase mt-1">{description}</p>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-brand-bg rounded-xl text-brand-text-secondary transition-colors">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                </div>

                <div className="flex-grow overflow-y-auto p-6 space-y-3 custom-scrollbar">
                    {clients.length > 0 ? (
                        clients.map(client => (
                            <div 
                                key={client.id} 
                                onClick={() => { onViewDetail(client); onClose(); }}
                                className="p-4 bg-brand-bg/50 rounded-2xl border border-brand-border/50 hover:border-brand-accent/40 hover:bg-brand-accent/5 transition-all cursor-pointer group flex justify-between items-center"
                            >
                                <div className="flex items-center gap-4">
                                    <div className="w-10 h-10 rounded-full bg-brand-accent/10 border border-brand-accent/20 flex items-center justify-center text-xs font-black text-brand-accent">
                                        {client.name.charAt(0)}
                                    </div>
                                    <div>
                                        <h4 className="font-black text-sm text-brand-text-light uppercase tracking-tight group-hover:text-brand-accent transition-colors">{client.name}</h4>
                                        <p className="text-[10px] text-brand-text-secondary font-bold uppercase">{client.whatsapp || 'No WhatsApp'}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3">
                                    <div className="text-right mr-2">
                                        <p className="text-[11px] font-black text-brand-text-light uppercase tracking-tighter">
                                            {(client as any).balanceDue > 0 ? 'Tagihan:' : 'Status:'}
                                        </p>
                                        <p className={`text-[10px] font-black uppercase ${(client as any).balanceDue > 0 ? 'text-rose-400' : 'text-emerald-400'}`}>
                                            {(client as any).balanceDue > 0 ? formatCurrency((client as any).balanceDue) : 'Lunas'}
                                        </p>
                                    </div>
                                    <ChevronRightIcon className="w-4 h-4 text-brand-text-secondary group-hover:text-brand-accent transition-colors" />
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className="flex flex-col items-center justify-center py-20 opacity-40">
                            <UsersIcon className="w-12 h-12 mb-4 text-brand-text-secondary" />
                            <p className="text-sm font-black uppercase tracking-widest text-brand-text-secondary">Tidak ada data klien</p>
                        </div>
                    )}
                </div>

                <div className="p-6 border-t border-brand-border bg-brand-bg/30">
                    <button 
                        onClick={onClose}
                        className="w-full py-3 bg-brand-surface hover:bg-brand-accent hover:text-white text-brand-text-light rounded-2xl text-xs font-black uppercase tracking-widest border border-brand-border hover:border-brand-accent transition-all"
                    >
                        Tutup Panel
                    </button>
                </div>
            </div>
        </div>
    );
};

const ClientStatusBreakdownWidget: React.FC<{ clients: any[], projects: Project[],
    onDrilldown: (label: string, filteredClients: Client[]) => void
}> = ({ clients, projects, onDrilldown }) => {
    const statusData = useMemo(() => {
        const activeCount = projects.filter(p => p.status !== 'Selesai' && p.status !== 'Dibatalkan').length;
        const unpaidCount = clients.filter(c => (c as any).balanceDue > 0).length;
        const totalCompleted = projects.filter(p => p.status === 'Selesai').length;
        const inactiveCount = Math.max(0, clients.length - activeCount - unpaidCount);

        return [
            { label: 'Aktif / On-Progress', value: activeCount, color: '#f472b6', type: 'active' }, // Pink
            { label: 'Tagihan Pending', value: unpaidCount, color: '#fb923c', type: 'unpaid' },   // Orange
            { label: 'Lunas & Selesai', value: totalCompleted, color: '#10b981', type: 'completed' }, // Green
            { label: 'Inaktif', value: inactiveCount, color: '#94a3b8', type: 'inactive' }           // Gray
        ];
    }, [clients, projects]);

    const handleChartClick = (item: any) => {
        let filtered: Client[] = [];
        switch(item.type) {
            case 'active':
                const activeProjectClientIds = projects.filter(p => p.status !== 'Selesai' && p.status !== 'Dibatalkan').map(p => p.clientId);
                filtered = clients.filter(c => activeProjectClientIds.includes(c.id));
                break;
            case 'unpaid':
                filtered = clients.filter(c => (c as any).balanceDue > 0);
                break;
            case 'completed':
                const completedIds = projects.filter(p => p.status === 'Selesai').map(p => p.clientId);
                filtered = clients.filter(c => completedIds.includes(c.id));
                break;
            case 'inactive':
            default:
                const busyIds = projects.map(p => p.clientId);
                filtered = clients.filter(c => !busyIds.includes(c.id));
                break;
        }
        onDrilldown(item.label, filtered);
    };

    return (
        <div className="bg-brand-surface p-6 rounded-2xl shadow-lg border border-brand-border h-full flex flex-col">
            <h3 className="font-black text-sm uppercase tracking-widest text-brand-text-light mb-6">Status Database Pengantin</h3>
            <div className="flex-grow flex items-center justify-center p-4">
                <DonutChart 
                    data={statusData} 
                    className="w-full" 
                    showValues={true} 
                    onClick={handleChartClick}
                />
            </div>
            <div className="mt-4 grid grid-cols-2 gap-2">
                {statusData.map(item => (
                    <div 
                        key={item.label} 
                        onClick={() => handleChartClick(item)}
                        className="flex items-center gap-2 p-2 bg-brand-bg hover:bg-brand-accent/5 rounded-lg border border-brand-border/30 cursor-pointer transition-colors group"
                    >
                        <div className="w-2 h-2 rounded-full" style={{ backgroundColor: item.color }}></div>
                        <span className="text-[9px] font-black uppercase text-brand-text-secondary truncate group-hover:text-brand-accent">{item.label}</span>
                        <span className="ml-auto text-[10px] font-black text-brand-text-light">{item.value}</span>
                    </div>
                ))}
            </div>
        </div>
    );
};

const RecentUnpaidClientsWidget: React.FC<{ clients: any[], 
    handleNavigation: (view: ViewType) => void,
    onViewClient: (client: Client) => void
}> = ({ clients, handleNavigation, onViewClient }) => {
    const unpaidClients = useMemo(() => {
        return clients
            .filter(c => (c as any).balanceDue > 0)
            .sort((a, b) => (b as any).balanceDue - (a as any).balanceDue)
            .slice(0, 5);
    }, [clients]);

    return (
        <div className="bg-brand-surface p-6 rounded-2xl shadow-lg border border-brand-border h-full flex flex-col">
            <div className="flex justify-between items-start mb-6">
                <div>
                    <h3 className="font-black text-sm uppercase tracking-widest text-brand-text-light">Tagihan Client Pending</h3>
                    <p className="text-[10px] text-brand-text-secondary font-black uppercase mt-1 tracking-tighter">Prioritas Pelunasan Piutang</p>
                </div>
                <button 
                    onClick={() => handleNavigation(ViewType.CLIENTS)}
                    className="p-2 bg-brand-bg hover:bg-brand-accent/10 text-brand-text-secondary hover:text-brand-accent rounded-xl transition-all border border-brand-border"
                >
                    <ChevronRightIcon className="w-4 h-4" />
                </button>
            </div>

            <div className="flex-grow space-y-3">
                {unpaidClients.map(client => (
                    <div 
                        key={client.id} 
                        onClick={() => onViewClient(client)}
                        className="p-3 bg-brand-bg rounded-xl border border-brand-border/50 hover:border-brand-accent/30 transition-all flex justify-between items-center group cursor-pointer"
                    >
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-brand-accent/10 border border-brand-accent/20 flex items-center justify-center text-[10px] font-black text-brand-accent">
                                {client.name.charAt(0)}
                            </div>
                            <div>
                                <p className="text-[11px] font-black text-brand-text-light uppercase tracking-tight group-hover:text-brand-accent transition-colors">{client.name}</p>
                                <p className="text-[9px] text-brand-text-secondary font-bold uppercase">{client.whatsapp || 'No WA'}</p>
                            </div>
                        </div>
                        <div className="text-right">
                            <p className="text-[11px] font-black text-rose-400">{formatCurrency((client as any).balanceDue || 0)}</p>
                            <p className="text-[8px] text-brand-text-secondary font-black uppercase tracking-widest">Sisa</p>
                        </div>
                    </div>
                ))}

                {unpaidClients.length === 0 && (
                    <div className="flex flex-col items-center justify-center h-48 opacity-40">
                        <StarIcon className="w-8 h-8 mb-2 text-brand-success" />
                        <p className="text-[10px] font-black uppercase tracking-widest text-brand-text-secondary">Semua Lunas!</p>
                    </div>
                )}
            </div>
            
            <button 
                onClick={() => handleNavigation(ViewType.CLIENTS)}
                className="mt-6 w-full py-3 bg-brand-bg hover:bg-brand-accent text-brand-text-secondary hover:text-white rounded-xl text-[10px] font-black uppercase tracking-[0.2em] transition-all border border-brand-border hover:border-brand-accent shadow-sm"
            >
                Kelola Database Klien
            </button>
        </div>
    );
};

// --- Main Dashboard Component ---

interface DashboardProps {
    handleNavigation?: (view: ViewType, action?: NavigationAction) => void;
    currentUser?: User | null;
}

const Dashboard: React.FC<DashboardProps> = () => {
    const navigate = useNavigate();
    const { setActiveView } = useUIStore();

    const handleNavigation = useCallback((view: ViewType) => {
        setActiveView(view);
        const pathMap: Partial<Record<ViewType, string>> = {
            [ViewType.HOMEPAGE]: "/",
            [ViewType.DASHBOARD]: "/dashboard",
            [ViewType.CLIENTS]: "/clients",
            [ViewType.PROJECTS]: "/projects",
            [ViewType.TEAM]: "/team",
            [ViewType.FINANCE]: "/finance",
            [ViewType.PACKAGES]: "/packages",
            [ViewType.BOOKING]: "/booking",
            [ViewType.CALENDAR]: "/calendar",
            [ViewType.SETTINGS]: "/settings",
            [ViewType.CONTRACTS]: "/kontrak",
        };
        const newPath = pathMap[view] || `/${view.toLowerCase().replace(/ /g, "-")}`;
        navigate(newPath);
    }, [setActiveView, navigate]);

    const { data: profile } = useProfile();


    const [dateRange, setDateRange] = useState<DateRange>({ type: 'all', startDate: null, endDate: null });
    const [activeModal, setActiveModal] = useState<'balance' | 'projects' | 'clients' | 'teamMembers' | 'payments' | null>(null);

    const { data: projects = [] } = useProjects();
    const { data: clients = [] } = useClients();
    const { data: teamMembers = [] } = useTeamMembers();
    const { data: packages = [] } = usePackages();
    const { transactions, cards } = useFinanceData();
    const [feedback, setFeedback] = useState<ClientFeedback[]>([]);

    // State for Drilldown Modals
    const [drilldown, setDrilldown] = useState<{
        isOpen: boolean;
        title: string;
        description: string;
        clients: Client[];
    }>({
        isOpen: false,
        title: '',
        description: '',
        clients: []
    });

    const handleOpenDrilldown = (title: string, description: string, filteredClients: Client[]) => {
        setDrilldown({
            isOpen: true,
            title,
            description,
            clients: filteredClients
        });
    };

    const [selectedClientForModal, setSelectedClientForModal] = useState<Client | null>(null);

    useEffect(() => {
        listClientFeedback().then(setFeedback).catch(console.error);
    }, []);



    const summary = useMemo(() => {
        const now = new Date();
        const start = dateRange.startDate || new Date(now.getFullYear(), now.getMonth(), 1);
        const end = dateRange.endDate || new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);

        const projsInPeriod = projects.filter(p => {
            const d = new Date(p.date);
            return d >= start && d <= end;
        });

        const txsInPeriod = transactions.filter(t => {
            const d = new Date(t.date);
            return d >= start && d <= end;
        });

        const incomeInPeriod = txsInPeriod
            .filter(t => t.type === TransactionType.INCOME)
            .reduce((sum, t) => sum + t.amount, 0);

        const newLeadsInPeriod = [].filter(l => {
            const d = new Date(l.date);
            return d >= start && d <= end;
        }).length;

        const activeProjs = projects.filter(p => p.status !== 'Selesai' && p.status !== 'Dibatalkan').length;
        const activeClis = clients.filter(c => c.status === ClientStatus.ACTIVE).length;
        const unpaidInv = projects.filter(p => p.paymentStatus !== PaymentStatus.LUNAS && p.status !== 'Dibatalkan').length;

        const avgSatisfaction = feedback.length > 0 
            ? feedback.reduce((sum, f) => sum + f.rating, 0) / feedback.length 
            : 4.8;

        const newClientsInPeriod = clients.filter(c => {
            const d = new Date(c.since);
            return d >= start && d <= end;
        }).length;

        const clientsWaitingFollowup = [].filter(l => l.status === "").length;

        return {
            totalBalance: cards.reduce((sum, c) => sum + Number(c.balance), 0),
            activeProjects: activeProjs,
            activeClients: activeClis,
            eventsInPeriod: projsInPeriod.length,
            incomeInPeriod: incomeInPeriod,
            newLeadsInPeriod: newLeadsInPeriod,
            unpaidInvoices: unpaidInv,
            totalTeamCount: teamMembers.length,
            avgSatisfaction: avgSatisfaction,
            newClientsInPeriod: newClientsInPeriod,
            clientsWaitingFollowup: clientsWaitingFollowup,
            periodLabel: dateRange.type === 'all' ? 'Sepanjang Waktu' : 
                         dateRange.type === 'today' ? 'Hari Ini' :
                         dateRange.type === 'last7' ? '7 Hari Terakhir' :
                         dateRange.type === 'last30' ? '30 Hari Terakhir' :
                         dateRange.type === 'thisMonth' ? 'Bulan Ini' : 'Tahun Ini'
        };
    }, [projects, transactions, [], cards, clients, dateRange, teamMembers.length, feedback]);



    if (!profile) return <div className="flex items-center justify-center min-h-[400px]"><LoadingState size="large" /></div>;

    const modalTitles: Record<string, string> = {
        balance: 'Rincian Saldo',
        projects: 'Daftar Acara Aktif',
        clients: 'Daftar Pengantin Aktif',
        teamMembers: 'Anggota Tim & Vendor',
        payments: 'Fee Tim Menunggu Pembayaran'
    };

    return (
        <div className="flex flex-col gap-8 p-4 md:p-8 animate-in fade-in slide-in-from-bottom-6 duration-700 bg-brand-bg/50">
            {/* Drilldown Modal */}
            <ClientDrilldownModal 
                isOpen={drilldown.isOpen}
                onClose={() => setDrilldown(prev => ({ ...prev, isOpen: false }))}
                title={drilldown.title}
                description={drilldown.description}
                clients={drilldown.clients}
                onViewDetail={(c) => setSelectedClientForModal(c)}
            />

            {/* Client Detail Modal */}
            {selectedClientForModal && (
                <ClientDetailModal 
                    isOpen={!!selectedClientForModal}
                    onClose={() => setSelectedClientForModal(null)}
                    client={selectedClientForModal as any}
                    projects={projects}
                    transactions={transactions}
                    packages={packages}
                    cards={cards}
                    onEditClient={() => {
                        handleNavigation(ViewType.CLIENTS);
                    }}
                    onDeleteClient={() => {}}
                    onViewReceipt={() => {}}
                    onViewInvoice={() => {}}
                    handleNavigation={handleNavigation}
                    onRecordPayment={async () => {}}
                    onSharePortal={() => {}}
                    onDeleteProject={async () => {}}
                    showNotification={(msg: string) => console.log(msg)}
                    userProfile={profile || {} as Profile}
                    setProjects={() => {}}
                    setTransactions={() => {}}
                    setCards={() => {}}
                />
            )}

            {/* Master Header */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-brand-border/30 pb-8">
                <div>
                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 bg-brand-accent rounded-xl shadow-[0_0_20px_rgba(var(--brand-accent-rgb),0.3)]">
                            <TrendingUpIcon className="w-5 h-5 text-white" />
                        </div>
                        <h1 className="text-4xl font-black text-brand-text-light tracking-tighter uppercase italic">Control Center</h1>
                    </div>
                    <p className="text-brand-text-secondary font-black text-[11px] uppercase tracking-[0.3em] pl-1">Intelligent Business Analytics & Operations</p>
                </div>
                <div className="flex-grow max-w-2xl">
                    <DashboardFilters dateRange={dateRange} onChange={setDateRange} />
                </div>
            </div>

            {/* Top Info Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                <StatCard
                    icon={<DollarSignIcon />}
                    title="Liquid Assets"
                    value={formatCurrency(summary.totalBalance)}
                    subtitle="Current Cash on Hand"
                    colorVariant="blue"
                    onClick={() => setActiveModal('balance')}
                />
                <StatCard
                    icon={<UsersIcon />}
                    title="Total Pengantin"
                    value={summary.activeClients.toString()}
                    subtitle="Active Client Portfolios"
                    colorVariant="pink"
                    onClick={() => setActiveModal('clients')}
                />
                <StatCard
                    icon={<CalendarIcon />}
                    title={`Sessions - ${summary.periodLabel}`}
                    value={summary.eventsInPeriod.toString()}
                    subtitle="Booked Wedding Dates"
                    colorVariant="purple"
                    onClick={() => setActiveModal('projects')}
                />
                <StatCard
                    icon={<TrendingUpIcon />}
                    title={`Revenue - ${summary.periodLabel}`}
                    value={formatCurrency(summary.incomeInPeriod)}
                    subtitle="Gross Income Received"
                    colorVariant="green"
                />
                <StatCard
                    icon={<UsersIcon />}
                    title={`Market Leads - ${summary.periodLabel}`}
                    value={summary.newLeadsInPeriod.toString()}
                    subtitle="Inbound Potential Clients"
                    colorVariant="orange"
                    onClick={() => setActiveModal('clients')}
                />
            </div>


            {/* Section 1: Marketing & Funnel */}
            <section className="space-y-6 pt-4">
                <div className="flex items-center gap-4">
                    <div className="p-2 bg-brand-surface border border-brand-border rounded-xl">
                        <UsersIcon className="w-5 h-5 text-brand-accent" />
                    </div>
                    <div>
                        <h2 className="text-2xl font-black text-brand-text-light tracking-tighter uppercase italic">Marketing & Funnel</h2>
                        <p className="text-[10px] text-brand-text-secondary font-black uppercase tracking-widest mt-1">Lead Generation & Acquisition Performance</p>
                    </div>
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                    <div className="lg:col-span-8">
                        
                    </div>
                    <div className="lg:col-span-4">
                        
                    </div>
                    <div className="lg:col-span-4">
                        
                    </div>
                    <div className="lg:col-span-4">
                        
                    </div>
                </div>
            </section>

            {/* Section 2: Client Management */}
            <section className="space-y-6 pt-8 border-t border-brand-border/30">
                <div className="flex items-center gap-4">
                    <div className="p-2 bg-brand-surface border border-brand-border rounded-xl">
                        <MessageSquareIcon className="w-5 h-5 text-pink-400" />
                    </div>
                    <div>
                        <h2 className="text-2xl font-black text-brand-text-light tracking-tighter uppercase italic">Client Insights & Management</h2>
                        <p className="text-[10px] text-brand-text-secondary font-black uppercase tracking-widest mt-1">CRM, Interaction Trend & Retention Strategy</p>
                    </div>
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                    <div className="lg:col-span-9">
                        
                    </div>
                    <div className="lg:col-span-3 flex flex-col gap-4">
                        <StatCard 
                            icon={<UsersIcon />} 
                            title="Total Klien Aktif" 
                            value={summary.activeClients.toString()} 
                            subtitle="Proyek Berjalan" 
                            colorVariant="pink" 
                            onClick={() => {
                                const activeProjectClientIds = projects.filter(p => p.status !== 'Selesai' && p.status !== 'Dibatalkan').map(p => p.clientId);
                                const filtered = clients.filter(c => activeProjectClientIds.includes(c.id));
                                handleOpenDrilldown("Klien Aktif", "Daftar klien dengan proyek yang sedang berjalan", filtered);
                            }}
                        />
                        <StatCard 
                            icon={<StarIcon />} 
                            title="Indeks Kepuasan" 
                            value={summary.avgSatisfaction.toFixed(1)} 
                            subtitle="Rating Klien" 
                            colorVariant="orange" 
                            onClick={() => {
                                // Potentially drilldown to feedback list
                                handleNavigation(ViewType.CLIENTS);
                            }}
                        />
                        <StatCard 
                            icon={<PhoneIcon />} 
                            title="Follow-up Pending" 
                            value={summary.clientsWaitingFollowup.toString()} 
                            subtitle="Leads Menunggu" 
                            colorVariant="blue" 
                            onClick={() => {
                                const filtered = [].map(l => ({ ...l, id: l.id || Math.random().toString(), isLead: true } as any));
                                handleOpenDrilldown("Follow-up Menunggu", "Daftar prospek ([]) yang belum dihubungi", filtered);
                            }}
                        />
                    </div>
                    
                    {/* Insights from Client database */}
                    <div className="lg:col-span-4">
                        <ClientStatusBreakdownWidget clients={clients as any} projects={projects} onDrilldown={(label, filtered) => handleOpenDrilldown(label, `Daftar Klien ${label}`, filtered as any)} />
                    </div>
                    <div className="lg:col-span-4">
                        <RecentUnpaidClientsWidget 
                            clients={clients as any} 
                            handleNavigation={handleNavigation} 
                            onViewClient={(c) => setSelectedClientForModal(c)}
                        />
                    </div>
                    <div className="lg:col-span-4">
                         <div className="bg-brand-surface p-6 rounded-2xl shadow-lg border border-brand-border h-full flex flex-col justify-center items-center text-center relative overflow-hidden group">
                            <div className="absolute inset-0 bg-gradient-to-br from-brand-accent/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                            <div className="w-16 h-16 rounded-3xl bg-brand-accent/10 border border-brand-accent/20 flex items-center justify-center mb-6 shadow-xl group-hover:scale-110 transition-transform">
                                <UsersIcon className="w-8 h-8 text-brand-accent" />
                            </div>
                            <h3 className="text-xl font-black text-brand-text-light uppercase tracking-tighter italic mb-2">Database Klien Lengkap</h3>
                            <p className="text-[11px] text-brand-text-secondary font-medium px-4 mb-8">Akses seluruh riwayat pengantin, kontrak digital, dan progres timeline acara dalam satu modul terpusat.</p>
                            <button 
                                onClick={() => handleNavigation(ViewType.CLIENTS)}
                                className="px-8 py-3 bg-brand-accent text-white rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] shadow-[0_0_20px_rgba(var(--brand-accent-rgb),0.3)] hover:scale-105 transition-all"
                            >
                                Buka Modul Klien
                            </button>
                         </div>
                    </div>
                </div>
            </section>

            {/* Section 2: Operations & Workforce */}
            <section className="space-y-8 pt-8 border-t border-brand-border/30">
                <div className="flex items-center gap-4">
                    <div className="p-2 bg-brand-surface border border-brand-border rounded-xl">
                        <BriefcaseIcon className="w-5 h-5 text-purple-400" />
                    </div>
                    <div>
                        <h2 className="text-2xl font-black text-brand-text-light tracking-tighter uppercase italic">Operations & Workforce</h2>
                        <p className="text-[10px] text-brand-text-secondary font-black uppercase tracking-widest mt-1">Project Distribution & Team Capacity</p>
                    </div>
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                    <div className="lg:col-span-4">
                        <TeamWorkloadWidget teamMembers={teamMembers} projects={projects} dateRange={dateRange} />
                    </div>
                    <div className="lg:col-span-4">
                        <PackageDistributionWidget projects={projects} dateRange={dateRange} />
                    </div>
                    <div className="lg:col-span-4">
                        <ProjectValueByTypeWidget projects={projects} dateRange={dateRange} />
                    </div>
                </div>
            </section>

            {/* Section 3: Finance & Business Health */}
            <section className="space-y-8 pt-8 border-t border-brand-border/30">
                <div className="flex items-center gap-4">
                    <div className="p-2 bg-brand-surface border border-brand-border rounded-xl">
                        <DollarSignIcon className="w-5 h-5 text-brand-success" />
                    </div>
                    <div>
                        <h2 className="text-2xl font-black text-brand-text-light tracking-tighter uppercase italic">Financial Performance</h2>
                        <p className="text-[10px] text-brand-text-secondary font-black uppercase tracking-widest mt-1">Cashflow, Profit Margins & Asset Health</p>
                    </div>
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                    <div className="lg:col-span-9">
                        <IncomeChartWidget transactions={transactions} dateRange={dateRange} />
                    </div>
                    <div className="lg:col-span-3 flex flex-col gap-4">
                        <StatCard 
                            icon={<AlertCircleIcon />} 
                            title="Unpaid Invoices" 
                            value={summary.unpaidInvoices.toString()} 
                            subtitle="Pending Balance" 
                            colorVariant="pink" 
                        />
                         <StatCard 
                            icon={<UsersIcon />} 
                            title="Active Team" 
                            value={summary.totalTeamCount.toString()} 
                            subtitle="Workforce Strength" 
                            colorVariant="blue" 
                            onClick={() => setActiveModal('teamMembers')}
                        />
                    </div>
                    <div className="lg:col-span-4">
                        <BusinessHealthWidget projects={projects} transactions={transactions} dateRange={dateRange} />
                    </div>
                    <div className="lg:col-span-8">
                        <RecentTransactionsWidget transactions={transactions} dateRange={dateRange} />
                    </div>
                </div>
            </section>

            {/* Modals */}
            <StatCardModal
                isOpen={activeModal === 'balance'}
                onClose={() => setActiveModal(null)}
                icon={<DollarSignIcon />}
                title="Asset Distribution"
                value={formatCurrency(summary.totalBalance)}
                colorVariant="blue"
            >
                <div className="space-y-6">
                    <div className="grid grid-cols-1 gap-3">
                        {cards.map(card => (
                            <div key={card.id} className="p-4 bg-brand-bg rounded-2xl flex justify-between items-center border border-brand-border/50">
                                <div>
                                    <p className="font-black text-[10px] uppercase tracking-widest text-brand-text-secondary">{card.bankName}</p>
                                    <p className="font-bold text-brand-text-light">{String(card.id) !== String('CARD_CASH') ? `**** ${card.lastFourDigits}` : 'Physical Cash'}</p>
                                </div>
                                <p className="font-black text-brand-accent">{formatCurrency(card.balance)}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </StatCardModal>

            <StatCardModal
                isOpen={activeModal === 'projects'}
                onClose={() => setActiveModal(null)}
                icon={<CalendarIcon />}
                title="Active Sessions"
                value={summary.activeProjects.toString()}
                colorVariant="purple"
            >
                <div className="space-y-3">
                    {projects.filter(p => p.status !== 'Selesai' && p.status !== 'Dibatalkan').map(project => (
                        <div key={project.id} className="p-4 bg-brand-bg rounded-2xl border border-brand-border/50 hover:border-brand-accent/50 transition-all cursor-pointer" onClick={() => { setActiveModal(null); handleNavigation(ViewType.PROJECTS); }}>
                            <div className="flex justify-between items-start mb-2">
                                <p className="font-black text-xs uppercase tracking-tight text-brand-text-light">{project.projectName}</p>
                                <Badge variant={project.status === 'Selesai' ? 'success' : project.status === 'Dibatalkan' ? 'danger' : 'warning'} size="xs">
                                    {project.status}
                                </Badge>
                            </div>
                            <p className="text-[10px] text-brand-text-secondary font-bold uppercase">{project.clientName}</p>
                        </div>
                    ))}
                </div>
            </StatCardModal>

            <StatCardModal
                isOpen={activeModal === 'teamMembers'}
                onClose={() => setActiveModal(null)}
                icon={<BriefcaseIcon />}
                title="Workforce Directory"
                value={summary.totalTeamCount.toString()}
                colorVariant="orange"
            >
                <div className="space-y-3">
                    {teamMembers.map(member => (
                        <div key={member.id} className="p-4 bg-brand-bg rounded-2xl border border-brand-border/50 flex justify-between items-center">
                            <div>
                                <p className="font-black text-xs uppercase tracking-tight text-brand-text-light">{member.name}</p>
                                <p className="text-[10px] text-brand-text-secondary font-bold uppercase">{member.role}</p>
                            </div>
                            <span className="text-[10px] font-black p-2 bg-brand-surface rounded-xl text-brand-accent">{member.category}</span>
                        </div>
                    ))}
                </div>
            </StatCardModal>

            {/* Other generic modal */}
            <Modal isOpen={!!activeModal && !['balance', 'projects', 'teamMembers'].includes(activeModal)} onClose={() => setActiveModal(null)} title={activeModal ? modalTitles[activeModal] : ''} size="2xl">
                <div className="p-4 text-center">
                    <p className="text-xs text-brand-text-secondary font-bold uppercase">Detail info available in module pages</p>
                </div>
            </Modal>
        </div>
    );
};

export default Dashboard;
