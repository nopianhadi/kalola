import { useState, useMemo, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { Client, Project, PromoCode, PaymentStatus, TransactionType, ClientStatus } from '@/types';
import { createClient as createClientRow, updateClient as updateClientRow, deleteClient as deleteClientRow } from '@/services/clients';
import { createProject as createProjectRow, updateProject as updateProjectRow, deleteProject as deleteProjectRow } from '@/services/projects';
import { createTransaction as createTransactionRow } from '@/services/transactions';
import { findCardIdByMeta } from '@/services/cards';
import { ensureOnlineOrNotify } from '@/utils/network';
import { downloadCSV } from '@/features/clients/utils/clients.utils';
import { ExtendedClient } from '@/features/clients/types';
import { useClients, useClientsPaginated } from '@/features/clients/api/useClients';
import { useProjects } from '@/features/projects/api/useProjects';
import { useCards } from '@/features/finance/api/useFinanceQueries';
import { usePackages, useAddOns } from '@/features/packages/api/usePackagesQueries';
import { usePromoCodes } from '@/features/promo/api/usePromoQueries';
import { useProfile } from '@/features/settings/api/useProfileQueries';
import { generatePrettyAccessId } from '@/utils/idUtils';
import { useContracts } from '@/features/contracts/api/useContractQueries';
import { checkTeamAvailability } from '@/services/projectTeamAssignments';


export const initialFormState = {
    clientId: '',
    clientName: '',
    email: '',
    phone: '',
    whatsapp: '',
    instagram: '',
    clientType: 'Perseorangan' as any,
    projectId: '',
    projectName: '',
    projectType: 'Wedding',
    location: '',
    date: new Date().toISOString().split('T')[0],
    packageId: '',
    selectedAddOnIds: [] as string[],
    durationSelection: '',
    unitPrice: undefined as number | undefined,
    address: '',
    dp: '',
    dpDestinationCardId: '',
    notes: '',
    accommodation: '',
    driveLink: '',
    promoCodeId: '',
};

export interface UseClientsPageProps {
    showNotification: (msg: string) => void;
}



export const useClientsPage = ({
    showNotification,
}: UseClientsPageProps) => {

    const queryClient = useQueryClient();
    const navigate = useNavigate();

    // --- UI & Modal States ---
    const [activeTab, setActiveTab] = useState('all');

    // --- Filters & Sort ---
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState<string>('Semua Status');
    const [clientStatusFilter, setClientStatusFilter] = useState<string>('Semua Status Klien');
    const [typeFilter, setTypeFilter] = useState<string>('Semua Tipe');
    const [locationFilter, setLocationFilter] = useState<string>('Semua Lokasi');

    // --- Pagination State ---
    const [page, setPage] = useState(1);
    const [limit] = useState(10);

    // --- Data Fetching ---
    const { data: clientsAll = [] } = useClients(); // Still needed for some stats/lookups if small, but let's be careful
    
    // Reset page on search or filter change
    useEffect(() => {
        setPage(1);
    }, [searchQuery, statusFilter, clientStatusFilter, typeFilter, locationFilter, activeTab]);

    const { data: paginatedData, isLoading: isLoadingClients } = useClientsPaginated(
        page, 
        limit, 
        searchQuery, 
        { 
            status: statusFilter === 'Semua Status' ? undefined : statusFilter,
            clientType: typeFilter === 'Semua Tipe' ? undefined : typeFilter
        }
    );

    const clients = paginatedData?.clients || [];
    const totalClients = paginatedData?.total || 0;
    const { data: projects = [] } = useProjects();
    const locationOptions = useMemo(() => Array.from(new Set(projects
        .map(project => project.location?.split(',')[0].trim())
        .filter(Boolean) as string[])).sort(), [projects]);
    const { data: cards = [] } = useCards();
    const { data: packages = [] } = usePackages();
    const { data: addOns = [] } = useAddOns();
    const { data: promoCodes = [] } = usePromoCodes();
    const { data: contracts = [] } = useContracts();
    const { data: userProfileData } = useProfile();

    const userProfile = userProfileData || ({
        projectTypes: [],
        projectStatusConfig: [],
        eventTypes: [],
    } as any);

    // Mock setter for compatibility (zero-rewrite pattern)
    const setPromoCodes: React.Dispatch<React.SetStateAction<PromoCode[]>> = () => {
        queryClient.invalidateQueries({ queryKey: ['promoCodes'] });
    };


    // --- UI & Modal States ---
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [modalMode, setModalMode] = useState<'add' | 'edit'>('add');
    const [selectedClient, setSelectedClient] = useState<Client | null>(null);
    const [selectedProject, setSelectedProject] = useState<Project | null>(null);
    const [formData, setFormData] = useState(initialFormState);

    const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
    const [selectedClientForDetail, setSelectedClientForDetail] = useState<ExtendedClient | null>(null);
    const [isBillingModalOpen, setIsBillingModalOpen] = useState(false);
    const [selectedClientForBilling, setSelectedClientForBilling] = useState<ExtendedClient | null>(null);
    const [qrModalContent, setQrModalContent] = useState<{ title: string; url: string; clientName: string; clientPhone?: string } | null>(null);
    const [isBookingFormShareModalOpen, setIsBookingFormShareModalOpen] = useState(false);
    const [sharePortalContent, setSharePortalContent] = useState<{ client: Client; url: string } | null>(null);

    // --- Filters & Sort ---
    const [startDate, setStartDate] = useState<string>('');
    const [endDate, setEndDate] = useState<string>('');
    const [sortConfig, setSortConfig] = useState<{ key: string, direction: 'asc' | 'desc' } | null>(null);



    // --- Computed Data ---
    const allClientData = useMemo(() => {
        return clients.map((client: Client) => {
            const clientProjects = projects.filter((p: Project) => String(p.clientId) === String(client.id));
            const totalValue = clientProjects.reduce((sum: number, p: Project) => sum + (p.totalCost || 0), 0);
            const totalPaid = clientProjects.reduce((sum: number, p: Project) => sum + (p.amountPaid || 0), 0);
            const mostRecentProject = clientProjects.length > 0
                ? [...clientProjects].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0]
                : null;

            return {
                ...client,
                projects: clientProjects,
                totalProjectValue: totalValue,
                balanceDue: totalValue - totalPaid,
                PackageTerbaru: mostRecentProject ? mostRecentProject.packageName : 'Belum ada Acara Pernikahan',
                overallPaymentStatus: mostRecentProject ? mostRecentProject.paymentStatus : null,
                mostRecentProject: mostRecentProject,
            };
        }) as ExtendedClient[];
    }, [clients, projects]);

    const filteredClientData = useMemo(() => {
        let result = allClientData.filter(client => {
            const searchMatch = !searchQuery || 
                [client.name, client.email, client.phone].some(f => f?.toLowerCase().includes(searchQuery.toLowerCase()));
            const statusMatch = statusFilter === 'Semua Status' || client.overallPaymentStatus === statusFilter;
            const clientStatusMatch = clientStatusFilter === 'Semua Status Klien' || client.status === clientStatusFilter;
            const typeMatch = typeFilter === 'Semua Tipe' || client.clientType === typeFilter;
            const locationMatch = locationFilter === 'Semua Lokasi' || client.projects.some(project => {
                const projectLocation = project.location?.split(',')[0].trim().toLowerCase();
                return projectLocation === locationFilter.toLowerCase();
            });
            
            // Date Filter (using client.since as the primary reference)
            const clientDate = new Date(client.since);
            const startMatch = !startDate || clientDate >= new Date(startDate);
            const endMatch = !endDate || clientDate <= new Date(endDate);
            
            if (activeTab === 'inactive') return searchMatch && statusMatch && clientStatusMatch && typeMatch && locationMatch && startMatch && endMatch && client.status === ClientStatus.INACTIVE;
            if (activeTab === 'unpaid') return searchMatch && statusMatch && clientStatusMatch && typeMatch && locationMatch && startMatch && endMatch && client.balanceDue > 0;
            
            return searchMatch && statusMatch && clientStatusMatch && typeMatch && locationMatch && startMatch && endMatch;
        });

        if (sortConfig) {
            result.sort((a, b) => {
                const aValue = (a as any)[sortConfig.key];
                const bValue = (b as any)[sortConfig.key];
                if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
                if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
                return 0;
            });
        }

        return result;
    }, [allClientData, searchQuery, statusFilter, clientStatusFilter, typeFilter, locationFilter, startDate, endDate, sortConfig, activeTab]);

    const stats = useMemo(() => {
        const locations = allClientData.flatMap(c => c.projects.map(p => p.location)).filter(Boolean);
        const locFreq: { [key: string]: number } = {};
        locations.forEach(l => locFreq[l] = (locFreq[l] || 0) + 1);
        const mostFreqLoc = Object.keys(locFreq).sort((a, b) => locFreq[b] - locFreq[a])[0] || '-';

        return {
            totalClients: totalClients, // Use total from server
            activeClients: clientsAll.filter(c => c.status === ClientStatus.ACTIVE).length,
            totalReceivables: clientsAll.reduce((sum: number) => {
                // This is a bit tricky if we don't have all projects. 
                // For now, keep using clientsAll if it's not too huge, 
                // but ideally this should be a summary query.
                return sum; 
            }, 0),
            mostFrequentLocation: mostFreqLoc
        };
    }, [allClientData, totalClients, clientsAll]);

    // --- Handlers ---
    const handleFormChange = useCallback((e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    }, []);

    const handleFormSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!ensureOnlineOrNotify(showNotification)) return;
        
        const selectedPackage = packages.find(p => String(p.id) === String(formData.packageId));
        if (!selectedPackage) {
            alert('Harap pilih Package layanan.');
            return;
        }

        const selectedAddOns = addOns.filter(addon => formData.selectedAddOnIds.includes(String(addon.id)));
        const packagePriceChosen = formData.unitPrice !== undefined && !isNaN(Number(formData.unitPrice)) ? Number(formData.unitPrice) : (selectedPackage.price || 0);
        const totalBeforeDiscount = packagePriceChosen + selectedAddOns.reduce((sum, addon) => sum + addon.price, 0);
        
        let finalDiscountAmount = 0;
        const promoCode = promoCodes.find(p => String(p.id) === String(formData.promoCodeId));
        if (promoCode) {
            finalDiscountAmount = promoCode.discountType === 'percentage' 
                ? (totalBeforeDiscount * promoCode.discountValue) / 100 
                : promoCode.discountValue;
        }
        const totalProject = totalBeforeDiscount - finalDiscountAmount;

        if (modalMode === 'add') {
            let clientId = selectedClient?.id;
            if (!selectedClient) {
                try {
                    const created = await createClientRow({
                        name: formData.clientName,
                        email: formData.email,
                        phone: formData.phone,
                        whatsapp: formData.whatsapp || formData.phone,
                        instagram: formData.instagram || undefined,
                        clientType: formData.clientType,
                        since: new Date().toISOString().split('T')[0],
                        status: ClientStatus.ACTIVE,
                        lastContact: new Date().toISOString(),
                        portalAccessId: generatePrettyAccessId(formData.clientName),
                        address: formData.address || undefined,
                    } as Omit<Client, 'id'>);
                    clientId = created.id;
                    queryClient.invalidateQueries();
                } catch (err) {
                    showNotification('Gagal menyimpan pengantin ke database.');
                    return;
                }
            }

            const dpAmount = Number(formData.dp) || 0;
            const remainingPayment = totalProject - dpAmount;

            try {
                const createdProject = await createProjectRow({
                    projectName: formData.projectName,
                    clientName: formData.clientName,
                    clientId: clientId!,
                    projectType: formData.projectType,
                    packageName: selectedPackage.name,
                    date: formData.date,
                    location: formData.location,
                    status: 'Dikonfirmasi',
                    totalCost: totalProject,
                    amountPaid: dpAmount,
                    paymentStatus: dpAmount > 0 ? (remainingPayment <= 0 ? PaymentStatus.LUNAS : PaymentStatus.DP_TERBAYAR) : PaymentStatus.BELUM_BAYAR,
                    durationSelection: formData.durationSelection || undefined,
                    unitPrice: formData.unitPrice !== undefined ? Number(formData.unitPrice) : undefined,
                    notes: formData.notes || undefined,
                    accommodation: formData.accommodation || undefined,
                    driveLink: formData.driveLink || undefined,
                    promoCodeId: formData.promoCodeId || undefined,
                    discountAmount: finalDiscountAmount > 0 ? finalDiscountAmount : undefined,
                    address: formData.address || undefined,
                    addOns: selectedAddOns.map(a => ({ id: a.id, name: a.name, price: a.price })),
                } as any);
                queryClient.invalidateQueries();

                if (dpAmount > 0 && formData.dpDestinationCardId) {
                    const selectedCard = cards.find(c => String(c.id) === String(formData.dpDestinationCardId));
                    const supaCardId = selectedCard ? await findCardIdByMeta(selectedCard.bankName, selectedCard.lastFourDigits) : null;
                    try {
                        await createTransactionRow({
                            date: new Date().toISOString().split('T')[0],
                            description: `DP Acara Pernikahan ${createdProject.projectName}`,
                            amount: dpAmount,
                            type: TransactionType.INCOME,
                            projectId: createdProject.id,
                            category: 'DP Acara Pernikahan',
                            method: 'Transfer Bank',
                            cardId: supaCardId || undefined,
                        } as any);
                        queryClient.invalidateQueries();
                    } catch (err) {
                        console.warn('DP Tx sync failed');
                    }
                }
            } catch (err) {
                showNotification('Gagal membuat Acara Pernikahan.');
                return;
            }

            if (promoCode) {
                setPromoCodes(prev => prev.map(p => String(p.id) === String(promoCode.id) ? { ...p, usageCount: p.usageCount + 1 } : p));
            }
            showNotification(`Pengantin ${formData.clientName} berhasil ditambahkan.`);
            handleCloseModal();
        } else {
            if (!selectedClient || !selectedProject) return;
            try {
                await updateClientRow(selectedClient.id, {
                    name: formData.clientName, email: formData.email, phone: formData.phone,
                    whatsapp: formData.whatsapp || undefined, instagram: formData.instagram || undefined,
                    clientType: formData.clientType, address: formData.address || undefined,
                });
                queryClient.invalidateQueries();

                // Check for team availability if date changed
                if (modalMode === 'edit' && selectedProject && formData.date !== selectedProject.date && selectedProject.team && selectedProject.team.length > 0) {
                    try {
                        const memberIds = selectedProject.team.map(m => m.memberId);
                        const conflicts = await checkTeamAvailability(memberIds, formData.date, selectedProject.id);
                        
                        if (conflicts.length > 0) {
                            const conflictList = conflicts.map(c => `• ${c.memberName} (${c.projectName})`).join('\n');
                            const confirmChange = window.confirm(
                                `⚠️ KONFLIK JADWAL TIM!\n\nBeberapa anggota tim sudah ada jadwal di proyek lain pada tanggal ${formData.date}:\n\n${conflictList}\n\nApakah Anda yakin ingin tetap mengubah tanggal acara?`
                            );
                            if (!confirmChange) return;
                        }
                    } catch (err) {
                        console.error('Availability check failed:', err);
                    }
                }

                // Check for contract existence if critical data changed
                if (modalMode === 'edit' && selectedProject) {
                    const existingContract = contracts.find(c => String(c.projectId) === String(selectedProject.id));
                    const isCriticalChange = formData.date !== selectedProject.date || totalProject !== selectedProject.totalCost;
                    
                    if (existingContract && isCriticalChange) {
                        const confirmChange = window.confirm(
                            `⚠️ PERINGATAN KONTRAK DIGITAL!\n\nProyek ini sudah memiliki Kontrak terdaftar (No: ${existingContract.contractNumber}).\n\nPerubahan jadwal atau harga akan membuat rincian di kontrak lama menjadi tidak valid secara administratif.\n\nApakah Anda yakin ingin tetap menyimpan perubahan ini?\n(Disarankan untuk merevisi kontrak setelah ini).`
                        );
                        if (!confirmChange) return;
                    }
                }

                const amountAlreadyPaid = selectedProject?.amountPaid || 0;
                const remainingPayment = totalProject - amountAlreadyPaid;
                
                if (totalProject < amountAlreadyPaid) {
                    showNotification(`Total biaya (Rp ${totalProject.toLocaleString()}) tidak boleh lebih rendah dari jumlah yang sudah dibayar (Rp ${amountAlreadyPaid.toLocaleString()}).`);
                    return;
                }

                const newPaymentStatus = amountAlreadyPaid > 0 
                    ? (remainingPayment <= 0 ? PaymentStatus.LUNAS : PaymentStatus.DP_TERBAYAR) 
                    : PaymentStatus.BELUM_BAYAR;

                await updateProjectRow(selectedProject.id, {
                    projectName: formData.projectName,
                    clientName: formData.clientName,
                    clientId: selectedClient.id,
                    projectType: formData.projectType,
                    packageName: selectedPackage.name,
                    date: formData.date,
                    location: formData.location,
                    totalCost: totalProject,
                    amountPaid: selectedProject.amountPaid, // Preserve existing payments
                    paymentStatus: newPaymentStatus,       // Recalculate based on new total
                    durationSelection: formData.durationSelection || undefined,
                    unitPrice: formData.unitPrice !== undefined ? Number(formData.unitPrice) : undefined,
                    notes: formData.notes || undefined,
                    accommodation: formData.accommodation || undefined,
                    driveLink: formData.driveLink || undefined,
                    promoCodeId: formData.promoCodeId || undefined,
                    discountAmount: finalDiscountAmount > 0 ? finalDiscountAmount : undefined,
                    address: formData.address || undefined,
                    addOns: selectedAddOns.map(a => ({ id: a.id, name: a.name, price: a.price })),
                } as any);
                queryClient.invalidateQueries();
                
                showNotification(`Data berhasil diperbarui.`);
                handleCloseModal();
            } catch (err) {
                showNotification('Gagal memperbarui data.');
            }
        }
    };

    const handleOpenModal = (mode: 'add' | 'edit', client?: Client, project?: Project) => {
        setModalMode(mode);
        if (mode === 'edit' && client && project) {
            setSelectedClient(client);
            setSelectedProject(project);
            setFormData({
                ...initialFormState,
                clientId: String(client.id),
                clientName: client.name,
                email: client.email,
                phone: client.phone,
                whatsapp: client.whatsapp || '',
                instagram: client.instagram || '',
                clientType: client.clientType,
                projectId: String(project.id),
                projectName: project.projectName,
                projectType: project.projectType,
                location: project.location,
                date: project.date,
                packageId: packages.find(p => p.name === project.packageName)?.id?.toString() || '',
                selectedAddOnIds: project.addOns ? project.addOns.map(a => String(a.id)) : [],
                durationSelection: (project as any).durationSelection || '',
                unitPrice: (project as any).unitPrice,
                address: project.address || client.address || '',
                dp: String(project.amountPaid || ''),
                notes: project.notes || '',
                accommodation: project.accommodation || '',
                driveLink: project.driveLink || '',
                promoCodeId: project.promoCodeId?.toString() || '',
            });
        } else if (mode === 'add' && client) {
            setSelectedClient(client);
            setFormData({ ...initialFormState, clientName: client.name, email: client.email, phone: client.phone, whatsapp: client.whatsapp || '', instagram: client.instagram || '', clientType: client.clientType, address: client.address || '' });
        } else {
            setSelectedClient(null);
            setSelectedProject(null);
            setFormData(initialFormState);
        }
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setFormData(initialFormState);
    };

    const handleViewDetail = (client: ExtendedClient) => {
        navigate(`/client/${client.id}`);
    };

    const handleCloseDetail = () => {
        setIsDetailModalOpen(false);
        setSelectedClientForDetail(null);
    };

    const handleOpenBilling = () => setIsBillingModalOpen(true);
    const handleOpenBillingForClient = (client: ExtendedClient) => {
        setSelectedClientForBilling(client);
        setIsBillingModalOpen(true);
    };
    const handleCloseBilling = () => {
        setIsBillingModalOpen(false);
        setSelectedClientForBilling(null);
    };

    const handleCloseQrModal = () => setQrModalContent(null);
    const handleDownloadQr = (id: string) => {
        const svg = document.getElementById(id);
        if (svg) {
            const svgData = new XMLSerializer().serializeToString(svg);
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            const img = new Image();
            img.onload = () => {
                canvas.width = img.width;
                canvas.height = img.height;
                ctx?.drawImage(img, 0, 0);
                const pngFile = canvas.toDataURL('image/png');
                const downloadLink = document.createElement('a');
                downloadLink.download = `${id}.png`;
                downloadLink.href = pngFile;
                downloadLink.click();
            };
            img.src = 'data:image/svg+xml;base64,' + btoa(svgData);
        }
    };
    const handleShareWhatsApp = (phone: string, url: string) => {
        const msg = encodeURIComponent(`Halo, berikut adalah link portal pengantin Anda: ${url}`);
        window.open(`https://wa.me/${phone}?text=${msg}`, '_blank');
    };

    const handleOpenBookingModal = () => setIsBookingFormShareModalOpen(true);
    const handleCloseBookingModal = () => setIsBookingFormShareModalOpen(false);
    const bookingFormUrl = `${window.location.origin}/#/b/${userProfile.id || 'public'}`;
    const handleCopyBookingLink = () => {
        navigator.clipboard.writeText(bookingFormUrl);
        showNotification('Link booking berhasil disalin.');
    };

    const handleDeleteClient = async (clientId: string) => {
        if (!window.confirm('Hapus pengantin?')) return;
        try {
            await deleteClientRow(Number(clientId));
            queryClient.invalidateQueries();
            showNotification('Pengantin berhasil dihapus.');
        } catch (err) {
            showNotification('Gagal menghapus pengantin.');
        }
    };

    const handleSharePortal = (client: Client) => {
        const url = `${window.location.origin}/#/p/${client.portalAccessId}`;
        setSharePortalContent({ client, url });
    };

    const handleDeleteProject = async (projectId: string) => {
        if (!window.confirm('Hapus proyek ini?')) return;
        try {
            const success = await deleteProjectRow(Number(projectId));
            if (success) {
                queryClient.invalidateQueries();
                showNotification('Proyek berhasil dihapus.');
            } else {
                showNotification('Gagal menghapus proyek.');
            }
        } catch (err) {
            showNotification('Gagal menghapus proyek.');
        }
    };

    const handleDownloadClients = () => {
        const headers = ['Nama', 'Email', 'Telepon', 'Tipe', 'Status Pembayaran', 'Total Nilai Proyek', 'Sisa Tagihan'];
        const data = allClientData.map(c => [
            c.name,
            c.email,
            c.phone,
            c.clientType,
            c.overallPaymentStatus || '-',
            c.totalProjectValue,
            c.balanceDue
        ]);
        downloadCSV(headers, data, 'daftar_klien.csv');
    };

    return {
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
        stats,
        isModalOpen, modalMode, setModalMode, formData, setFormData,
        setSelectedClient, setSelectedProject, selectedProject,
        handleOpenModal, handleCloseModal, handleFormChange, handleFormSubmit,
        handleDeleteClient,
        handleSharePortal,
        handleDeleteProject,
        handleDownloadClients,
        isDetailModalOpen, selectedClientForDetail, handleViewDetail, handleCloseDetail,
        isBillingModalOpen, handleOpenBilling, handleOpenBillingForClient, handleCloseBilling,
        selectedClientForBilling,
        qrModalContent, handleCloseQrModal, handleDownloadQr, handleShareWhatsApp,
        isBookingFormShareModalOpen, handleOpenBookingModal, handleCloseBookingModal,
        bookingFormUrl, handleCopyBookingLink,
        sharePortalContent, setSharePortalContent,
        // Pagination
        page, setPage, limit, totalClients, isLoadingClients
    };
};
