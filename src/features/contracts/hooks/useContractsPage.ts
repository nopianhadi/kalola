import { useState, useMemo, useEffect } from 'react';
import { Contract } from '@/types';
import { initialFormState } from '@/features/contracts/constants/contracts.constants';
import { 
    useContractsPaginated, 
    useCreateContract, 
    useUpdateContract, 
    useDeleteContract,
    useContractsSummary
} from '@/features/contracts/api/useContractQueries';
import { useClients } from '@/features/clients/api/useClients';
import { useProjects } from '@/features/projects/api/useProjects';
import { usePackages } from '@/features/packages/api/usePackagesQueries';
import { useProfile } from '@/features/settings/api/useProfileQueries';
import { upsertProfile } from '@/services/profile';

interface UseContractsPageProps {
    showNotification: (message: string) => void;
}

export const useContractsPage = ({
    showNotification,
}: UseContractsPageProps) => {
    // --- Data Fetching ---
    const [page, setPage] = useState(1);
    const [limit] = useState(10);
    const [searchQuery, setSearchQuery] = useState('');

    const { data: paginatedData, isLoading: isLoadingContracts } = useContractsPaginated(page, limit, searchQuery);
    const { data: clients = [] } = useClients();
    const { data: projects = [] } = useProjects();
    const { data: packages = [] } = usePackages();
    const { data: profileData } = useProfile();
    
    const profile = profileData || ({
        projectTypes: [],
        projectStatusConfig: [],
        eventTypes: [],
    } as any);

    const contracts = paginatedData?.contracts || [];
    const totalContracts = paginatedData?.total || 0;

    const createContractMutation = useCreateContract();
    const updateContractMutation = useUpdateContract();
    const deleteContractMutation = useDeleteContract();

    const [isFormModalOpen, setIsFormModalOpen] = useState(false);
    const [isViewModalOpen, setIsViewModalOpen] = useState(false);
    const [modalMode, setModalMode] = useState<'add' | 'edit' | 'view'>('add');
    const [selectedContract, setSelectedContract] = useState<Contract | null>(null);
    const [isInfoModalOpen, setIsInfoModalOpen] = useState(false);
    const [isSignatureModalOpen, setIsSignatureModalOpen] = useState(false);

    // Form specific state
    const [formData, setFormData] = useState(initialFormState);
    const [selectedClientId, setSelectedClientId] = useState('');
    const [selectedProjectId, setSelectedProjectId] = useState('');

    const availableProjects = useMemo(() => {
        return projects.filter(p => String(p.clientId) === String(selectedClientId));
    }, [selectedClientId, projects]);

    // Auto-populate form when project is selected
    useEffect(() => {
        if (selectedProjectId) {
            const project = projects.find(p => String(p.id) === String(selectedProjectId));
            const client = clients.find(c => String(c.id) === String(project?.clientId));
            if (project && client) {
                const pkg = packages.find(p => String(p.id) === String(project.packageId));
                const clientNames = client.name.split(/&|,/);
                setFormData(prev => ({
                    ...prev,
                    clientName1: prev.clientName1 || clientNames[0]?.trim() || client.name,
                    clientPhone1: prev.clientPhone1 || client.phone,
                    clientAddress1: prev.clientAddress1 || project.location,
                    clientName2: prev.clientName2 || clientNames[1]?.trim() || '',
                    clientPhone2: prev.clientPhone2 || client.phone,
                    clientAddress2: prev.clientAddress2 || project.location,
                    jurisdiction: prev.jurisdiction || project.location.split(',')[1]?.trim() || project.location.split(',')[0]?.trim() || 'Indonesia',
                    signingLocation: prev.signingLocation || profile.address,
                    dpDate: prev.dpDate || (project.amountPaid > 0 ? new Date().toISOString().split('T')[0] : ''),
                    finalPaymentDate: prev.finalPaymentDate || (project.date ? new Date(new Date(project.date).setDate(new Date(project.date).getDate() - 7)).toISOString().split('T')[0] : ''),
                    shootingDuration: prev.shootingDuration || pkg?.photographers || 'Sesuai detail paket',
                    guaranteedPhotos: prev.guaranteedPhotos || pkg?.digitalItems.find(item => item.toLowerCase().includes('foto')) || 'Sesuai detail paket',
                    albumDetails: prev.albumDetails || pkg?.physicalItems.find(item => item.name.toLowerCase().includes('album'))?.name || 'Sesuai detail paket',
                    otherItems: prev.otherItems || project.addOns.map(a => a.name).join(', ') || 'Sesuai detail paket',
                    personnelCount: prev.personnelCount || `${pkg?.photographers ? '1+' : '0'} Fotografer, ${pkg?.videographers ? '1+' : '0'} Videografer`,
                    deliveryTimeframe: prev.deliveryTimeframe || pkg?.processingTime || '30 hari kerja',
                    serviceTitle: prev.serviceTitle || `JASA ${project.projectType.toUpperCase()}`,
                    pasal1Content: prev.pasal1Content || profile.contractPasal1Defaults || `1.1 PIHAK PERTAMA sepakat untuk memberikan jasa ${project.projectType.toLowerCase()} kepada PIHAK KEDUA.\n\n1.2 Pelaksanaan pekerjaan dilakukan pada:\n• Tanggal Acara : ${new Date(project.date).toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}\n• Lokasi Acara : ${project.location}\n\n1.3 Rincian layanan yang diberikan oleh PIHAK PERTAMA meliputi:\n• ${pkg?.photographers || 'Sesuai paket'}\n• ${pkg?.digitalItems.find(item => item.toLowerCase().includes('foto')) || 'Sesuai paket'}\n• ${pkg?.physicalItems.find(item => item.name.toLowerCase().includes('album'))?.name || 'Sesuai paket'}\n\n1.4 Layanan tambahan yang disepakati:\n• ${project.addOns.map(a => a.name).join(', ') || '-'}\n\n1.5 Segala perubahan layanan di luar yang tercantum dalam perjanjian ini harus disepakati oleh kedua belah pihak.`,
                    pasal2Content: prev.pasal2Content || profile.contractPasal2Defaults || `2.1 Total biaya jasa yang disepakati oleh kedua belah pihak adalah sebesar:\nRp ${project.totalCost.toLocaleString('id-ID')}\n\n2.2 Sistem pembayaran dilakukan dengan ketentuan sebagai berikut:\n\na. Uang Muka (DP)\nSebesar Rp ${project.amountPaid.toLocaleString('id-ID')} dibayarkan pada tanggal ${new Date().toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}.\n\nb. Pelunasan\nSisa pembayaran wajib dilunasi paling lambat pada tanggal ${project.date ? new Date(new Date(project.date).setDate(new Date(project.date).getDate() - 7)).toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }) : '-'} atau sebelum hari pelaksanaan acara.\n\n2.3 Pembayaran dianggap sah setelah dana diterima oleh PIHAK PERTAMA.`,
                    pasal3Content: prev.pasal3Content || profile.contractPasal3Defaults || `3.1 DP yang sudah dibayarkan tidak dapat dikembalikan.\n\n3.2 Jika pembatalan dilakukan H-7 sebelum hari pelaksanaan, PIHAK KEDUA wajib membayar 50% dari total biaya.\n\n3.3 Apabila pembatalan dilakukan oleh PIHAK PERTAMA karena alasan yang tidak dapat dihindari, maka PIHAK PERTAMA wajib mengembalikan seluruh pembayaran yang telah diterima.`,
                    pasal4Content: prev.pasal4Content || profile.contractPasal4Defaults || `4.1 Waktu pengerjaan dan pengiriman hasil dokumentasi adalah maksimal ${pkg?.processingTime || '30 hari kerja'} setelah acara berlangsung.\n\n4.2 Tim yang akan bertugas pada acara PIHAK KEDUA: ${pkg?.photographers ? '1+' : '0'} Fotografer, ${pkg?.videographers ? '1+' : '0'} Videografer.\n\n4.3 PIHAK PERTAMA berhak menggunakan sebagian hasil dokumentasi sebagai portofolio atau media promosi, kecuali apabila PIHAK KEDUA menyatakan keberatan secara tertulis.`,
                    pasal5Content: prev.pasal5Content || profile.contractPasal5Defaults || `5.1 Perjanjian ini berlaku sejak tanggal ditandatangani oleh kedua belah pihak.\n\n5.2 Segala hal yang belum diatur dalam perjanjian ini akan diselesaikan secara musyawarah dan mufakat.\n\n5.3 Apabila terjadi perselisihan yang tidak dapat diselesaikan secara musyawarah, maka kedua belah pihak sepakat untuk menyelesaikannya melalui jalur hukum di wilayah ${project.location.split(',')[1]?.trim() || project.location.split(',')[0]?.trim() || 'Indonesia'}.`,
                    closingText: prev.closingText || profile.contractClosingDefaults || `Demikian Surat Perjanjian Kerja Sama ini dibuat dengan sebenar-benarnya dalam keadaan sadar dan tanpa paksaan. Perjanjian ini dibuat dalam dua rangkap yang masing-masing mempunyai kekuatan hukum yang sama.`
                }));
            }
        }
    }, [selectedProjectId, projects, clients, packages, profile.address]);

    const handleOpenModal = (mode: 'add' | 'edit' | 'view', contract?: Contract) => {
        if (mode === 'view' && contract) {
            setSelectedContract(contract);
            setIsViewModalOpen(true);
        } else {
            setModalMode(mode);
            if (mode === 'edit' && contract) {
                setSelectedContract(contract);
                setSelectedClientId(contract.clientId);
                setSelectedProjectId(contract.projectId);

                const editFormData = { ...initialFormState };
                Object.keys(initialFormState).forEach(key => {
                    const val = (contract as any)[key];
                    (editFormData as any)[key] = (val === null || val === undefined) ? '' : val;
                });
                setFormData(editFormData as any);
            } else {
                setSelectedContract(null);
                setSelectedClientId('');
                setSelectedProjectId('');
                setFormData(initialFormState);
            }
            setIsFormModalOpen(true);
        }
    };

    const handleCloseModal = () => {
        setIsFormModalOpen(false);
        setIsViewModalOpen(false);
        setSelectedContract(null);
    };

    const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const generateContractNumber = () => {
        const stamp = Date.now().toString().slice(-6);
        const suffix = Math.floor(100 + Math.random() * 900);
        return `VP/CTR/${new Date().getFullYear()}/${stamp}${suffix}`;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!selectedProjectId) {
            showNotification('Harap pilih proyek terlebih dahulu.');
            return;
        }

        try {
            if (modalMode === 'add') {
                const contractNumber = generateContractNumber();
                const payload = {
                    contractNumber,
                    clientId: Number(selectedClientId),
                    projectId: Number(selectedProjectId),
                    ...formData,
                } as Omit<Contract, 'id' | 'createdAt'>;
                await createContractMutation.mutateAsync(payload);
                showNotification('Kontrak baru berhasil dibuat.');
            } else if (selectedContract) {
                const patch = {
                    ...formData,
                    clientId: Number(selectedClientId),
                    projectId: Number(selectedProjectId),
                } as Partial<Contract>;
                await updateContractMutation.mutateAsync({ id: selectedContract.id, patch });
                showNotification('Kontrak berhasil diperbarui.');
            }
            handleCloseModal();
        } catch (err: any) {
            console.error('[API][contracts.save] error:', err);
            const detail = err?.response?.data?.error || err?.message || 'Coba lagi.';
            alert(`Gagal menyimpan kontrak ke database. ${detail}`);
        }

    };

    const handleDelete = async (contractId: string) => {
        if (!window.confirm("Apakah Anda yakin ingin menghapus kontrak ini?")) return;
        try {
            await deleteContractMutation.mutateAsync(contractId);
            showNotification('Kontrak berhasil dihapus.');
        } catch (err: any) {
            console.error('[API][contracts.delete] error:', err);
            alert(`Gagal menghapus kontrak di database. ${err?.message || 'Coba lagi.'}`);
        }

    };

    const handleSaveSignature = async (signatureDataUrl: string) => {
        if (selectedContract) {
            try {
                await updateContractMutation.mutateAsync({ 
                    id: selectedContract.id, 
                    patch: { vendorSignature: signatureDataUrl } 
                });
                showNotification('Tanda tangan berhasil disimpan.');
            } catch (err: any) {
                console.error('[API][contracts.signature] error:', err);
                alert(`Gagal menyimpan tanda tangan ke database. ${err?.message || 'Coba lagi.'}`);
            }
        }
        setIsSignatureModalOpen(false);
    };

    const handleSaveTemplateDefaults = async () => {
        if (!confirm('Simpan teks pasal saat ini sebagai template default untuk kontrak baru selanjutnya?')) return;
        try {
            await upsertProfile({
                ...profile,
                contractPasal1Defaults: formData.pasal1Content,
                contractPasal2Defaults: formData.pasal2Content,
                contractPasal3Defaults: formData.pasal3Content,
                contractPasal4Defaults: formData.pasal4Content,
                contractPasal5Defaults: formData.pasal5Content,
                contractClosingDefaults: formData.closingText,
            });
            showNotification('Template default berhasil disimpan.');
        } catch (err: any) {
            console.error('[API][profile.saveDefaults] error:', err);
            alert(`Gagal menyimpan template default. ${err?.message || 'Coba lagi.'}`);
        }

    };

    const { data: summaryData } = useContractsSummary();

    const stats = useMemo(() => {
        return summaryData || { waitingForClient: 0, waitingForVendor: 0, totalValue: 0 };
    }, [summaryData]);

    return {
        contracts,
        totalContracts,
        clients,
        projects,
        profile,
        packages,
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
    };
};
