import React, { useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
    ChevronLeftIcon,
    SaveIcon,
    Trash2Icon,
    LayoutIcon
} from 'lucide-react';
import { useProject, useProjects } from '@/features/projects/api/useProjects';
import { useProfile } from '@/features/settings/api/useProfileQueries';
import { useClients } from '@/features/clients/api/useClients';
import { useTeamMembers, useTeamProjectPayments } from '@/features/team/api/useTeamQueries';
import { useTransactions, useCards, usePockets } from '@/features/finance/api/useFinanceQueries';
import { useProjectActions } from '@/features/projects/hooks/useProjectActions';
import ProjectForm from '@/features/projects/components/ProjectForm';
import { useApp } from '@/app/AppContext';

const ProjectEditPage: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { showNotification } = useApp();
    const isEdit = !!id;

    // Track if form has been initialized to avoid re-init on profile refetch
    const initializedRef = useRef(false);

    const { data: project, isLoading: isProjectLoading } = useProject(id ? Number(id) : 0);
    const { data: projectsData } = useProjects();
    const { data: profile } = useProfile();
    const { data: clientsData } = useClients({ limit: 500 });
    const { data: teamMembers = [] } = useTeamMembers();
    const { data: teamProjectPayments = [] } = useTeamProjectPayments();
    const { data: transactions = [] } = useTransactions();
    const { data: cards = [] } = useCards();
    const { data: pockets = [] } = usePockets();

    const projects = projectsData || [];
    const clients = clientsData || [];

    const projectActions = useProjectActions({
        projects,
        clients,
        teamMembers,
        teamProjectPayments,
        setTeamProjectPayments: () => {},
        transactions,
        cards,
        pockets,
        profile: profile || {} as any,
        showNotification,
    });

    useEffect(() => {
        // Only initialize once per page load; prevent re-init when profile refetches
        if (initializedRef.current) return;

        if (isEdit) {
            // Wait until both project and profile are loaded
            if (project && profile) {
                projectActions.initializeForm('edit', project);
                initializedRef.current = true;
            }
        } else {
            // For "add" mode, initialize as soon as profile is ready
            if (profile) {
                projectActions.initializeForm('add');
                initializedRef.current = true;
            }
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isEdit, project, profile]);

    // Show loading only while data is actually being fetched
    if (isEdit && (isProjectLoading || !project || !profile)) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-brand-bg">
                <div className="flex flex-col items-center gap-4">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-accent"></div>
                    <p className="text-brand-text-secondary text-sm font-medium">Memuat Data Acara...</p>
                </div>
            </div>
        );
    }

    if (!profile) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-brand-bg">
                <div className="flex flex-col items-center gap-4">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-accent"></div>
                    <p className="text-brand-text-secondary text-sm font-medium">Memuat Konfigurasi...</p>
                </div>
            </div>
        );
    }

    if (!projectActions.formData) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-brand-bg">
                <div className="flex flex-col items-center gap-4">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-accent"></div>
                    <p className="text-brand-text-secondary text-sm font-medium">Menyiapkan Form...</p>
                </div>
            </div>
        );
    }

    const handleBack = () => {
        if (window.confirm("Perubahan yang belum disimpan akan hilang. Yakin ingin kembali?")) {
            if (isEdit && id) {
                navigate(`/project/${id}`);
            } else {
                navigate('/project');
            }
        }
    };

    return (
        <div className="min-h-screen bg-brand-bg pb-20">
            {/* Header */}
            <div className="sticky top-0 z-40 bg-brand-bg/80 backdrop-blur-md border-b border-brand-border/50">
                <div className="max-w-5xl mx-auto px-4 sm:px-6 h-20 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <button 
                            onClick={handleBack}
                            className="p-2.5 rounded-xl border border-brand-border hover:bg-brand-surface transition-colors"
                        >
                            <ChevronLeftIcon className="w-5 h-5 text-brand-text-secondary" />
                        </button>
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-brand-accent to-blue-600 flex items-center justify-center shadow-lg shadow-brand-accent/20">
                                <LayoutIcon className="w-5 h-5 text-white" />
                            </div>
                            <div>
                                <h1 className="text-lg font-black text-brand-text-light tracking-tight">
                                    {isEdit ? 'Edit Acara Pernikahan' : 'Tambah Acara Pernikahan'}
                                </h1>
                                <p className="text-[10px] text-brand-text-secondary font-bold uppercase tracking-widest">
                                    {isEdit ? projectActions.formData.projectName : 'Acara Pernikahan Baru'}
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        <button 
                            onClick={handleBack}
                            className="px-5 py-2.5 rounded-xl text-xs font-bold text-brand-text-secondary hover:text-brand-text-light transition-colors"
                        >
                            Batal
                        </button>
                        <button 
                            onClick={(e: any) => projectActions.handleFormSubmit(e)}
                            className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-brand-accent text-white text-xs font-black shadow-lg shadow-brand-accent/25 hover:shadow-brand-accent/40 transition-all active:scale-95"
                        >
                            <SaveIcon className="w-4 h-4" />
                            <span>{isEdit ? 'Simpan Perubahan' : 'Simpan Acara'}</span>
                        </button>
                    </div>
                </div>
            </div>

            {/* Content */}
            <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
                <div className="bg-brand-surface border border-brand-border rounded-[2.5rem] shadow-sm overflow-hidden">
                    <div className="p-6 md:p-10">
                        {/* 
                            We reuse ProjectForm but we need to make sure it doesn't render as a Modal 
                            when used here. I'll update ProjectForm to accept an 'inline' prop.
                        */}
                        <ProjectForm
                            isOpen={true}
                            onClose={() => {}}
                            mode={projectActions.formMode}
                            formData={projectActions.formData}
                            onFormChange={projectActions.handleFormChange}
                            onSubStatusChange={projectActions.handleSubStatusChange}
                            onClientChange={projectActions.handleClientChange}
                            onTeamChange={projectActions.handleTeamChange}
                            onTeamFeeChange={projectActions.handleTeamFeeChange}
                            onTeamSubJobChange={projectActions.handleTeamSubJobChange}
                            onTeamClientPortalLinkChange={projectActions.handleTeamClientPortalLinkChange}
                            onCustomSubStatusChange={projectActions.handleCustomSubStatusChange}
                            onAddCustomSubStatus={projectActions.addCustomSubStatus}
                            onRemoveCustomSubStatus={projectActions.removeCustomSubStatus}
                            onSubmit={projectActions.handleFormSubmit}
                            clients={clients}
                            teamMembers={teamMembers}
                            teamProjectPayments={teamProjectPayments}
                            profile={profile}
                            teamByCategory={projectActions.teamByCategory}
                            showNotification={showNotification}
                            setFormData={projectActions.setFormData}
                            inline={true}
                        />
                    </div>
                </div>

                {isEdit && (
                    <div className="mt-8 flex justify-center">
                        <button 
                            onClick={() => {
                                if (window.confirm("Yakin ingin menghapus Acara Pernikahan ini? Semua data terkait akan ikut terhapus.")) {
                                    projectActions.handleProjectDelete(Number(id));
                                    navigate('/project');
                                }
                            }}
                            className="flex items-center gap-2 px-6 py-3 rounded-2xl bg-red-500/10 text-red-500 border border-red-500/20 text-xs font-bold hover:bg-red-500 hover:text-white transition-all"
                        >
                            <Trash2Icon className="w-4 h-4" />
                            Hapus Acara Pernikahan
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ProjectEditPage;
