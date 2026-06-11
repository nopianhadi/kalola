import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { TeamMember, AssignedTeamMember, TeamProjectPayment, TeamPaymentRecord, Project, PaymentStatus } from '@/types';
import { useTeamMembers, useTeamProjectPayments, useTeamPaymentRecords, useTeamMembersPaginated } from '@/features/team/api/useTeamQueries';
import { useProjects } from '@/features/projects/api/useProjects';

import PageHeader from '@/layouts/PageHeader';
import Modal from '@/shared/ui/Modal';
import StatCard from '@/shared/ui/StatCard';
import { Button } from '@/shared/ui';
import { PlusIcon, PencilIcon, Trash2Icon, EyeIcon, StarIcon, UsersIcon, AlertCircleIcon, UserCheckIcon, DownloadIcon, CalendarIcon, DollarSignIcon } from '@/constants';
import { deleteTeamMember as deleteTeamMemberRow } from '@/services/teamMembers';
import { useApp } from "@/app/AppContext";
import { AvatarDisplay } from '@/shared/ui/AvatarUpload';

const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(amount);
}

const formatDate = (dateString: string) => {
    if (!dateString) return '';
    return new Date(dateString).toLocaleDateString('id-ID', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
};

const getStatusClass = (status: PaymentStatus) => {
    return status === PaymentStatus.LUNAS ? 'bg-green-600 text-white border border-green-600' : 'bg-amber-500 text-white border border-amber-500';
};

const downloadCSV = (headers: string[], data: (string | number)[][], filename: string) => {
    const csvRows = [
        headers.join(','),
        ...data.map(row =>
            row.map(field => {
                const str = String(field);
                if (str.includes(',') || str.includes('"') || str.includes('\n')) {
                    return `"${str.replace(/"/g, '""')}"`;
                }
                return str;
            }).join(',')
        )
    ];

    const csvString = csvRows.join('\n');
    // Add UTF-8 BOM so Excel (Windows) recognizes encoding
    const BOM = '\uFEFF';
    const blob = new Blob([BOM + csvString], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
};


// --- NEWLY ADDED HELPER COMPONENTS ---

// Extracted components: PerformanceTab, CreatePaymentTab, TeamForm

// Components moved to separate files

// Extracted components moved to src/features/team/components/

interface FreelancersProps {
    showNotification?: (message: string) => void;
}

const memberBadgeClass = (category?: string) =>
    category === 'Vendor'
        ? 'bg-orange-50 text-orange-600 border border-orange-100'
        : 'bg-blue-50 text-blue-600 border border-blue-100';

const iconActionClass =
    'inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-xs font-bold transition-all';

const paginationButtonClass =
    'px-2 sm:px-3 py-1 sm:py-1.5 rounded-lg bg-white border border-slate-200 text-[10px] sm:text-xs font-bold text-slate-600 hover:border-slate-300 hover:text-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all';




export const Freelancers: React.FC<FreelancersProps> = (props) => {
    const navigate = useNavigate();
    const { 
        showNotification: contextShowNotification,
    } = useApp();

    const showNotification = props.showNotification || contextShowNotification;


    const queryClient = useQueryClient();

    // Independent Data Fetching


    const { data: qTeamMembers } = useTeamMembers();
    const { data: qTeamProjectPayments } = useTeamProjectPayments();
    const { data: qTeamPaymentRecords } = useTeamPaymentRecords();
    const { data: qProjects } = useProjects({ limit: 1000 });

    const teamMembers = qTeamMembers || [];
    const teamProjectPayments = qTeamProjectPayments || [];
    const teamPaymentRecords = qTeamPaymentRecords || [];
    const projects = qProjects || [];

    // Mock Setters to redirect setState calls to invalidate React Query (zero-rewrite pattern)
    // By passing an updater function, we enable optimistic UX within deeply nested logic.
    const setQueryAndInvalidate = (key: any[], updater: any) => {
        if (typeof updater === 'function') {
            queryClient.setQueryData(key, updater);
        } else {
            queryClient.setQueryData(key, updater);
        }
        queryClient.invalidateQueries({ queryKey: key });
    };

    const setTeamMembers: React.Dispatch<React.SetStateAction<TeamMember[]>> = () => setQueryAndInvalidate(['teamMembers', {}], undefined);
    const setTeamProjectPayments: React.Dispatch<React.SetStateAction<TeamProjectPayment[]>> = () => setQueryAndInvalidate(['teamProjectPayments'], undefined);
    const setTeamPaymentRecords: React.Dispatch<React.SetStateAction<TeamPaymentRecord[]>> = () => setQueryAndInvalidate(['teamPaymentRecords'], undefined);
    const setProjects: React.Dispatch<React.SetStateAction<Project[]>> = () => setQueryAndInvalidate(['projects', {}], undefined);

    const [isInfoModalOpen, setIsInfoModalOpen] = useState(false);
    const [dateFrom, setDateFrom] = useState('');
    const [dateTo, setDateTo] = useState('');
    const [activeTab, setActiveTab] = useState<'team' | 'vendor'>('team');

    const [teamSearchQuery, setTeamSearchQuery] = useState('');
    const [vendorSearchQuery, setVendorSearchQuery] = useState('');
    const [activeStatModal, setActiveStatModal] = useState<{ group: 'team' | 'vendor'; stat: 'total' | 'unpaid' | 'topRated' | 'events' | 'payments' | 'performance' } | null>(null);

    const [pageTeam, setPageTeam] = useState(1);
    const [pageVendor, setPageVendor] = useState(1);
    const PAGE_SIZE = 10;

    const { data: teamPaginatedData } = useTeamMembersPaginated(pageTeam, PAGE_SIZE, teamSearchQuery, 'Tim');
    const { data: vendorPaginatedData } = useTeamMembersPaginated(pageVendor, PAGE_SIZE, vendorSearchQuery, 'Vendor');

    const paginatedTeamMembers = teamPaginatedData?.teamMembers || [];
    const paginatedVendorMembers = vendorPaginatedData?.teamMembers || [];



    const projectsInDateRange = useMemo(() => {
        if (!dateFrom && !dateTo) return projects;
        return projects.filter(p => {
            const d = new Date(p.date);
            d.setHours(0, 0, 0, 0);
            if (dateFrom) {
                const from = new Date(dateFrom);
                from.setHours(0, 0, 0, 0);
                if (d < from) return false;
            }
            if (dateTo) {
                const to = new Date(dateTo);
                to.setHours(23, 59, 59, 999);
                if (d > to) return false;
            }
            return true;
        });
    }, [projects, dateFrom, dateTo]);

    const teamProjectPaymentsInDateRange = useMemo(() => {
        if (!dateFrom && !dateTo) return teamProjectPayments;
        const projectIdsInRange = new Set(projectsInDateRange.map(p => p.id));
        return teamProjectPayments.filter(p => projectIdsInRange.has(p.projectId));
    }, [teamProjectPayments, projectsInDateRange, dateFrom, dateTo]);




    const memberGroups = useMemo(() => {
        const team = teamMembers.filter(m => m.category !== 'Vendor');
        const vendor = teamMembers.filter(m => m.category === 'Vendor');
        return { team, vendor };
    }, [teamMembers]);

    const teamSectionStats = useMemo(() => {
        const memberIds = new Set(memberGroups.team.map(m => m.id));
        const totalUnpaid = teamProjectPaymentsInDateRange
            .filter(p => p.status === PaymentStatus.BELUM_BAYAR && memberIds.has(p.teamMemberId))
            .reduce((sum, p) => sum + p.fee, 0);

        const teamPayments = teamProjectPaymentsInDateRange.filter(p => memberIds.has(p.teamMemberId));
        const uniqueProjectIds = new Set(teamPayments.map(p => p.projectId));
        const totalPaid = teamPayments
            .filter(p => p.status === PaymentStatus.LUNAS)
            .reduce((sum, p) => sum + p.fee, 0);
        const totalUnpaidCount = teamPayments.filter(p => p.status === PaymentStatus.BELUM_BAYAR).length;
        const totalPaidCount = teamPayments.filter(p => p.status === PaymentStatus.LUNAS).length;
        const avgRating = memberGroups.team.length > 0
            ? memberGroups.team.reduce((sum, m) => sum + (m.rating || 0), 0) / memberGroups.team.length
            : 0;
        const performanceNotesCount = memberGroups.team.reduce((sum, m) => sum + (m.performanceNotes?.length || 0), 0);

        const topRated = [...memberGroups.team].sort((a, b) => b.rating - a.rating)[0];
        return {
            totalMembers: memberGroups.team.length,
            totalUnpaid: formatCurrency(totalUnpaid),
            topRatedName: topRated ? topRated.name : 'N/A',
            topRatedRating: topRated ? topRated.rating.toFixed(1) : 'N/A',

            totalWeddingEvents: uniqueProjectIds.size,
            totalPaid: formatCurrency(totalPaid),
            totalUnpaidRaw: formatCurrency(totalUnpaid),
            totalPaidCount,
            totalUnpaidCount,
            avgRating: avgRating.toFixed(1),
            performanceNotesCount,
        };
    }, [memberGroups.team, teamProjectPaymentsInDateRange]);

    const vendorSectionStats = useMemo(() => {
        const memberIds = new Set(memberGroups.vendor.map(m => m.id));
        const totalUnpaid = teamProjectPaymentsInDateRange
            .filter(p => p.status === PaymentStatus.BELUM_BAYAR && memberIds.has(p.teamMemberId))
            .reduce((sum, p) => sum + p.fee, 0);

        const vendorPayments = teamProjectPaymentsInDateRange.filter(p => memberIds.has(p.teamMemberId));
        const uniqueProjectIds = new Set(vendorPayments.map(p => p.projectId));
        const totalPaid = vendorPayments
            .filter(p => p.status === PaymentStatus.LUNAS)
            .reduce((sum, p) => sum + p.fee, 0);
        const totalUnpaidCount = vendorPayments.filter(p => p.status === PaymentStatus.BELUM_BAYAR).length;
        const totalPaidCount = vendorPayments.filter(p => p.status === PaymentStatus.LUNAS).length;
        const avgRating = memberGroups.vendor.length > 0
            ? memberGroups.vendor.reduce((sum, m) => sum + (m.rating || 0), 0) / memberGroups.vendor.length
            : 0;
        const performanceNotesCount = memberGroups.vendor.reduce((sum, m) => sum + (m.performanceNotes?.length || 0), 0);

        const topRated = [...memberGroups.vendor].sort((a, b) => b.rating - a.rating)[0];
        return {
            totalMembers: memberGroups.vendor.length,
            totalUnpaid: formatCurrency(totalUnpaid),
            topRatedName: topRated ? topRated.name : 'N/A',
            topRatedRating: topRated ? topRated.rating.toFixed(1) : 'N/A',

            totalWeddingEvents: uniqueProjectIds.size,
            totalPaid: formatCurrency(totalPaid),
            totalUnpaidRaw: formatCurrency(totalUnpaid),
            totalPaidCount,
            totalUnpaidCount,
            avgRating: avgRating.toFixed(1),
            performanceNotesCount,
        };
    }, [memberGroups.vendor, teamProjectPaymentsInDateRange]);

    const teamStats = useMemo(() => {
        const totalPayout = teamPaymentRecords.reduce((sum, r) => sum + r.totalAmount, 0);
        const totalProjectsHandled = teamProjectPayments.filter(p => p.status === PaymentStatus.LUNAS).length;
        const avgRating = teamMembers.length > 0 ? teamMembers.reduce((sum, m) => sum + m.rating, 0) / teamMembers.length : 0;

        return {
            totalPayout: formatCurrency(totalPayout),
            totalProjectsHandled,
            avgRating: avgRating.toFixed(1),
        };
    }, [teamPaymentRecords, teamProjectPayments, teamMembers]);

    const handleOpenForm = (mode: 'add' | 'edit', member?: TeamMember) => {
        if (mode === 'add') {
            navigate('/member/add');
        } else if (member) {
            navigate(`/member/${member.id}/edit`);
        }
    };

    const handleDelete = async (memberId: number) => {
        if (teamProjectPayments.some(p => String(p.teamMemberId) === String(memberId) && p.status === PaymentStatus.BELUM_BAYAR)) {
            alert("Tim / Vendor ini memiliki pembayaran yang belum lunas dan tidak dapat dihapus.");
            return;
        }
        if (!window.confirm("Apakah Anda yakin ingin menghapus Tim / Vendor ini? Semua data terkait (Acara Pernikahan, pembayaran) juga akan dihapus.")) return;
        try {
            await deleteTeamMemberRow(memberId);
            // Remove from projects
            setProjects(prevProjects => prevProjects.map((p: Project) => ({
                ...p,
                team: p.team.filter((t: AssignedTeamMember) => String(t.memberId) !== String(memberId))
            })));
            // Remove related data
            setTeamProjectPayments(prevPayments => prevPayments.filter(p => String(p.teamMemberId) !== String(memberId)));
            setTeamPaymentRecords(prevRecords => prevRecords.filter(r => String(r.teamMemberId) !== String(memberId)));
            // no reward ledger to clean up
            setTeamMembers(prev => prev.filter(m => String(m.id) !== String(memberId)));
            showNotification('Tim / Vendor dan semua data terkait berhasil dihapus.');
        } catch (err: any) {
            console.error('[API][teamMembers.delete] error:', err);
            alert(`Gagal menghapus Tim / Vendor di database. ${err?.message || 'Coba lagi.'}`);
        }
    };

    const handleViewDetails = (member: TeamMember) => {
        navigate(`/member/${member.id}`);
    };


    const filterUniqueMembers = (members: TeamMember[], query: string) => {
        const seen = new Set<string>();
        const q = query.trim().toLowerCase();
        return members.filter(m => {
            if (seen.has(String(m.id))) return false;
            seen.add(String(m.id));

            if (!q) return true;
            return m.name.toLowerCase().includes(q) || m.role.toLowerCase().includes(q);
        });
    };

    const uniqueTeamMembers = useMemo(() => filterUniqueMembers(memberGroups.team, teamSearchQuery), [memberGroups.team, teamSearchQuery]);
    const uniqueVendorMembers = useMemo(() => filterUniqueMembers(memberGroups.vendor, vendorSearchQuery), [memberGroups.vendor, vendorSearchQuery]);





    const handleDownloadTeam = () => {
        const headers = ['Nama', 'Role', 'Kategori', 'Email', 'Telepon', 'No. Rekening', 'Fee Belum Dibayar', 'Rating'];
        const data = teamMembers.map(member => {
            const unpaidFee = teamProjectPaymentsInDateRange
                .filter(p => String(p.teamMemberId) === String(member.id) && p.status === PaymentStatus.BELUM_BAYAR)
                .reduce((sum, p) => sum + p.fee, 0);
            return [
                `"${member.name.replace(/"/g, '""')}"`,
                member.role,
                member.category || 'Tim',
                member.email,
                member.phone,
                member.noRek || '-',
                unpaidFee,
                member.rating.toFixed(1)
            ];
        });
        downloadCSV(headers, data, `data-Tim / Vendor-${new Date().toISOString().split('T')[0]}.csv`);
    };



    const modalTitles: { [key: string]: string } = {
        'team-total': 'Daftar Semua Tim',
        'team-unpaid': 'Rincian Fee Tim Belum Dibayar',
        'team-topRated': 'Peringkat Tim',
        'team-events': 'Rincian Acara Pernikahan (Tim)',
        'team-payments': 'Rincian Pembayaran (Tim)',
        'team-performance': 'Rincian Kinerja (Tim)',
        'vendor-total': 'Daftar Semua Vendor',
        'vendor-unpaid': 'Rincian Fee Vendor Belum Dibayar',
        'vendor-topRated': 'Peringkat Vendor',
        'vendor-events': 'Rincian Acara Pernikahan (Vendor)',
        'vendor-payments': 'Rincian Pembayaran (Vendor)',
        'vendor-performance': 'Rincian Kinerja (Vendor)'
    };

    return (
        <div className="space-y-6">
            <PageHeader 
                title="Manajemen Tim / Vendor" 
                subtitle="Kelola database tim internal, vendor pihak ketiga, koordinasi pengantin, dan riwayat pembayaran mereka." 
                icon={<UsersIcon className="w-6 h-6" />}
            >
            <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-white border border-slate-200 order-2 sm:order-none w-full sm:w-auto shadow-sm">
                    <CalendarIcon className="w-4 h-4 text-brand-accent" />
                    <input 
                        type="date" 
                        value={dateFrom} 
                        onChange={e => setDateFrom(e.target.value)} 
                        className="bg-transparent border-none text-slate-700 text-xs font-bold outline-none focus:ring-0 p-0 w-28" 
                        title="Dari Tanggal" 
                    />
                    <span className="text-slate-300 font-bold">-</span>
                    <input 
                        type="date" 
                        value={dateTo} 
                        onChange={e => setDateTo(e.target.value)} 
                        className="bg-transparent border-none text-slate-700 text-xs font-bold outline-none focus:ring-0 p-0 w-28" 
                        title="Sampai Tanggal" 
                    />
                    {(dateFrom || dateTo) && (
                        <button onClick={() => { setDateFrom(''); setDateTo(''); }} className="text-slate-500 hover:text-blue-600 ml-1 text-xs px-2 py-0.5 rounded-lg bg-slate-50">Reset</button>
                    )}
                </div>

                <div className="flex items-center gap-2 sm:gap-3 w-full sm:w-auto order-1 sm:order-none">
                    <Button 
                        onClick={() => setIsInfoModalOpen(true)} 
                        variant="secondary"
                        size="sm"
                        className="flex-1 sm:flex-none"
                    >
                        Pelajari
                    </Button>

                    <Button 
                        onClick={handleDownloadTeam} 
                        variant="secondary"
                        size="sm"
                        leftIcon={<DownloadIcon className="w-4 h-4" />}
                        className="flex-1 sm:flex-none"
                    >
                        <span>Export CSV</span>
                    </Button>
                </div>

                <Button 
                    onClick={() => handleOpenForm('add')} 
                    variant="primary"
                    size="sm"
                    leftIcon={<PlusIcon className="w-5 h-5" />}
                    className="order-first sm:order-none w-full sm:w-auto"
                >
                    <span>Tambah Tim / Vendor</span>
                </Button>
            </div>
        </PageHeader>

            {/* Tab Navigation */}
            <div className="bg-white p-1.5 rounded-2xl shadow-xl shadow-slate-200/50 border border-slate-100 w-full sm:w-fit">
                <div className="flex gap-2">
                    <button
                        onClick={() => setActiveTab('team')}
                        className={`flex-1 sm:flex-none px-4 sm:px-5 py-2.5 rounded-xl font-black text-xs uppercase tracking-wider transition-all duration-300 ${
                            activeTab === 'team'
                                ? 'bg-blue-600 text-white shadow-md shadow-blue-100'
                                : 'text-slate-500 hover:bg-slate-50 hover:text-slate-700'
                        }`}
                    >
                        <div className="flex items-center justify-center gap-2">
                            <UsersIcon className="w-5 h-5" />
                            <span>Tim Internal</span>
                            <span className={`px-2 py-0.5 rounded-full text-[10px] ${
                                activeTab === 'team' ? 'bg-white/20' : 'bg-blue-50 text-blue-600'
                            }`}>
                                {teamSectionStats.totalMembers}
                            </span>
                        </div>
                    </button>
                    <button
                        onClick={() => setActiveTab('vendor')}
                        className={`flex-1 sm:flex-none px-4 sm:px-5 py-2.5 rounded-xl font-black text-xs uppercase tracking-wider transition-all duration-300 ${
                            activeTab === 'vendor'
                                ? 'bg-orange-600 text-white shadow-md shadow-orange-100'
                                : 'text-slate-500 hover:bg-slate-50 hover:text-slate-700'
                        }`}
                    >
                        <div className="flex items-center justify-center gap-2">
                            <UsersIcon className="w-5 h-5" />
                            <span>Vendor Eksternal</span>
                            <span className={`px-2 py-0.5 rounded-full text-[10px] ${
                                activeTab === 'vendor' ? 'bg-white/20' : 'bg-orange-50 text-orange-600'
                            }`}>
                                {vendorSectionStats.totalMembers}
                            </span>
                        </div>
                    </button>
                </div>
            </div>

            {/* Tim Tab Content */}
            {activeTab === 'team' && (
            <div className="space-y-8">
                <div className="space-y-4">
                    <div className="flex items-center justify-between">
                        <h2 className="text-lg font-black text-brand-text-light">Tim Internal</h2>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 xl:grid-cols-6 gap-6">
                        <div onClick={() => setActiveStatModal({ group: 'team', stat: 'total' })} className="widget-animate cursor-pointer transition-transform duration-200 hover:scale-105" style={{ animationDelay: '100ms' }}>
                            <StatCard icon={<UsersIcon className="w-6 h-6" />} title="Total Tim" value={teamSectionStats.totalMembers.toString()} subtitle="Anggota tim" colorVariant="blue" />
                        </div>
                        <div onClick={() => setActiveStatModal({ group: 'team', stat: 'unpaid' })} className="widget-animate cursor-pointer transition-transform duration-200 hover:scale-105" style={{ animationDelay: '200ms' }}>
                            <StatCard icon={<AlertCircleIcon className="w-6 h-6" />} title="Fee Tim Belum Lunas" value={teamSectionStats.totalUnpaid} subtitle="Tagihan tim" colorVariant="pink" />
                        </div>
                        <div onClick={() => setActiveStatModal({ group: 'team', stat: 'topRated' })} className="widget-animate cursor-pointer transition-transform duration-200 hover:scale-105" style={{ animationDelay: '300ms' }}>
                            <StatCard icon={<UserCheckIcon className="w-6 h-6" />} title="Top Tim" value={teamSectionStats.topRatedName} subtitle={`Rating: ${teamSectionStats.topRatedRating}`} colorVariant="green" />
                        </div>

                        <div className="widget-animate" style={{ animationDelay: '400ms' }}>
                            <div onClick={() => setActiveStatModal({ group: 'team', stat: 'events' })} className="cursor-pointer transition-transform duration-200 hover:scale-105">
                                <StatCard icon={<CalendarIcon className="w-6 h-6" />} title="Acara Pernikahan" value={teamSectionStats.totalWeddingEvents.toString()} subtitle="Event terkait" colorVariant="purple" />
                            </div>
                        </div>
                        <div className="widget-animate" style={{ animationDelay: '500ms' }}>
                            <div onClick={() => setActiveStatModal({ group: 'team', stat: 'payments' })} className="cursor-pointer transition-transform duration-200 hover:scale-105">
                                <StatCard icon={<DollarSignIcon className="w-6 h-6" />} title="Pembayaran Tim" value={teamSectionStats.totalPaid} subtitle={`Paid: ${teamSectionStats.totalPaidCount} | Unpaid: ${teamSectionStats.totalUnpaidCount}`} colorVariant="default" />
                            </div>
                        </div>
                        <div className="widget-animate" style={{ animationDelay: '600ms' }}>
                            <div onClick={() => setActiveStatModal({ group: 'team', stat: 'performance' })} className="cursor-pointer transition-transform duration-200 hover:scale-105">
                                <StatCard icon={<StarIcon className="w-6 h-6" />} title="Kinerja Tim" value={teamSectionStats.avgRating} subtitle={`Catatan: ${teamSectionStats.performanceNotesCount}`} colorVariant="orange" />
                            </div>
                        </div>
                    </div>

                    <div className="bg-white p-4 md:p-5 rounded-2xl shadow-xl shadow-slate-200/50 border border-slate-100 flex flex-col md:flex-row justify-between items-stretch md:items-center gap-4">
                        <div className="relative flex-grow max-w-md">
                            <input
                                type="text"
                                placeholder="Cari nama atau posisi..."
                                value={teamSearchQuery}
                                onChange={(e) => {
                                    setTeamSearchQuery(e.target.value);
                                    setPageTeam(1);
                                }}
                                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-bold text-slate-700 focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all pl-10 placeholder:text-slate-400"
                            />
                            <UsersIcon className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                        </div>
                    </div>

                    <div className="bg-white p-4 md:p-6 rounded-2xl shadow-xl shadow-slate-200/50 border border-slate-100 transition-all duration-300">
                        <div className="md:hidden space-y-3">
                            {paginatedTeamMembers.map(member => {
                                const unpaidFee = teamProjectPaymentsInDateRange.filter(p => String(p.teamMemberId) === String(member.id) && p.status === PaymentStatus.BELUM_BAYAR).reduce((sum, p) => sum + p.fee, 0);

                                return (
                                    <div key={member.id} className="rounded-2xl bg-white border border-slate-100 p-5 shadow-sm group hover:border-slate-300 transition-all duration-300">
                                        <div className="flex items-start justify-between">
                                            <div className="flex items-center gap-3">
                                                <AvatarDisplay avatarBase64={member.avatar} name={member.name} size="md" variant="team" className="shrink-0" />
                                                <div>
                                                    <p className="font-semibold text-slate-900 leading-tight">{member.name}</p>
                                                    <div className="flex items-center gap-2 mt-0.5">
                                                        <p className="text-[11px] text-slate-500">{member.role}</p>
                                                        <span className={`text-[9px] px-1.5 py-0.5 rounded-full uppercase font-bold tracking-wider ${memberBadgeClass(member.category)}`}>
                                                            {member.category || 'Tim'}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="text-right text-xs">
                                                <div className="inline-flex items-center gap-1 bg-amber-50 text-amber-600 px-2 py-1 rounded-full font-bold"><StarIcon className="w-3.5 h-3.5 fill-current" />{member.rating.toFixed(1)}</div>
                                            </div>
                                        </div>
                                        <div className="mt-3 grid grid-cols-2 gap-y-2 text-sm">
                                            <span className="text-slate-500">Fee Belum Dibayar</span>
                                            <span className="text-right font-semibold text-red-600">{formatCurrency(unpaidFee)}</span>
                                        </div>
                                        <div className="mt-4 flex flex-wrap justify-end gap-2">
                                            <button onClick={() => handleViewDetails(member)} className={`${iconActionClass} bg-blue-50 text-blue-600 border-blue-100 hover:bg-blue-600 hover:text-white`}>
                                                <EyeIcon className="w-4 h-4" />
                                                <span>Detail</span>
                                            </button>
                                            <button onClick={() => handleOpenForm('edit', member)} className={`${iconActionClass} bg-emerald-50 text-emerald-600 border-emerald-100 hover:bg-emerald-600 hover:text-white`}>
                                                <PencilIcon className="w-4 h-4" />
                                                <span>Edit</span>
                                            </button>
                                            <button onClick={() => handleDelete(member.id)} className={`${iconActionClass} bg-red-50 text-red-600 border-red-100 hover:bg-red-600 hover:text-white`}>
                                                <Trash2Icon className="w-4 h-4" />
                                                <span>Hapus</span>
                                            </button>
                                         </div>
                                    </div>
                                );
                            })}
                        </div>
                        <div className="hidden md:block overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead className="text-xs text-slate-700 uppercase bg-slate-100"><tr><th className="px-4 py-3 text-left border-r border-slate-300">Nama</th><th className="px-4 py-3 text-left border-r border-slate-300">Vendor / Tim</th><th className="px-4 py-3 text-left border-r border-slate-300">Fee Belum Dibayar</th><th className="px-4 py-3 text-center border-r border-slate-300">Rating</th><th className="px-4 py-3 text-center">Aksi</th></tr></thead>
                                <tbody className="bg-white/40 divide-y divide-slate-300">
                                    {paginatedTeamMembers.map(member => {
                                        const unpaidFee = teamProjectPaymentsInDateRange.filter(p => String(p.teamMemberId) === String(member.id) && p.status === PaymentStatus.BELUM_BAYAR).reduce((sum, p) => sum + p.fee, 0);
                                        return (
                                            <tr key={member.id} className="hover:bg-brand-bg transition-colors">
                                                <td className="px-4 py-3 border-r border-slate-300">
                                                    <div className="flex items-center gap-3">
                                                        <AvatarDisplay avatarBase64={member.avatar} name={member.name} size="md" variant="team" className="shrink-0" />
                                                        <span className="font-semibold text-brand-text-light">{member.name}</span>
                                                    </div>
                                                </td>
                                                <td className="px-4 py-3 border-r border-slate-300">
                                                    <div className="flex flex-col gap-1">
                                                        <span className="text-brand-text-primary font-medium">{member.role}</span>
                                                        <span className={`text-[10px] w-fit px-2 py-0.5 rounded-full uppercase font-bold tracking-wider ${memberBadgeClass(member.category)}`}>
                                                            {member.category || 'Tim'}
                                                        </span>
                                                    </div>
                                                </td>
                                                <td className="px-4 py-3 font-semibold text-red-600 border-r border-slate-300">{formatCurrency(unpaidFee)}</td>
                                                <td className="px-4 py-3 border-r border-slate-300"><div className="flex justify-center items-center gap-1 text-amber-600 font-bold"><StarIcon className="w-4 h-4 fill-current" />{member.rating.toFixed(1)}</div></td>
                                                <td className="px-4 py-3">
                                                    <div className="flex items-center justify-center space-x-1.5">
                                                        <button onClick={() => handleViewDetails(member)} className={`${iconActionClass} bg-blue-50 text-blue-600 border-blue-100 hover:bg-blue-600 hover:text-white`} title="Detail">
                                                            <EyeIcon className="w-4 h-4" />
                                                            <span className="text-xs font-bold">Detail</span>
                                                        </button>
                                                        <button onClick={() => handleOpenForm('edit', member)} className={`${iconActionClass} bg-emerald-50 text-emerald-600 border-emerald-100 hover:bg-emerald-600 hover:text-white`} title="Edit">
                                                            <PencilIcon className="w-4 h-4" />
                                                            <span className="text-xs font-bold">Edit</span>
                                                        </button>
                                                        <button onClick={() => handleDelete(member.id)} className={`${iconActionClass} bg-red-50 text-red-600 border-red-100 hover:bg-red-600 hover:text-white`} title="Hapus">
                                                            <Trash2Icon className="w-4 h-4" />
                                                            <span className="text-xs font-bold">Hapus</span>
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>

                        {/* Team Pagination */}
                        {teamPaginatedData && teamPaginatedData.total > PAGE_SIZE && (
                            <div className="mt-6 flex items-center justify-between border-t border-slate-100 pt-6 px-2">
                                <p className="text-[10px] sm:text-xs text-slate-500">
                                    Menampilkan <span className="font-bold text-slate-900">{((pageTeam - 1) * PAGE_SIZE) + 1}</span> - <span className="font-bold text-slate-900">{Math.min(pageTeam * PAGE_SIZE, teamPaginatedData.total)}</span> dari <span className="font-bold text-slate-900">{teamPaginatedData.total}</span> tim
                                </p>
                                <div className="flex items-center gap-1.5 sm:gap-2">
                                    <button 
                                        onClick={() => setPageTeam(prev => Math.max(1, prev - 1))}
                                        disabled={pageTeam === 1}
                                        className={paginationButtonClass}
                                    >
                                        Prev
                                    </button>
                                    <div className="flex items-center gap-1">
                                        {(() => {
                                            const totalPages = Math.ceil(teamPaginatedData.total / PAGE_SIZE);
                                            const pages = [];
                                            for (let i = 1; i <= totalPages; i++) {
                                                if (i === 1 || i === totalPages || Math.abs(i - pageTeam) <= 1) {
                                                    pages.push(
                                                        <button
                                                            key={i}
                                                            onClick={() => setPageTeam(i)}
                                                            className={`w-7 h-7 sm:w-8 sm:h-8 rounded-lg flex items-center justify-center text-[10px] sm:text-xs font-bold transition-all ${pageTeam === i ? 'bg-brand-accent text-white shadow-lg shadow-brand-accent/20' : 'bg-white text-slate-500 border border-slate-200 hover:border-slate-300 hover:text-blue-600'}`}
                                                        >
                                                            {i}
                                                        </button>
                                                    );
                                                } else if (Math.abs(i - pageTeam) === 2) {
                                                    pages.push(<span key={i} className="text-slate-400 text-xs">...</span>);
                                                }
                                            }
                                            return pages;
                                        })()}
                                    </div>
                                    <button 
                                        onClick={() => setPageTeam(prev => prev + 1)}
                                        disabled={!teamPaginatedData.hasMore}
                                        className={paginationButtonClass}
                                    >
                                        Next
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
            )}

            {/* Vendor Tab Content */}
            {activeTab === 'vendor' && (
            <div className="space-y-8">
                <div className="space-y-4">
                    <div className="flex items-center justify-between">
                        <h2 className="text-lg font-black text-brand-text-light">Vendor Eksternal</h2>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 xl:grid-cols-6 gap-6">
                        <div onClick={() => setActiveStatModal({ group: 'vendor', stat: 'total' })} className="widget-animate cursor-pointer transition-transform duration-200 hover:scale-105" style={{ animationDelay: '100ms' }}>
                            <StatCard icon={<UsersIcon className="w-6 h-6" />} title="Total Vendor" value={vendorSectionStats.totalMembers.toString()} subtitle="Vendor terdaftar" colorVariant="blue" />
                        </div>
                        <div onClick={() => setActiveStatModal({ group: 'vendor', stat: 'unpaid' })} className="widget-animate cursor-pointer transition-transform duration-200 hover:scale-105" style={{ animationDelay: '200ms' }}>
                            <StatCard icon={<AlertCircleIcon className="w-6 h-6" />} title="Fee Vendor Belum Lunas" value={vendorSectionStats.totalUnpaid} subtitle="Tagihan vendor" colorVariant="pink" />
                        </div>
                        <div onClick={() => setActiveStatModal({ group: 'vendor', stat: 'topRated' })} className="widget-animate cursor-pointer transition-transform duration-200 hover:scale-105" style={{ animationDelay: '300ms' }}>
                            <StatCard icon={<UserCheckIcon className="w-6 h-6" />} title="Top Vendor" value={vendorSectionStats.topRatedName} subtitle={`Rating: ${vendorSectionStats.topRatedRating}`} colorVariant="green" />
                        </div>

                        <div className="widget-animate" style={{ animationDelay: '400ms' }}>
                            <div onClick={() => setActiveStatModal({ group: 'vendor', stat: 'events' })} className="cursor-pointer transition-transform duration-200 hover:scale-105">
                                <StatCard icon={<CalendarIcon className="w-6 h-6" />} title="Acara Pernikahan" value={vendorSectionStats.totalWeddingEvents.toString()} subtitle="Event terkait" colorVariant="purple" />
                            </div>
                        </div>
                        <div className="widget-animate" style={{ animationDelay: '500ms' }}>
                            <div onClick={() => setActiveStatModal({ group: 'vendor', stat: 'payments' })} className="cursor-pointer transition-transform duration-200 hover:scale-105">
                                <StatCard icon={<DollarSignIcon className="w-6 h-6" />} title="Pembayaran Vendor" value={vendorSectionStats.totalPaid} subtitle={`Paid: ${vendorSectionStats.totalPaidCount} | Unpaid: ${vendorSectionStats.totalUnpaidCount}`} colorVariant="default" />
                            </div>
                        </div>
                        <div className="widget-animate" style={{ animationDelay: '600ms' }}>
                            <div onClick={() => setActiveStatModal({ group: 'vendor', stat: 'performance' })} className="cursor-pointer transition-transform duration-200 hover:scale-105">
                                <StatCard icon={<StarIcon className="w-6 h-6" />} title="Kinerja Vendor" value={vendorSectionStats.avgRating} subtitle={`Catatan: ${vendorSectionStats.performanceNotesCount}`} colorVariant="orange" />
                            </div>
                        </div>
                    </div>

                    <div className="bg-white p-4 md:p-5 rounded-2xl shadow-xl shadow-slate-200/50 border border-slate-100 flex flex-col md:flex-row justify-between items-stretch md:items-center gap-4">
                        <div className="relative flex-grow max-w-md">
                            <input
                                type="text"
                                placeholder="Cari nama atau posisi..."
                                value={vendorSearchQuery}
                                onChange={(e) => {
                                    setVendorSearchQuery(e.target.value);
                                    setPageVendor(1);
                                }}
                                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-bold text-slate-700 focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all pl-10 placeholder:text-slate-400"
                            />
                            <UsersIcon className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                        </div>
                    </div>

                    <div className="bg-white p-4 md:p-6 rounded-2xl shadow-xl shadow-slate-200/50 border border-slate-100 transition-all duration-300">
                        <div className="md:hidden space-y-3">
                            {paginatedVendorMembers.map(member => {
                                const unpaidFee = teamProjectPaymentsInDateRange.filter(p => String(p.teamMemberId) === String(member.id) && p.status === PaymentStatus.BELUM_BAYAR).reduce((sum, p) => sum + p.fee, 0);

                                return (
                                    <div key={member.id} className="rounded-2xl bg-white border border-slate-100 p-5 shadow-sm group hover:border-slate-300 transition-all duration-300">
                                        <div className="flex items-start justify-between">
                                            <div className="flex items-center gap-3">
                                                <AvatarDisplay avatarBase64={member.avatar} name={member.name} size="md" variant="vendor" className="shrink-0" />
                                                <div>
                                                    <p className="font-semibold text-slate-900 leading-tight">{member.name}</p>
                                                    <div className="flex items-center gap-2 mt-0.5">
                                                        <p className="text-[11px] text-slate-500">{member.role}</p>
                                                        <span className={`text-[9px] px-1.5 py-0.5 rounded-full uppercase font-bold tracking-wider ${memberBadgeClass(member.category)}`}>
                                                            {member.category || 'Tim'}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="text-right text-xs">
                                                <div className="inline-flex items-center gap-1 bg-amber-50 text-amber-600 px-2 py-1 rounded-full font-bold"><StarIcon className="w-3.5 h-3.5 fill-current" />{member.rating.toFixed(1)}</div>
                                            </div>
                                        </div>
                                        <div className="mt-3 grid grid-cols-2 gap-y-2 text-sm">
                                            <span className="text-slate-500">Fee Belum Dibayar</span>
                                            <span className="text-right font-semibold text-red-600">{formatCurrency(unpaidFee)}</span>
                                        </div>
                                        <div className="mt-4 flex flex-wrap justify-end gap-2">
                                            <button onClick={() => handleViewDetails(member)} className={`${iconActionClass} bg-blue-50 text-blue-600 border-blue-100 hover:bg-blue-600 hover:text-white`}>
                                                <EyeIcon className="w-4 h-4" />
                                                <span>Detail</span>
                                            </button>
                                            <button onClick={() => handleOpenForm('edit', member)} className={`${iconActionClass} bg-emerald-50 text-emerald-600 border-emerald-100 hover:bg-emerald-600 hover:text-white`}>
                                                <PencilIcon className="w-4 h-4" />
                                                <span>Edit</span>
                                            </button>
                                            <button onClick={() => handleDelete(member.id)} className={`${iconActionClass} bg-red-50 text-red-600 border-red-100 hover:bg-red-600 hover:text-white`}>
                                                <Trash2Icon className="w-4 h-4" />
                                                <span>Hapus</span>
                                            </button>
                                         </div>
                                    </div>
                                );
                            })}
                        </div>
                        <div className="hidden md:block overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead className="text-xs text-slate-700 uppercase bg-slate-100"><tr><th className="px-4 py-3 text-left border-r border-slate-300">Nama</th><th className="px-4 py-3 text-left border-r border-slate-300">Vendor / Tim</th><th className="px-4 py-3 text-left border-r border-slate-300">Fee Belum Dibayar</th><th className="px-4 py-3 text-center border-r border-slate-300">Rating</th><th className="px-4 py-3 text-center">Aksi</th></tr></thead>
                                <tbody className="bg-white/40 divide-y divide-slate-300">
                                    {paginatedVendorMembers.map(member => {
                                        const unpaidFee = teamProjectPaymentsInDateRange.filter(p => String(p.teamMemberId) === String(member.id) && p.status === PaymentStatus.BELUM_BAYAR).reduce((sum, p) => sum + p.fee, 0);
                                        return (
                                            <tr key={member.id} className="hover:bg-brand-bg transition-colors">
                                                <td className="px-4 py-3 border-r border-slate-300">
                                                    <div className="flex items-center gap-3">
                                                        <AvatarDisplay avatarBase64={member.avatar} name={member.name} size="md" variant="vendor" className="shrink-0" />
                                                        <span className="font-semibold text-brand-text-light">{member.name}</span>
                                                    </div>
                                                </td>
                                                <td className="px-4 py-3 border-r border-slate-300">
                                                    <div className="flex flex-col gap-1">
                                                        <span className="text-brand-text-primary font-medium">{member.role}</span>
                                                        <span className={`text-[10px] w-fit px-2 py-0.5 rounded-full uppercase font-bold tracking-wider ${memberBadgeClass(member.category)}`}>
                                                            {member.category || 'Tim'}
                                                        </span>
                                                    </div>
                                                </td>
                                                <td className="px-4 py-3 font-semibold text-red-600 border-r border-slate-300">{formatCurrency(unpaidFee)}</td>
                                                <td className="px-4 py-3 border-r border-slate-300"><div className="flex justify-center items-center gap-1 text-amber-600 font-bold"><StarIcon className="w-4 h-4 fill-current" />{member.rating.toFixed(1)}</div></td>
                                                <td className="px-4 py-3">
                                                    <div className="flex items-center justify-center space-x-1.5">
                                                        <button onClick={() => handleViewDetails(member)} className={`${iconActionClass} bg-blue-50 text-blue-600 border-blue-100 hover:bg-blue-600 hover:text-white`} title="Detail">
                                                            <EyeIcon className="w-4 h-4" />
                                                            <span className="text-xs font-bold">Detail</span>
                                                        </button>
                                                        <button onClick={() => handleOpenForm('edit', member)} className={`${iconActionClass} bg-emerald-50 text-emerald-600 border-emerald-100 hover:bg-emerald-600 hover:text-white`} title="Edit">
                                                            <PencilIcon className="w-4 h-4" />
                                                            <span className="text-xs font-bold">Edit</span>
                                                        </button>
                                                        <button onClick={() => handleDelete(member.id)} className={`${iconActionClass} bg-red-50 text-red-600 border-red-100 hover:bg-red-600 hover:text-white`} title="Hapus">
                                                            <Trash2Icon className="w-4 h-4" />
                                                            <span className="text-xs font-bold">Hapus</span>
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>

                        {/* Vendor Pagination */}
                        {vendorPaginatedData && vendorPaginatedData.total > PAGE_SIZE && (
                            <div className="mt-6 flex items-center justify-between border-t border-slate-100 pt-6 px-2">
                                <p className="text-[10px] sm:text-xs text-slate-500">
                                    Menampilkan <span className="font-bold text-slate-900">{((pageVendor - 1) * PAGE_SIZE) + 1}</span> - <span className="font-bold text-slate-900">{Math.min(pageVendor * PAGE_SIZE, vendorPaginatedData.total)}</span> dari <span className="font-bold text-slate-900">{vendorPaginatedData.total}</span> vendor
                                </p>
                                <div className="flex items-center gap-1.5 sm:gap-2">
                                    <button 
                                        onClick={() => setPageVendor(prev => Math.max(1, prev - 1))}
                                        disabled={pageVendor === 1}
                                        className={paginationButtonClass}
                                    >
                                        Prev
                                    </button>
                                    <div className="flex items-center gap-1">
                                        {(() => {
                                            const totalPages = Math.ceil(vendorPaginatedData.total / PAGE_SIZE);
                                            const pages = [];
                                            for (let i = 1; i <= totalPages; i++) {
                                                if (i === 1 || i === totalPages || Math.abs(i - pageVendor) <= 1) {
                                                    pages.push(
                                                        <button
                                                            key={i}
                                                            onClick={() => setPageVendor(i)}
                                                            className={`w-7 h-7 sm:w-8 sm:h-8 rounded-lg flex items-center justify-center text-[10px] sm:text-xs font-bold transition-all ${pageVendor === i ? 'bg-brand-accent text-white shadow-lg shadow-brand-accent/20' : 'bg-white text-slate-500 border border-slate-200 hover:border-slate-300 hover:text-blue-600'}`}
                                                        >
                                                            {i}
                                                        </button>
                                                    );
                                                } else if (Math.abs(i - pageVendor) === 2) {
                                                    pages.push(<span key={i} className="text-slate-400 text-xs">...</span>);
                                                }
                                            }
                                            return pages;
                                        })()}
                                    </div>
                                    <button 
                                        onClick={() => setPageVendor(prev => prev + 1)}
                                        disabled={!vendorPaginatedData.hasMore}
                                        className={paginationButtonClass}
                                    >
                                        Next
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
            )}

            {/* Widgets - Outside tabs, showing combined stats */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Widget 1: Komposisi */}
                <div className="bg-white p-5 rounded-2xl shadow-xl shadow-slate-200/50 border border-slate-100 flex flex-col justify-between">
                    <div>
                        <h3 className="text-sm font-bold text-slate-900 mb-5 flex items-center gap-2">
                            <UsersIcon className="w-5 h-5 text-blue-600" /> Komposisi Tim
                        </h3>
                        <div className="space-y-4">
                            {(() => {
                                const timCount = teamMembers.filter(m => m.category !== 'Vendor').length;
                                const vendorCount = teamMembers.filter(m => m.category === 'Vendor').length;
                                const total = timCount + vendorCount || 1;
                                return (
                                    <>
                                        <div className="space-y-1.5">
                                            <div className="flex justify-between items-end">
                                                <span className="text-slate-500 text-[10px] font-bold uppercase tracking-widest">Internal</span>
                                                <span className="text-lg font-black text-blue-600">{timCount}</span>
                                            </div>
                                            <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
                                                <div className="h-full rounded-full" style={{ width: `${(timCount / total) * 100}%`, backgroundColor: '#2563eb' }}></div>
                                            </div>
                                        </div>
                                        <div className="space-y-1.5">
                                            <div className="flex justify-between items-end">
                                                <span className="text-slate-500 text-[10px] font-bold uppercase tracking-widest">Vendor</span>
                                                <span className="text-lg font-black text-orange-600">{vendorCount}</span>
                                            </div>
                                            <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
                                                <div className="h-full rounded-full" style={{ width: `${(vendorCount / total) * 100}%`, backgroundColor: '#ea580c' }}></div>
                                            </div>
                                        </div>
                                    </>
                                );
                            })()}
                        </div>
                    </div>
                </div>

                {/* Widget 2: Performa */}
                <div className="bg-white p-5 rounded-2xl shadow-xl shadow-slate-200/50 border border-slate-100">
                    <h3 className="text-sm font-bold text-slate-900 mb-5 flex items-center gap-2">
                        <StarIcon className="w-5 h-5 text-amber-500" /> Performa Rata-rata
                    </h3>
                    <div className="space-y-4">
                        <div className="flex items-center justify-between group cursor-pointer p-2 hover:bg-slate-50 rounded-xl transition-all">
                            <div>
                                <p className="text-[9px] text-slate-500 font-bold uppercase tracking-widest">Total Payout</p>
                                <p className="text-lg font-black text-slate-900">{teamStats.totalPayout}</p>
                            </div>
                            <DollarSignIcon className="w-6 h-6 text-slate-300 group-hover:text-brand-accent/40" />
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                            <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                                <p className="text-[9px] text-slate-500 font-bold uppercase tracking-widest">Selesai</p>
                                <p className="text-lg font-black text-slate-900">{teamStats.totalProjectsHandled}</p>
                            </div>
                            <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                                <p className="text-[9px] text-slate-500 font-bold uppercase tracking-widest">Rating</p>
                                <div className="flex items-center gap-1.5">
                                    <p className="text-lg font-black text-amber-600">{teamStats.avgRating}</p>
                                    <StarIcon className="w-3.5 h-3.5 text-amber-500 fill-current" />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Widget 3: Tren */}
                <div className="bg-white p-5 rounded-2xl shadow-xl shadow-slate-200/50 border border-slate-100">
                    <div className="flex justify-between items-start mb-5">
                        <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                            <DollarSignIcon className="w-5 h-5 text-brand-accent" /> Tren
                        </h3>
                        <div className="text-right">
                            <p className="text-[9px] text-slate-500 font-bold uppercase">6 Bulan</p>
                            <p className="text-sm font-black text-brand-accent">
                                {(() => {
                                    const now = new Date();
                                    const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 5, 1);
                                    const total = teamPaymentRecords
                                        .filter(r => new Date(r.date) >= sixMonthsAgo)
                                        .reduce((sum, r) => sum + r.totalAmount, 0);
                                    return formatCurrency(total);
                                })()}
                            </p>
                        </div>
                    </div>
                    <div className="h-24 flex items-end gap-2 px-1">
                        {(() => {
                            const now = new Date();
                            const months: { name: string; year: number; month: number; total: number }[] = [];
                            for (let i = 5; i >= 0; i--) {
                                const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
                                months.push({
                                    name: d.toLocaleString('id-ID', { month: 'short' }),
                                    year: d.getFullYear(),
                                    month: d.getMonth(),
                                    total: 0
                                });
                            }
                            teamPaymentRecords.forEach(r => {
                                const rd = new Date(r.date);
                                const m = months.find(mo => mo.month === rd.getMonth() && mo.year === rd.getFullYear());
                                if (m) m.total += r.totalAmount;
                            });
                            const maxVal = Math.max(...months.map(m => m.total), 1);
                            return months.map((m, idx) => (
                                <div key={idx} className="flex-1 flex flex-col items-center group relative">
                                    <div className="absolute -top-8 opacity-0 group-hover:opacity-100 transition-opacity bg-brand-accent text-white text-[9px] py-1 px-2 rounded-lg shadow-2xl z-20 whitespace-nowrap font-bold">
                                        {formatCurrency(m.total)}
                                    </div>
                                    <div className="w-full rounded-t-lg transition-all duration-300"
                                        style={{
                                            height: `${(m.total / maxVal) * 100}%`,
                                            minHeight: '4px',
                                            background: m.total > 0 ? 'linear-gradient(to top, #2563eb, #60a5fa)' : '#e2e8f0',
                                            boxShadow: 'none'
                                        }}>
                                    </div>
                                    <span className="text-[9px] font-bold text-slate-500 mt-2">{m.name}</span>
                                </div>
                            ));
                        })()}
                    </div>
                </div>
            </div>

            <Modal isOpen={isInfoModalOpen} onClose={() => setIsInfoModalOpen(false)} title="Panduan Halaman Tim / Vendor">
                <div className="space-y-4 text-sm text-brand-text-primary">
                    <p>Halaman ini adalah pusat untuk semua hal yang berkaitan dengan tim Tim / Vendor Anda.</p>
                    <ul className="list-disc list-inside space-y-2">
                        <li><strong>Tambah & Edit:</strong> Gunakan tombol di kanan atas untuk menambahkan Tim / Vendor baru atau klik ikon pensil di tabel untuk mengedit data yang ada.</li>
                        <li><strong>Lihat Detail (<EyeIcon className="w-4 h-4 inline-block" />):</strong> Buka panel detail untuk melihat semua Acara Pernikahan yang dikerjakan, riwayat pembayaran, dan catatan kinerja.</li>
                        <li><strong>Kelola Pembayaran:</strong> Di panel detail, Anda dapat memilih Acara Pernikahan yang belum dibayar, membuat slip pembayaran, dan mencatat transaksi pembayaran.</li>
                        <li><strong>Kinerja:</strong> Berikan peringkat, tambahkan catatan kinerja untuk setiap Tim / Vendor di tab masing-masing pada panel detail.</li>
                        <li><strong>Bagikan Portal:</strong> Setiap Tim / Vendor memiliki portal pribadi. Bagikan tautan unik melalui panel detail agar mereka dapat melihat jadwal dan tugas revisi mereka.</li>
                    </ul>
                </div>
            </Modal>

            {/* Modals removed in favor of standalone pages */}

            <Modal isOpen={!!activeStatModal} onClose={() => setActiveStatModal(null)} title={activeStatModal ? modalTitles[`${activeStatModal.group}-${activeStatModal.stat}`] : ''} size="3xl">
                <div className="max-h-[60vh] overflow-y-auto pr-2">
                    {activeStatModal?.stat === 'total' && (
                        <div className="space-y-3">
                            {(activeStatModal.group === 'team' ? uniqueTeamMembers : uniqueVendorMembers).map(member => (
                                <div key={member.id} className="p-3 bg-brand-bg rounded-lg">
                                    <p className="font-semibold text-brand-text-light">{member.name}</p>
                                    <p className="text-sm text-brand-text-secondary">{member.role}</p>
                                </div>
                            ))}
                        </div>
                    )}

                    {activeStatModal?.stat === 'unpaid' && (
                        <div className="space-y-3">
                            {(() => {
                                const memberIds = new Set(
                                    (activeStatModal.group === 'team' ? memberGroups.team : memberGroups.vendor).map(m => m.id)
                                );
                                const unpaid = teamProjectPaymentsInDateRange.filter(p => p.status === PaymentStatus.BELUM_BAYAR && memberIds.has(p.teamMemberId));
                                if (unpaid.length === 0) return <p className="text-center py-8 text-brand-text-secondary">Tidak ada fee yang belum dibayar.</p>;
                                return unpaid.map(payment => (
                                    <div key={payment.id} className="p-3 bg-brand-bg rounded-lg flex justify-between items-center">
                                        <div>
                                            <p className="font-semibold text-brand-text-light">{payment.teamMemberName}</p>
                                            <p className="text-sm text-brand-text-secondary">Acara Pernikahan: {projects.find(proj => String(proj.id) === String(payment.projectId))?.projectName || 'N/A'}</p>
                                        </div>
                                        <p className="font-semibold text-brand-danger">{formatCurrency(payment.fee)}</p>
                                    </div>
                                ));
                            })()}
                        </div>
                    )}

                    {activeStatModal?.stat === 'topRated' && (
                        <div className="space-y-3">
                            {[...(activeStatModal.group === 'team' ? memberGroups.team : memberGroups.vendor)]
                                .sort((a, b) => b.rating - a.rating)
                                .map(member => (
                                    <div key={member.id} className="p-3 bg-brand-bg rounded-lg flex justify-between items-center">
                                        <div className="flex items-center gap-3">
                                            <AvatarDisplay avatarBase64={member.avatar} name={member.name} size="sm" variant={activeStatModal.group === 'vendor' ? 'vendor' : 'team'} className="shrink-0" />
                                            <div>
                                                <p className="font-semibold text-brand-text-light">{member.name}</p>
                                                <p className="text-sm text-brand-text-secondary">{member.role}</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-1 font-semibold text-brand-text-light"><StarIcon className="w-4 h-4 text-yellow-400 fill-current" />{member.rating.toFixed(1)}</div>
                                    </div>
                                ))}
                        </div>
                    )}

                    {activeStatModal?.stat === 'events' && (
                        <div className="space-y-3">
                            {(() => {
                                const memberIds = new Set(
                                    (activeStatModal.group === 'team' ? memberGroups.team : memberGroups.vendor).map(m => m.id)
                                );
                                const payments = teamProjectPaymentsInDateRange.filter(p => memberIds.has(p.teamMemberId));
                                const projectIds = new Set(payments.map(p => p.projectId));
                                const relatedProjects = projectsInDateRange
                                    .filter(p => projectIds.has(p.id))
                                    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

                                if (relatedProjects.length === 0) return <p className="text-center py-8 text-brand-text-secondary">Belum ada acara terkait.</p>;

                                return relatedProjects.map(p => (
                                    <div key={p.id} className="p-3 bg-brand-bg rounded-lg">
                                        <div className="flex items-start justify-between gap-3">
                                            <div>
                                                <p className="font-semibold text-brand-text-light">{p.projectName}</p>
                                                <p className="text-sm text-brand-text-secondary">{p.clientName}</p>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-xs text-brand-text-secondary">{formatDate(p.date)}</p>
                                                <p className="text-xs text-brand-text-secondary">{p.location}</p>
                                            </div>
                                        </div>
                                    </div>
                                ));
                            })()}
                        </div>
                    )}

                    {activeStatModal?.stat === 'payments' && (
                        <div className="space-y-4">
                            {(() => {
                                const memberIds = new Set(
                                    (activeStatModal.group === 'team' ? memberGroups.team : memberGroups.vendor).map(m => m.id)
                                );
                                const payments = teamProjectPaymentsInDateRange
                                    .filter(p => memberIds.has(p.teamMemberId))
                                    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
                                if (payments.length === 0) return <p className="text-center py-8 text-brand-text-secondary">Belum ada data pembayaran.</p>;

                                const paid = payments.filter(p => p.status === PaymentStatus.LUNAS);
                                const unpaid = payments.filter(p => p.status === PaymentStatus.BELUM_BAYAR);
                                const totalPaid = paid.reduce((sum, p) => sum + p.fee, 0);
                                const totalUnpaid = unpaid.reduce((sum, p) => sum + p.fee, 0);
                                const projectMap = new Map(projects.map(p => [p.id, p] as const));

                                return (
                                    <div className="space-y-4">
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                            <div className="p-3 bg-brand-bg rounded-lg">
                                                <p className="text-xs text-brand-text-secondary">Total Paid</p>
                                                <p className="font-bold text-brand-text-light">{formatCurrency(totalPaid)}</p>
                                                <p className="text-xs text-brand-text-secondary mt-1">Item: {paid.length}</p>
                                            </div>
                                            <div className="p-3 bg-brand-bg rounded-lg">
                                                <p className="text-xs text-brand-text-secondary">Total Unpaid</p>
                                                <p className="font-bold text-brand-text-light">{formatCurrency(totalUnpaid)}</p>
                                                <p className="text-xs text-brand-text-secondary mt-1">Item: {unpaid.length}</p>
                                            </div>
                                        </div>

                                        <div className="space-y-2">
                                            {payments.slice(0, 100).map(pay => {
                                                const prj = projectMap.get(pay.projectId);
                                                return (
                                                    <div key={pay.id} className="p-3 bg-brand-bg rounded-lg flex justify-between items-start gap-3">
                                                        <div>
                                                            <p className="font-semibold text-brand-text-light">{pay.teamMemberName}</p>
                                                            <p className="text-sm text-brand-text-secondary">Acara Pernikahan: {prj ? prj.projectName : 'N/A'}</p>
                                                        </div>
                                                        <div className="text-right">
                                                            <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${getStatusClass(pay.status)}`}>{pay.status}</span>
                                                            <p className="font-semibold text-brand-text-light mt-1">{formatCurrency(pay.fee)}</p>
                                                            <p className="text-xs text-brand-text-secondary">{formatDate(pay.date)}</p>
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                            {payments.length > 100 && (
                                                <p className="text-center text-xs text-brand-text-secondary pt-2">Menampilkan 100 data terbaru dari {payments.length} total data.</p>
                                            )}
                                        </div>
                                    </div>
                                );
                            })()}
                        </div>
                    )}

                    {activeStatModal?.stat === 'performance' && (
                        <div className="space-y-4">
                            {(() => {
                                const members = activeStatModal.group === 'team' ? memberGroups.team : memberGroups.vendor;
                                if (members.length === 0) return <p className="text-center py-8 text-brand-text-secondary">Belum ada data kinerja.</p>;
                                const avg = members.reduce((sum, m) => sum + (m.rating || 0), 0) / members.length;
                                const notesCount = members.reduce((sum, m) => sum + (m.performanceNotes?.length || 0), 0);
                                const sorted = [...members].sort((a, b) => (b.rating || 0) - (a.rating || 0));

                                return (
                                    <div className="space-y-4">
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                            <div className="p-3 bg-brand-bg rounded-lg">
                                                <p className="text-xs text-brand-text-secondary">Rating Rata-rata</p>
                                                <p className="font-bold text-brand-text-light">{avg.toFixed(1)}</p>
                                            </div>
                                            <div className="p-3 bg-brand-bg rounded-lg">
                                                <p className="text-xs text-brand-text-secondary">Total Catatan</p>
                                                <p className="font-bold text-brand-text-light">{notesCount}</p>
                                            </div>
                                        </div>

                                        <div className="space-y-2">
                                            {sorted.map(member => (
                                                <div key={member.id} className="p-3 bg-brand-bg rounded-lg flex justify-between items-center gap-3">
                                                    <div>
                                                        <p className="font-semibold text-brand-text-light">{member.name}</p>
                                                        <p className="text-sm text-brand-text-secondary">{member.role}</p>
                                                        <p className="text-xs text-brand-text-secondary mt-1">Catatan: {member.performanceNotes?.length || 0}</p>
                                                    </div>
                                                    <div className="flex items-center gap-1 font-semibold text-brand-text-light"><StarIcon className="w-4 h-4 text-yellow-400 fill-current" />{(member.rating || 0).toFixed(1)}</div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                );
                            })()}
                        </div>
                    )}

                </div>
            </Modal>
        </div>
    );
};

export default Freelancers;
