import React, { useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { 
    ChevronLeftIcon,
    SaveIcon,
    UsersIcon
} from 'lucide-react';
import { useClient } from '@/features/clients/api/useClients';
import { usePackages, useAddOns } from '@/features/packages/api/usePackagesQueries';
import { usePromoCodes } from '@/features/promo/api/usePromoQueries';
import { useProfile } from '@/features/settings/api/useProfileQueries';
import { useCards, useTransactions } from '@/features/finance/api/useFinanceQueries';
import { useClientsPage, initialFormState } from '@/features/clients/hooks/useClientsPage';
import { useProjects } from '@/features/projects/api/useProjects';
import { ClientForm } from '@/features/clients/components/ClientForm';
import { useApp } from '@/app/AppContext';

const ClientEditPage: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const location = useLocation();
    const isEdit = !!id;
    const { showNotification } = useApp();

    // Parse query params (e.g. ?projectId=...&section=...)
    const queryParams = new URLSearchParams(location.search);
    const targetProjectId = queryParams.get('projectId');


    const { data: client, isLoading: isClientLoading } = useClient(id ? Number(id) : 0);
    const { data: projects = [] } = useProjects();
    const { data: packages = [] } = usePackages();
    const { data: addOns = [] } = useAddOns();
    const { data: promoCodes = [] } = usePromoCodes();
    const { data: userProfileData } = useProfile();
    const { data: cards = [] } = useCards();
    const { data: transactions = [] } = useTransactions();

    const userProfile = userProfileData || ({
        projectTypes: [],
        projectStatusConfig: [],
        eventTypes: [],
    } as any);

    const clientsPage = useClientsPage({
        showNotification: (msg) => showNotification(msg)
    });

    useEffect(() => {
        if (isEdit && client && projects.length > 0 && !clientsPage.formData.clientName) {
            // Find projects for this client
            const clientProjects = projects.filter(p => String(p.clientId) === String(client.id));
            
            // Determine which project to edit
            let selectedProjectToEdit = null;
            if (targetProjectId) {
                selectedProjectToEdit = clientProjects.find(p => String(p.id) === String(targetProjectId)) || null;
            }
            
            // If no specific project requested or not found, fallback to most recent
            if (!selectedProjectToEdit) {
                selectedProjectToEdit = clientProjects.length > 0 
                    ? [...clientProjects].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0]
                    : null;
            }

            // Find DP transaction to get the card ID
            const dpTx = selectedProjectToEdit 
                ? transactions.find(t => t.projectId === selectedProjectToEdit!.id && (t.category === 'DP Acara Pernikahan' || t.description.toLowerCase().includes('dp')))
                : null;

            // Fill form with client and selected project data
            clientsPage.setModalMode('edit');
            clientsPage.setSelectedClient(client);
            if (selectedProjectToEdit) {
                clientsPage.setSelectedProject(selectedProjectToEdit);
            }

            // Ensure date is in YYYY-MM-DD format for input[type="date"]
            const formattedDate = selectedProjectToEdit?.date ? selectedProjectToEdit.date.split('T')[0] : new Date().toISOString().split('T')[0];

            clientsPage.setFormData({
                ...initialFormState,
                clientId: String(client.id),
                clientName: client.name,
                clientType: client.clientType,
                email: client.email,
                phone: client.phone,
                whatsapp: client.whatsapp || '',
                instagram: client.instagram || '',
                address: client.address || '',
                
                // Project data
                projectId: selectedProjectToEdit?.id ? String(selectedProjectToEdit.id) : '',
                projectName: selectedProjectToEdit?.projectName || '',
                projectType: selectedProjectToEdit?.projectType || 'Wedding',
                location: selectedProjectToEdit?.location || '',
                date: formattedDate,
                packageId: packages.find(p => p.name === selectedProjectToEdit?.packageName)?.id?.toString() || '',
                selectedAddOnIds: selectedProjectToEdit?.addOns ? selectedProjectToEdit.addOns.map(a => String(a.id)) : [],
                durationSelection: (selectedProjectToEdit as any)?.durationSelection || '',
                unitPrice: (selectedProjectToEdit as any)?.unitPrice,
                dp: String(selectedProjectToEdit?.amountPaid || ''),
                dpDestinationCardId: dpTx?.cardId?.toString() || '',
                notes: selectedProjectToEdit?.notes || '',
                accommodation: selectedProjectToEdit?.accommodation || '',
                driveLink: selectedProjectToEdit?.driveLink || '',
                promoCodeId: selectedProjectToEdit?.promoCodeId?.toString() || '',
            });
        }
    }, [isEdit, client, projects, packages, transactions, targetProjectId, clientsPage.setFormData, clientsPage.formData.clientName, clientsPage.setModalMode, clientsPage.setSelectedClient, clientsPage.setSelectedProject]);

    if (isEdit && isClientLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-brand-bg">
                <div className="flex flex-col items-center gap-4">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-accent"></div>
                    <p className="text-brand-text-secondary text-sm font-medium">Memuat Data Pengantin...</p>
                </div>
            </div>
        );
    }

    const handleBack = () => {
        if (window.confirm("Perubahan yang belum disimpan akan hilang. Yakin ingin kembali?")) {
            if (isEdit && id) {
                navigate(`/client/${id}`);
            } else {
                navigate('/client');
            }
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        // The useClientsPage.handleFormSubmit usually handles both add and edit
        await clientsPage.handleFormSubmit(e);
        if (isEdit) {
            navigate(`/client/${id}`);
        } else {
            navigate('/client');
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
                            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-500/20">
                                <UsersIcon className="w-5 h-5 text-white" />
                            </div>
                            <div>
                                <h1 className="text-lg font-black text-brand-text-light tracking-tight">
                                    {isEdit ? (targetProjectId ? 'Edit Rincian Paket' : 'Edit Profil Pengantin') : 'Tambah Pengantin Baru'}
                                </h1>
                                <p className="text-[10px] text-brand-text-secondary font-bold uppercase tracking-widest">
                                    {isEdit ? clientsPage.formData.clientName : 'Data Pengantin Baru'}
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
                            onClick={handleSubmit}
                            className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-brand-accent text-white text-xs font-black shadow-lg shadow-brand-accent/25 hover:shadow-brand-accent/40 transition-all active:scale-95"
                        >
                            <SaveIcon className="w-4 h-4" />
                            <span>{isEdit ? 'Simpan Perubahan' : 'Simpan Pengantin'}</span>
                        </button>
                    </div>
                </div>
            </div>

            {/* Content */}
            <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
                <div className="bg-brand-surface border border-brand-border rounded-[2.5rem] shadow-sm overflow-hidden">
                    <div className="p-6 md:p-10">
                        {/* If we wanted to hide sections based on 'targetSection', we could do it here.
                            For now, providing the full form but with the correct project context is already a huge improvement.
                        */}
                        <ClientForm
                            isOpen={true}
                            onClose={() => {}}
                            mode={isEdit ? 'edit' : 'add'}
                            formData={clientsPage.formData}
                            setFormData={clientsPage.setFormData}
                            onChange={clientsPage.handleFormChange}
                            onSubmit={handleSubmit}
                            packages={packages}
                            addOns={addOns}
                            promoCodes={promoCodes}
                            cards={cards}
                            userProfile={userProfile}
                            inline={true}
                            assignedTeam={clientsPage.selectedProject?.team}
                        />
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ClientEditPage;
