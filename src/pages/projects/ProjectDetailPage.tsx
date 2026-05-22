import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
    LayoutIcon, 

    ChevronLeftIcon,
    CalendarIcon,
    MapPinIcon,
    UsersIcon,
    BriefcaseIcon,
    ClockIcon,
    Share2Icon,
    PencilIcon
} from 'lucide-react';
import { useProject, useUpdateProject } from '@/features/projects/api/useProjects';
import { useProfile } from '@/features/settings/api/useProfileQueries';

import { useTeamProjectPayments } from '@/features/team/api/useTeamQueries';
import { useClients } from '@/features/clients/api/useClients';
import ProjectDetailsTab from '@/features/projects/components/ProjectDetailModal/ProjectDetailsTab';
import { getProgressForStatus, formatDateFull, getStatusClass } from '@/features/projects/utils/project.utils';
import { AssignedTeamMember } from '@/features/projects/types/project.types';
import { useProjectActions } from '@/features/projects/hooks/useProjectActions';

import BriefingModal from '@/features/projects/components/BriefingModal';
import { useTeamMembers } from '@/features/team/api/useTeamQueries';
import { useTransactions, useCards, usePockets } from '@/features/finance/api/useFinanceQueries';
import { useApp } from '@/app/AppContext';

const ProjectDetailPage: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();

    const { data: project, isLoading: isProjectLoading } = useProject(id ? Number(id) : undefined);
    const { data: profile } = useProfile();

    const { data: teamProjectPayments = [] } = useTeamProjectPayments();
    const { data: clientsData } = useClients({ limit: 500 });
    const { data: teamMembers = [] } = useTeamMembers();
    const { data: transactions = [] } = useTransactions();
    const { data: cards = [] } = useCards();
    const { data: pockets = [] } = usePockets();

    const updateProjectMutation = useUpdateProject();
    const clients = clientsData || [];

    const { showNotification } = useApp();
    const projectActions = useProjectActions({
        projects: project ? [project] : [],
        clients,
        teamMembers,
        teamProjectPayments,
        setTeamProjectPayments: () => {},
        transactions,
        cards,
        pockets,
        profile: profile || {} as any,
        showNotification
    });

    const teamByCategory = React.useMemo(() => {
        if (!project) return { 'Tim': {}, 'Vendor': {} };
        const categories: Record<string, Record<string, AssignedTeamMember[]>> = { 'Tim': {}, 'Vendor': {} };
        (project.team || []).forEach(m => {
            const cat = ('category' in m ? (m as any).category : 'Tim') || 'Tim';
            if (!categories[cat]) categories[cat] = {};
            if (!categories[cat][m.role]) categories[cat][m.role] = [];
            categories[cat][m.role].push(m);
        });
        return categories;
    }, [project]);

    if (isProjectLoading || !project || !profile) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-brand-bg">
                <div className="flex flex-col items-center gap-4">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-accent"></div>
                    <p className="text-brand-text-secondary text-sm font-medium animate-pulse">Memuat Detail Acara Pernikahan...</p>
                </div>
            </div>
        );
    }

    const handleStatusUpdate = async (newStatus: string) => {
        try {
            const nextProgress = getProgressForStatus(newStatus, profile.projectStatusConfig);
            await updateProjectMutation.mutateAsync({
                id: project.id,
                status: newStatus,
                progress: nextProgress,
                activeSubStatuses: []
            });
        } catch (err) {
            console.error('Failed to update status:', err);
        }
    };

    const handleSubStatusToggle = async (name: string, checked: boolean) => {
        try {
            const nextActive = checked 
                ? [...(project.activeSubStatuses || []), name]
                : (project.activeSubStatuses || []).filter(s => s !== name);
            
            await updateProjectMutation.mutateAsync({
                id: project.id,
                activeSubStatuses: nextActive
            });
        } catch (err) {
            console.error('Failed to update sub-status:', err);
        }
    };

    const handleSaveFinalLink = async (link: string) => {
        try {
            await updateProjectMutation.mutateAsync({
                id: project.id,
                finalDriveLink: link
            });
        } catch (err) {
            console.error('Failed to save link:', err);
        }
    };

    const handleSendFinalLink = () => {
        const client = clients.find(c => String(c.id) === String(project.clientId));
        if (!project.finalDriveLink || !client?.phone) {
            alert('Nomor telepon pengantin atau link belum tersedia.');
            return;
        }
        const message = `Halo Kak, file dokumentasi pernikahan sudah siap ya. Silakan akses di link berikut: ${project.finalDriveLink}. Terima kasih!`;
        window.open(`https://wa.me/${client.phone.replace(/\D/g, '')}?text=${encodeURIComponent(message)}`, '_blank');
    };

    return (
        <div className="min-h-screen bg-brand-bg relative overflow-x-hidden">
            {/* Background Decorative Elements */}
            <div className="absolute top-0 left-0 w-full h-[400px] bg-gradient-to-b from-brand-accent/10 to-transparent pointer-events-none"></div>
            <div className="absolute top-[-10%] right-[-5%] w-[40%] h-[40%] bg-brand-accent/5 rounded-full blur-[120px] pointer-events-none"></div>

            {/* Header / Nav */}
            <header className="sticky top-0 z-40 bg-brand-bg/60 backdrop-blur-xl border-b border-brand-border/50">
                <div className="w-full mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
                    <div className="flex items-center gap-6">
                        <button 
                            onClick={() => navigate('/project')}
                            className="group flex items-center gap-2 p-2 rounded-2xl hover:bg-brand-surface transition-all active:scale-95 border border-transparent hover:border-brand-border"
                        >
                            <div className="p-2 rounded-xl bg-brand-surface border border-brand-border group-hover:bg-brand-accent group-hover:text-white transition-all">
                                <ChevronLeftIcon className="w-5 h-5" />
                            </div>
                            <span className="text-sm font-bold text-brand-text-secondary group-hover:text-brand-text-light hidden sm:block transition-colors">Kembali ke Daftar</span>
                        </button>
                        
                        <div className="h-8 w-[1px] bg-brand-border hidden sm:block"></div>

                        <div className="flex items-center gap-4">
                            <div className="hidden sm:flex w-12 h-12 rounded-2xl bg-gradient-to-br from-brand-accent to-blue-600 items-center justify-center shadow-xl shadow-brand-accent/20">
                                <LayoutIcon className="w-6 h-6 text-white" />
                            </div>
                            <div>
                                <h1 className="text-xl font-black text-brand-text-light tracking-tight truncate max-w-[200px] md:max-w-md">Detail Acara Pernikahan</h1>
                                <div className="flex items-center gap-2 mt-0.5">
                                    <span className={`text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full ${getStatusClass(project.status, profile.projectStatusConfig)}`}>
                                        {project.status}
                                    </span>
                                    <span className="text-brand-text-secondary text-[10px] font-bold">•</span>
                                    <p className="text-[10px] text-brand-text-secondary font-bold uppercase tracking-widest truncate max-w-[150px]">{project.projectName}</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </header>

            <main className="w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12 relative z-10">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                    {/* Sidebar / Quick Info */}
                    <aside className="lg:col-span-4 space-y-6">
                        {/* Project Card Hero */}
                        <div className="bg-brand-surface border border-brand-border rounded-[2.5rem] p-8 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group">
                            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                                <BriefcaseIcon className="w-24 h-24 text-brand-accent -mr-8 -mt-8 rotate-12" />
                            </div>
                            
                            <div className="relative z-10">
                                <h2 className="text-2xl font-black text-brand-text-light leading-tight mb-2">{project.projectName}</h2>
                                <p className="text-brand-text-secondary font-semibold flex items-center gap-2 mb-8">
                                    <UsersIcon className="w-4 h-4 text-brand-accent" />
                                    {project.clientName}
                                </p>

                                <div className="space-y-4">
                                    <div className="flex items-center gap-4 p-4 rounded-3xl bg-brand-bg/50 border border-brand-border/30">
                                        <div className="w-10 h-10 rounded-2xl bg-white/5 flex items-center justify-center text-brand-accent border border-brand-border/30">
                                            <CalendarIcon className="w-5 h-5" />
                                        </div>
                                        <div>
                                            <p className="text-[10px] font-black text-brand-text-secondary uppercase tracking-widest">Tanggal Acara</p>
                                            <p className="text-sm font-bold text-brand-text-light">{formatDateFull(project.date)}</p>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-4 p-4 rounded-3xl bg-brand-bg/50 border border-brand-border/30">
                                        <div className="w-10 h-10 rounded-2xl bg-white/5 flex items-center justify-center text-blue-400 border border-brand-border/30">
                                            <MapPinIcon className="w-5 h-5" />
                                        </div>
                                        <div className="min-w-0">
                                            <p className="text-[10px] font-black text-brand-text-secondary uppercase tracking-widest">Lokasi</p>
                                            <p className="text-sm font-bold text-brand-text-light truncate" title={project.location}>{project.location || 'Belum diatur'}</p>
                                        </div>
                                    </div>

                                    {project.startTime && (
                                        <div className="flex items-center gap-4 p-4 rounded-3xl bg-brand-bg/50 border border-brand-border/30">
                                            <div className="w-10 h-10 rounded-2xl bg-white/5 flex items-center justify-center text-orange-400 border border-brand-border/30">
                                                <ClockIcon className="w-5 h-5" />
                                            </div>
                                            <div>
                                                <p className="text-[10px] font-black text-brand-text-secondary uppercase tracking-widest">Waktu</p>
                                                <p className="text-sm font-bold text-brand-text-light">{project.startTime} {project.endTime ? ` - ${project.endTime}` : ''}</p>
                                            </div>
                                        </div>
                                    )}
                                </div>
                                
                                <div className="mt-8 pt-8 border-t border-brand-border/30 flex gap-3">
                                    <button 
                                        onClick={() => navigate(`/project/${project.id}/edit`)}
                                        className="flex-1 flex items-center justify-center gap-2 px-5 py-3 rounded-2xl bg-brand-surface border border-brand-border text-sm font-bold text-brand-text-light hover:bg-brand-bg transition-all active:scale-95"
                                    >
                                        <PencilIcon className="w-4 h-4" />
                                        Edit
                                    </button>
                                    <button 
                                        onClick={() => projectActions.handleOpenBriefingModal(project)}
                                        className="flex-1 flex items-center justify-center gap-2 px-5 py-3 rounded-2xl bg-brand-accent text-white font-bold hover:shadow-lg hover:shadow-brand-accent/25 transition-all active:scale-95"
                                    >
                                        <Share2Icon className="w-4 h-4" />
                                        Briefing
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Quick Progress Summary */}
                        <div className="bg-brand-surface border border-brand-border rounded-[2.5rem] p-8 shadow-sm">
                            <h3 className="text-xs font-black text-brand-text-secondary uppercase tracking-[0.2em] mb-6">Progres Pengerjaan</h3>
                            <div className="space-y-4">
                                <div className="flex justify-between items-end mb-1">
                                    <span className="text-2xl font-black text-brand-text-light">{project.progress}%</span>
                                    <span className="text-xs font-bold text-brand-text-secondary">{project.status}</span>
                                </div>
                                <div className="h-4 w-full bg-brand-bg rounded-full overflow-hidden p-1 border border-brand-border/30">
                                    <div 
                                        className="h-full bg-gradient-to-r from-brand-accent to-blue-500 rounded-full transition-all duration-1000 ease-out shadow-sm"
                                        style={{ width: `${project.progress}%` }}
                                    ></div>
                                </div>
                                <p className="text-[11px] text-brand-text-secondary font-medium leading-relaxed italic mt-4">
                                    * Progress dihitung otomatis berdasarkan status pengerjaan saat ini.
                                </p>
                            </div>
                        </div>
                    </aside>

                    {/* Main Content Area */}
                    <div className="lg:col-span-8">
                        <div className="bg-brand-surface border border-brand-border rounded-[2.5rem] shadow-sm overflow-hidden min-h-[600px] flex flex-col">
                            {/* Tab Header Decoration */}
                            <div className="h-1.5 w-full bg-gradient-to-r from-brand-accent/20 via-brand-accent to-blue-500/20"></div>
                            
                            <div className="p-6 md:p-10 flex-1">
                                <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                                    <ProjectDetailsTab
                                        selectedProject={project}
                                        profile={profile}
                                        teamByCategory={teamByCategory}
                                        handleStatusUpdate={handleStatusUpdate}
                                        handleSubStatusToggle={handleSubStatusToggle}
                                        handleOpenForm={projectActions.handleOpenForm}
                                        handleOpenBriefingModal={() => projectActions.handleOpenBriefingModal(project)}
                                        onClose={() => {}}
                                        handleSaveFinalLink={handleSaveFinalLink}
                                        handleSendFinalLink={handleSendFinalLink}
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </main>

            {/* Modals from projectActions */}

            {projectActions.isBriefingModalOpen && (
                <BriefingModal
                    isOpen={projectActions.isBriefingModalOpen}
                    onClose={() => projectActions.setIsBriefingModalOpen(false)}
                    briefingText={projectActions.briefingText}
                />
            )}
            
            {/* Footer Padding for Mobile Bottom Bar if any */}
            <div className="h-20 lg:hidden"></div>
        </div>
    );
};

export default ProjectDetailPage;
