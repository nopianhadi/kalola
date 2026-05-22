import { useState, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';


import { 
    Project, 
    TeamMember, 
    Client, 
    TeamProjectPayment, 
    Transaction, 
    TransactionType, 
    Profile, 
    Card, 
    FinancialPocket, 
    AssignedTeamMember,
    PrintingItem
} from '@/features/projects/types/project.types';
import { 
    createProjectWithRelations, 
    updateProject as updateProjectInDb, 
    deleteProject as deleteProjectInDb, 
    sanitizeProjectData 
} from '@/services/projects';
import { upsertAssignmentsForProject } from '@/services/projectTeamAssignments';
import { 
    createTransaction
} from '@/services/transactions';
import { syncClientStatusFromProjects } from '@/services/clients';
import { getProgressForStatus, generateBriefingData } from '@/features/projects/utils/project.utils';


interface UseProjectActionsProps {
    projects: Project[];
    clients: Client[];
    teamMembers: TeamMember[];
    teamProjectPayments: TeamProjectPayment[];
    setTeamProjectPayments: React.Dispatch<React.SetStateAction<TeamProjectPayment[]>>;
    transactions: Transaction[];
    cards: Card[];
    pockets: FinancialPocket[];
    profile: Profile;
    showNotification: (message: string) => void;
}

export const useProjectActions = ({
    projects, clients, teamMembers,
    cards,
    pockets, profile, showNotification
}: UseProjectActionsProps) => {
    const queryClient = useQueryClient();
    const navigate = useNavigate();

    // Modal States
    const [isFormModalOpen, setIsFormModalOpen] = useState(false);
    const [formMode, setFormMode] = useState<'add' | 'edit'>('add');
    const [formData, setFormData] = useState<any>(null);

    const initialFormState = useMemo(() => ({
        projectName: '',
        projectType: profile?.projectTypes?.[0] || '',
        date: new Date().toISOString().split('T')[0],
        status: profile?.projectStatusConfig?.[0]?.name || '',
        team: [] as AssignedTeamMember[],
        totalCost: 0,
        amountPaid: 0,
        paymentStatus: 'BELUM_BAYAR' as const,
        progress: 0,
        activeSubStatuses: [] as string[],
        customSubStatuses: profile?.projectStatusConfig?.[0]?.subStatuses || [],
        printingDetails: [] as PrintingItem[],
        customCosts: [] as any[],
        location: '',
        address: '',
        notes: '',
        driveLink: '',
        clientDriveLink: '',
        finalDriveLink: '',
        createdAt: new Date().toISOString(),
    }), [profile]);

    const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
    const [selectedProject, setSelectedProject] = useState<Project | null>(null);
    const [isBriefingModalOpen, setIsBriefingModalOpen] = useState(false);
    const [briefingText, setBriefingText] = useState('');
    const [whatsappLink, setWhatsappLink] = useState('');
    const [googleCalendarLink, setGoogleCalendarLink] = useState('');
    const [icsDataUri, setIcsDataUri] = useState('');
    const [activeStatModal, setActiveStatModal] = useState<'count' | 'deadline' | 'top_type' | 'status_dist' | null>(null);
    const [quickStatusModalOpen, setQuickStatusModalOpen] = useState(false);
    const [selectedProjectForStatus, setSelectedProjectForStatus] = useState<Project | null>(null);
    const [chatModalData, setChatModalData] = useState<{ project: Project; client: Client } | null>(null);
    const [sharePreview, setSharePreview] = useState<{ title: string; message: string; phone?: string | null } | null>(null);
    
    // Drag and Drop State
    const [draggedProjectId, setDraggedProjectId] = useState<number | null>(null);

    // Form Handlers
    const initializeForm = useCallback((mode: 'add' | 'edit', project?: Project) => {
        setFormMode(mode);
        if (mode === 'edit' && project) {
            setFormData({ 
                ...project,
                date: (project.date || initialFormState.date).split('T')[0],
                deadlineDate: project.deadlineDate ? project.deadlineDate.split('T')[0] : '',
                startTime: project.startTime ? project.startTime.split(':').slice(0, 2).join(':') : '',
                endTime: project.endTime ? project.endTime.split(':').slice(0, 2).join(':') : '',
            });
        } else {
            setFormData({ ...initialFormState });
        }
    }, [initialFormState]);

    const handleOpenForm = useCallback((mode: 'add' | 'edit', project?: Project) => {
        if (mode === 'edit' && project) {
            navigate(`/project/${project.id}/edit`);
        } else {
            navigate('/project/add');
        }
    }, [navigate]);

    const handleFormChange = useCallback((e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value, type } = e.target;
        if (type === 'checkbox') {
            const { checked } = e.target as HTMLInputElement;
            setFormData((prev: any) => ({ ...prev, [name]: checked }));
            return;
        }
        setFormData((prev: any) => {
            const newState = { ...prev, [name]: value };
            if (name === 'status') {
                newState.activeSubStatuses = [];
                const statusConfig = profile?.projectStatusConfig?.find(s => s.name === value);
                newState.customSubStatuses = statusConfig?.subStatuses || [];
            }
            return newState;
        });
    }, [profile]);

    const handleSubStatusChange = useCallback((option: string, isChecked: boolean) => {
        setFormData((prev: any) => {
            const current = prev.activeSubStatuses || [];
            if (isChecked) return { ...prev, activeSubStatuses: [...current, option] };
            return { ...prev, activeSubStatuses: current.filter((s: string) => s !== option) };
        });
    }, []);

    const handleClientChange = useCallback((e: React.ChangeEvent<HTMLSelectElement>) => {
        const clientId = e.target.value;
        const client = clients.find(c => String(c.id) === String(clientId));
        if (client) {
            setFormData((prev: any) => ({
                ...prev,
                clientId: client.id,
                clientName: client.name,
                projectName: prev.projectName || `Acara Pernikahan ${client.name}`
            }));
        }
    }, [clients]);

    const handleTeamChange = useCallback((member: TeamMember) => {
        setFormData((prev: any) => {
            const isSelected = prev.team.some((t: any) => String(t.memberId) === String(member.id));
            if (isSelected) {
                return { ...prev, team: prev.team.filter((t: any) => t.memberId !== member.id) };
            } else {
                const newMember: AssignedTeamMember = {
                    memberId: member.id,
                    name: member.name,
                    role: member.role,
                    fee: member.standardFee,
                };
                return { ...prev, team: [...prev.team, newMember] };
            }
        });
    }, []);

    const handleTeamFeeChange = useCallback((memberId: number, newFee: number) => {
        setFormData((prev: any) => ({
            ...prev,
            team: prev.team.map((t: any) => t.memberId === memberId ? { ...t, fee: newFee } : t)
        }));
    }, []);

    const handleTeamSubJobChange = useCallback((memberId: number, subJob: string) => {
        setFormData((prev: any) => ({
            ...prev,
            team: prev.team.map((t: any) => t.memberId === memberId ? { ...t, subJob } : t)
        }));
    }, []);

    const handleTeamClientPortalLinkChange = useCallback((memberId: number, link: string) => {
        setFormData((prev: any) => ({
            ...prev,
            team: prev.team.map((t: any) => t.memberId === memberId ? { ...t, clientPortalLink: link } : t)
        }));
    }, []);

    const handleCustomSubStatusChange = useCallback((index: number, field: 'name' | 'note', value: string) => {
        setFormData((prev: any) => {
            const newCustom = [...(prev.customSubStatuses || [])];
            const oldName = newCustom[index]?.name;
            newCustom[index] = { ...newCustom[index], [field]: value };
            if (field === 'name' && oldName && (prev.activeSubStatuses || []).includes(oldName)) {
                const newActive = (prev.activeSubStatuses || []).map((name: string) => name === oldName ? value : name);
                return { ...prev, customSubStatuses: newCustom, activeSubStatuses: newActive };
            }
            return { ...prev, customSubStatuses: newCustom };
        });
    }, []);

    const addCustomSubStatus = useCallback(() => {
        setFormData((prev: any) => ({
            ...prev,
            customSubStatuses: [...(prev.customSubStatuses || []), { name: '', note: '' }]
        }));
    }, []);

    const removeCustomSubStatus = useCallback((index: number) => {
        setFormData((prev: any) => {
            const custom = prev.customSubStatuses || [];
            const subToRemove = custom[index];
            const newCustom = custom.filter((_: any, i: number) => i !== index);
            let newActive = prev.activeSubStatuses || [];
            if (subToRemove) newActive = newActive.filter((name: string) => name !== subToRemove.name);
            return { ...prev, customSubStatuses: newCustom, activeSubStatuses: newActive };
        });
    }, []);

    const teamByCategory = useMemo(() => {
        const categories: Record<string, Record<string, TeamMember[]>> = { 'Tim': {}, 'Vendor': {} };
        teamMembers.forEach(m => {
            const cat = m.category || 'Tim';
            if (!categories[cat]) categories[cat] = {};
            if (!categories[cat][m.role]) categories[cat][m.role] = [];
            categories[cat][m.role].push(m);
        });
        return categories;
    }, [teamMembers]);


    const handleCloseForm = useCallback(() => {
        setIsFormModalOpen(false);
        setFormData(null);
        navigate(-1);
    }, [navigate]);

    const handleOpenDetailModal = useCallback((project: Project) => {
        navigate(`/project/${project.id}`);
    }, [navigate]);


    const handleFormSubmit = useCallback(async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData) return;
        const projectData = sanitizeProjectData(formData);
        const originalProject = formMode === 'edit' ? projects.find(p => String(p.id) === String(projectData.id)) : null;
        const clientIdsToSync = new Set<number>();
        if (projectData.clientId) clientIdsToSync.add(Number(projectData.clientId));
        if (originalProject?.clientId) clientIdsToSync.add(Number(originalProject.clientId));

        try {
            if (formMode === 'add') {
                await createProjectWithRelations(projectData);
                queryClient.invalidateQueries();
                showNotification('Berhasil menambah Acara Pernikahan');
            } else {
                const fieldsToUpdate = {
                    projectName: projectData.projectName,
                    projectType: projectData.projectType,
                    date: projectData.date,
                    deadlineDate: projectData.deadlineDate,
                    startTime: projectData.startTime,
                    endTime: projectData.endTime,
                    location: projectData.location,
                    address: projectData.address,
                    driveLink: projectData.driveLink,
                    clientDriveLink: projectData.clientDriveLink,
                    finalDriveLink: projectData.finalDriveLink,
                    notes: projectData.notes,
                    status: projectData.status,
                    progress: projectData.progress,
                    activeSubStatuses: projectData.activeSubStatuses,
                    customSubStatuses: projectData.customSubStatuses,
                };
                
                await updateProjectInDb(projectData.id, fieldsToUpdate);
                
                // Also update assignments
                const newTeam = (projectData.team || []).map((t: any) => ({
                    memberId: t.memberId,
                    name: t.name,
                    role: t.role,
                    fee: t.fee,
                    subJob: t.subJob,
                }));
                await upsertAssignmentsForProject(projectData.id, newTeam);
                queryClient.invalidateQueries();
                
                showNotification('Berhasil memperbarui Acara Pernikahan');
            }

            // Sync client status
            if (clientIdsToSync.size > 0) {
                await Promise.all(Array.from(clientIdsToSync).map(id => syncClientStatusFromProjects(id)));
            }
            
            // Navigate to detail page after success
            setIsFormModalOpen(false);
            setFormData(null);
            if (formMode === 'edit') {
                navigate(`/project/${projectData.id}`);
            } else {
                // If it was a new project, we might need the new ID. 
                // For now, going back to list or if we have created object, use its id.
                // Assuming createProjectWithRelations returns the created project.
                navigate('/project'); 
            }
        } catch (err) {
            console.error('Project action failed:', err);
            showNotification('Gagal menyimpan perubahan. Coba lagi.');
        }
    }, [formData, formMode, projects, queryClient, showNotification, handleCloseForm]);

    const handleProjectDelete = async (projectId: number | string) => {
        if (window.confirm("Apakah Anda yakin ingin menghapus Acara Pernikahan ini? Semua data terkait akan dihapus.")) {
            try {
                await deleteProjectInDb(Number(projectId));
                queryClient.invalidateQueries();
                showNotification('Acara Pernikahan berhasil dihapus');
            } catch (err) {
                console.error('Delete failed:', err);
                showNotification('Gagal menghapus Acara Pernikahan');
            }
        }
    };

    const handleQuickStatusChange = async (projectId: number | string, newStatus: string, _notifyClient: boolean) => {
        try {
            const project = projects.find(p => String(p.id) === String(projectId));
            if (!project) return;
            const nextProgress = getProgressForStatus(newStatus, profile?.projectStatusConfig || []);
            
            await updateProjectInDb(Number(projectId), {
                status: newStatus as any,
                progress: nextProgress as any,
                activeSubStatuses: [] as any,
            } as any);

            queryClient.invalidateQueries();
            syncClientStatusFromProjects(project.clientId).catch(console.error);
            showNotification(`Status berhasil diubah ke "${newStatus}"`);
        } catch (error) {
            console.error('Status change failed:', error);
            showNotification('Gagal mengubah status');
        }
    };

    const handleOpenBriefingModal = useCallback((project: Project) => {
        const data = generateBriefingData(project, profile || {} as any);
        setBriefingText(data.text);
        setWhatsappLink(data.whatsappLink);
        setGoogleCalendarLink(data.googleCalendarLink);
        setIcsDataUri(data.icsDataUri);
        setSelectedProject(project);
        setIsBriefingModalOpen(true);
    }, [profile]);

    const handlePayForPrintingItem = async (projectId: number | string, printingItemId: string, sourceCardId: string, sourcePocketId?: string) => {
        const project = projects.find(p => String(p.id) === String(projectId));
        if (!project) return;

        const currentItems = (project.printingDetails || []) as PrintingItem[];
        const printingItem = currentItems.find(item => String(item.id) === String(printingItemId));

        const isFromPocket = !!sourcePocketId;
        const sourcePocket = isFromPocket ? pockets.find(p => String(p.id) === String(sourcePocketId)) : null;
        const sourceCard = !isFromPocket ? cards.find(c => String(c.id) === String(sourceCardId)) : null;

        if (!printingItem || (!sourcePocket && !sourceCard)) {
            showNotification("Error: Data tidak lengkap.");
            return;
        }

        try {
            await createTransaction({
                date: new Date().toISOString().split('T')[0],
                description: `Biaya Produksi Fisik: ${printingItem.customName || printingItem.type} - ${project.projectName}`,
                amount: printingItem.cost,
                type: TransactionType.EXPENSE,
                projectId: projectId,
                category: 'Produksi Fisik',
                method: 'Sistem',
                cardId: isFromPocket ? undefined : sourceCardId,
                pocketId: isFromPocket ? sourcePocketId : undefined,
                printingItemId: printingItemId,
            } as any);
            
            queryClient.invalidateQueries();
            
            showNotification('Pembayaran berhasil diproses');
        } catch (err) {
            console.error('Payment failed:', err);
            showNotification('Gagal memproses pembayaran');
        }
    };

    
    const handleSendMessage = (project: Project) => {
        const client = clients.find(c => String(c.id) === String(project.clientId));
        if (!client) return;
        setChatModalData({ project, client });
    };

    const handleDragStart = (e: React.DragEvent<HTMLDivElement>, projectId: number) => {
        e.dataTransfer.setData("projectId", String(projectId));
        setDraggedProjectId(projectId);
    };

    const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
    };

    const handleDrop = async (e: React.DragEvent<HTMLDivElement>, newStatus: string) => {
        e.preventDefault();
        const projectId = e.dataTransfer.getData("projectId");
        if (projectId) {
            handleQuickStatusChange(projectId, newStatus, false);
        }
        setDraggedProjectId(null);
    };

    return {

        isFormModalOpen, setIsFormModalOpen,
        formMode, setFormMode,
        formData, setFormData,
        isDetailModalOpen, setIsDetailModalOpen,
        selectedProject, setSelectedProject,
        isBriefingModalOpen, setIsBriefingModalOpen,
        briefingText, setBriefingText,
        whatsappLink, setWhatsappLink,
        googleCalendarLink, setGoogleCalendarLink,
        icsDataUri, setIcsDataUri,
        activeStatModal, setActiveStatModal,
        quickStatusModalOpen, setQuickStatusModalOpen,
        selectedProjectForStatus, setSelectedProjectForStatus,
        chatModalData, setChatModalData,
        sharePreview, setSharePreview,
        draggedProjectId, setDraggedProjectId,
        handleOpenForm, handleCloseForm, handleOpenDetailModal,
        handleOpenBriefingModal, handlePayForPrintingItem, handleQuickStatusChange,
        handleSendMessage, handleProjectDelete, handleFormSubmit,
        handleDragStart, handleDragOver, handleDrop,
        handleFormChange, handleSubStatusChange, handleClientChange,
        handleTeamChange, handleTeamFeeChange, handleTeamSubJobChange,
        handleTeamClientPortalLinkChange, handleCustomSubStatusChange,
        addCustomSubStatus, removeCustomSubStatus, teamByCategory,
        initializeForm
    };
};
