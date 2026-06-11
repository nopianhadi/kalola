import React, { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { ProjectsProps, Project } from '@/features/projects/types/project.types';
import { useProjectsData } from '@/features/projects/hooks/useProjectsData';
import { useProjectsFilters } from '@/features/projects/hooks/useProjectsFilters';
import { useProjectActions } from '@/features/projects/hooks/useProjectActions';

// React Query Hooks
import { useProjectsPaginated } from '@/features/projects/api/useProjects';

import { useClients } from '@/features/clients/api/useClients';
import { useTransactions, useCards, usePockets } from '@/features/finance/api/useFinanceQueries';
// import { useProjectChecklist } from '@/features/projects/hooks/useProjectChecklist'; // Keep if needed for later
import ProjectHeader from '@/features/projects/components/ProjectHeader';
import ProjectFilters from '@/features/projects/components/ProjectFilters';
import ProjectListView from '@/features/projects/components/ProjectListView';
import ProjectKanbanView from '@/features/projects/components/ProjectKanbanView';
import BriefingModal from '@/features/projects/components/BriefingModal';
import { UniversalShareModal } from '@/shared/components/UniversalShareModal';
import ChatModal from '@/features/communication/components/ChatModal';
import StatModal from '@/features/projects/components/StatModal';
import QuickStatusModal from '@/features/projects/components/QuickStatusModal';
import { getStatModalData } from '@/features/projects/utils/project.utils';

const ProjectsPage: React.FC<ProjectsProps> = ({
    profile, showNotification,
    teamMembers, teamProjectPayments, setTeamProjectPayments
}) => {
    const navigate = useNavigate();


    // 1. Decoupled Data Fetching
    const { data: qClients } = useClients({ limit: 50 });
    const { data: qTransactions } = useTransactions({ limit: 50 });
    const { data: qCards } = useCards();
    const { data: qPockets } = usePockets();

    const clients = qClients || [];
    const transactions = qTransactions || [];
    const cards = qCards || [];
    const pockets = qPockets || [];

    // 2. Filtering & View Logic
    const {
        searchTerm, setSearchTerm,
        statusFilter, setStatusFilter,
        dateFrom, setDateFrom, dateTo, setDateTo,
        viewMode, setViewMode,
        page, setPage, limit
    } = useProjectsFilters({
        projects: [] as Project[]
    });

    // Reset page on filter change
    React.useEffect(() => {
        setPage(1);
    }, [searchTerm, statusFilter, dateFrom, dateTo]);

    const { data: paginatedData, isLoading: isLoadingPaginated } = useProjectsPaginated(
        page,
        limit,
        searchTerm,
        {
            status: statusFilter === 'all' ? undefined : statusFilter,
            dateFrom,
            dateTo
        }
    );

    const projects = paginatedData?.projects || [];
    const totalProjects = paginatedData?.total || 0;

    // 1. Data & State Management
    useProjectsData({
        projects: projects as any,
        clients: clients as any,
        teamMembers
    });

    // 3. Mutation & Action Handlers
    const actions = useProjectActions({
        projects: projects as any,
        clients: clients as any,
        teamMembers,
        teamProjectPayments,
        setTeamProjectPayments,
        transactions,
        cards,
        pockets,
        profile,
        showNotification
    });

    // 4. Derived Data
    const statModalData = useMemo(() => 
        getStatModalData(actions.activeStatModal, projects as any, profile),
        [actions.activeStatModal, projects, profile]
    );

    return (
        <div className="space-y-6 pb-20 lg:pb-0">
            {/* Header */}
            <ProjectHeader 
                onAddProject={() => navigate('/project/add')}
            />

            {/* Filters Section */}
            <ProjectFilters 
                searchTerm={searchTerm}
                setSearchTerm={setSearchTerm}
                dateFrom={dateFrom}
                setDateFrom={setDateFrom}
                dateTo={dateTo}
                setDateTo={setDateTo}
                statusFilter={statusFilter}
                setStatusFilter={setStatusFilter}
                viewMode={viewMode}
                setViewMode={setViewMode}
                projectStatusConfig={profile.projectStatusConfig}
            />

            {/* Main Content: List or Kanban */}
            <div className="min-h-[400px]">
                {viewMode === 'list' ? (
                    <ProjectListView 
                        projects={projects as any}
                        handleOpenDetailModal={(p) => navigate(`/project/${p.id}`)}
                        handleOpenForm={(_, p) => navigate(`/project/${p.id}/edit`)}
                        handleProjectDelete={actions.handleProjectDelete}
                        config={profile.projectStatusConfig}
                        clients={clients as any}
                        handleQuickStatusChange={actions.handleQuickStatusChange}
                        handleSendMessage={actions.handleSendMessage}
                        // Pagination
                        page={page}
                        setPage={setPage}
                        limit={limit}
                        totalItems={totalProjects}
                        isLoading={isLoadingPaginated}
                    />
                ) : (
                    <ProjectKanbanView 
                        projects={projects as any}
                        handleOpenDetailModal={(p) => navigate(`/project/${p.id}`)}
                        draggedProjectId={actions.draggedProjectId}
                        handleDragStart={actions.handleDragStart}
                        handleDragOver={actions.handleDragOver}
                        handleDrop={actions.handleDrop}
                        config={profile.projectStatusConfig}
                    />
                )}
            </div>

            {/* Modals */}

            {actions.isBriefingModalOpen && (
                <BriefingModal 
                    isOpen={actions.isBriefingModalOpen}
                    onClose={() => actions.setIsBriefingModalOpen(false)}
                    briefingText={actions.briefingText}
                />
            )}

            {actions.quickStatusModalOpen && actions.selectedProjectForStatus && (
                <QuickStatusModal 
                    isOpen={actions.quickStatusModalOpen}
                    onClose={() => actions.setQuickStatusModalOpen(false)}
                    project={actions.selectedProjectForStatus}
                    statusConfig={profile.projectStatusConfig}
                    onStatusChange={actions.handleQuickStatusChange}
                    showNotification={showNotification}
                />
            )}

            {actions.sharePreview && (
                <UniversalShareModal 
                    isOpen={!!actions.sharePreview}
                    onClose={() => actions.setSharePreview(null)}
                    title={actions.sharePreview.title}
                    initialMessage={actions.sharePreview.message}
                    phone={actions.sharePreview.phone}
                    profile={profile}
                    showNotification={showNotification}
                />
            )}

            {actions.chatModalData && (
                <ChatModal 
                    isOpen={!!actions.chatModalData}
                    onClose={() => actions.setChatModalData(null)}
                    project={actions.chatModalData.project}
                    client={actions.chatModalData.client}
                    onSendMessage={() => {}} // TODO: Implement if needed
                    userProfile={profile}
                />
            )}

            {actions.activeStatModal && statModalData && (
                <StatModal 
                    isOpen={!!actions.activeStatModal}
                    onClose={() => actions.setActiveStatModal(null)}
                    title={statModalData.title}
                    items={statModalData.items}
                />
            )}
        </div>
    );
};

export default ProjectsPage;
