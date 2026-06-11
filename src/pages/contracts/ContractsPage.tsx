import React, { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import PageHeader from '@/layouts/PageHeader';
import { PlusIcon, FileTextIcon, SearchIcon } from '@/constants';
import { useContractsPage } from '@/features/contracts/hooks/useContractsPage';
import { ContractStats } from '@/features/contracts/components/ContractStats';
import { ContractTable } from '@/features/contracts/components/ContractTable';
import { ContractMobileList } from '@/features/contracts/components/ContractMobileList';
import { ContractFormModal } from '@/features/contracts/components/ContractFormModal';
import { ContractViewModal } from '@/features/contracts/components/ContractViewModal';
import { ContractInfoModal } from '@/features/contracts/components/ContractInfoModal';
import { handleDownloadPDF, handleDownloadPDFWithoutTTD } from '@/features/contracts/utils/pdf.utils';
import { useApp } from '@/app/AppContext';

const Contracts: React.FC = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const { showNotification } = useApp();

    const {
        contracts,
        totalContracts,
        clients,
        projects,
        profile,
        page,
        setPage,
        limit,
        searchQuery,
        setSearchQuery,
        isLoadingContracts,
        isFormModalOpen,
        isViewModalOpen,
        modalMode,
        selectedContract,
        isInfoModalOpen,
        setIsInfoModalOpen,
        isSignatureModalOpen,
        setIsSignatureModalOpen,
        formData,
        setFormData,
        selectedClientId,
        setSelectedClientId,
        selectedProjectId,
        setSelectedProjectId,
        availableProjects,
        handleOpenModal,
        handleCloseModal,
        handleFormChange,
        handleSubmit,
        handleDelete,
        handleSaveSignature,
        handleSaveTemplateDefaults,
        stats
    } = useContractsPage({
        showNotification
    });

    // Handle deep-link from ClientDetailPage: /kontrak?newFor=<projectId>&clientId=<clientId>
    // This automatically opens the create contract modal with the project pre-selected.
    useEffect(() => {
        const params = new URLSearchParams(location.search);
        const newForProjectId = params.get('newFor');
        const deepLinkClientId = params.get('clientId');

        if (newForProjectId && projects.length > 0 && clients.length > 0) {
            // Open modal with project and client pre-selected
            handleOpenModal('add');
            if (deepLinkClientId) setSelectedClientId(deepLinkClientId);
            setSelectedProjectId(newForProjectId);
            // Clean up URL so refreshing doesn't re-open modal
            navigate(location.pathname, { replace: true });
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [location.search, projects.length, clients.length]);

    const totalPages = Math.ceil(totalContracts / limit);

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            <PageHeader 
                title="Kontrak Digital" 
                subtitle="Buat, kelola, dan arsipkan semua kontrak kerja vendor Anda dengan sistem tanda tangan digital yang aman." 
                icon={<FileTextIcon className="w-6 h-6" />}
            >
                <button 
                    onClick={() => setIsInfoModalOpen(true)} 
                    className="px-4 py-2 rounded-xl bg-white/10 text-white border border-white/20 hover:bg-white/20 transition-all text-xs font-bold"
                >
                    Pelajari
                </button>
                <button 
                    onClick={() => handleOpenModal('add')} 
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white text-blue-600 hover:bg-blue-50 transition-all text-xs sm:text-sm font-black shadow-lg shadow-blue-900/40"
                >
                    <PlusIcon className="w-5 h-5"/>
                    <span>Buat Kontrak</span>
                </button>
            </PageHeader>

            <ContractStats 
                waitingForClient={stats.waitingForClient}
                totalValue={stats.totalValue}
            />

            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-brand-surface p-4 rounded-2xl border border-brand-border">
                <div className="relative flex-1 max-w-md">
                    <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-brand-text-secondary" />
                    <input
                        type="text"
                        placeholder="Cari nomor kontrak atau nama klien..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 rounded-xl bg-brand-input border border-brand-border focus:outline-none focus:ring-2 focus:ring-brand-accent transition-all text-sm"
                    />
                </div>
            </div>
            
            <div className="bg-brand-surface rounded-2xl shadow-lg border border-brand-border overflow-hidden">
                <div className="hidden md:block">
                    {isLoadingContracts ? (
                        <div className="p-12 flex justify-center items-center">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-accent"></div>
                        </div>
                    ) : (
                        <ContractTable 
                            contracts={contracts}
                            clients={clients}
                            projects={projects}
                            onView={(c) => navigate(`/contract/${c.id}`)}
                            onEdit={(c) => handleOpenModal('edit', c)}
                            onDelete={handleDelete}
                        />
                    )}
                </div>

                <div className="md:hidden">
                    <ContractMobileList 
                        contracts={contracts}
                        clients={clients}
                        projects={projects}
                        onView={(c) => navigate(`/contract/${c.id}`)}
                        onEdit={(c) => handleOpenModal('edit', c)}
                        onDelete={handleDelete}
                    />
                </div>

                {totalPages > 1 && (
                    <div className="p-4 border-t border-brand-border flex flex-col md:flex-row items-center justify-between gap-4">
                        <div className="text-xs text-brand-text-secondary order-2 md:order-1">
                            Menampilkan {((page - 1) * limit) + 1} - {Math.min(page * limit, totalContracts)} dari {totalContracts} kontrak
                        </div>
                        <div className="flex items-center gap-1 order-1 md:order-2">
                            <button
                                onClick={() => setPage(Math.max(1, page - 1))}
                                disabled={page === 1}
                                className="px-3 py-1.5 rounded-lg border border-brand-border text-xs font-bold transition-all hover:bg-brand-accent/10 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                Sebelumnya
                            </button>
                            {[...Array(totalPages)].map((_, i) => {
                                const p = i + 1;
                                if (p === 1 || p === totalPages || (p >= page - 1 && p <= page + 1)) {
                                    return (
                                        <button
                                            key={p}
                                            onClick={() => setPage(p)}
                                            className={`w-8 h-8 rounded-lg text-xs font-bold transition-all ${page === p ? 'bg-brand-accent text-white shadow-md' : 'border border-brand-border hover:bg-brand-accent/10'}`}
                                        >
                                            {p}
                                        </button>
                                    );
                                }
                                if (p === page - 2 || p === page + 2) {
                                    return <span key={p} className="px-1 text-brand-text-secondary">...</span>;
                                }
                                return null;
                            })}
                            <button
                                onClick={() => setPage(Math.min(totalPages, page + 1))}
                                disabled={page === totalPages}
                                className="px-3 py-1.5 rounded-lg border border-brand-border text-xs font-bold transition-all hover:bg-brand-accent/10 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                Selanjutnya
                            </button>
                        </div>
                    </div>
                )}
            </div>

            <ContractInfoModal 
                isOpen={isInfoModalOpen} 
                onClose={() => setIsInfoModalOpen(false)} 
            />
            
            <ContractFormModal 
                isOpen={isFormModalOpen}
                onClose={handleCloseModal}
                mode={modalMode === 'view' ? 'edit' : modalMode} 
                formData={formData}
                setFormData={setFormData}
                clients={clients}
                availableProjects={availableProjects}
                selectedClientId={selectedClientId}
                setSelectedClientId={setSelectedClientId}
                selectedProjectId={selectedProjectId}
                setSelectedProjectId={setSelectedProjectId}
                handleFormChange={handleFormChange}
                handleSubmit={handleSubmit}
                handleSaveTemplateDefaults={handleSaveTemplateDefaults}
            />
            
            <ContractViewModal 
                isOpen={isViewModalOpen}
                onClose={handleCloseModal}
                selectedContract={selectedContract}
                projects={projects}
                clients={clients}
                profile={profile}
                isSignatureModalOpen={isSignatureModalOpen}
                setIsSignatureModalOpen={setIsSignatureModalOpen}
                handleSaveSignature={handleSaveSignature}
                handleDownloadPDF={() => handleDownloadPDF(selectedContract)}
                handleDownloadPDFWithoutTTD={() => handleDownloadPDFWithoutTTD(selectedContract, projects, profile)}
                showNotification={showNotification}
            />
        </div>
    );
};

export default Contracts;
