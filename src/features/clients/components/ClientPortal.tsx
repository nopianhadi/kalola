import React, { useState, useMemo, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { Client, Project, ClientFeedback, SatisfactionLevel, Transaction, Profile, Package, ProjectStatusConfig, TeamMember } from '@/types';
import { FolderKanbanIcon, ClockIcon, StarIcon, FileTextIcon, CreditCardIcon, CheckCircleIcon, DownloadIcon, ChevronRightIcon, CalendarIcon, BriefcaseIcon, DollarSignIcon, UsersIcon, GoogleIcon, LinkIcon } from '@/constants';
import Modal from '@/shared/ui/Modal';
import SignaturePad from '@/shared/ui/SignaturePad';
import { createClientFeedback } from '@/services/clientFeedback';
import { getAuthToken } from '@/lib/apiClient';
import HelpBox from '@/shared/ui/HelpBox';
import InvoiceDocument from '@/features/finance/components/InvoiceDocument';

const formatDate = (dateString: string) => new Date(dateString).toLocaleDateString('id-ID', { year: 'numeric', month: 'long', day: 'numeric' });
const formatCurrency = (amount: number, options?: {
    showDecimals?: boolean;
    compact?: boolean;
}) => {
    const { showDecimals = true, compact = false } = options || {};

    // Indonesian currency formatting: Rp 10.416.183,30
    return new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        minimumFractionDigits: showDecimals ? 2 : 0,
        maximumFractionDigits: showDecimals ? 2 : 0,
        notation: compact ? 'compact' : 'standard'
    }).format(amount);
};

// Utility function for consistent currency display in documents
const formatDocumentCurrency = (amount: number) => {
    // Always show decimals for formal documents
    return formatCurrency(amount, { showDecimals: true });
};

// Utility function for display in tables/lists (no decimals for cleaner look)
const formatDisplayCurrency = (amount: number) => {
    return formatCurrency(amount, { showDecimals: false });
};

const getSatisfactionFromRating = (rating: number): SatisfactionLevel => {
    if (rating >= 5) return SatisfactionLevel.VERY_SATISFIED;
    if (rating >= 4) return SatisfactionLevel.SATISFIED;
    if (rating >= 3) return SatisfactionLevel.NEUTRAL;
    return SatisfactionLevel.UNSATISFIED;
};

/** Progress 0-100 from project.progress or derived from status order / defaultProgress in config (for portal display) */
const getDisplayProgressForProject = (project: Project, config: ProjectStatusConfig[]): number => {
    if (!config || config.length === 0) return typeof project.progress === 'number' ? Math.round(project.progress) : 0;
    const raw = project.progress;
    if (typeof raw === 'number' && !Number.isNaN(raw) && raw >= 0 && raw <= 100) return Math.round(raw);
    const idx = config.findIndex(s => s.name === project.status);
    if (idx === -1) return 0;
    const statusConfig = config[idx];
    if (statusConfig.defaultProgress != null && statusConfig.defaultProgress !== undefined) {
        return Math.min(100, Math.max(0, statusConfig.defaultProgress));
    }
    return Math.round(((idx + 1) / config.length) * 100);
};


import { listClients } from '@/services/clients';
import { listProjectsWithRelations } from '@/services/projects';
import { listTransactions } from '@/services/transactions';
import { getProfile } from '@/services/profile';
import { listPackages } from '@/services/packages';
import { listTeamMembers } from '@/services/teamMembers';

const ClientPortal: React.FC = () => {
    const { accessId } = useParams<{ accessId: string }>();
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [client, setClient] = useState<Client | null>(null);
    const [projects, setProjects] = useState<Project[]>([]);
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [profile, setProfile] = useState<Profile | null>(null);
    const [packages, setPackages] = useState<Package[]>([]);
    const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
    const [viewingDocument, setViewingDocument] = useState<{ type: 'invoice' | 'receipt', project: Project, data: any } | null>(null);

    useEffect(() => {
        console.log("Page Loaded: Client Portal", accessId);
        const loadPortalData = async (showLoadingSpinner = true) => {
            if (showLoadingSpinner) setLoading(true);
            try {
                // 1. Fetch all clients to find the one with accessId
                // In a real app, we'd have a specific "getByAccessId" endpoint for security
                const allClients = await listClients({ limit: 1000 });
                const foundClient = allClients.find(c => c.portalAccessId === accessId);

                if (!foundClient) {
                    setError('Portal tidak ditemukan');
                    if (showLoadingSpinner) setLoading(false);
                    return;
                }
                setClient(foundClient);

                // 2. Fetch other related data in parallel
                const [projs, trans, prof, pkgs, tm] = await Promise.all([
                    listProjectsWithRelations(),
                    listTransactions({ clientId: foundClient.id, limit: 500 }),
                    getProfile(),
                    listPackages(),
                    listTeamMembers()
                ]);

                const clientProjs = projs.filter(p => String(p.clientId) === String(foundClient.id));
                setProjects(clientProjs);
                setTransactions(trans.filter(t => clientProjs.some(p => String(p.id) === String(t.projectId))));
                setProfile(prof);
                setPackages(pkgs);
                setTeamMembers(tm);
            } catch (err) {
                console.error('Error loading portal data:', err);
                setError('Gagal memuat data portal');
            } finally {
                if (showLoadingSpinner) setLoading(false);
            }
        };

        loadPortalData(true);

        // SSE-based real-time updates for the client portal.
        // The portal doesn't use React Query, so we subscribe to the SSE stream
        // directly and silently refresh data when relevant resources change.
        const API_BASE_URL = import.meta.env.VITE_API_URL
            ? (import.meta.env.VITE_API_URL as string).replace(/\/api$/, '')
            : 'http://localhost:5000';
        let es: EventSource | null = null;
        let reconnectTimer: ReturnType<typeof setTimeout> | null = null;
        let reconnectDelay = 2000;
        let isMounted = true;

        const connectSSE = () => {
            if (!isMounted) return;
            const token = getAuthToken();
            es = new EventSource(`${API_BASE_URL}/api/events${token ? `?token=${encodeURIComponent(token)}` : ''}`);

            es.onopen = () => { reconnectDelay = 2000; };

            es.onmessage = (event) => {
                try {
                    const payload = JSON.parse(event.data);
                    if (payload.type === 'connected') return;
                    const { resource } = payload;
                    // Refresh portal data when projects, transactions, or clients change
                    if (['projects', 'transactions', 'clients', 'profiles'].includes(resource)) {
                        loadPortalData(false);
                    }
                } catch { /* ignore */ }
            };

            es.onerror = () => {
                es?.close();
                es = null;
                if (!isMounted) return;
                reconnectDelay = Math.min(reconnectDelay * 2, 30000);
                reconnectTimer = setTimeout(connectSSE, reconnectDelay);
            };
        };

        connectSSE();

        return () => {
            isMounted = false;
            es?.close();
            if (reconnectTimer) clearTimeout(reconnectTimer);
        };
    }, [accessId]);

    const isVendorClient = client?.clientType === 'Vendor';
    const clientProjects = useMemo(() => [...projects].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()), [projects]);
    const template = profile?.publicPageConfig?.template ?? 'classic';

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen p-4 bg-public-bg">
                <div className="flex flex-col items-center justify-center">
                    <div className="relative flex justify-center items-center mb-6">
                        <div className="absolute border-4 border-brand-accent/20 rounded-full w-16 h-16"></div>
                        <div className="animate-spin border-4 border-transparent border-t-brand-accent rounded-full w-16 h-16"></div>
                    </div>
                </div>
            </div>
        );
    }

    if (error || !client || !profile) {
        return (
            <div className="flex items-center justify-center min-h-screen p-4 bg-public-bg">
                <div className="w-full max-w-lg p-8 text-center bg-public-surface rounded-2xl shadow-lg border border-red-100">
                    <h1 className="text-2xl font-bold text-red-500">{error || 'Portal Tidak Ditemukan'}</h1>
                    <p className="mt-4 text-public-text-primary">Tautan yang Anda gunakan tidak valid atau sudah tidak berlaku.</p>
                    <Link to="/" className="mt-6 inline-block text-blue-600 font-bold hover:underline">Kembali ke Beranda</Link>
                </div>
            </div>
        );
    }


    const renderAllSections = () => {
        return (
            <div className="space-y-16 md:space-y-24">
                {!isVendorClient && (
                    <section id="beranda" className="scroll-mt-24">
                        <DashboardTab projects={clientProjects} profile={profile} packages={packages} />
                    </section>
                )}

                <section id="proyek" className="scroll-mt-24">
                    <div className="mb-8 flex items-center gap-4">
                        <div className="h-10 w-1 bg-blue-600 rounded-full"></div>
                        <h2 className="text-3xl font-black text-slate-800 tracking-tight">Acara Pernikahan Saya</h2>
                    </div>
                    <ProjectsTab projects={clientProjects} profile={profile} teamMembers={teamMembers} />
                </section>

                <section id="Pricelist" className="scroll-mt-24">
                    <div className="mb-8 flex items-center gap-4 mt-6">
                        <div className="h-10 w-1 bg-purple-600 rounded-full"></div>
                        <h2 className="text-3xl font-black text-slate-800 tracking-tight">Link File Acara Pernikahan Kamu</h2>
                    </div>
                    <GalleryTab projects={clientProjects} />
                </section>

                {!isVendorClient && (
                    <section id="keuangan" className="scroll-mt-24">
                        <div className="mb-8 flex items-center gap-4 mt-6">
                            <div className="h-10 w-1 bg-green-600 rounded-full"></div>
                            <h2 className="text-3xl font-black text-slate-800 tracking-tight">Keuangan</h2>
                        </div>
                        <FinanceTab projects={clientProjects} transactions={transactions} packages={packages} />
                    </section>
                )}

                <section id="umpan-balik" className="scroll-mt-24">
                    <div className="mb-8 flex items-center gap-4 mt-6">
                        <div className="h-10 w-1 bg-yellow-500 rounded-full"></div>
                        <h2 className="text-3xl font-black text-slate-800 tracking-tight">Testimoni Pengantin</h2>
                    </div>
                    <FeedbackTab client={client} />

                </section>
            </div>
        );
    }

    return (
        <div className={`template-wrapper template-${template} min-h-screen portal-gradient`}>
            <style>{`
                .template-wrapper { background-color: #f8fafc; color: #0f172a; }
                .portal-surface { 
                    background: rgba(255, 255, 255, 0.95); 
                    backdrop-filter: blur(24px); 
                    -webkit-backdrop-filter: blur(24px); 
                    border: 1px solid #cbd5e1; 
                    box-shadow: 0 10px 40px -10px rgba(0, 0, 0, 0.08);
                }
                .portal-text-primary { color: #0f172a; }
                .portal-text-secondary { color: #475569; }
                .portal-border { border-color: #e2e8f0; }
                .portal-accent-text { color: #4338ca; }
                .portal-accent-bg { background: linear-gradient(135deg, #4338ca 0%, #1e1b4b 100%); }
                .portal-accent-bg-light { background: #f5f3ff; }
                .portal-gradient { 
                    background: 
                        radial-gradient(circle at 10% 10%, rgba(67, 56, 202, 0.08) 0%, transparent 40%),
                        radial-gradient(circle at 90% 90%, rgba(59, 130, 246, 0.08) 0%, transparent 40%),
                        #fbfcfe; 
                    min-height: 100vh; 
                }
                
                @keyframes float {
                    0% { transform: translateY(0px); }
                    50% { transform: translateY(-12px); }
                    100% { transform: translateY(0px); }
                }
                .animate-float { animation: float 5s ease-in-out infinite; }
                
                @keyframes pulse-intense {
                    0% { box-shadow: 0 0 0 0 rgba(67, 56, 202, 0.4); transform: scale(1); }
                    70% { box-shadow: 0 0 0 15px rgba(67, 56, 202, 0); transform: scale(1.05); }
                    100% { box-shadow: 0 0 0 0 rgba(67, 56, 202, 0); transform: scale(1); }
                }
                .pulse-strong { animation: pulse-intense 2s infinite cubic-bezier(0.4, 0, 0.6, 1); }

                .timeline-line {
                    background: repeating-linear-gradient(
                        to bottom,
                        #cbd5e1,
                        #cbd5e1 4px,
                        transparent 4px,
                        transparent 8px
                    );
                }
                .timeline-line-active {
                    background: #4338ca;
                    box-shadow: 0 0 12px rgba(67, 56, 202, 0.3);
                }
                
                .stage-card {
                    transition: all 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275);
                    border: 1px solid transparent;
                }
                .stage-card:hover {
                    transform: translateX(8px) scale(1.01);
                    border-color: rgba(67, 56, 202, 0.2);
                    box-shadow: 0 20px 50px -12px rgba(0, 0, 0, 0.08);
                }
            `}</style>
            <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
                {/* --- Main Content --- */}
                <main className="py-8 md:py-16">
                    <header className="mb-12 md:mb-16 widget-animate">
                        <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6">
                            <div className="space-y-4">
                                <h1 className="text-3xl font-black tracking-tight text-slate-800 bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-indigo-600 inline-block">
                                    {profile.companyName}
                                </h1>
                                {/* Client Avatar + Greeting */}
                                <div className="flex items-center gap-4">
                                    {client.avatar ? (
                                        <img
                                            src={client.avatar}
                                            alt={client.name}
                                            className="w-16 h-16 rounded-2xl object-cover border-2 border-blue-200 shadow-md shrink-0"
                                        />
                                    ) : (
                                        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-pink-500 to-rose-600 flex items-center justify-center text-white text-2xl font-black shadow-md shrink-0">
                                            {client.name.split(' ').map((w: string) => w[0]).slice(0, 2).join('').toUpperCase()}
                                        </div>
                                    )}
                                    <div>
                                        <h2 className="text-3xl md:text-5xl font-black text-slate-900 leading-tight">
                                            Halo Pasangan Pengantin, <br className="sm:hidden" />
                                            <span className="text-blue-600">{client.name.split(' ')[0]}! 👋</span>
                                        </h2>
                                        <p className="text-lg text-slate-600 font-medium max-w-xl mt-2">
                                            Ini adalah pusat informasi untuk semua Acara Pernikahan Anda bersama kami. Silakan gulir ke bawah untuk melihat detail lengkapnya.
                                        </p>
                                    </div>
                                </div>
                            </div>
                            {profile?.phone && (
                                <div className="lg:w-[360px] shrink-0">
                                    <HelpBox variant="public" phone={profile.phone} />
                                </div>
                            )}
                        </div>
                    </header>
                    <div className="relative">
                        {renderAllSections()}
                    </div>
                </main>
            </div>

            {/* Remove bottom padding div since nav is gone */}
            <DocumentViewerModal
                viewingDocument={viewingDocument}
                onClose={() => setViewingDocument(null)}
                profile={profile}
                packages={packages}
                client={client}
                projects={clientProjects}
            />
        </div>
    );
};

// --- Portal Tabs as Components ---

const DashboardTab: React.FC<{ projects: Project[], profile: Profile, packages: Package[] }> = ({ projects, profile, packages }) => {
    const activeProject = useMemo(() => projects.find(p => p.status !== 'Selesai' && p.status !== 'Dibatalkan'), [projects]);
    const displayProgress = useMemo(() => activeProject ? getDisplayProgressForProject(activeProject, profile.projectStatusConfig || []) : 0, [activeProject, profile.projectStatusConfig]);
    const upcomingProject = useMemo(() => projects.filter(p => new Date(p.date) >= new Date()).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())[0], [projects]);

    const financialSummary = useMemo(() => {
        const totalValue = projects.reduce((sum, p) => sum + p.totalCost, 0);
        const totalPaid = projects.reduce((sum, p) => sum + p.amountPaid, 0);
        return { totalValue, totalPaid, totalDue: totalValue - totalPaid };
    }, [projects]);
    const activePackage = useMemo(() => {
        if (!activeProject) return null;
        return packages.find(pk => String(pk.id) === String(activeProject.packageId)) || null;
    }, [activeProject, packages]);
    const addOnsTotal = useMemo(() => {
        if (!activeProject) return 0;
        return (activeProject.addOns || []).reduce((s, a) => s + (a.price || 0), 0);
    }, [activeProject]);

    const customCostsTotal = useMemo(() => {
        if (!activeProject) return 0;
        return (activeProject.customCosts || []).reduce((s, c) => s + (c.amount || 0), 0);
    }, [activeProject]);

    const packagePrice = useMemo(() => {
        if (!activeProject) return 0;

        // Calculate package price with better fallback logic
        let price = 0;
        if ((activeProject as any).unitPrice !== undefined && (activeProject as any).unitPrice !== null && Number((activeProject as any).unitPrice) > 0) {
            price = Number((activeProject as any).unitPrice);
        } else if (activePackage) {
            // If duration selection exists, try to find the price from duration options
            const durationSelection = (activeProject as any).durationSelection;
            if (durationSelection && activePackage.durationOptions && activePackage.durationOptions.length > 0) {
                const durationOption = activePackage.durationOptions.find(opt => opt.label === durationSelection);
                price = durationOption ? Number(durationOption.price) : Number(activePackage.price);
            } else {
                price = Number(activePackage.price);
            }
        } else {
            // Fallback: calculate from total cost minus addons and transport
            const transportCost = Number(activeProject.transportCost || 0);
            const discountAmount = Number(activeProject.discountAmount || 0);
            const subtotal = activeProject.totalCost + discountAmount;
            price = Math.max(0, subtotal - addOnsTotal - transportCost);
        }
        return price;
    }, [activeProject, activePackage, addOnsTotal]);

    return (
        <div className="space-y-4 md:space-y-6">
            {upcomingProject && (
                <div className="portal-surface p-4 md:p-6 rounded-[2rem] border-slate-200/80 shadow-xl widget-animate hover:scale-[1.01] transition-all duration-500 group" style={{ animationDelay: '100ms' }}>
                    <div className="flex items-center gap-2 mb-4">
                        <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse shadow-[0_0_10px_rgba(59,130,246,0.5)]"></div>
                        <h3 className="text-xs md:text-sm font-black uppercase tracking-widest text-blue-600/70">Acara Pernikahan Mendatang</h3>
                    </div>
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 md:w-14 md:h-14 rounded-2xl bg-blue-50 flex items-center justify-center text-blue-600 shadow-inner group-hover:scale-110 transition-transform duration-500">
                                <CalendarIcon className="w-6 h-6 md:w-7 md:h-7" />
                            </div>
                            <div>
                                <p className="font-black text-xl md:text-2xl text-slate-800 tracking-tight">{upcomingProject.projectName}</p>
                                <p className="text-xs md:text-sm text-slate-500 mt-0.5 flex items-center gap-1.5 font-medium">
                                    <span className="opacity-70">📍</span> {upcomingProject.location}
                                </p>
                            </div>
                        </div>
                        <div className="w-full sm:w-auto px-6 py-3 rounded-2xl bg-slate-900 text-white shadow-xl shadow-slate-900/20 transform hover:-translate-y-1 transition-transform duration-300">
                            <p className="text-[10px] font-black uppercase tracking-widest opacity-60 text-center">Tanggal Acara Pernikahan</p>
                            <p className="text-sm md:text-base font-bold text-center">{formatDate(upcomingProject.date)}</p>
                        </div>
                    </div>
                </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 md:gap-4">
                <div className="portal-surface p-4 md:p-5 rounded-[1.5rem] border-slate-200/80 widget-animate group hover:shadow-lg transition-all duration-300" style={{ animationDelay: '300ms' }}>
                    <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600 mb-3">
                        <BriefcaseIcon className="w-5 h-5" />
                    </div>
                    <p className="text-[10px] md:text-xs font-black uppercase tracking-widest text-slate-400">Total Package</p>
                    <p className="text-lg md:text-xl font-black text-slate-800 mt-1">{formatDisplayCurrency(financialSummary.totalValue)}</p>
                </div>
                <div className="portal-surface p-4 md:p-5 rounded-[1.5rem] border-slate-200/80 widget-animate group hover:shadow-lg transition-all duration-300" style={{ animationDelay: '400ms' }}>
                    <div className="w-10 h-10 rounded-xl bg-green-50 flex items-center justify-center text-green-600 mb-3">
                        <CheckCircleIcon className="w-5 h-5" />
                    </div>
                    <p className="text-[10px] md:text-xs font-black uppercase tracking-widest text-slate-400">Terbayar</p>
                    <p className="text-lg md:text-xl font-black text-slate-800 mt-1">{formatDisplayCurrency(financialSummary.totalPaid)}</p>
                </div>
                <div className="portal-surface p-4 md:p-5 rounded-[1.5rem] border-slate-200/80 widget-animate group hover:shadow-lg transition-all duration-300" style={{ animationDelay: '500ms' }}>
                    <div className="w-10 h-10 rounded-xl bg-rose-50 flex items-center justify-center text-rose-600 mb-3">
                        <CreditCardIcon className="w-5 h-5" />
                    </div>
                    <p className="text-[10px] md:text-xs font-black uppercase tracking-widest text-slate-400">Sisa Tagihan</p>
                    <p className="text-lg md:text-xl font-black text-rose-600 mt-1">{formatDisplayCurrency(financialSummary.totalDue)}</p>
                </div>
            </div>

        </div>
    );
};

const ProjectsTab: React.FC<{ projects: Project[], profile: Profile, teamMembers: TeamMember[] }> = ({ projects, profile, teamMembers }) => {
    const [selectedProjectId, setSelectedProjectId] = useState<string | null>(projects[0]?.id ? String(projects[0].id) : null);

    // Sync selectedProjectId if it's null but projects data has arrived
    useEffect(() => {
        if (!selectedProjectId && projects.length > 0) {
            setSelectedProjectId(String(projects[0].id));
        }
    }, [projects, selectedProjectId]);

    const selectedProject = useMemo(() =>
        projects.find(p => String(p.id) === String(selectedProjectId)) || projects[0],
        [projects, selectedProjectId]
    );

    const displayProgress = useMemo(() =>
        selectedProject ? getDisplayProgressForProject(selectedProject, profile.projectStatusConfig || []) : 0,
        [selectedProject, profile.projectStatusConfig]
    );

    // Group team members by category for the selected project
    const teamByCategory = useMemo(() => {
        if (!selectedProject?.team) return { 'Tim': {}, 'Vendor': {} };
        return selectedProject.team.reduce((acc, member) => {
            const originalMember = teamMembers.find(m => String(m.id) === String(member.memberId));
            const category = originalMember?.category || 'Tim';
            if (!acc[category]) acc[category] = {};
            if (!acc[category][member.role]) acc[category][member.role] = [];
            acc[category][member.role].push({ ...member, phone: originalMember?.phone, email: originalMember?.email });
            return acc;
        }, { 'Tim': {}, 'Vendor': {} } as Record<string, Record<string, any[]>>);
    }, [selectedProject?.team, teamMembers]);

    return (
        <div className="space-y-4 md:space-y-6">
            {projects.length > 1 && (
                <div className="portal-surface p-4 md:p-5 rounded-2xl border-slate-200/80 shadow-sm widget-animate">
                    <label htmlFor="project-selector" className="text-[10px] md:text-xs font-black uppercase tracking-widest text-slate-400 flex items-center gap-2 mb-2">
                        <span>🎯</span> Pilih Acara Pernikahan
                    </label>
                    <div className="relative">
                        <select
                            id="project-selector"
                            value={selectedProjectId || ''}
                            onChange={(e) => setSelectedProjectId(e.target.value)}
                            className="w-full p-3 bg-white/50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none font-bold text-slate-800 transition-all appearance-none cursor-pointer"
                        >
                            {projects.map(p => (
                                <option key={p.id} value={p.id}>{p.projectName}</option>
                            ))}
                        </select>
                        <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                            <ChevronRightIcon className="w-5 h-5 rotate-90" />
                        </div>
                    </div>
                </div>
            )}

            {!selectedProject ? (
                <div className="portal-surface p-12 rounded-[2rem] border border-white/40 text-center widget-animate">
                    <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
                        <FolderKanbanIcon className="w-8 h-8 text-slate-300" />
                    </div>
                    <p className="text-sm font-bold text-slate-400">Pilih Acara Pernikahan untuk melihat detailnya</p>
                </div>
            ) : (
                <div className="space-y-8 widget-animate" style={{ animationDelay: '100ms' }}>
                    {/* Simplified Header */}
                    <div className="portal-surface p-6 md:p-10 rounded-[2.5rem] overflow-hidden relative border-none bg-white">
                        <div className="absolute top-0 right-0 w-80 h-80 bg-blue-500/5 blur-[120px] -mr-40 -mt-40 rounded-full"></div>
                        <div className="relative z-10">
                            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
                                <div>
                                    <h3 className="text-2xl md:text-3xl font-black text-slate-800 tracking-tight mb-2">Progres Acara Pernikahan Kamu</h3>
                                    <div className="flex items-center gap-3">
                                        <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></div>
                                        <p className="text-sm font-bold text-blue-600 uppercase tracking-widest">{selectedProject.projectName}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-4">
                                    <div className="px-6 py-3 bg-slate-50 border border-slate-100 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 shadow-sm">
                                        Status: {selectedProject.status}
                                    </div>
                                </div>
                            </div>

                            {/* Clean Stats Grid */}
                            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                                <div className="p-4 bg-white rounded-2xl border border-slate-300 shadow-sm">
                                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Tahap Saat Ini</p>
                                    <p className="text-sm md:text-base font-bold text-slate-800">{selectedProject.status}</p>
                                </div>
                                <div className="p-4 bg-white rounded-2xl border border-slate-300 shadow-sm">
                                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Progres</p>
                                    <p className="text-base font-bold text-blue-600">{displayProgress}%</p>
                                </div>
                                <div className="p-4 bg-white rounded-2xl border border-slate-300 shadow-sm">
                                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Total Tahapan</p>
                                    <p className="text-base font-bold text-slate-800">{profile.projectStatusConfig.length} Langkah</p>
                                </div>
                                <div className="p-4 bg-white rounded-2xl border border-slate-300 shadow-sm">
                                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Tujuan</p>
                                    <p className="text-base font-bold text-green-600 truncate">{profile.projectStatusConfig[profile.projectStatusConfig.length - 1]?.name || 'Selesai'}</p>
                                </div>
                            </div>

                            {/* Horizontal Progress Bar (Simple) */}
                            <div className="mt-8 h-2 w-full bg-slate-50 rounded-full overflow-hidden border border-slate-100">
                                <div
                                    className="h-full bg-blue-500 transition-all duration-1000 ease-out rounded-full"
                                    style={{ width: `${displayProgress}%` }}
                                ></div>
                            </div>
                        </div>
                    </div>

                    {/* Modern Vertical Roadmap */}
                    <div className="relative pl-10 md:pl-12 py-4 mt-8 space-y-12">
                        {/* Continuous Vertical Line */}
                        <div className="absolute left-[19px] md:left-[23px] top-4 bottom-4 w-0.5 timeline-line opacity-50"></div>

                        {/* Dynamic Progress Line */}
                        <div
                            className="absolute left-[19px] md:left-[23px] top-4 w-0.5 timeline-line-active transition-all duration-1000 ease-in-out"
                            style={{
                                height: `${displayProgress}%`,
                                maxHeight: 'calc(100% - 32px)'
                            }}
                        ></div>

                        {profile.projectStatusConfig
                            .filter(s => s.name !== 'Dibatalkan' || selectedProject.status === 'Dibatalkan')
                            .map((statusConfig, statusIndex) => {
                                const isCurrentStage = selectedProject.status === statusConfig.name;
                                const stageIndex = profile.projectStatusConfig.findIndex(s => s.name === selectedProject.status);
                                const isPastStage = statusIndex < stageIndex;
                                const isFutureStage = statusIndex > stageIndex;

                                return (
                                    <div key={statusConfig.id} className="relative group">
                                        {/* Timeline Marker (Dot) */}
                                        <div className={`absolute -left-[32px] md:-left-[36px] top-1 w-8 h-8 rounded-full border-4 border-white shadow-xl flex items-center justify-center z-10 transition-all duration-500 ${isPastStage ? 'bg-emerald-500 scale-90' :
                                            isCurrentStage ? 'bg-indigo-600 scale-110 pulse-strong' :
                                                'bg-slate-300 scale-75'
                                            }`}>
                                            {isPastStage && <CheckCircleIcon className="w-4 h-4 text-white" />}
                                            {isCurrentStage && <ClockIcon className="w-4 h-4 text-white animate-spin-slow" />}
                                            {isFutureStage && <div className="w-2 h-2 rounded-full bg-white opacity-40"></div>}
                                        </div>

                                        {/* Stage Content Card */}
                                        <div className={`stage-card p-6 md:p-8 rounded-[2.5rem] border-2 transition-all duration-300 ${isCurrentStage
                                            ? 'bg-white border-indigo-400 shadow-2xl shadow-indigo-500/10 ring-2 ring-indigo-100'
                                            : isPastStage
                                                ? 'bg-slate-50/50 border-slate-300 opacity-90'
                                                : 'bg-transparent border-slate-300 border-dashed opacity-70'
                                            }`}>
                                            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                                                <div>
                                                    <div className="flex items-center gap-2 mb-1">
                                                        <span className={`text-[10px] font-black uppercase tracking-widest ${isCurrentStage ? 'text-indigo-600' : 'text-slate-400'}`}>
                                                            Tahap {statusIndex + 1}
                                                        </span>
                                                        {isCurrentStage && (
                                                            <span className="px-3 py-1 bg-indigo-600 text-white rounded-full text-[9px] font-black uppercase tracking-[0.15em] shadow-lg shadow-indigo-500/30">
                                                                Pengerjaan
                                                            </span>
                                                        )}
                                                    </div>
                                                    <h4 className={`text-xl font-black tracking-tight ${isCurrentStage ? 'text-slate-900 scale-105 origin-left' :
                                                        isPastStage ? 'text-slate-700' :
                                                            'text-slate-400'
                                                        } transition-all duration-300`}>
                                                        {statusConfig.name}
                                                    </h4>
                                                </div>
                                                {statusConfig.subStatuses && statusConfig.subStatuses.length > 0 && (
                                                    <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest bg-slate-100/80 px-4 py-2 rounded-2xl border border-slate-200 shadow-sm">
                                                        {statusConfig.subStatuses.filter(s => selectedProject.confirmedSubStatuses?.includes(s.name)).length} / {statusConfig.subStatuses.length} Selesai
                                                    </div>
                                                )}
                                            </div>

                                            {/* Sub-statuses - Cleaner List */}
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-4">
                                                {(statusConfig.subStatuses || []).map((subStatus) => {
                                                    const isConfirmed = selectedProject.confirmedSubStatuses?.includes(subStatus.name);
                                                    const isActive = selectedProject.activeSubStatuses?.includes(subStatus.name) && isCurrentStage;
                                                    const clientNote = selectedProject.clientSubStatusNotes?.[subStatus.name];

                                                    return (
                                                        <div
                                                            key={subStatus.name}
                                                            className={`flex items-start gap-4 p-4 rounded-2xl border transition-all duration-300 ${isConfirmed ? 'bg-green-50/50 border-green-200 grayscale-[0.2] opacity-90' :
                                                                isActive ? 'bg-blue-50 shadow-sm border-blue-300' :
                                                                    'bg-slate-50 border-slate-300'
                                                                }`}
                                                        >
                                                            <div className={`mt-1 flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center transition-all ${isConfirmed ? 'bg-green-500 text-white' :
                                                                isActive ? 'bg-blue-600 text-white shadow-md' :
                                                                    'border-2 border-slate-200 bg-white text-slate-200'
                                                                }`}>
                                                                {isConfirmed ? <CheckCircleIcon className="w-3.5 h-3.5" /> : isActive ? <div className="w-1.5 h-1.5 rounded-full bg-white"></div> : null}
                                                            </div>
                                                            <div className="min-w-0">
                                                                <p className={`text-sm font-bold tracking-tight mb-1 ${isActive ? 'text-blue-700' :
                                                                    isConfirmed ? 'text-slate-500' :
                                                                        'text-slate-700'
                                                                    }`}>
                                                                    {subStatus.name}
                                                                </p>
                                                                <p className="text-[11px] font-medium text-slate-500 leading-relaxed mb-1">{subStatus.note}</p>
                                                                {clientNote && (
                                                                    <div className="mt-2 text-[10px] font-bold text-blue-600 bg-white/80 p-2 rounded-lg border border-blue-100/50">
                                                                        “{clientNote}”
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </div>
                                                    );
                                                })}
                                            </div>

                                            {(!statusConfig.subStatuses || statusConfig.subStatuses.length === 0) && (
                                                <div className="py-6 text-center border-2 border-dashed border-slate-100 rounded-3xl">
                                                    <p className="text-xs font-black text-slate-300 uppercase tracking-[0.2em]">Tahap Sedang Dipersiapkan</p>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                    </div>

                    {/* Vendor & Tim Section */}
                    {selectedProject && selectedProject.team && selectedProject.team.length > 0 && (
                        <div className="portal-surface p-6 md:p-10 rounded-[2.5rem] border-none bg-white mt-8 widget-animate" style={{ animationDelay: '800ms' }}>
                            <div className="flex items-center gap-3 mb-8">
                                <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center">
                                    <UsersIcon className="w-6 h-6" />
                                </div>
                                <div>
                                    <h3 className="text-xl md:text-2xl font-black text-slate-800 tracking-tight">Daftar Vendor</h3>
                                    <p className="text-xs md:text-sm font-medium text-slate-500 mt-1">Daftar vendor yang bertugas di Acara Pernikahan Anda</p>
                                </div>
                            </div>

                            <div className="space-y-8">
                                {Object.entries(teamByCategory)
                                    .filter(([category]) => category === 'Vendor')
                                    .map(([category, roleGroups]) => {
                                        const hasMembers = Object.keys(roleGroups).length > 0;
                                        if (!hasMembers) return null;

                                        return (
                                            <div key={category} className="space-y-4">
                                                <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
                                                    <div className={`w-2 h-2 rounded-full ${category === 'Vendor' ? 'bg-amber-500' : 'bg-blue-500'}`}></div>
                                                    <h4 className="text-sm font-black uppercase tracking-widest text-slate-600">{category}</h4>
                                                </div>

                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                    {Object.entries(roleGroups).map(([role, members]: [string, any[]]) => (
                                                        <div key={role} className="space-y-3">
                                                            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 px-1">{role}</p>
                                                            {members.map((member, idx) => (
                                                                <div key={idx} className={`p-4 rounded-2xl border transition-all duration-300 hover:shadow-md ${category === 'Vendor' ? 'bg-amber-50/50 border-amber-100 hover:border-amber-200' : 'bg-blue-50/50 border-blue-100 hover:border-blue-200'}`}>
                                                                    <div className="flex items-start justify-between gap-3">
                                                                        <div className="flex-1 min-w-0">
                                                                            <p className="text-sm font-bold text-slate-800 truncate">{member.name}</p>
                                                                            {member.subJob && (
                                                                                <p className="text-xs text-slate-500 mt-1">{member.subJob}</p>
                                                                            )}
                                                                            {member.phone && (
                                                                                <p className="text-xs text-slate-400 mt-1 flex items-center gap-1">
                                                                                    <span>📱</span> {member.phone}
                                                                                </p>
                                                                            )}
                                                                        </div>
                                                                        {member.fee > 0 && (
                                                                            <div className="text-right">
                                                                                <p className="text-[10px] font-bold text-slate-400 uppercase">Fee</p>
                                                                                <p className="text-xs font-black text-slate-700">{formatDisplayCurrency(member.fee)}</p>
                                                                            </div>
                                                                        )}
                                                                    </div>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        );
                                    })}
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

const GalleryTab: React.FC<{ projects: Project[] }> = ({ projects }) => (
    <div className="space-y-4 md:space-y-6">
        {projects.map((project, index) => {
            return (
                <div key={project.id} className="portal-surface p-5 md:p-10 rounded-[2.5rem] border-slate-200/80 widget-animate" style={{ animationDelay: `${index * 100}ms` }}>
                    <div className="flex items-center gap-3 mb-10">
                        <div className="w-12 h-12 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center">
                            <GoogleIcon className="w-6 h-6" />
                        </div>
                        <div>
                            <h3 className="text-xl font-black text-slate-800 tracking-tight">Penyimpanan File Digital</h3>
                            <p className="text-xs text-slate-500 font-medium">Akses semua file melalui Google Drive {project.projectName}</p>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                        <a href={project.finalDriveLink || '#'} target="_blank" rel="noopener noreferrer" className={`group p-6 rounded-[2rem] border transition-all duration-500 flex flex-col justify-between h-48 ${project.finalDriveLink ? 'bg-gradient-to-br from-indigo-600 to-indigo-700 border-white/20 text-white shadow-xl shadow-indigo-500/20 hover:scale-[1.02] active:scale-95' : 'bg-slate-50 border-slate-200 text-slate-400 cursor-not-allowed opacity-60'}`}>
                            <div className="flex justify-between items-start">
                                <div className="p-3 bg-white/20 rounded-2xl backdrop-blur-md">
                                    <GoogleIcon className="w-6 h-6" />
                                </div>
                                <span className="text-[10px] font-black uppercase tracking-widest opacity-70">Final Results</span>
                            </div>
                            <div>
                                <p className="font-extrabold text-lg">Link Final Editing</p>
                                <div className="flex items-center gap-2 mt-2 py-2 px-4 bg-white/10 rounded-xl group-hover:bg-white/20 transition-colors">
                                    <LinkIcon className="w-3.5 h-3.5" />
                                    <span className="text-xs font-bold">{project.finalDriveLink ? 'Buka Pricelist Utama' : 'Belum Tersedia'}</span>
                                </div>
                            </div>
                        </a>

                        <a href={project.driveLink || '#'} target="_blank" rel="noopener noreferrer" className={`group p-6 rounded-[2rem] border transition-all duration-500 flex flex-col justify-between h-48 ${project.driveLink ? 'bg-white border-slate-300 text-slate-700 hover:border-blue-400 hover:shadow-xl hover:scale-[1.02] active:scale-95 shadow-sm' : 'bg-slate-50 border-slate-300 text-slate-400 cursor-not-allowed opacity-60'}`}>
                            <div className="flex justify-between items-start">
                                <div className="p-3 bg-blue-50 rounded-2xl">
                                    <GoogleIcon className="w-6 h-6" />
                                </div>
                                <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Briefing</span>
                            </div>
                            <div>
                                <p className="font-extrabold text-lg text-slate-800">Moodboard / Brief</p>
                                <div className="flex items-center gap-2 mt-2 py-2 px-4 bg-slate-50 rounded-xl group-hover:bg-blue-50 transition-colors">
                                    <LinkIcon className="w-3.5 h-3.5 text-blue-500" />
                                    <span className="text-xs font-bold text-slate-600">{project.driveLink ? 'Lihat Tautan' : 'Tidak Ada'}</span>
                                </div>
                            </div>
                        </a>

                        <a href={project.clientDriveLink || '#'} target="_blank" rel="noopener noreferrer" className={`group p-6 rounded-[2rem] border transition-all duration-500 flex flex-col justify-between h-48 ${project.clientDriveLink ? 'bg-white border-slate-300 text-slate-700 hover:border-green-400 hover:shadow-xl hover:scale-[1.02] active:scale-95 shadow-sm' : 'bg-slate-50 border-slate-300 text-slate-400 cursor-not-allowed opacity-60'}`}>
                            <div className="flex justify-between items-start">
                                <div className="p-3 bg-green-50 rounded-2xl">
                                    <GoogleIcon className="w-6 h-6" />
                                </div>
                                <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Submissions</span>
                            </div>
                            <div>
                                <p className="font-extrabold text-lg text-slate-800">File Dari Anda</p>
                                <div className="flex items-center gap-2 mt-2 py-2 px-4 bg-slate-50 rounded-xl group-hover:bg-green-50 transition-colors">
                                    <LinkIcon className="w-3.5 h-3.5 text-green-500" />
                                    <span className="text-xs font-bold text-slate-600">{project.clientDriveLink ? 'Lihat Tautan' : 'Tidak Ada'}</span>
                                </div>
                            </div>
                        </a>
                    </div>

                    <div className="mt-10 p-6 md:p-8 bg-slate-50 rounded-[2rem] border border-slate-300 shadow-sm">
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                            <div>
                                <h4 className="text-sm font-black text-slate-800 tracking-tight">Kelengkapan File Digital</h4>
                                <p className="text-[10px] font-medium text-slate-500 mt-1 uppercase tracking-widest">Daftar deliverables yang Anda dapatkan</p>
                            </div>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                            {[
                                'Semua File Original',
                                '30 Foto Edit',
                                'Video Highlight 1-2 Menit'
                            ].map((item, i) => (
                                <div key={i} className="flex items-center gap-4 p-4 bg-white rounded-2xl border border-slate-100 shadow-sm group hover:border-blue-200 transition-all duration-300">
                                    <div className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center text-blue-500 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                                        <CheckCircleIcon className="w-5 h-5" />
                                    </div>
                                    <span className="text-sm font-bold text-slate-700">{item}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            );
        })}
    </div>
);

const FinanceTab: React.FC<{ projects: Project[], transactions: Transaction[], packages: Package[] }> = ({ projects, transactions, packages }) => {
    const navigate = useNavigate();
    return (
        <div className="space-y-6 md:space-y-8">
            {projects.map((project, index) => {
                const projectTransactions = transactions.filter(t => String(t.projectId) === String(project.id) && (t.type === 'Pemasukan' || (t.type as string) === 'Income'));
                const activePackage = packages.find(pk => String(pk.id) === String(project.packageId)) || null;

                // Calculate package price
                let packagePrice = 0;
                if ((project as any).unitPrice && Number((project as any).unitPrice) > 0) {
                    packagePrice = Number((project as any).unitPrice);
                } else if (activePackage) {
                    const durationSelection = (project as any).durationSelection;
                    if (durationSelection && activePackage.durationOptions && activePackage.durationOptions.length > 0) {
                        const durationOption = activePackage.durationOptions.find(opt => opt.label === durationSelection);
                        packagePrice = durationOption ? Number(durationOption.price) : Number(activePackage.price);
                    } else {
                        packagePrice = Number(activePackage.price);
                    }
                }
                const addOnsTotal = (project.addOns || []).reduce((s, a) => s + (a.price || 0), 0);
                const customCostsTotal = (project.customCosts || []).reduce((s, c) => s + (c.amount || 0), 0);

                return (
                    <div key={project.id} className="portal-surface p-5 md:p-8 rounded-[2rem] border-slate-200/80 widget-animate" style={{ animationDelay: `${index * 100}ms` }}>
                        {/* Header */}
                        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-green-50 text-green-600 flex items-center justify-center">
                                    <DollarSignIcon className="w-5 h-5" />
                                </div>
                                <div>
                                    <h3 className="text-lg font-black text-slate-800 tracking-tight">{project.projectName}</h3>
                                    <p className="text-xs text-slate-400 font-medium">ID: #PRJ-{project.id} • {formatDate(project.date)}</p>
                                </div>
                            </div>
                            <button
                                onClick={() => navigate(`/i/${project.id}`)}
                                className="px-5 py-2.5 bg-blue-600 text-white rounded-xl shadow-lg shadow-blue-500/20 text-xs font-black uppercase tracking-widest hover:scale-105 active:scale-95 transition-all"
                            >
                                Lihat Invoice
                            </button>
                        </div>

                        {/* Package & Addon Details */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6 pb-6 border-b border-slate-100">
                            {/* Package Info */}
                            <div className="space-y-3">
                                <p className="text-[10px] font-black uppercase tracking-widest text-blue-600">Paket Dipilih</p>
                                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                                    <p className="text-base font-black text-slate-800">{project.packageName || activePackage?.name || 'Custom Package'}</p>
                                    <p className="text-sm font-bold text-blue-600 mt-1">
                                        {formatDisplayCurrency(packagePrice)}
                                        {(project as any)?.durationSelection && <span className="text-slate-400 font-medium ml-2">/ {(project as any).durationSelection}</span>}
                                    </p>
                                    {/* Package description (digitalItems) */}
                                    {activePackage?.digitalItems && activePackage.digitalItems.length > 0 && (
                                        <ul className="mt-3 space-y-1.5 border-t border-slate-200 pt-3">
                                            {activePackage.digitalItems.map((item, idx) => (
                                                <li key={idx} className="flex items-start gap-2">
                                                    <div className={`w-1.5 h-1.5 rounded-full mt-1.5 flex-shrink-0 ${project.completedDigitalItems?.includes(item) ? 'bg-green-500' : 'bg-blue-400'}`}></div>
                                                    <span className={`text-xs font-medium ${project.completedDigitalItems?.includes(item) ? 'text-green-700 line-through' : 'text-slate-600'}`}>{item}</span>
                                                </li>
                                            ))}
                                        </ul>
                                    )}
                                </div>
                            </div>

                            {/* Addons & Cost Summary */}
                            <div className="space-y-3">
                                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Tambahan & Ringkasan Biaya</p>
                                <div className="space-y-2">
                                    {/* Addons */}
                                    {project.addOns && project.addOns.length > 0 && (
                                        <div className="space-y-1.5">
                                            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-[0.1em] px-1">Layanan Add-On</p>
                                            {project.addOns.map(ao => (
                                                <div key={ao.id} className="flex justify-between items-center p-3 px-4 bg-white border border-slate-100 rounded-xl shadow-sm">
                                                    <span className="text-xs font-bold text-slate-700">{ao.name}</span>
                                                    <span className="text-xs font-black text-slate-900">{formatDisplayCurrency(ao.price)}</span>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                    {/* Custom Costs */}
                                    {project.customCosts && project.customCosts.length > 0 && (
                                        <div className="space-y-1.5">
                                            <p className="text-[9px] font-bold text-blue-500 uppercase tracking-[0.1em] px-1">Biaya Tambahan</p>
                                            {project.customCosts.map(cc => (
                                                <div key={cc.id} className="flex justify-between items-center p-3 px-4 bg-blue-50/50 border border-blue-100/50 rounded-xl">
                                                    <span className="text-xs font-bold text-slate-700">{cc.description}</span>
                                                    <span className="text-xs font-black text-slate-900">{formatDisplayCurrency(cc.amount)}</span>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                    {/* Cost Summary */}
                                    <div className="p-4 bg-slate-900 rounded-2xl text-white mt-2">
                                        <div className="space-y-2">
                                            <div className="flex justify-between text-xs">
                                                <span className="opacity-60">Paket Utama</span>
                                                <span className="font-bold">{formatDisplayCurrency(packagePrice)}</span>
                                            </div>
                                            {addOnsTotal > 0 && (
                                                <div className="flex justify-between text-xs">
                                                    <span className="opacity-60">Add-On</span>
                                                    <span className="font-bold">{formatDisplayCurrency(addOnsTotal)}</span>
                                                </div>
                                            )}
                                            {customCostsTotal > 0 && (
                                                <div className="flex justify-between text-xs">
                                                    <span className="opacity-60">Biaya Tambahan</span>
                                                    <span className="font-bold">{formatDisplayCurrency(customCostsTotal)}</span>
                                                </div>
                                            )}
                                            {Boolean(project.discountAmount) && (
                                                <div className="flex justify-between text-xs">
                                                    <span className="text-rose-400">Diskon</span>
                                                    <span className="font-bold text-rose-400">- {formatDisplayCurrency(project.discountAmount || 0)}</span>
                                                </div>
                                            )}
                                            <div className="pt-2 border-t border-white/10 flex justify-between items-center">
                                                <span className="text-[10px] font-black uppercase tracking-widest opacity-60">Total Tagihan</span>
                                                <span className="text-lg font-black">{formatDisplayCurrency(project.totalCost)}</span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="p-3 bg-green-50 border border-green-100 rounded-xl">
                                        <div className="flex justify-between items-center mb-1">
                                            <span className="text-[10px] font-black uppercase tracking-widest text-green-700">DP Terbayar</span>
                                            <span className="text-sm font-black text-green-700">{formatDisplayCurrency(project.amountPaid)}</span>
                                        </div>
                                        <div className="flex justify-between items-center">
                                            <span className="text-[10px] font-black uppercase tracking-widest text-rose-700">Sisa Tagihan</span>
                                            <span className="text-sm font-black text-rose-700">{formatDisplayCurrency(project.totalCost - project.amountPaid)}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Transaction History */}
                        <div className="space-y-3">
                            <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-4 px-1">Detail Transaksi Pembayaran</h4>
                            <p className="text-xs text-slate-400 -mt-3 mb-3 px-1">Riwayat semua pembayaran yang telah dilakukan</p>
                            {projectTransactions.length > 0 ? projectTransactions.map(tx => (
                                <div key={tx.id} className="p-4 bg-white rounded-2xl border border-slate-300 flex justify-between items-center group hover:border-blue-400 hover:shadow-md transition-all">
                                    <div className="flex items-center gap-4">
                                        <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400 group-hover:text-green-500 group-hover:bg-green-50 transition-colors">
                                            <CreditCardIcon className="w-5 h-5" />
                                        </div>
                                        <div>
                                            <p className="text-sm font-bold text-slate-700">{tx.description || 'Pembayaran'}</p>
                                            <div className="flex items-center gap-2 mt-0.5">
                                                <p className="text-[10px] font-medium text-slate-400">{formatDate(tx.date)}</p>
                                                {tx.category && <span className="text-[9px] font-bold px-1.5 py-0.5 bg-slate-100 text-slate-500 rounded-full uppercase tracking-wide">{tx.category}</span>}
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-4">
                                        <p className="text-base font-black text-green-600">{formatDisplayCurrency(tx.amount)}</p>
                                        <button
                                            onClick={() => navigate(`/r/${tx.id}`)}
                                            className="px-4 py-2 bg-slate-100 text-slate-700 border border-slate-300 hover:text-white hover:bg-blue-600 hover:border-blue-600 rounded-xl transition-all text-[10px] md:text-xs font-black uppercase tracking-widest flex items-center gap-2"
                                            title="Lihat Tanda Terima"
                                        >
                                            <FileTextIcon className="w-4 h-4" />
                                            <span>Bukti</span>
                                        </button>
                                    </div>
                                </div>
                            )) : (
                                <div className="p-8 text-center bg-slate-50/50 rounded-2xl border border-dashed border-slate-200">
                                    <CreditCardIcon className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                                    <p className="text-sm font-bold text-slate-400">Belum ada pembayaran tercatat</p>
                                    <p className="text-xs text-slate-300 mt-1">Riwayat DP dan pembayaran akan muncul di sini</p>
                                </div>
                            )}
                        </div>
                    </div>
                );
            })}
        </div>
    );
};

const FeedbackTab: React.FC<{ client: Client }> = ({ client }) => {

    const [rating, setRating] = useState(0);
    const [feedbackText, setFeedbackText] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (rating === 0) { alert('Mohon berikan peringkat.'); return; }
        setIsSubmitting(true);
        try {
            const payload = {
                clientName: client!.name,
                rating,
                satisfaction: getSatisfactionFromRating(rating),
                feedback: feedbackText,
                date: new Date().toISOString(),
            } as Omit<ClientFeedback, 'id'>;
            await createClientFeedback(payload);
            alert('Terima kasih! Masukan Anda telah tersimpan.');

            setRating(0);
            setFeedbackText('');
        } catch (err) {
            console.error('[ClientPortal] Failed to create client feedback:', err);
            alert('Gagal menyimpan masukan. Coba lagi.');

        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="portal-surface p-6 md:p-8 rounded-[2rem] border-slate-200/80 shadow-xl flex flex-col widget-animate">
            <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 rounded-2xl bg-yellow-50 text-yellow-500 flex items-center justify-center shadow-inner">
                    <StarIcon className="w-6 h-6 fill-current" />
                </div>
                <div>
                    <h3 className="text-lg md:text-xl font-black text-slate-800 tracking-tight">Berikan Testimoni</h3>
                    <p className="text-xs md:text-sm font-medium text-slate-500">Berbagi pengalaman Anda bersama kami</p>
                </div>
            </div>

            <div className="mt-4">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-3 block">Peringkat Kepuasan</label>
                <div className="flex items-center gap-2">
                    {[1, 2, 3, 4, 5].map(star => (
                        <button
                            key={star}
                            type="button"
                            onClick={() => setRating(star)}
                            aria-label={`Beri ${star} bintang`}
                            className="transform hover:scale-125 transition-all duration-300 active:scale-95"
                        >
                            <StarIcon className={`w-10 h-10 md:w-12 md:h-12 transition-all ${rating >= star ? 'text-yellow-400 fill-yellow-400 drop-shadow-[0_0_15px_rgba(250,204,21,0.4)]' : 'text-slate-300'}`} />
                        </button>
                    ))}
                </div>
            </div>

            <div className="mt-8 flex-grow flex flex-col">
                <label htmlFor="feedbackText" className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 block">Testimoni Kamu</label>
                <textarea
                    id="feedbackText"
                    value={feedbackText}
                    onChange={(e) => setFeedbackText(e.target.value)}
                    placeholder="Tuliskan pengalaman berkesan Anda..."
                    className="w-full p-4 bg-white/50 border border-slate-300 rounded-2xl flex-grow focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 focus:outline-none font-medium text-slate-800 transition-all placeholder:text-slate-400 shadow-inner"
                    rows={5}
                ></textarea>
            </div>

            <button
                type="submit"
                disabled={isSubmitting}
                className="mt-8 w-full py-4 px-6 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-black uppercase tracking-widest rounded-2xl shadow-xl shadow-blue-500/30 hover:shadow-2xl hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-50 disabled:hover:scale-100 flex items-center justify-center gap-3"
            >
                {isSubmitting ? 'Mengirim...' : (
                    <>
                        <span>🚀 Kirim Testimoni</span>
                    </>
                )}
            </button>
        </form>
    );
};

const DocumentViewerModal: React.FC<{ viewingDocument: any, onClose: any, profile: Profile, packages: Package[], client: Client, projects: Project[] }> = ({ viewingDocument, onClose, profile, packages, client, projects }) => {
    const [isSigning, setIsSigning] = useState(false);

    // Debug effect to track isSigning state changes
    useEffect(() => {
        console.log('isSigning state changed to:', isSigning);
    }, [isSigning]);

    const handleSaveSignature = (signature: string) => {
        console.log('Saving signature:', signature?.substring(0, 50) + '@/features/clients/components/...');
        setIsSigning(false);
    }


    const handleDownloadPDF = async () => {
        if (!viewingDocument) return;
        const targetId = viewingDocument.type === 'invoice' ? 'invoice-document' : 'receipt-document';
        const element = document.getElementById(targetId);
        if (!element) return;

        const opt = {
            margin: 10,
            filename: `${viewingDocument.type}-${viewingDocument.project?.clientName?.replace(/\s+/g, '-').toLowerCase()}-${viewingDocument.project?.id.slice(-8)}.pdf`,
            image: { type: 'jpeg' as const, quality: 0.98 },
            html2canvas: {
                scale: 3,
                useCORS: true,
                letterRendering: true,
                windowWidth: 1200,
                onclone: (clonedDoc: any) => {
                    const el = clonedDoc.getElementById(targetId);
                    if (el) el.classList.add('force-desktop');
                }
            },
            jsPDF: { unit: 'mm' as const, format: 'a4' as const, orientation: 'portrait' as const }
        };

        const html2pdf = (await import('html2pdf.js')).default;
        html2pdf().set(opt).from(element).save();
    };

    const renderDocumentBody = () => {
        if (!viewingDocument) return null;

        const { type, project, data } = viewingDocument;
        const formatDate = (dateString: string) => new Date(dateString).toLocaleDateString('id-ID', { year: 'numeric', month: 'long', day: 'numeric' });

        if (type === 'invoice') {
            return (
                <InvoiceDocument
                    id="invoice-document"
                    project={project}
                    profile={profile}
                    packages={packages}
                    client={client}
                />
            );
        } else if (type === 'receipt') {
            const transaction = data as Transaction;
            const projectData = transaction.projectId ? projects.find((p: Project) => String(p.id) === String(transaction.projectId)) : null;
            return (
                <div id="receipt-document" className="p-4 sm:p-8 bg-white border border-slate-200 shadow-xl mx-auto max-w-2xl font-sans text-slate-900 print:shadow-none print:border-none print:bg-white print:max-w-none">
                    <div className="flex justify-between items-start mb-10 pb-6 border-b-2 border-brand-accent print:mb-6 print:pb-4">
                        <div>
                            {profile.logoBase64 ? (
                                <img src={profile.logoBase64} alt="Company Logo" className="h-16 object-contain mb-3" />
                            ) : (
                                <h2 className="text-xl font-bold text-brand-accent mb-1">{profile.companyName}</h2>
                            )}
                            <p className="text-[11px] text-slate-500">{profile.address}</p>
                        </div>
                        <div className="text-right">
                            <h1 className="text-2xl font-black text-slate-400 uppercase tracking-widest leading-none">Tanda Terima</h1>
                            <p className="text-xs font-mono text-slate-500 mt-2">#{String(transaction.id).slice(0, 8).toUpperCase()}</p>
                        </div>
                    </div>

                    <div className="bg-slate-50 p-6 rounded-lg mb-8 border border-slate-100 print:bg-white print:border-slate-200">
                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Status Pembayaran</p>
                        <p className="text-xs font-bold text-green-600 uppercase mb-3">Telah Diterima Secara Sah</p>
                        <p className="text-4xl font-black text-slate-900 tracking-tighter">{formatDocumentCurrency(transaction.amount)}</p>
                        <p className="text-xs text-slate-500 mt-2">Tanggal: <span className="font-bold text-slate-700">{formatDate(transaction.date)}</span></p>
                    </div>

                    <div className="grid grid-cols-1 gap-6 mb-10">
                        <div className="space-y-4">
                            <div className="flex justify-between text-sm py-2 border-b border-slate-100">
                                <span className="text-slate-500">Diterima Dari</span>
                                <span className="font-bold text-slate-800">{client.name}</span>
                            </div>
                            <div className="flex justify-between text-sm py-2 border-b border-slate-100">
                                <span className="text-slate-500">Metode Pembayaran</span>
                                <span className="font-bold text-slate-800">{transaction.method}</span>
                            </div>
                            <div className="py-4">
                                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">Tujuan Pembayaran</p>
                                <p className="text-sm font-medium text-slate-700 leading-relaxed bg-slate-50/50 p-3 rounded">{transaction.description}</p>
                            </div>
                            {projectData && (
                                <div className="p-4 bg-blue-50/50 border border-blue-100 rounded-lg text-[12px] text-blue-700">
                                    <p className="font-bold mb-1">Progres Acara Pernikahan Pengantin: {projectData.projectName}</p>
                                    <div className="flex justify-between">
                                        <span>Total Tagihan: {formatDocumentCurrency(projectData.totalCost)}</span>
                                        <span className="font-bold">Sisa: {formatDocumentCurrency(projectData.totalCost - projectData.amountPaid)}</span>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="flex justify-between items-end pt-8 border-t border-slate-100">
                        <div className="text-[10px] text-slate-400 italic">
                            Dicetak otomatis oleh {profile.companyName}
                        </div>
                        <div className="text-center w-48 shrink-0">
                            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-4">Penerima,</p>
                            <div className="h-20 flex items-center justify-center mb-2">
                                {transaction.vendorSignature ? (
                                    <img src={transaction.vendorSignature} alt="Tanda Tangan" className="max-h-full object-contain" />
                                ) : (
                                    <div className="h-px w-24 bg-slate-200 mx-auto mt-10" />
                                )}
                            </div>
                            <p className="text-sm font-bold text-slate-800 underline underline-offset-4 decoration-slate-300">({profile.authorizedSigner || profile.companyName})</p>
                        </div>
                    </div>
                </div>
            );
        }
        return null;
    };


    return (
        <>
            <Modal isOpen={!!viewingDocument} onClose={onClose} title={viewingDocument ? `${viewingDocument.type.charAt(0).toUpperCase() + viewingDocument.type.slice(1)}: ${viewingDocument.project.projectName}` : ''} size="4xl">
                {viewingDocument && (
                    <div>
                        <div id="invoice" className="printable-area overflow-y-auto pr-4">{renderDocumentBody()}</div>
                        <div className="mt-6 flex justify-end items-center non-printable border-t border-public-border pt-4 px-2">
                            <div className="flex items-center gap-3">
                                <button
                                    onClick={handleDownloadPDF}
                                    className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white text-sm font-bold rounded-xl shadow-lg shadow-blue-500/20 transition-all flex items-center gap-2"
                                >
                                    <DownloadIcon className="w-4 h-4" />
                                    <span>Unduh PDF</span>
                                </button>

                            </div>
                        </div>
                    </div>
                )}
            </Modal>
            <div
                className={`fixed inset-0 bg-black/70 backdrop-blur-sm flex justify-center items-center p-4 transition-all duration-300 ${isSigning ? 'z-[60] opacity-100 pointer-events-auto' : 'z-[-1] opacity-0 pointer-events-none'
                    }`}
                style={{
                    display: isSigning ? 'flex' : 'none', // Force display control
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    zIndex: isSigning ? 9999 : -1
                }}
                onClick={(e) => {
                    if (e.target === e.currentTarget) {
                        console.log('Closing signature modal by clicking outside');
                        setIsSigning(false);
                    }
                }}
            >
                <div
                    className={`bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] flex flex-col transform transition-all duration-300 ${isSigning ? 'scale-100 opacity-100' : 'scale-95 opacity-0'
                        }`}
                    onClick={e => e.stopPropagation()}
                >
                    {/* Header */}
                    <div className="flex justify-between items-center p-6 border-b border-gray-200">
                        <h3 className="text-xl font-semibold text-gray-900">Bubuhkan Tanda Tangan Anda</h3>
                        <button
                            onClick={() => {
                                console.log('Closing signature modal via X button');
                                setIsSigning(false);
                            }}
                            className="p-2 rounded-full hover:bg-gray-100 transition-colors"
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>

                    {/* Content */}
                    <div className="p-6 flex-1 overflow-y-auto">
                        <div className="w-full min-h-[400px]">
                            <div className="mb-4 text-center">
                                <p className="text-sm text-gray-600">Silakan tanda tangani kontrak ini untuk melanjutkan</p>
                                <p className="text-xs text-blue-600 mt-2">Debug: isSigning = {isSigning.toString()}</p>
                            </div>
                            <SignaturePad
                                onSave={handleSaveSignature}
                                onClose={() => {
                                    console.log('Signature pad cancelled');
                                    setIsSigning(false);
                                }}
                            />
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}

export default ClientPortal;
