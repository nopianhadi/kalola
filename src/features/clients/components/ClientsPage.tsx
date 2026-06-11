import React from 'react';
import { useNavigate } from 'react-router-dom';
// Types
import {
    Client, Project,
    ViewType, NavigationAction, Transaction
} from '@/types';
import { ExtendedClient } from '@/features/clients/types';

// UI Components
import { Button, Badge, Card, PageHeader } from '@/shared/ui';

// React Query Hooks
import { useQueryClient } from '@tanstack/react-query';
import { useClients } from '@/features/clients/api/useClients';
import { useProjects } from '@/features/projects/api/useProjects';
import { useTransactions, useCards, usePockets } from '@/features/finance/api/useFinanceQueries';
import { usePackages, useAddOns } from '@/features/packages/api/usePackagesQueries';
import { usePromoCodes } from '@/features/promo/api/usePromoQueries';
import { useProfile } from '@/features/settings/api/useProfileQueries';

// Hooks
import { useClientsPage } from '@/features/clients/hooks/useClientsPage';

// Components (Named & Default Imports)
import { ClientFilterBar } from '@/features/clients/components/ClientFilterBar';
import { ClientHeader } from '@/features/clients/components/ClientHeader';
import { ClientActiveList } from '@/features/clients/components/ClientActiveList';
import { ClientInactiveList } from '@/features/clients/components/ClientInactiveList';
import { ClientUnpaidList } from '@/features/clients/components/ClientUnpaidList';
import { ClientForm } from '@/features/clients/components/ClientForm';
import ClientDetailModal from '@/features/clients/components/ClientDetailModal';
import BillingChatModal from '@/features/clients/components/BillingChatModal';
import { ClientPortalQrModal, BookingFormShareModal } from '@/features/clients/components/ClientLinkModals';
import { InvoicePreviewModal } from '@/features/clients/components/InvoicePreviewModal';
import { ReceiptPreviewModal } from '@/features/clients/components/ReceiptPreviewModal';
import ProjectsPageFeature from '@/features/projects/ProjectsPage';
import { useProjectActions } from '@/features/projects/hooks/useProjectActions';
import QuickStatusModal from '@/features/projects/components/QuickStatusModal';
import BriefingModal from '@/features/projects/components/BriefingModal';
import ChatModal from '@/features/communication/components/ChatModal';
import { UniversalShareModal } from '@/shared/components/UniversalShareModal';
import Contracts from '@/pages/contracts/ContractsPage';

export interface ClientsProps {
    showNotification: (message: string) => void;
    handleNavigation: (view: ViewType, action?: NavigationAction) => void;
}



// Service & Mutation Imports for local handlers

import { updateProject as updateProjectInDb } from '@/services/projects';
import { createTransaction, updateCardBalance, updateTransaction as updateTransactionInDb } from '@/services/transactions';
import { useTeamMembers, useTeamProjectPayments } from '@/features/team/api/useTeamQueries';
import { TransactionType, PaymentStatus, ClientStatus } from '@/types';
import { ClientStatsCards } from '@/features/clients/components/ClientStatsCards';
import { formatCurrency } from '@/features/clients/utils/clients.utils';

export const ClientsPage: React.FC<ClientsProps> = (props) => {

    const {
        showNotification,
        handleNavigation,
    } = props;


    // Fetch decoupled data locally
    const { data: packages = [] } = usePackages();
    const { data: addOns = [] } = useAddOns();
    const { data: promoCodes = [] } = usePromoCodes();
    const { data: userProfileData } = useProfile();

    const userProfile = userProfileData || ({
        projectTypes: [],
        projectStatusConfig: [],
        eventTypes: [],
    } as any);


    // Fetch decoupled data locally
    const { data: clientsData } = useClients({ limit: 500 });
    const { data: projectsData } = useProjects({ limit: 500 });
    const { data: transactionsData } = useTransactions({ limit: 500 });
    const { data: cardsData } = useCards();
    const { data: pocketsData } = usePockets();

    // Mission Decoupling: Localized data for previously drilled props
    const { data: teamMembers = [] } = useTeamMembers();
    const { data: teamProjectPayments = [] } = useTeamProjectPayments();


    const setTeamProjectPayments = (updater: React.SetStateAction<any[]>) => {
        const current = queryClient.getQueryData<any[]>(['teamProjectPayments']) || [];
        const next = typeof updater === 'function' ? (updater as any)(current) : updater;
        queryClient.setQueryData(['teamProjectPayments'], next);
    };

    const queryClient = useQueryClient();

    // Local Handlers (previously in AppRoutes)
    const onSignInvoice = async (pId: number, sig: string) => {
        try {
            await updateProjectInDb(pId, { invoiceSignature: sig } as any);
            queryClient.invalidateQueries({ queryKey: ['projects'] });
            showNotification("Tanda tangan invoice berhasil disimpan.");
        } catch (e) { showNotification("Gagal menyimpan tanda tangan invoice."); }
    };

    const onSignTransaction = async (tId: number, sig: string) => {
        try {
            await updateTransactionInDb(tId, { vendorSignature: sig } as any);
            queryClient.invalidateQueries({ queryKey: ['transactions'] });
            showNotification("Tanda tangan kuitansi berhasil disimpan.");
        } catch (e) { showNotification("Gagal menyimpan tanda tangan kuitansi."); }
    };

    const onRecordPayment = async (projectId: number, amount: number, destinationCardId: number) => {
        try {
            const today = new Date().toISOString().split("T")[0];
            const proj = (projectsData || []).find(p => String(p.id) === String(projectId));
            if (!proj) return;
            await createTransaction({
                date: today, description: `Pembayaran Acara Pernikahan ${proj.projectName}`,
                amount, type: TransactionType.INCOME, projectId, category: "Pelunasan Acara Pernikahan",
                method: "Transfer Bank", cardId: destinationCardId,
            } as any);
            if (destinationCardId) await updateCardBalance(destinationCardId, amount);
            const newAmountPaid = (proj.amountPaid || 0) + amount;
            const newStatus = newAmountPaid >= proj.totalCost ? PaymentStatus.LUNAS : PaymentStatus.DP_TERBAYAR;
            await updateProjectInDb(projectId, { amountPaid: newAmountPaid, paymentStatus: newStatus } as any);
            queryClient.invalidateQueries({ queryKey: ['projects'] });
            queryClient.invalidateQueries({ queryKey: ['transactions'] });
            queryClient.invalidateQueries({ queryKey: ['cards'] });
            showNotification("Pembayaran berhasil dicatat.");
        } catch (e) { showNotification("Gagal mencatat pembayaran."); }
    };


    const clients = clientsData || [];
    const projects = projectsData || [];
    const transactions = transactionsData || [];
    const clientSummaryStats = React.useMemo(() => {
        const locationCounts = projects.reduce((acc: Record<string, number>, project: Project) => {
            const location = project.location?.trim();
            if (location) {
                const mainLocation = location.split(',')[0].trim();
                acc[mainLocation] = (acc[mainLocation] || 0) + 1;
            }
            return acc;
        }, {});

        const mostFrequentLocation = Object.keys(locationCounts).sort((a, b) => locationCounts[b] - locationCounts[a])[0] || '—';
        const totalReceivables = (clients as ExtendedClient[]).reduce((sum, client) => sum + (client.balanceDue || 0), 0);

        return {
            totalClients: clients.length,
            activeClients: (clients as ExtendedClient[]).filter(client => client.status === ClientStatus.ACTIVE).length,
            mostFrequentLocation,
            totalReceivables: formatCurrency(totalReceivables),
        };
    }, [clients, projects]);
    const cards = cardsData || [];
    const pockets = pocketsData || [];

    const [mainTab, setMainTab] = React.useState<'database' | 'progress' | 'contracts'>('database');

    const navigate = useNavigate();

    const {
        activeTab, setActiveTab,
        searchQuery, setSearchQuery,
        statusFilter, setStatusFilter,
        clientStatusFilter, setClientStatusFilter,
        typeFilter, setTypeFilter,
        locationFilter, setLocationFilter,
        locationOptions,
        startDate, setStartDate,
        endDate, setEndDate,
        sortConfig, setSortConfig,
        filteredClientData,
        isModalOpen, modalMode, formData, setFormData,
        handleOpenModal, handleCloseModal, handleFormChange, handleFormSubmit,
        handleDeleteClient,
        handleSharePortal,
        handleDeleteProject,
        handleDownloadClients,
        isDetailModalOpen, selectedClientForDetail, handleCloseDetail,
        isBillingModalOpen, handleCloseBilling, handleOpenBillingForClient,
        selectedClientForBilling,
        qrModalContent, handleCloseQrModal, handleDownloadQr, handleShareWhatsApp,
        isBookingFormShareModalOpen, handleOpenBookingModal, handleCloseBookingModal,
        bookingFormUrl, handleCopyBookingLink,
        sharePortalContent, setSharePortalContent,
        // Pagination
        page, setPage, limit, totalClients, isLoadingClients
    } = useClientsPage({
        showNotification,
    });

    const handleViewDetail = (client: Client) => {
        navigate(`/client/${client.id}`);
    };

    const handleEditClient = (client: Client) => {
        navigate(`/client/${client.id}/edit`);
    };

    const handleAddClient = () => {
        navigate('/client/add');
    };


    const projectActions = useProjectActions({
        projects, clients, teamMembers,
        teamProjectPayments, setTeamProjectPayments,
        transactions, cards, 
        pockets, profile: userProfile, showNotification

    });

    const handleManageProjects = (client: ExtendedClient) => {
        setMainTab('progress');
        if (client.mostRecentProject) {
            projectActions.handleOpenDetailModal(client.mostRecentProject);
        }
    };


    const [selectedInvoiceProject, setSelectedInvoiceProject] = React.useState<Project | null>(null);
    const [isInvoiceModalOpen, setIsInvoiceModalOpen] = React.useState(false);
    const [selectedReceiptTransaction, setSelectedReceiptTransaction] = React.useState<Transaction | null>(null);
    const [isReceiptModalOpen, setIsReceiptModalOpen] = React.useState(false);

    const handleViewInvoiceModal = (project: Project) => {
        setSelectedInvoiceProject(project);
        setIsInvoiceModalOpen(true);
    };

    const handleViewReceiptModal = (transaction: Transaction) => {
        setSelectedReceiptTransaction(transaction);
        setIsReceiptModalOpen(true);
    };

    return (
        <div className="space-y-6 pb-20 sm:pb-8">
            <div className="flex p-1 bg-brand-surface/60 backdrop-blur-md rounded-2xl border border-brand-border/40 w-fit">
                <Button
                    onClick={() => setMainTab('database')}
                    variant={mainTab === 'database' ? 'primary' : 'ghost'}
                    size="sm"
                    leftIcon={
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                        </svg>
                    }
                >
                    Database Pengantin
                </Button>
                <Button
                    onClick={() => setMainTab('progress')}
                    variant={mainTab === 'progress' ? 'primary' : 'ghost'}
                    size="sm"
                    leftIcon={
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                        </svg>
                    }
                >
                    Progress & Timeline Acara Pernikahan 
                </Button>
                <Button 
                    onClick={() => setMainTab('contracts')}
                    variant={mainTab === 'contracts' ? 'primary' : 'ghost'}
                    size="sm"
                    leftIcon={
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                    }
                >
                    Kontrak Digital
                </Button>
            </div>

            {mainTab === 'database' ? (
                <>
                    <ClientStatsCards
                        stats={clientSummaryStats}
                        onCardClick={(type) => {
                            setActiveTab('all');
                            setStatusFilter('Semua Status');
                            setTypeFilter('Semua Tipe');
                            if (type === 'active') {
                                setClientStatusFilter(ClientStatus.ACTIVE);
                            } else if (type === 'location') {
                                setLocationFilter(clientSummaryStats.mostFrequentLocation === '—' ? 'Semua Lokasi' : clientSummaryStats.mostFrequentLocation);
                            } else if (type === 'unpaid') {
                                setActiveTab('unpaid');
                            }
                        }}
                    />

                    <ClientHeader
                        onAddClient={handleAddClient}
                        onDownloadClients={handleDownloadClients}
                    />

                    <ClientFilterBar
                        activeTab={activeTab}
                        onTabChange={setActiveTab}
                        searchQuery={searchQuery}
                        onSearchChange={setSearchQuery}
                        statusFilter={statusFilter}
                        onStatusFilterChange={setStatusFilter}
                        typeFilter={typeFilter}
                        onTypeFilterChange={setTypeFilter}
                        locationFilter={locationFilter}
                        onLocationFilterChange={setLocationFilter}
                        locationOptions={locationOptions}
                        startDate={startDate}
                        onStartDateChange={setStartDate}
                        endDate={endDate}
                        onEndDateChange={setEndDate}
                        sortConfig={sortConfig}
                        onSortChange={setSortConfig}
                    />

                    <div className="space-y-6">
                        {activeTab === 'all' && (
                            <>
                                <ClientActiveList
                                    clients={filteredClientData}
                                    onEditClient={handleEditClient}
                                    onViewDetail={handleViewDetail}
                                    onDeleteClient={handleDeleteClient}
                                    onAddProject={(c: ExtendedClient) => navigate('/project/add', { state: { clientId: c.id } })}
                                    onManageProjects={handleManageProjects}
                                    // Pagination
                                    page={page}
                                    setPage={setPage}
                                    limit={limit}
                                    totalItems={totalClients}
                                    isLoading={isLoadingClients}
                                />
                                <ClientInactiveList
                                    clients={filteredClientData}
                                    onEditClient={handleEditClient}
                                    onViewDetail={handleViewDetail}
                                    onDeleteClient={handleDeleteClient}
                                />
                            </>
                        )}
                        {activeTab === 'unpaid' && (
                            <ClientUnpaidList
                                clients={filteredClientData.filter(c => c.balanceDue > 0)}
                                onViewDetail={handleViewDetail}
                                onSendBilling={handleOpenBillingForClient}
                            />
                        )}
                        {activeTab === 'inactive' && (
                            <ClientInactiveList
                                clients={filteredClientData}
                                onEditClient={handleEditClient}
                                onViewDetail={handleViewDetail}
                                onDeleteClient={handleDeleteClient}
                            />
                        )}
                    </div>
                </>
            ) : mainTab === 'progress' ? (
                <ProjectsPageFeature
                    profile={userProfile}
                    showNotification={showNotification}
                    packages={packages}
                    teamMembers={teamMembers}
                    teamProjectPayments={teamProjectPayments}
                    setTeamProjectPayments={() => {}}
                />

            ) : (
                <Contracts />

            )}

            <ClientForm
                isOpen={isModalOpen}
                onClose={handleCloseModal}
                mode={modalMode}
                formData={formData}
                setFormData={setFormData}
                onChange={handleFormChange}
                onSubmit={handleFormSubmit}
                packages={packages}
                addOns={addOns}
                promoCodes={promoCodes}
                cards={cards}
                userProfile={userProfile}
            />

            {selectedClientForDetail && (
                <ClientDetailModal
                    isOpen={isDetailModalOpen}
                    onClose={handleCloseDetail}
                    client={selectedClientForDetail}
                    projects={projects}
                    transactions={transactions}
                    packages={packages}
                    cards={cards}
                    onEditClient={(c: Client) => handleOpenModal('edit', c, projects.find(p => String(p.clientId) === String(c.id)))}
                    onDeleteClient={handleDeleteClient}
                    onViewReceipt={handleViewReceiptModal}
                    onViewInvoice={handleViewInvoiceModal}
                    handleNavigation={handleNavigation}
                    onRecordPayment={onRecordPayment}
                    onSharePortal={handleSharePortal}
                    onDeleteProject={handleDeleteProject}
                    showNotification={showNotification}
                    userProfile={userProfile}
                    // Mocks for decoupled setters in ClientDetailModal (if it still needs them before we refactor it)
                    setProjects={() => {}}
                    setTransactions={() => {}}
                    setCards={() => {}}
                />
            )}

            <BillingChatModal
                isOpen={isBillingModalOpen}
                onClose={handleCloseBilling}
                client={selectedClientForBilling}
                projects={projects}
                userProfile={userProfile}
                showNotification={showNotification}
            />

            <ClientPortalQrModal
                qrModalContent={qrModalContent}
                onCloseQrModal={handleCloseQrModal}
                onDownloadQr={handleDownloadQr}
                onShareWhatsApp={handleShareWhatsApp}
            />

            <BookingFormShareModal
                isBookingFormShareModalOpen={isBookingFormShareModalOpen}
                onCloseBookingModal={handleCloseBookingModal}
                bookingFormUrl={bookingFormUrl}
                onCopyLink={handleCopyBookingLink}
                onDownloadQr={handleDownloadQr}
            />

            {selectedInvoiceProject && (
                <InvoicePreviewModal
                    isOpen={isInvoiceModalOpen}
                    onClose={() => setIsInvoiceModalOpen(false)}
                    project={selectedInvoiceProject}
                    profile={userProfile}
                    packages={packages}
                    client={clients.find(c => String(c.id) === String(selectedInvoiceProject.clientId))}
                    onSign={(sig) => onSignInvoice(selectedInvoiceProject.id, sig)}
                    onEdit={() => {
                        const client = clients.find(c => String(c.id) === String(selectedInvoiceProject.clientId));
                        if (client) handleOpenModal('edit', client, selectedInvoiceProject);
                    }}
                />
            )}

            {selectedReceiptTransaction && (
                <ReceiptPreviewModal
                    isOpen={isReceiptModalOpen}
                    onClose={() => setIsReceiptModalOpen(false)}
                    transaction={selectedReceiptTransaction}
                    project={projects.find(p => String(p.id) === String(selectedReceiptTransaction.projectId))}
                    client={selectedClientForDetail}
                    profile={userProfile}
                    onSign={(sig) => onSignTransaction(selectedReceiptTransaction.id, sig)}
                    onEdit={() => {
                        const project = projects.find(p => String(p.id) === String(selectedReceiptTransaction.projectId));
                        if (selectedClientForDetail && project) {
                            handleOpenModal('edit', selectedClientForDetail, project);
                        }
                    }}
                />
            )}

            {/* Project Related Modals */}


            {projectActions.isBriefingModalOpen && (
                <BriefingModal
                    isOpen={projectActions.isBriefingModalOpen}
                    onClose={() => projectActions.setIsBriefingModalOpen(false)}
                    briefingText={projectActions.briefingText}
                />
            )}

            {projectActions.quickStatusModalOpen && projectActions.selectedProjectForStatus && (
                <QuickStatusModal
                    isOpen={projectActions.quickStatusModalOpen}
                    onClose={() => projectActions.setQuickStatusModalOpen(false)}
                    project={projectActions.selectedProjectForStatus}
                    statusConfig={userProfile.projectStatusConfig}
                    onStatusChange={projectActions.handleQuickStatusChange}
                    showNotification={showNotification}
                />
            )}

            {projectActions.sharePreview && (
                <UniversalShareModal
                    isOpen={!!projectActions.sharePreview}
                    onClose={() => projectActions.setSharePreview(null)}
                    title={projectActions.sharePreview.title}
                    initialMessage={projectActions.sharePreview.message}
                    phone={projectActions.sharePreview.phone}
                    profile={userProfile}
                    showNotification={showNotification}
                />
            )}

            {projectActions.chatModalData && (
                <ChatModal
                    isOpen={!!projectActions.chatModalData}
                    onClose={() => projectActions.setChatModalData(null)}
                    project={projectActions.chatModalData.project}
                    client={projectActions.chatModalData.client}
                    onSendMessage={() => { }}
                    userProfile={userProfile}
                />
            )}
            {sharePortalContent && (
                <UniversalShareModal
                    isOpen={!!sharePortalContent}
                    onClose={() => setSharePortalContent(null)}
                    type="portalShareTemplate"
                    profile={userProfile}
                    variables={{
                        '{clientName}': sharePortalContent.client.name,
                        '{companyName}': userProfile.companyName,
                        '{portalLink}': sharePortalContent.url
                    }}
                    phone={sharePortalContent.client.whatsapp || sharePortalContent.client.phone}
                    title="Bagikan Portal Pengantin"
                    showNotification={showNotification}
                />
            )}
        </div>
    );
};
