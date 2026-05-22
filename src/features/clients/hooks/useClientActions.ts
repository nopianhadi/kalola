import { useState, useCallback } from 'react';
import { Client, Project, Transaction, PaymentStatus, ClientStatus, TransactionType, Card, PromoCode, Package, AddOn, Profile, ViewType, ClientType } from '@/types';
import { createClient as createClientRow, updateClient as updateClientRow, deleteClient as deleteClientRow } from '@/services/clients';
import { createProject as createProjectRow, updateProject as updateProjectRow, deleteProject as deleteProjectRow } from '@/services/projects';
import { createTransaction as createTransactionRow, updateTransaction as updateTransactionRow, updateCardBalance } from '@/services/transactions';
import { findCardIdByMeta } from '@/services/cards';
import { ensureOnlineOrNotify, formatCurrency } from '@/features/clients/utils/clients.utils';

export const initialFormState = {
    clientName: '',
    email: '',
    phone: '',
    whatsapp: '',
    instagram: '',
    address: '',
    clientType: 'Perseorangan',
    projectName: '',
    projectType: 'Wedding',
    packageId: '',
    date: new Date().toISOString().split('T')[0],
    location: '',
    dp: '',
    dpDestinationCardId: '',
    durationSelection: '',
    unitPrice: undefined as number | undefined,
    notes: '',
    accommodation: '',
    driveLink: '',
    promoCodeId: '',
    selectedAddOnIds: [] as string[]
};

interface UseClientActionsProps {
    clients: Client[];
    setClients: React.Dispatch<React.SetStateAction<Client[]>>;
    projects: Project[];
    setProjects: React.Dispatch<React.SetStateAction<Project[]>>;
    transactions: Transaction[];
    setTransactions: React.Dispatch<React.SetStateAction<Transaction[]>>;
    cards: Card[];
    setCards: React.Dispatch<React.SetStateAction<Card[]>>;
    promoCodes: PromoCode[];
    setPromoCodes: React.Dispatch<React.SetStateAction<PromoCode[]>>;
    packages: Package[];
    addOns: AddOn[];
    userProfile: Profile;
    showNotification: (message: string) => void;
    addNotification: (notif: any) => void;
}

export function useClientActions({
    setClients,
    projects, setProjects,
    transactions, setTransactions,
    cards, setCards,
    promoCodes, setPromoCodes,
    packages, addOns,
    showNotification,
    addNotification
}: UseClientActionsProps) {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [modalMode, setModalMode] = useState<'add' | 'edit'>('add');
    const [selectedClient, setSelectedClient] = useState<Client | null>(null);
    const [selectedProject, setSelectedProject] = useState<Project | null>(null);
    const [formData, setFormData] = useState(initialFormState);

    const handleOpenModal = useCallback((mode: 'add' | 'edit', client?: Client, project?: Project) => {
        setModalMode(mode);
        if (mode === 'edit' && client && project) {
            setSelectedClient(client);
            setSelectedProject(project);
            setFormData({
                clientName: client.name,
                email: client.email,
                phone: client.phone,
                whatsapp: client.whatsapp || '',
                instagram: client.instagram || '',
                address: client.address || '',
                clientType: client.clientType || 'Perseorangan',
                projectName: project.projectName,
                projectType: project.projectType,
                packageId: packages.find(p => p.name === project.packageName)?.id || '',
                date: project.date,
                location: project.location,
                dp: project.amountPaid.toString(),
                dpDestinationCardId: '', // Reset in edit mode
                durationSelection: project.durationSelection || '',
                unitPrice: project.unitPrice,
                notes: project.notes || '',
                accommodation: project.accommodation || '',
                driveLink: project.driveLink || '',
                promoCodeId: project.promoCodeId || '',
                selectedAddOnIds: project.addOns ? project.addOns.map(a => a.id) : []
            });
        } else if (mode === 'add' && client) {
            setSelectedClient(client);
            setSelectedProject(null);
            setFormData({
                ...initialFormState,
                clientName: client.name,
                email: client.email,
                phone: client.phone,
                whatsapp: client.whatsapp || '',
                instagram: client.instagram || '',
                clientType: client.clientType || 'Perseorangan',
                address: client.address || '',
            });
        } else {
            setSelectedClient(null);
            setSelectedProject(null);
            setFormData(initialFormState);
        }
        setIsModalOpen(true);
    }, [packages]);

    const handleCloseModal = useCallback(() => {
        setIsModalOpen(false);
        setFormData(initialFormState);
        setSelectedClient(null);
        setSelectedProject(null);
    }, []);

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
            if (promoCode.discountType === 'percentage') {
                finalDiscountAmount = (totalBeforeDiscount * promoCode.discountValue) / 100;
            } else {
                finalDiscountAmount = promoCode.discountValue;
            }
        }
        const totalProjectValue = totalBeforeDiscount - finalDiscountAmount;

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
                        clientType: formData.clientType as ClientType,
                        since: new Date().toISOString().split('T')[0],
                        status: ClientStatus.ACTIVE,
                        lastContact: new Date().toISOString(),
                        portalAccessId: crypto.randomUUID(),
                        address: formData.address || undefined,
                    } as Omit<Client, 'id'>);
                    clientId = created.id;
                    setClients(prev => [created, ...prev]);
                } catch (err) {
                    showNotification('Gagal menyimpan pengantin ke database.');
                    return;
                }
            }

            const dpAmount = Number(formData.dp) || 0;
            const remainingPayment = totalProjectValue - dpAmount;

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
                    totalCost: totalProjectValue,
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

                const mergedProject: Project = { ...createdProject, addOns: selectedAddOns };
                setProjects(prev => [mergedProject, ...prev]);

                if (mergedProject.amountPaid > 0) {
                    const selectedCard = cards.find(c => String(c.id) === String(formData.dpDestinationCardId));
                    const supaCardId = selectedCard ? await findCardIdByMeta(selectedCard.bankName, selectedCard.lastFourDigits) : null;
                    try {
                        const createdTx = await createTransactionRow({
                            date: new Date().toISOString().split('T')[0],
                            description: `DP Acara Pernikahan ${mergedProject.projectName}`,
                            amount: mergedProject.amountPaid,
                            type: TransactionType.INCOME,
                            projectId: mergedProject.id,
                            category: 'DP Acara Pernikahan',
                            method: 'Transfer Bank',
                            cardId: supaCardId || undefined,
                        } as any);
                        setTransactions(prev => [createdTx, ...prev].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
                        if (supaCardId && formData.dpDestinationCardId) {
                            setCards(prev => prev.map(c => String(c.id) === String(formData.dpDestinationCardId) ? { ...c, balance: c.balance + mergedProject.amountPaid } : c));
                        }
                    } catch (err) {
                        console.warn('Gagal mencatat transaksi DP.');
                    }
                }
                
                if (promoCode) {
                    setPromoCodes(prev => prev.map(p => String(p.id) === String(promoCode.id) ? { ...p, usageCount: p.usageCount + 1 } : p));
                }
                showNotification(`Pengantin ${formData.clientName} dan Acara Pernikahan baru berhasil ditambahkan.`);
                handleCloseModal();
            } catch (err) {
                showNotification('Gagal membuat Acara Pernikahan.');
            }
        } else {
            // Edit mode logic...
            if (!selectedClient || !selectedProject) return;
            try {
                const updatedClient = await updateClientRow(selectedClient.id, {
                    name: formData.clientName,
                    email: formData.email,
                    phone: formData.phone,
                    whatsapp: formData.whatsapp || undefined,
                    instagram: formData.instagram || undefined,
                    clientType: formData.clientType as ClientType,
                    lastContact: new Date().toISOString(),
                    address: formData.address || undefined,
                });
                setClients(prev => prev.map(c => (String(c.id) === String(updatedClient.id) ? updatedClient : c)));

                const oldAmountPaid = selectedProject.amountPaid;
                const newAmountPaid = Number(formData.dp) || 0;
                let newPaymentStatus: PaymentStatus = PaymentStatus.BELUM_BAYAR;
                if (newAmountPaid <= 0) newPaymentStatus = PaymentStatus.BELUM_BAYAR;
                else if (newAmountPaid >= totalProjectValue) newPaymentStatus = PaymentStatus.LUNAS;
                else newPaymentStatus = PaymentStatus.DP_TERBAYAR;

                if (newAmountPaid !== oldAmountPaid) {
                    const diff = newAmountPaid - oldAmountPaid;
                    const dpTransaction = transactions.find(t =>
                        String(t.projectId) === String(selectedProject.id) &&
                        (t.category === 'DP Acara Pernikahan' || t.category === 'DP Acara' || t.category === 'DP Proyek' || t.category === 'Booking Fee')
                    );

                    if (dpTransaction) {
                        const updatedTx = await updateTransactionRow(dpTransaction.id, { amount: newAmountPaid });
                        setTransactions(prev => prev.map(t => String(t.id) === String(updatedTx.id) ? updatedTx : t));
                        if (dpTransaction.cardId) {
                            await updateCardBalance(dpTransaction.cardId, diff);
                            setCards(prev => prev.map(c => String(c.id) === String(dpTransaction.cardId) ? { ...c, balance: c.balance + diff } : c));
                        }
                    }
                }

                const updatedProject = await updateProjectRow(selectedProject.id, {
                    projectName: formData.projectName,
                    clientName: formData.clientName,
                    clientId: selectedClient.id,
                    projectType: formData.projectType,
                    packageName: selectedPackage.name,
                    date: formData.date,
                    location: formData.location,
                    status: selectedProject.status,
                    totalCost: totalProjectValue,
                    amountPaid: newAmountPaid,
                    paymentStatus: newPaymentStatus,
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

                const merged = { ...updatedProject, addOns: selectedAddOns } as Project;
                setProjects(prev => prev.map(p => (String(p.id) === String(merged.id) ? merged : p)));
                showNotification(`Data pengantin dan Acara Pernikahan berhasil diperbarui.`);
                handleCloseModal();
            } catch (err) {
                showNotification('Gagal mengupdate data.');
            }
        }
    };

    const handleDeleteClient = async (clientId: string) => {
        if (!window.confirm('Hapus pengantin?')) return;
        if (!ensureOnlineOrNotify(showNotification)) return;
        try {
            await deleteClientRow(Number(clientId));
            setClients(prev => prev.filter(c => String(c.id) !== String(clientId)));
            const projectsToDelete = projects.filter(p => p.clientId === clientId).map(p => p.id);
            setProjects(prev => prev.filter(p => p.clientId !== clientId));
            setTransactions(prev => prev.filter(t => !projectsToDelete.includes(t.projectId || '')));
            showNotification('Pengantin berhasil dihapus.');
        } catch (err) {
            showNotification('Gagal menghapus pengantin.');
        }
    };

    const handleDeleteProject = async (projectId: string) => {
        if (!window.confirm('Hapus Acara Pernikahan ini?')) return;
        if (!ensureOnlineOrNotify(showNotification)) return;
        const success = await deleteProjectRow(Number(projectId));
        if (success) {
            setProjects(prev => prev.filter(p => String(p.id) !== String(projectId)));
            showNotification('Acara Pernikahan berhasil dihapus.');
        } else {
            showNotification('Gagal menghapus Acara Pernikahan.');
        }
    };

    const handleRecordPayment = async (projectId: string, amount: number, destinationCardId: string) => {
        const project = projects.find(p => String(p.id) === String(projectId));
        if (!project) return;
        if (!ensureOnlineOrNotify(showNotification)) return;

        try {
            const selectedCard = cards.find(c => String(c.id) === String(destinationCardId));
            const supaCardId = selectedCard ? await findCardIdByMeta(selectedCard.bankName, selectedCard.lastFourDigits) : null;
            const createdTx = await createTransactionRow({
                date: new Date().toISOString().split('T')[0],
                description: `Pembayaran Acara Pernikahan ${project.projectName}`,
                amount,
                type: TransactionType.INCOME,
                projectId: project.id,
                category: 'Pelunasan Acara Pernikahan',
                method: 'Transfer Bank',
                cardId: supaCardId || undefined,
            } as any);
            setTransactions(prev => [createdTx, ...prev].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
            if (destinationCardId) {
                setCards(prev => prev.map(c => String(c.id) === String(destinationCardId) ? { ...c, balance: c.balance + amount } : c));
            }

            const newAmountPaid = project.amountPaid + amount;
            const remaining = project.totalCost - newAmountPaid;
            const updated = await updateProjectRow(project.id, {
                amountPaid: newAmountPaid,
                paymentStatus: remaining <= 0 ? PaymentStatus.LUNAS : PaymentStatus.DP_TERBAYAR,
            } as any);
            setProjects(prev => prev.map(p => (String(p.id) === String(updated.id) ? { ...p, amountPaid: updated.amountPaid, paymentStatus: updated.paymentStatus } : p)));

            showNotification('Pembayaran berhasil dicatat.');
            addNotification({
                title: 'Pembayaran Diterima',
                message: `Pembayaran sebesar ${formatCurrency(amount)} untuk Acara Pernikahan "${project.projectName}" telah diterima.`,
                icon: 'payment',
                link: {
                    view: ViewType.CLIENTS,
                    action: { type: 'VIEW_CLIENT_DETAILS', id: project.clientId }
                }
            });
        } catch (err) {
            showNotification('Gagal mencatat pembayaran.');
        }
    };

    return {
        isModalOpen,
        modalMode,
        selectedClient,
        selectedProject,
        formData,
        setFormData,
        handleOpenModal,
        handleCloseModal,
        handleFormChange,
        handleFormSubmit,
        handleDeleteClient,
        handleDeleteProject,
        handleRecordPayment
    };
}
