import React, { useState } from 'react';
import { UsersIcon, HistoryIcon, Share2Icon } from '@/constants';
import Modal from '@/shared/ui/Modal';
import { PaymentStatus } from '@/types';
import { updateProject as updateProjectRow } from '@/services/projects';
import ClientInfoTab from '@/features/clients/components/ClientInfoTab';
import ProjectPaymentCard from '@/features/clients/components/ProjectPaymentCard';

import { ClientDetailModalProps } from '@/features/clients/types';
import { AvatarDisplay } from '@/shared/ui/AvatarUpload';

const formatCurrency = (amount: number) => new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
}).format(amount);

const ClientDetailModal: React.FC<ClientDetailModalProps> = ({
    client,
    projects,
    transactions,
    packages,
    onClose,
    onViewReceipt,
    onViewInvoice,
    onRecordPayment,
    cards,
    onSharePortal,
    onDeleteProject,
    showNotification,
    setProjects
}) => {
    const [newPayments, setNewPayments] = useState<{ [key: string]: { amount: string, destinationCardId: string } }>({});
    const [newCharge, setNewCharge] = useState<{ [key: string]: { name: string, amount: string } }>({});
    const [editingChargeId, setEditingChargeId] = useState<string | null>(null);
    const [editChargeData, setEditChargeData] = useState({ name: '', amount: '' });

    if (!client) return null;

    const handleNewPaymentChange = (projectId: string, field: 'amount' | 'destinationCardId', value: string) => {
        const currentProjectPayment = newPayments[projectId] || { amount: '', destinationCardId: '' };
        setNewPayments(prev => ({
            ...prev,
            [projectId]: { ...currentProjectPayment, [field]: value }
        }));
    };

    const handleNewPaymentSubmit = (projectId: string) => {
        const paymentData = newPayments[projectId];
        const project = clientProjects.find(p => String(p.id) === String(projectId));
        if (paymentData && Number(paymentData.amount) > 0 && paymentData.destinationCardId && project) {
            const amount = Number(paymentData.amount);
            if (amount > (project.totalCost - project.amountPaid)) {
                alert('Jumlah pembayaran melebihi sisa tagihan.');
                return;
            }
            onRecordPayment(Number(projectId), amount, Number(paymentData.destinationCardId));
            setNewPayments(prev => ({ ...prev, [projectId]: { amount: '', destinationCardId: '' } }));
        } else {
            showNotification('Harap isi jumlah dan tujuan pembayaran dengan benar.');
        }
    };

    const handleNewChargeChange = (projectId: string, field: 'name' | 'amount', value: string) => {
        const currentCharge = newCharge[projectId] || { name: '', amount: '' };
        setNewCharge(prev => ({
            ...prev,
            [projectId]: { ...currentCharge, [field]: value }
        }));
    };

    const handleNewChargeSubmit = async (projectId: string) => {
        const chargeData = newCharge[projectId];
        const project = clientProjects.find(p => String(p.id) === String(projectId));
        if (chargeData && chargeData.name.trim() && Number(chargeData.amount) > 0 && project) {
            const amount = Number(chargeData.amount);
            const newCustomCost = { id: `custom-${Date.now()}`, description: chargeData.name.trim(), amount: amount };
            const updatedCustomCosts = [...(project.customCosts || []), newCustomCost];
            const newTotalCost = project.totalCost + amount;
            const remaining = newTotalCost - project.amountPaid;
            const newPaymentStatus = remaining <= 0 ? PaymentStatus.LUNAS : (project.amountPaid > 0 ? PaymentStatus.DP_TERBAYAR : PaymentStatus.BELUM_BAYAR);

            try {
                await updateProjectRow(projectId, { customCosts: updatedCustomCosts, totalCost: newTotalCost, paymentStatus: newPaymentStatus });
                setProjects(prev => prev.map(p => String(p.id) === String(projectId) ? { ...p, customCosts: updatedCustomCosts, totalCost: newTotalCost, paymentStatus: newPaymentStatus } : p));
                setNewCharge(prev => ({ ...prev, [projectId]: { name: '', amount: '' } }));
                showNotification('Biaya tambahan berhasil ditambahkan.');
            } catch (err) {
                showNotification('Gagal menambahkan biaya tambahan.');
            }
        } else {
            showNotification('Harap isi nama dan jumlah biaya dengan benar.');
        }
    };

    const handleDeleteCharge = async (projectId: string, chargeId: string) => {
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
            await updateProjectRow(projectId, { customCosts: updatedCustomCosts, totalCost: newTotalCost, paymentStatus: newPaymentStatus });
            setProjects(prev => prev.map(p => String(p.id) === String(projectId) ? { ...p, customCosts: updatedCustomCosts, totalCost: newTotalCost, paymentStatus: newPaymentStatus } : p));
            showNotification('Biaya tambahan berhasil dihapus.');
        } catch (err) {
            showNotification('Gagal menghapus biaya tambahan.');
        }
    };

    const handleSaveEditCharge = async (projectId: string) => {
        const project = clientProjects.find(p => String(p.id) === String(projectId));
        if (!project || !project.customCosts || !editingChargeId) return;
        const chargeToUpdate = project.customCosts.find(c => String(c.id) === String(editingChargeId));
        if (!chargeToUpdate) return;
        const newAmount = Number(editChargeData.amount);
        const name = editChargeData.name.trim();
        if (!name || isNaN(newAmount)) {
            showNotification('Harap isi nama dan jumlah biaya con benar.');
            return;
        }
        const diff = newAmount - chargeToUpdate.amount;
        const updatedCustomCosts = project.customCosts.map(c => String(c.id) === String(editingChargeId) ? { ...c, description: name, amount: newAmount } : c);
        const newTotalCost = project.totalCost + diff;
        const remaining = newTotalCost - project.amountPaid;
        const newPaymentStatus = remaining <= 0 ? PaymentStatus.LUNAS : (project.amountPaid > 0 ? PaymentStatus.DP_TERBAYAR : PaymentStatus.BELUM_BAYAR);

        try {
            await updateProjectRow(projectId, { customCosts: updatedCustomCosts, totalCost: newTotalCost, paymentStatus: newPaymentStatus });
            setProjects(prev => prev.map(p => String(p.id) === String(projectId) ? { ...p, customCosts: updatedCustomCosts, totalCost: newTotalCost, paymentStatus: newPaymentStatus } : p));
            setEditingChargeId(null);
            showNotification('Biaya tambahan berhasil diperbarui.');
        } catch (err) {
            showNotification('Gagal memperbarui biaya tambahan.');
        }
    };

    const clientProjects = projects.filter(p => String(p.clientId) === String(client.id)).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    const clientTransactions = transactions.filter(t => clientProjects.some(p => String(p.id) === String(t.projectId))).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    const totalBilled = clientProjects.reduce((sum, project) => sum + project.totalCost, 0);
    const totalPaid = clientProjects.reduce((sum, project) => sum + project.amountPaid, 0);
    const remainingBalance = totalBilled - totalPaid;

    return (
        <Modal isOpen={!!client} onClose={onClose} title={`Detail Pengantin: ${client.name}`} size="5xl">
            <div className="flex flex-col h-full">
                <div className="max-h-[75vh] overflow-y-auto pr-2 pb-4 space-y-8 custom-scrollbar">
                    <section className="rounded-2xl border border-brand-border bg-brand-bg/60 p-4 md:p-5">
                        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                            <div className="flex items-center gap-3">
                                <AvatarDisplay avatarBase64={client.avatar} name={client.name} size="lg" variant="client" className="shrink-0" />
                                <div>
                                    <p className="text-xs font-bold uppercase tracking-widest text-brand-text-secondary">Ringkasan Pengantin</p>
                                    <h3 className="mt-1 text-lg font-black text-brand-text-light">{client.name}</h3>
                                    <p className="text-xs text-brand-text-secondary">{clientProjects.length} acara tercatat</p>
                                </div>
                            </div>
                            <button
                                type="button"
                                onClick={() => onSharePortal(client)}
                                className="button-primary inline-flex items-center justify-center gap-2 text-sm"
                            >
                                <Share2Icon className="w-4 h-4" />
                                Bagikan Portal
                            </button>
                        </div>

                        <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
                            <div className="rounded-xl border border-brand-border bg-brand-surface p-3">
                                <p className="text-[10px] font-black uppercase tracking-widest text-brand-text-secondary">Total Tagihan</p>
                                <p className="mt-1 text-base font-black text-brand-text-light">{formatCurrency(totalBilled)}</p>
                            </div>
                            <div className="rounded-xl border border-green-500/20 bg-green-500/10 p-3">
                                <p className="text-[10px] font-black uppercase tracking-widest text-green-400">Terbayar</p>
                                <p className="mt-1 text-base font-black text-green-400">{formatCurrency(totalPaid)}</p>
                            </div>
                            <div className="rounded-xl border border-red-500/20 bg-red-500/10 p-3">
                                <p className="text-[10px] font-black uppercase tracking-widest text-red-400">Sisa Tagihan</p>
                                <p className="mt-1 text-base font-black text-red-400">{formatCurrency(remainingBalance)}</p>
                            </div>
                        </div>
                    </section>

                    {/* Info Section */}
                    <section>
                        <div className="flex items-center gap-2 mb-4 pb-2 border-b border-slate-100">
                            <UsersIcon className="w-5 h-5 text-brand-accent" />
                            <h3 className="font-bold text-brand-text-primary">Informasi Pengantin</h3>
                        </div>
                        <ClientInfoTab client={client} />
                    </section>

                    {/* Payments Section */}
                    <section>
                        <div className="flex items-center gap-2 mb-4 pb-2 border-b border-slate-100">
                            <HistoryIcon className="w-5 h-5 text-brand-accent" />
                            <h3 className="font-bold text-brand-text-primary">Riwayat Pembayaran Pengantin</h3>
                        </div>
                        <div className="space-y-6">
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
                                        setEditingChargeId(charge.id);
                                        setEditChargeData({ name: charge.description, amount: String(charge.amount) });
                                    }}
                                    onSaveEditCharge={() => handleSaveEditCharge(p.id)}
                                    onCancelEditCharge={() => setEditingChargeId(null)}
                                    setEditChargeData={setEditChargeData}
                                    onViewReceipt={onViewReceipt}
                                    onViewInvoice={onViewInvoice}
                                    onDeleteProject={onDeleteProject}
                                />
                            ))}
                        </div>
                    </section>
                </div>
            </div>
        </Modal>
    );
};

export default ClientDetailModal;
