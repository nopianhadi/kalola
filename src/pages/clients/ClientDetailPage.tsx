import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
    UsersIcon,
    ChevronLeftIcon,
    HistoryIcon,
    CalendarIcon,
    LayoutIcon,
    Share2Icon,
    PencilIcon,
    PlusIcon,
    CreditCardIcon,
    FileTextIcon
} from 'lucide-react';
import { useClient } from '@/features/clients/api/useClients';
import { useProjects } from '@/features/projects/api/useProjects';
import { useTransactions, useCards } from '@/features/finance/api/useFinanceQueries';
import { usePackages } from '@/features/packages/api/usePackagesQueries';
import { useProfile } from '@/features/settings/api/useProfileQueries';
import ClientInfoTab from '@/features/clients/components/ClientInfoTab';
import ProjectPaymentCard from '@/features/clients/components/ProjectPaymentCard';
import { InvoicePreviewModal } from '@/features/clients/components/InvoicePreviewModal';
import { ReceiptPreviewModal } from '@/features/clients/components/ReceiptPreviewModal';
import { createTransaction, updateCardBalance } from '@/services/transactions';
import { updateProject as updateProjectRow } from '@/services/projects';
import { updateClient, syncClientStatusFromProjects } from '@/services/clients';
import { useQueryClient } from '@tanstack/react-query';
import { TransactionType, PaymentStatus, Project, Transaction } from '@/types';
import ProjectDashboardCard from '@/features/clients/components/ProjectDashboardCard';
import { useApp } from '@/app/AppContext';
import { CloudinaryAvatarUpload } from '@/shared/ui/CloudinaryAvatarUpload';

const ClientDetailPage: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const { showNotification } = useApp();

    const { data: client, isLoading: isClientLoading } = useClient(id ? Number(id) : undefined);
    const { data: projects = [] } = useProjects();
    const { data: allTransactions = [] } = useTransactions({ clientId: id ? Number(id) : undefined, limit: 500 });
    const { data: packages = [] } = usePackages();
    const { data: cards = [] } = useCards();
    const { data: profile } = useProfile();

    const [newPayments, setNewPayments] = React.useState<{ [key: string]: { amount: string, destinationCardId: string } }>({});
    const [newCharge, setNewCharge] = React.useState<{ [key: string]: { name: string, amount: string } }>({});
    const [editingChargeId, setEditingChargeId] = React.useState<string | null>(null);
    const [editChargeData, setEditChargeData] = React.useState({ name: '', amount: '' });
    const [activeTab, setActiveTab] = React.useState<'overview' | 'finance' | 'documents'>('overview');
    const [selectedInvoiceProject, setSelectedInvoiceProject] = React.useState<Project | null>(null);
    const [selectedReceiptTransaction, setSelectedReceiptTransaction] = React.useState<Transaction | null>(null);

    if (isClientLoading || !client || !profile) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-brand-bg">
                <div className="flex flex-col items-center gap-4">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-accent"></div>
                    <p className="text-brand-text-secondary text-sm font-medium animate-pulse">Memuat Detail Pengantin...</p>
                </div>
            </div>
        );
    }

    const clientProjects = projects.filter(p => String(p.clientId) === String(client.id)).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    const clientProjectIds = new Set(clientProjects.map(p => String(p.id)));
    // Include transactions matched by clientId OR by projectId belonging to this client
    const clientTransactions = allTransactions
        .filter(t => clientProjectIds.has(String(t.projectId)))
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    const handleRecordPayment = async (projectId: number, amount: number, destinationCardId: number) => {
        try {
            const today = new Date().toISOString().split("T")[0];
            const proj = projects.find(p => String(p.id) === String(projectId));
            if (!proj) return;

            await createTransaction({
                date: today,
                description: `Pembayaran Acara Pernikahan ${proj.projectName}`,
                amount,
                type: TransactionType.INCOME,
                projectId,
                clientId: client.id,
                category: "Pelunasan Acara Pernikahan",
                method: "Transfer Bank",
                cardId: destinationCardId,
            } as any);

            if (destinationCardId) await updateCardBalance(destinationCardId, amount);

            const newAmountPaid = (proj.amountPaid || 0) + amount;
            const newStatus = newAmountPaid >= proj.totalCost ? PaymentStatus.LUNAS : PaymentStatus.DP_TERBAYAR;

            // Add to history
            const history = proj.statusHistory || [];
            const newHistory = [
                ...history,
                {
                    type: 'status' as const,
                    name: 'Pembayaran Diterima',
                    value: `Rp ${amount.toLocaleString('id-ID')}`,
                    timestamp: new Date().toISOString()
                }
            ];

            await updateProjectRow(projectId, {
                amountPaid: newAmountPaid,
                paymentStatus: newStatus,
                statusHistory: newHistory
            } as any);
            await queryClient.invalidateQueries({ queryKey: ['finance'] });
            await queryClient.invalidateQueries({ queryKey: ['projects'] });
            await queryClient.invalidateQueries({ queryKey: ['clients', client.id] });

            // Sync client status after payment update
            try {
                console.log(`🔄 Syncing client status after payment for client ID: ${proj.clientId}`);
                await syncClientStatusFromProjects(proj.clientId);
                console.log(`✅ Client status sync completed after payment for client ID: ${proj.clientId}`);
                queryClient.invalidateQueries({ queryKey: ['clients'] });
            } catch (syncErr) {
                console.error('❌ Failed to sync client status after payment:', syncErr);
            }

            showNotification("Pembayaran berhasil dicatat.");
        } catch (e) {
            showNotification("Gagal mencatat pembayaran.");
        }
    };

    const handleNewPaymentChange = (projectId: number, field: 'amount' | 'destinationCardId', value: string) => {
        setNewPayments(prev => ({
            ...prev,
            [projectId]: { ...(prev[projectId] || { amount: '', destinationCardId: '' }), [field]: value }
        }));
    };

    const handleNewPaymentSubmit = (projectId: number) => {
        const paymentData = newPayments[projectId];
        const project = clientProjects.find(p => String(p.id) === String(projectId));
        if (paymentData && Number(paymentData.amount) > 0 && paymentData.destinationCardId && project) {
            const amount = Number(paymentData.amount);
            if (amount > (project.totalCost - project.amountPaid)) {
                alert('Jumlah pembayaran melebihi sisa tagihan.');
                return;
            }
            handleRecordPayment(projectId, amount, Number(paymentData.destinationCardId));
            setNewPayments(prev => ({ ...prev, [projectId]: { amount: '', destinationCardId: '' } }));
        } else {
            showNotification('Harap isi jumlah dan tujuan pembayaran dengan benar.');
        }
    };

    const handleNewChargeChange = (projectId: number, field: 'name' | 'amount', value: string) => {
        setNewCharge(prev => ({
            ...prev,
            [projectId]: { ...(prev[projectId] || { name: '', amount: '' }), [field]: value }
        }));
    };

    const handleNewChargeSubmit = async (projectId: number) => {
        const chargeData = newCharge[projectId];
        const project = clientProjects.find(p => String(p.id) === String(projectId));
        if (chargeData && chargeData.name.trim() && Number(chargeData.amount) > 0 && project) {
            const amount = Number(chargeData.amount);
            const newCustomCost = { id: Date.now(), description: chargeData.name.trim(), amount: amount };
            const updatedCustomCosts = [...(project.customCosts || []), newCustomCost];
            const newTotalCost = project.totalCost + amount;
            const remaining = newTotalCost - project.amountPaid;
            const newPaymentStatus = remaining <= 0 ? PaymentStatus.LUNAS : (project.amountPaid > 0 ? PaymentStatus.DP_TERBAYAR : PaymentStatus.BELUM_BAYAR);

            try {
                // Add to history
                const history = project.statusHistory || [];
                const newHistory = [
                    ...history,
                    {
                        type: 'status' as const,
                        name: 'Biaya Tambahan',
                        value: `${chargeData.name}: Rp ${amount.toLocaleString('id-ID')}`,
                        timestamp: new Date().toISOString()
                    }
                ];

                await updateProjectRow(projectId, {
                    customCosts: updatedCustomCosts,
                    totalCost: newTotalCost,
                    paymentStatus: newPaymentStatus,
                    statusHistory: newHistory
                });
                queryClient.invalidateQueries();
                setNewCharge(prev => ({ ...prev, [projectId]: { name: '', amount: '' } }));
                showNotification('Biaya tambahan berhasil ditambahkan.');
            } catch (err) {
                showNotification('Gagal menambahkan biaya tambahan.');
            }
        } else {
            showNotification('Harap isi nama dan jumlah biaya dengan benar.');
        }
    };

    const handleDeleteCharge = async (projectId: number, chargeId: string) => {
        if (!window.confirm('Hapus biaya tambahan ini?')) return;
        const project = clientProjects.find(p => String(p.id) === String(projectId));
        if (!project || !project.customCosts) return;
        const chargeToDelete = project.customCosts.find(c => String(c.id) === String(chargeId));
        if (!chargeToDelete) return;
        const updatedCustomCosts = project.customCosts.filter(c => String(c.id) !== String(chargeId));
        const newTotalCost = project.totalCost - chargeToDelete.amount;
        const remaining = newTotalCost - project.amountPaid;
        const newPaymentStatus = remaining <= 0 ? PaymentStatus.LUNAS : (project.amountPaid > 0 ? PaymentStatus.DP_TERBAYAR : PaymentStatus.BELUM_BAYAR);

        try {
            // Add to history
            const history = project.statusHistory || [];
            const newHistory = [
                ...history,
                {
                    type: 'status' as const,
                    name: 'Hapus Biaya',
                    value: `${chargeToDelete.description}: -Rp ${chargeToDelete.amount.toLocaleString('id-ID')}`,
                    timestamp: new Date().toISOString()
                }
            ];

            await updateProjectRow(projectId, {
                customCosts: updatedCustomCosts,
                totalCost: newTotalCost,
                paymentStatus: newPaymentStatus,
                statusHistory: newHistory
            });
            queryClient.invalidateQueries();
            showNotification('Biaya tambahan berhasil dihapus.');
        } catch (err) {
            showNotification('Gagal menghapus biaya tambahan.');
        }
    };

    const handleSaveEditCharge = async (projectId: number) => {
        const project = clientProjects.find(p => String(p.id) === String(projectId));
        if (!project || !project.customCosts || !editingChargeId) return;
        const chargeToUpdate = project.customCosts.find(c => String(c.id) === String(editingChargeId));
        if (!chargeToUpdate) return;
        const newAmount = Number(editChargeData.amount);
        const name = editChargeData.name.trim();
        if (!name || isNaN(newAmount)) {
            showNotification('Harap isi nama dan jumlah biaya dengan benar.');
            return;
        }
        const diff = newAmount - chargeToUpdate.amount;
        const updatedCustomCosts = project.customCosts.map(c => String(c.id) === String(editingChargeId) ? { ...c, description: name, amount: newAmount } : c);
        const newTotalCost = project.totalCost + diff;
        const remaining = newTotalCost - project.amountPaid;
        const newPaymentStatus = remaining <= 0 ? PaymentStatus.LUNAS : (project.amountPaid > 0 ? PaymentStatus.DP_TERBAYAR : PaymentStatus.BELUM_BAYAR);

        try {
            // Add to history
            const history = project.statusHistory || [];
            const newHistory = [
                ...history,
                {
                    type: 'status' as const,
                    name: 'Update Biaya',
                    value: `${name}: Rp ${newAmount.toLocaleString('id-ID')}`,
                    timestamp: new Date().toISOString()
                }
            ];

            await updateProjectRow(projectId, {
                customCosts: updatedCustomCosts,
                totalCost: newTotalCost,
                paymentStatus: newPaymentStatus,
                statusHistory: newHistory
            });
            queryClient.invalidateQueries();
            setEditingChargeId(null);
            showNotification('Biaya tambahan berhasil diperbarui.');
        } catch (err) {
            showNotification('Gagal memperbarui biaya tambahan.');
        }
    };

    const handleSharePortal = () => {
        const url = `${window.location.origin}/#/p/${client.portalAccessId}`;
        const message = `Halo Kak ${client.name}, berikut adalah Link Portal Pengantin Kakak:\n\n${url}\n\nDi portal ini Kakak bisa:\n1. Cek detail paket & invoice\n2. Download file foto/video\n3. Lihat jadwal & progres\n\nTerima kasih!`;
        window.open(`https://wa.me/${(client.whatsapp || client.phone || '').replace(/\D/g, '')}?text=${encodeURIComponent(message)}`, '_blank');
    };

    const handleStatusUpdate = async (projectId: number, newStatus: string) => {
        const project = projects.find(p => String(p.id) === String(projectId));
        if (!project) return;

        const history = project.statusHistory || [];
        const newHistory = [
            ...history,
            {
                type: 'status' as const,
                name: 'Status Update',
                value: newStatus,
                timestamp: new Date().toISOString()
            }
        ];

        try {
            await updateProjectRow(projectId, {
                status: newStatus,
                statusHistory: newHistory
            } as any);
            queryClient.invalidateQueries();
            showNotification(`Status proyek berhasil diperbarui ke ${newStatus}.`);

            // Sync client status after project status update
            try {
                console.log(`🔄 Syncing client status for client ID: ${project.clientId}`);
                await syncClientStatusFromProjects(project.clientId);
                console.log(`✅ Client status sync completed for client ID: ${project.clientId}`);
                
                // Force refresh semua cache yang berkaitan dengan clients
                queryClient.invalidateQueries({ queryKey: ['clients'] });
                queryClient.invalidateQueries({ queryKey: ['projects'] });
                queryClient.refetchQueries({ queryKey: ['clients'] });
            } catch (syncErr) {
                console.error('❌ Failed to sync client status:', syncErr);
            }
        } catch (err) {
            showNotification("Gagal memperbarui status.");
        }
    };

    const handleSubStatusToggle = async (projectId: number, subStatusName: string, isChecked: boolean) => {
        const project = projects.find(p => String(p.id) === String(projectId));
        if (!project) return;

        const currentActive = project.activeSubStatuses || [];
        const newActive = isChecked
            ? [...currentActive, subStatusName]
            : currentActive.filter(s => s !== subStatusName);

        const history = project.statusHistory || [];
        const newHistory = [
            ...history,
            {
                type: 'sub-status' as const,
                name: subStatusName,
                value: isChecked ? 'Selesai' : 'Batal Selesai',
                timestamp: new Date().toISOString()
            }
        ];

        try {
            await updateProjectRow(projectId, {
                activeSubStatuses: newActive,
                statusHistory: newHistory
            } as any);
            queryClient.invalidateQueries();
        } catch (err) {
            showNotification("Gagal memperbarui progress.");
        }
    };

    const handleSendProjectUpdate = (project: Project) => {
        const url = `${window.location.origin}/#/p/${client.portalAccessId}`;
        const message = `Halo Kak ${client.name}, update terbaru untuk proyek "${project.projectName}":\n\nStatus saat ini: *${project.status}*\nProgress: ${project.activeSubStatuses?.length || 0} tahapan selesai.\n\nCek selengkapnya di portal: ${url}`;
        window.open(`https://wa.me/${(client.whatsapp || client.phone || '').replace(/\D/g, '')}?text=${encodeURIComponent(message)}`, '_blank');
    };

    return (
        <div className="relative overflow-x-hidden min-h-screen bg-brand-bg">
            {/* Background Decorative Elements - Rich Dynamic Blue Glows */}
            <div className="absolute top-0 left-0 w-full h-[500px] bg-gradient-to-b from-brand-accent/[0.08] via-brand-accent/[0.02] to-transparent pointer-events-none"></div>
            <div className="absolute top-[-8%] left-[-5%] w-[35%] h-[35%] bg-gradient-to-tr from-brand-accent/10 to-indigo-500/5 rounded-full blur-[140px] pointer-events-none opacity-80 animate-pulse-soft"></div>
            <div className="absolute top-[-12%] right-[-8%] w-[45%] h-[45%] bg-gradient-to-bl from-cyan-400/8 to-brand-accent/12 rounded-full blur-[130px] pointer-events-none opacity-70"></div>

            {/* Breadcrumb / Local Navigation */}
            <div className="mb-8 flex items-center justify-between relative z-20">
                <div className="flex items-center gap-4">
                    <button
                        onClick={() => navigate('/client')}
                        className="group flex items-center gap-2 p-1.5 rounded-xl hover:bg-brand-surface transition-all active:scale-95 border border-transparent hover:border-brand-border"
                    >
                        <div className="p-1.5 rounded-lg bg-brand-surface border border-brand-border group-hover:bg-brand-accent group-hover:text-white transition-all">
                            <ChevronLeftIcon className="w-4 h-4" />
                        </div>
                        <span className="text-xs font-bold text-brand-text-secondary group-hover:text-brand-text-light transition-colors">Daftar Pengantin</span>
                    </button>

                    <div className="h-4 w-[1px] bg-brand-border"></div>

                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-brand-accent/10 flex items-center justify-center">
                            <UsersIcon className="w-4 h-4 text-brand-accent" />
                        </div>
                        <div>
                            <h2 className="text-sm font-black text-brand-text-light truncate max-w-[150px] md:max-w-xs">{client.name}</h2>
                            <p className="text-[10px] text-brand-text-secondary font-bold uppercase tracking-widest">{client.clientType}</p>
                        </div>
                    </div>
                </div>
            </div>

            <div className="relative z-10">
                <div className="space-y-8">
                    {/* Top Row: Profile Summary */}
                    <div className="bg-brand-surface border border-brand-border/60 rounded-[2.5rem] p-6 md:p-8 shadow-lg hover:shadow-xl hover:border-brand-accent/30 transition-all duration-300 relative overflow-hidden group flex flex-col md:flex-row items-center gap-8">
                        <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                            <UsersIcon className="w-24 h-24 text-brand-accent -mr-8 -mt-8 rotate-12" />
                        </div>

                        <div className="relative z-10 text-center md:text-left flex flex-col items-center md:items-start shrink-0 min-w-[250px]">
                            {/* Avatar Upload */}
                            <div className="flex justify-center mb-4">
                                <CloudinaryAvatarUpload
                                    value={client.avatar}
                                    context="client"
                                    onChange={async (url) => {
                                        try {
                                            await updateClient(client.id, { avatar: url });
                                            queryClient.invalidateQueries({ queryKey: ['clients'] });
                                            queryClient.invalidateQueries({ queryKey: ['clients', client.id] });
                                            showNotification(url ? 'Foto profil diperbarui.' : 'Foto profil dihapus.');
                                        } catch {
                                            showNotification('Gagal menyimpan foto profil.');
                                        }
                                    }}
                                    name={client.name}
                                    size="xl"
                                    variant="client"
                                    label="Foto Pengantin"
                                />
                            </div>
                            <h2 className="text-2xl font-black text-brand-text-light leading-tight mb-1">{client.name}</h2>
                            <p className="text-brand-text-secondary font-semibold flex items-center justify-center md:justify-start gap-1 text-[10px]">
                                <CalendarIcon className="w-3 h-3 text-brand-accent" />
                                {new Date(client.since).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
                            </p>
                            
                            <div className="mt-4 flex gap-2 w-full">
                                <button
                                    onClick={() => navigate(`/client/${client.id}/edit`)}
                                    className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-brand-bg border border-brand-border text-xs font-bold text-brand-text-light hover:bg-brand-surface transition-all active:scale-95"
                                >
                                    <PencilIcon className="w-3 h-3" />
                                    Edit
                                </button>
                                <button
                                    onClick={handleSharePortal}
                                    className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-brand-accent/10 border border-brand-accent/20 text-brand-accent text-xs font-bold hover:bg-brand-accent/20 transition-all active:scale-95"
                                >
                                    <Share2Icon className="w-3 h-3" />
                                    Portal
                                </button>
                            </div>
                        </div>

                        <div className="relative z-10 w-full flex-1">
                            <ClientInfoTab client={client} onSharePortal={handleSharePortal} />
                        </div>
                    </div>

                    {/* Horizontal Tab Navigation */}
                    <div className="flex items-center gap-2 sm:gap-3 bg-brand-surface border border-brand-border/40 p-1.5 rounded-2xl w-fit overflow-x-auto scrollbar-hide">
                        {[
                            { id: 'overview', label: 'Ringkasan & Progres', icon: LayoutIcon },
                            { id: 'finance', label: 'Keuangan', icon: CreditCardIcon },
                            { id: 'documents', label: 'Dokumen', icon: FileTextIcon },
                        ].map((tab) => {
                            const isActive = activeTab === tab.id;
                            return (
                                <button
                                    key={tab.id}
                                    onClick={() => setActiveTab(tab.id as any)}
                                    className={`flex items-center gap-2 px-4 py-2.5 text-xs font-black rounded-xl transition-all duration-300 relative whitespace-nowrap ${
                                        isActive
                                        ? 'bg-gradient-to-r from-brand-accent to-blue-600 text-white shadow-md shadow-brand-accent/15'
                                        : 'text-brand-text-secondary hover:text-brand-text-light hover:bg-white/40'
                                    }`}
                                >
                                    <tab.icon className="w-3.5 h-3.5" />
                                    {tab.label}
                                </button>
                             );
                        })}
                    </div>

                    {/* Main Content Dashboard (Full Width) */}
                    <div className="w-full">
                        {/* Tab Content */}
                        <div className="bg-brand-surface border border-brand-border/60 rounded-[2.5rem] shadow-lg overflow-hidden p-6 md:p-10 min-h-[500px]">
                            <div className="animate-in fade-in slide-in-from-top-2 duration-500">
                                {activeTab === 'overview' && (
                                    <div className="space-y-6">
                                        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-8 gap-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-xl bg-brand-accent/10 flex items-center justify-center">
                                                    <HistoryIcon className="w-5 h-5 text-brand-accent" />
                                                </div>
                                                <h3 className="text-xl font-black text-brand-text-light tracking-tight">Kelola Acara Pengantin</h3>
                                            </div>
                                            <button
                                                onClick={() => navigate('/project/add')}
                                                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-brand-accent text-white text-xs font-black shadow-lg shadow-brand-accent/25 hover:scale-105 transition-all"
                                            >
                                                <PlusIcon className="w-4 h-4" />
                                                Proyek Baru
                                            </button>
                                        </div>

                                        <div className="w-full overflow-x-auto pb-4">
                                            {clientProjects.length === 0 ? (
                                                <div className="text-center py-20 bg-brand-surface border-2 border-dashed border-brand-border rounded-[2.5rem]">
                                                    <p className="text-brand-text-secondary font-medium">Belum ada proyek terdaftar.</p>
                                                </div>
                                            ) : (
                                                <div className="min-w-[800px] flex flex-col gap-6">
                                                    {clientProjects.map(p => (
                                                        <ProjectDashboardCard
                                                            key={p.id}
                                                            project={p}
                                                            profile={profile}
                                                            transactions={clientTransactions.filter(t => String(t.projectId) === String(p.id))}
                                                            onStatusUpdate={(status) => handleStatusUpdate(p.id, status)}
                                                            onSubStatusToggle={(name, checked) => handleSubStatusToggle(p.id, name, checked)}
                                                            onSendWhatsApp={() => handleSendProjectUpdate(p)}
                                                        />
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )}

                                {activeTab === 'finance' && (
                                    <div className="flex flex-col">
                                        <div className="flex items-center gap-3 mb-8">
                                            <div className="w-10 h-10 rounded-xl bg-brand-accent/10 flex items-center justify-center">
                                                <CreditCardIcon className="w-5 h-5 text-brand-accent" />
                                            </div>
                                            <h3 className="text-xl font-black text-brand-text-light tracking-tight">Data Keuangan Pembayaran Pengantin</h3>
                                        </div>

                                        <div className="w-full overflow-x-auto pb-4">
                                            <div className="min-w-[800px] space-y-8">
                                                {clientProjects.map(p => (
                                                    <ProjectPaymentCard
                                                        key={p.id}
                                                        project={p}
                                                        transactions={clientTransactions.filter(t => String(t.projectId) === String(p.id))}
                                                        packages={packages}
                                                        cards={cards}
                                                        newPayment={newPayments[p.id] || { amount: '', destinationCardId: '' }}
                                                        newCharge={newCharge[p.id] || { name: '', amount: '' }}
                                                        editingChargeId={editingChargeId}
                                                        editChargeData={editChargeData}
                                                        onPaymentChange={(field, val) => handleNewPaymentChange(p.id, field, val)}
                                                        onPaymentSubmit={() => handleNewPaymentSubmit(p.id)}
                                                        onChargeChange={(field, val) => handleNewChargeChange(p.id, field, val)}
                                                        onChargeSubmit={() => handleNewChargeSubmit(p.id)}
                                                        onDeleteCharge={(chargeId) => handleDeleteCharge(p.id, chargeId)}
                                                        onStartEditCharge={(charge) => {
                                                            setEditingChargeId(String(charge.id));
                                                            setEditChargeData({ name: charge.description, amount: String(charge.amount) });
                                                        }}
                                                        onSaveEditCharge={() => handleSaveEditCharge(p.id)}
                                                        onCancelEditCharge={() => setEditingChargeId(null)}
                                                        setEditChargeData={setEditChargeData}
                                                        onViewReceipt={(t) => setSelectedReceiptTransaction(t)}
                                                        onViewInvoice={(proj) => setSelectedInvoiceProject(proj)}
                                                        onDeleteProject={() => showNotification("Penghapusan proyek dinonaktifkan di sini.")}
                                                    />
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {activeTab === 'documents' && (
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div className="bg-brand-surface border border-brand-border rounded-[2.5rem] p-8 shadow-sm">
                                            <div className="flex items-center gap-3 mb-6">
                                                <FileTextIcon className="w-6 h-6 text-brand-accent" />
                                                <h3 className="text-lg font-black text-brand-text-light tracking-tight">Kontrak Digital</h3>
                                            </div>
                                            <div className="space-y-4">
                                                {clientProjects.map(p => (
                                                    <div key={p.id} className="p-4 rounded-2xl bg-brand-bg border border-brand-border flex items-center justify-between group">
                                                        <div className="min-w-0">
                                                            <p className="text-xs font-black text-brand-text-primary truncate">{p.projectName}</p>
                                                            <p className="text-[10px] font-bold text-brand-text-secondary uppercase">Dokumen Legal</p>
                                                        </div>
                                                        <button
                                                            onClick={() => navigate(`/kontrak?newFor=${p.id}&clientId=${client.id}`)}
                                                            className="px-4 py-2 rounded-xl bg-brand-surface border border-brand-border text-[10px] font-black text-brand-text-secondary group-hover:text-brand-accent group-hover:border-brand-accent/50 transition-all"
                                                        >
                                                            Lihat / Buat
                                                        </button>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>

                                        <div className="bg-brand-surface border border-brand-border rounded-[2.5rem] p-8 shadow-sm">
                                            <div className="flex items-center gap-3 mb-6">
                                                <Share2Icon className="w-6 h-6 text-brand-accent" />
                                                <h3 className="text-lg font-black text-brand-text-light tracking-tight">Portal Klien</h3>
                                            </div>
                                            <p className="text-xs text-brand-text-secondary font-medium leading-relaxed mb-6">
                                                Akses cepat untuk membagikan portal interaktif kepada klien. Klien dapat memantau progres dan mengunduh file dari sini.
                                            </p>
                                            <div className="p-4 rounded-2xl bg-brand-accent/5 border border-brand-accent/20 flex items-center justify-between">
                                                <div className="min-w-0">
                                                    <p className="text-[10px] font-black text-brand-accent uppercase mb-1">Status Portal</p>
                                                    <p className="text-xs font-bold text-brand-text-light truncate">Aktif & Siap Bagikan</p>
                                                </div>
                                                <button
                                                    onClick={handleSharePortal}
                                                    className="px-4 py-2 rounded-xl bg-brand-accent text-white text-[10px] font-black shadow-lg shadow-brand-accent/20 hover:scale-105 transition-all"
                                                >
                                                    Buka & Share
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            {/* Modals */}
            {selectedInvoiceProject && (
                <InvoicePreviewModal
                    isOpen={!!selectedInvoiceProject}
                    onClose={() => setSelectedInvoiceProject(null)}
                    project={selectedInvoiceProject}
                    profile={profile}
                    packages={packages}
                    client={client}
                />
            )}

            {selectedReceiptTransaction && (
                <ReceiptPreviewModal
                    isOpen={!!selectedReceiptTransaction}
                    onClose={() => setSelectedReceiptTransaction(null)}
                    transaction={selectedReceiptTransaction}
                    project={projects.find(p => p.id === selectedReceiptTransaction.projectId) || clientProjects[0]}
                    profile={profile}
                />
            )}
        </div>
    );
};

export default ClientDetailPage;
