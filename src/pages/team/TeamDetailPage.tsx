import React, { useState, useMemo, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
    ChevronLeftIcon,
    HistoryIcon,
    StarIcon,
    FileTextIcon,
    PencilIcon,
    PrinterIcon,
    EyeIcon,
    DollarSignIcon,
    BriefcaseIcon
} from '@/constants';
import { useTeamMembers, useTeamProjectPayments, useTeamPaymentRecords } from '@/features/team/api/useTeamQueries';
import { useProjects } from '@/features/projects/api/useProjects';
import { useCards, usePockets } from '@/features/finance/api/useFinanceQueries';
import { useProfile } from '@/features/settings/api/useProfileQueries';
import { useQueryClient } from '@tanstack/react-query';
import { 
    TeamProjectPayment, 
    TeamPaymentRecord, 
    PaymentStatus, 
    PerformanceNote, 
    PerformanceNoteType,
    PocketType,
    TransactionType,
    AssignedTeamMember
} from '@/types';
import { useApp } from '@/app/AppContext';
import FreelancerProjects from '@/features/team/components/FreelancerProjects';
import { PerformanceTab } from '@/features/team/components/PerformanceTab';
import { CreatePaymentTab } from '@/features/team/components/CreatePaymentTab';
import Modal from '@/shared/ui/Modal';
import SignaturePad from '@/shared/ui/SignaturePad';
import { updateTeamMember as updateTeamMemberRow } from '@/services/teamMembers';
import { createTeamPaymentRecord, updateTeamPaymentRecord } from '@/services/teamPaymentRecords';
import { createTransaction as createTransactionApi, updateCardBalance as updateCardBalanceApi } from '@/services/transactions';
import { updatePocket as updatePocketRow } from '@/services/pockets';
import { markTeamPaymentStatus } from '@/services/teamProjectPayments';
import { AvatarDisplay } from '@/shared/ui/AvatarUpload';
import { CloudinaryAvatarUpload } from '@/shared/ui/CloudinaryAvatarUpload';

const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(amount);
}

const formatDate = (dateString: string) => {
    if (!dateString) return '';
    return new Date(dateString).toLocaleDateString('id-ID', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
};

const TeamDetailPage: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const { showNotification } = useApp();

    const { data: teamMembers = [] } = useTeamMembers();
    const { data: teamProjectPayments = [] } = useTeamProjectPayments();
    const { data: teamPaymentRecords = [] } = useTeamPaymentRecords();
    const { data: projects = [] } = useProjects({ limit: 1000 });
    const { data: pockets = [] } = usePockets();
    const { data: cards = [] } = useCards();
    const { data: profile } = useProfile();

    const member = useMemo(() => teamMembers.find(m => m.id === Number(id)), [teamMembers, id]);

    const [detailTab, setDetailTab] = useState<'projects' | 'payments' | 'performance' | 'create-payment'>('projects');
    const [projectsToPay, setProjectsToPay] = useState<number[]>([]);
    const [paymentAmount, setPaymentAmount] = useState<number | ''>('');
    const [paymentSourceId, setPaymentSourceId] = useState('');
    const [isSignatureModalOpen, setIsSignatureModalOpen] = useState(false);
    const [paymentSlipToView, setPaymentSlipToView] = useState<TeamPaymentRecord | null>(null);
    const [isInstallment, setIsInstallment] = useState(false);
    const [isSubmittingPayment, setIsSubmittingPayment] = useState(false);
    const paymentSubmitLockRef = useRef(false);

    // Performance states
    const [newNote, setNewNote] = useState('');
    const [newNoteType, setNewNoteType] = useState<PerformanceNoteType>(PerformanceNoteType.GENERAL);

    if (!member || !profile) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-brand-bg">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-accent"></div>
            </div>
        );
    }

    const memberUnpaidProjects = teamProjectPayments.filter(p => String(p.teamMemberId) === String(member.id) && p.status === PaymentStatus.BELUM_BAYAR);

    const memberRecords = teamPaymentRecords.filter(r => String(r.teamMemberId) === String(member.id));
    const monthlyBudgetPocket = pockets.find(p => p.type === PocketType.EXPENSE);

    const handleCreatePayment = () => {
        if (projectsToPay.length === 0) {
            showNotification('Pilih setidaknya satu acara pernikahan untuk dibayar.');
            return;
        }
        const total = memberUnpaidProjects.filter(p => projectsToPay.includes(p.id)).reduce((sum, p) => sum + p.fee, 0);
        setPaymentAmount(total);
        setDetailTab('create-payment');
    };

    const handlePay = async () => {
        if (paymentSubmitLockRef.current || isSubmittingPayment) return;
        paymentSubmitLockRef.current = true;
        if (!paymentSourceId) {
            showNotification('Pilih sumber dana pembayaran.');
            return;
        }
        if (!paymentAmount || paymentAmount <= 0) {
            showNotification('Jumlah pembayaran tidak valid.');
            return;
        }

        setIsSubmittingPayment(true);

        try {
            const isFromPocket = paymentSourceId.startsWith('pocket-');
            const sourceId = paymentSourceId.replace('card-', '').replace('pocket-', '');
            const sourceName = isFromPocket
                ? pockets.find(p => p.id === Number(sourceId))?.name
                : cards.find(c => c.id === Number(sourceId))?.bankName;

            // 1. Create Transaction (this already updates the source balance)
            const transactionPayload = {
                date: new Date().toISOString(),
                description: `Pembayaran Honor: ${member.name} (${projectsToPay.length} Acara)`,
                amount: Number(paymentAmount),
                type: TransactionType.EXPENSE,
                category: 'Gaji & Honor Tim',
                method: 'Transfer Bank',
                cardId: isFromPocket ? null : Number(sourceId),
                pocketId: isFromPocket ? Number(sourceId) : null,
            };
            await createTransactionApi(transactionPayload as any);

            // 2. Create Team Payment Record
            const recordPayload = {
                teamMemberId: member.id,
                teamMemberName: member.name,
                teamMemberRole: member.role,
                date: new Date().toISOString(),
                projectPaymentIds: projectsToPay,
                totalAmount: Number(paymentAmount),
                recordNumber: `PAY-FR-${String(member.id).slice(-4)}-${Date.now()}`,
                vendorSignature: profile.signatureBase64 || '',
                sourceType: isFromPocket ? 'pocket' : 'card',
                sourceId: sourceId,
                sourceName,
            };
            await createTeamPaymentRecord(recordPayload as any);

            // 4. Mark Status
            if (!isInstallment) {
                for (const pId of projectsToPay) {
                    await markTeamPaymentStatus(pId, PaymentStatus.LUNAS);
                }
            }

            queryClient.invalidateQueries();
            showNotification('Pembayaran berhasil dicatat!');
            setDetailTab('payments');
            setProjectsToPay([]);
            setPaymentAmount('');
            setPaymentSourceId('');
        } catch (err) {
            const detail = err instanceof Error ? err.message : 'Coba lagi.';
            showNotification(`Gagal mencatat pembayaran: ${detail}`);
        } finally {
            paymentSubmitLockRef.current = false;
            setIsSubmittingPayment(false);
        }
    };

    const handleSetRating = async (rating: number) => {
        try {
            await updateTeamMemberRow(member.id, { rating });
            queryClient.invalidateQueries({ queryKey: ['teamMembers'] });
            showNotification('Rating diperbarui.');
        } catch (err) {
            showNotification('Gagal memperbarui rating.');
        }
    };

    const handleAddNote = async () => {
        if (!newNote.trim()) return;
        const note: PerformanceNote = {
            id: Date.now(),
            date: new Date().toISOString(),
            note: newNote,
            type: newNoteType,
        };
        const updatedNotes = [...member.performanceNotes, note];
        try {
            await updateTeamMemberRow(member.id, { performanceNotes: updatedNotes });
            queryClient.invalidateQueries({ queryKey: ['teamMembers'] });
            setNewNote('');
            showNotification('Catatan kinerja ditambahkan.');
        } catch (err) {
            showNotification('Gagal menambahkan catatan.');
        }
    };

    const handleDeleteNote = async (noteId: number) => {
        const updatedNotes = member.performanceNotes.filter(n => String(n.id) !== String(noteId));
        try {
            await updateTeamMemberRow(member.id, { performanceNotes: updatedNotes });
            queryClient.invalidateQueries({ queryKey: ['teamMembers'] });
            showNotification('Catatan kinerja dihapus.');
        } catch (err) {
            showNotification('Gagal menghapus catatan.');
        }
    };

    const handleSaveSignature = async (sig: string) => {
        if (paymentSlipToView) {
            try {
                await updateTeamPaymentRecord(paymentSlipToView.id, { vendorSignature: sig });
                queryClient.invalidateQueries({ queryKey: ['teamPaymentRecords'] });
                setPaymentSlipToView(prev => prev ? { ...prev, vendorSignature: sig } : null);
                showNotification('Tanda tangan disimpan.');
            } catch (err) {
                showNotification('Gagal menyimpan tanda tangan.');
            }
        }
        setIsSignatureModalOpen(false);
    };

    const renderPaymentSlipBody = (record: TeamPaymentRecord) => {
        const projectsBeingPaid = teamProjectPayments.filter(p => record.projectPaymentIds.includes(p.id));

        return (
            <div id={`payment-slip-content-${record.id}`} className="printable-content bg-white font-sans text-slate-900 printable-area avoid-break shadow-2xl border border-slate-200">
                <div className="h-2 bg-brand-accent w-full"></div>
                <div className="p-8 sm:p-12">
                    <header className="flex justify-between items-start mb-12 pb-8 border-b border-slate-100">
                        <div className="flex flex-col gap-4">
                            {profile.logoBase64 ? (
                                <img src={profile.logoBase64} alt="Company Logo" className="h-16 sm:h-20 object-contain self-start" />
                            ) : (
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-lg bg-brand-accent flex items-center justify-center">
                                        <span className="text-white font-bold text-xl">{profile.companyName?.charAt(0) || 'V'}</span>
                                    </div>
                                    <h1 className="text-xl font-bold text-slate-800">{profile.companyName}</h1>
                                </div>
                            )}
                            <div className="text-[11px] leading-relaxed text-slate-500 max-w-[250px]">
                                <p className="font-bold text-slate-700">{profile.companyName}</p>
                                <p>{profile.address}</p>
                                <p>{profile.phone} • {profile.email}</p>
                            </div>
                        </div>
                        <div className="text-right">
                            <h2 className="text-3xl font-black text-brand-accent tracking-tighter mb-2">SLIP GAJI</h2>
                            <div className="inline-block bg-slate-100 px-3 py-1 rounded-sm text-[12px] font-bold text-slate-600 mb-3">
                                #{record.recordNumber}
                            </div>
                            <div className="text-[11px] text-slate-500">
                                <p>Tanggal Bayar: <span className="font-bold text-slate-700">{formatDate(record.date)}</span></p>
                                <p className="mt-1">Metode: <span className="font-bold text-slate-700 uppercase">Transfer Bank</span></p>
                            </div>
                        </div>
                    </header>

                    <div className="grid grid-cols-2 gap-8 mb-12">
                        <div className="bg-slate-50/50 p-6 rounded-xl border border-slate-100">
                            <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-3">Penerima (Vendor/Tim)</h4>
                            <div className="space-y-1">
                                <p className="text-lg font-bold text-slate-800">{member.name}</p>
                                <div className="text-[12px] text-slate-600 space-y-0.5">
                                    <p className="font-medium text-brand-accent">{member.role}</p>
                                    <p>No. Rek: <span className="font-bold">{member.noRek || '-'}</span></p>
                                </div>
                            </div>
                        </div>
                        <div className="bg-slate-50/50 p-6 rounded-xl border border-slate-100">
                            <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-3">Sumber Dana</h4>
                            <div className="space-y-1">
                                <p className="text-lg font-bold text-slate-800">{profile.companyName}</p>
                                <div className="text-[12px] text-slate-600 space-y-0.5">
                                    <p>Rekening Bisnis: <span className="font-bold">{profile.bankAccount || '-'}</span></p>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="mb-12">
                        <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-4 ml-1">Rincian Pekerjaan & Honor</h3>
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-slate-100 border-b-2 border-slate-300">
                                    <th className="px-5 py-4 text-[11px] font-black text-slate-700 uppercase tracking-widest w-[60%] border-r border-slate-300">Deskripsi Acara Pernikahan / Tugas</th>
                                    <th className="px-5 py-4 text-[11px] font-black text-slate-700 uppercase tracking-widest text-center w-[15%] border-r border-slate-300">Peran</th>
                                    <th className="px-5 py-4 text-[11px] font-black text-slate-700 uppercase tracking-widest text-right w-[25%]">Jumlah Fee</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white/40 divide-y divide-slate-300">
                                {projectsBeingPaid.map((p: TeamProjectPayment) => {
                                    const project = projects.find(proj => String(proj.id) === String(p.projectId));
                                    return (
                                        <tr key={p.id} className="hover:bg-blue-50/30 transition-colors">
                                            <td className="px-5 py-5 border-r border-slate-300">
                                                <p className="font-bold text-slate-800">{project?.projectName || 'Acara Pernikahan'}</p>
                                                <p className="text-[10px] text-slate-500 mt-1 flex items-center gap-2">
                                                    <span className="w-1.5 h-1.5 rounded-full bg-brand-accent"></span>
                                                    ID: {String(p.id).slice(-8).toUpperCase()} • Selesai: {formatDate(project?.date || '')}
                                                </p>
                                            </td>
                                            <td className="px-5 py-5 text-center border-r border-slate-300">
                                                <span className="inline-block px-2 py-1 bg-slate-100 rounded text-[10px] font-bold text-slate-600 uppercase">
                                                    {project?.team.find((t: AssignedTeamMember) => Number(t.memberId) === Number(member.id))?.role || member.role}
                                                </span>
                                            </td>
                                            <td className="px-5 py-5 text-right font-bold text-slate-800">{formatCurrency(p.fee)}</td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                            <tfoot>
                                <tr className="bg-slate-50/50 border-t-2 border-slate-200">
                                    <td colSpan={2} className="px-5 py-5 text-right">
                                        <span className="text-[11px] font-black text-slate-400 uppercase tracking-widest">Total Honor Bersih</span>
                                    </td>
                                    <td className="px-5 py-5 text-right">
                                        <p className="text-2xl font-black text-brand-accent tracking-tighter">{formatCurrency(record.totalAmount)}</p>
                                    </td>
                                </tr>
                            </tfoot>
                        </table>
                    </div>

                    <div className="flex justify-between items-end pt-12 border-t border-slate-100">
                        <div className="flex-1 max-w-[350px]">
                            <div className="bg-brand-accent/5 border border-brand-accent/10 p-4 rounded-lg mb-4">
                                <p className="text-[10px] text-brand-accent font-bold mb-1 uppercase tracking-tight">Catatan Transaksi:</p>
                                <p className="text-[11px] text-slate-500 leading-relaxed italic">
                                    Pembayaran ini bersifat final untuk rincian pekerjaan yang tertera di atas. Jika terdapat ketidaksesuaian, silakan hubungi tim administrasi dalam 2x24 jam.
                                </p>
                            </div>
                            <p className="text-[9px] text-slate-400 uppercase tracking-widest font-black">
                                Dicetak Otomatis oleh Sistem {profile.companyName}
                            </p>
                        </div>
                        <div className="text-center min-w-[180px]">
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Verifikator,</p>
                            <div className="h-20 flex items-center justify-center mb-1">
                                {record.vendorSignature ? (
                                    <img src={record.vendorSignature} alt="Tanda Tangan" className="max-h-full object-contain" />
                                ) : profile.signatureBase64 ? (
                                    <img src={profile.signatureBase64} alt="Tanda Tangan" className="max-h-full object-contain" />
                                ) : (
                                    <div className="h-px w-24 bg-slate-200 mx-auto mt-10" />
                                )}
                            </div>
                            <p className="text-sm font-bold text-slate-800 underline underline-offset-4 decoration-slate-300">
                                ({profile.authorizedSigner || profile.companyName})
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        );
    };

    return (
        <div className="min-h-screen bg-brand-bg relative overflow-x-hidden pb-20">
            {/* Background Decorative Elements */}
            <div className="absolute top-0 left-0 w-full h-[400px] bg-gradient-to-b from-brand-accent/10 to-transparent pointer-events-none"></div>
            <div className="absolute top-[-10%] right-[-5%] w-[40%] h-[40%] bg-brand-accent/5 rounded-full blur-[120px] pointer-events-none"></div>
            <div className="absolute bottom-[10%] left-[-5%] w-[30%] h-[30%] bg-blue-500/5 rounded-full blur-[100px] pointer-events-none"></div>

            <header className="sticky top-0 z-40 bg-brand-bg/60 backdrop-blur-xl border-b border-brand-border/50">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 h-20 flex items-center justify-between">
                    <div className="flex items-center gap-6">
                        <button 
                            onClick={() => navigate('/member')}
                            className="group flex items-center gap-2 p-2 rounded-2xl hover:bg-brand-surface transition-all active:scale-95 border border-transparent hover:border-brand-border"
                        >
                            <div className="p-2 rounded-xl bg-brand-surface border border-brand-border group-hover:bg-brand-accent group-hover:text-white transition-all">
                                <ChevronLeftIcon className="w-5 h-5" />
                            </div>
                            <span className="text-sm font-bold text-brand-text-secondary group-hover:text-brand-text-light hidden sm:block transition-colors">Daftar Tim</span>
                        </button>
                        
                        <div className="h-8 w-[1px] bg-brand-border hidden sm:block"></div>

                        <div className="flex items-center gap-4">
                            <div className="hidden sm:flex w-12 h-12 rounded-2xl bg-gradient-to-br from-brand-accent to-blue-600 items-center justify-center shadow-xl shadow-brand-accent/20">
                                <BriefcaseIcon className="w-6 h-6 text-white" />
                            </div>
                            <div>
                                <h1 className="text-xl font-black text-brand-text-light tracking-tight truncate max-w-[200px] md:max-w-md">Detail Tim / Vendor</h1>
                                <div className="flex items-center gap-2 mt-0.5">
                                    <span className="text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full bg-brand-accent text-white border border-brand-accent">
                                        {member.category}
                                    </span>
                                    <span className="text-brand-text-secondary text-[10px] font-bold">•</span>
                                    <p className="text-[10px] text-brand-text-secondary font-bold uppercase tracking-widest truncate max-w-[150px]">{member.name}</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    <button 
                        onClick={() => navigate(`/member/${member.id}/edit`)}
                        className="flex items-center gap-2 px-4 py-2 rounded-xl bg-brand-accent text-white text-xs font-bold hover:bg-brand-accent-hover transition-all shadow-sm"
                    >
                        <PencilIcon className="w-4 h-4" />
                        Edit Data
                    </button>
                </div>
            </header>

            <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8 md:py-12 relative z-10">
                <div className="space-y-8">
                    {/* Top Row: Profile Summary */}
                    <div className="bg-brand-surface border border-brand-border rounded-[2.5rem] p-6 md:p-8 shadow-sm relative overflow-hidden group flex flex-col md:flex-row items-center gap-8">
                        <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                            <BriefcaseIcon className="w-24 h-24 text-brand-accent -mr-8 -mt-8 rotate-12" />
                        </div>

                        <div className="relative z-10 text-center md:text-left flex flex-col items-center md:items-start shrink-0 min-w-[250px]">
                            <CloudinaryAvatarUpload
                                value={member.avatar}
                                context="team"
                                onChange={async (url) => {
                                    try {
                                        await updateTeamMemberRow(member.id, { avatar: url });
                                        queryClient.invalidateQueries({ queryKey: ['teamMembers'] });
                                        showNotification(url ? 'Foto profil diperbarui.' : 'Foto profil dihapus.');
                                    } catch {
                                        showNotification('Gagal menyimpan foto profil.');
                                    }
                                }}
                                name={member.name}
                                size="xl"
                                variant={member.category === 'Vendor' ? 'vendor' : 'team'}
                            />
                            <h2 className="text-2xl font-black text-brand-text-light leading-tight mt-3">{member.name}</h2>
                            <p className="text-brand-accent font-bold mt-1 uppercase tracking-widest text-[10px]">{member.role}</p>
                        </div>

                        <div className="relative z-10 w-full flex-1 grid grid-cols-1 sm:grid-cols-3 gap-4">
                            <div className="flex flex-col p-5 rounded-2xl bg-brand-bg border border-brand-border h-full justify-center">
                                <div className="flex items-center gap-3 mb-2">
                                    <div className="p-2 rounded-lg bg-amber-500">
                                        <StarIcon className="w-4 h-4 text-white fill-current" />
                                    </div>
                                    <span className="text-[10px] font-bold text-brand-text-secondary uppercase tracking-widest">Rating</span>
                                </div>
                                <span className="text-xl font-black text-brand-text-light ml-1">{member.rating.toFixed(1)}</span>
                            </div>
                            <div className="flex flex-col p-5 rounded-2xl bg-brand-bg border border-brand-border h-full justify-center">
                                <div className="flex items-center gap-3 mb-2">
                                    <div className="p-2 rounded-lg bg-blue-600">
                                        <DollarSignIcon className="w-4 h-4 text-white" />
                                    </div>
                                    <span className="text-[10px] font-bold text-brand-text-secondary uppercase tracking-widest">Fee Standar</span>
                                </div>
                                <span className="text-lg font-black text-brand-text-light ml-1">{formatCurrency(member.standardFee)}</span>
                            </div>
                            <div className="flex justify-between items-center p-5 rounded-2xl bg-blue-50 border border-blue-200 h-full">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 rounded-lg bg-brand-accent">
                                        <HistoryIcon className="w-4 h-4 text-white" />
                                    </div>
                                    <div>
                                        <span className="block text-[10px] font-bold text-brand-accent uppercase tracking-widest mb-0.5">Tagihan Belum Lunas</span>
                                        <span className="block text-xl font-black text-brand-accent mt-1">
                                            {formatCurrency(memberUnpaidProjects.reduce((sum, p) => sum + p.fee, 0))}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Horizontal Tab Navigation */}
                    <div className="flex items-center gap-2 sm:gap-6 border-b border-brand-border w-full overflow-x-auto pb-1 scrollbar-hide">
                        {[
                            { id: 'projects', label: 'Acara Pernikahan', icon: FileTextIcon },
                            { id: 'payments', label: 'Riwayat Pembayaran', icon: HistoryIcon },
                            { id: 'performance', label: 'Evaluasi Kinerja', icon: StarIcon },
                        ].map(tab => (
                            <button
                                key={tab.id}
                                onClick={() => setDetailTab(tab.id as any)}
                                className={`flex items-center gap-2 pb-4 pt-2 px-1 text-sm font-black transition-all relative whitespace-nowrap ${String(detailTab) === String(tab.id) || (String(tab.id) === String('projects') && detailTab === 'create-payment')
                                    ? 'text-brand-accent'
                                    : 'text-brand-text-secondary hover:text-brand-text-light'
                                    }`}
                            >
                                <tab.icon className="w-4 h-4" />
                                {tab.label}
                                {(String(detailTab) === String(tab.id) || (String(tab.id) === String('projects') && detailTab === 'create-payment')) && (
                                    <div className="absolute bottom-0 left-0 w-full h-1 bg-brand-accent rounded-t-full"></div>
                                )}
                            </button>
                        ))}
                    </div>

                    {/* Content Area (Full Width) */}
                    <div className="w-full">
                        <div className="bg-brand-surface border border-brand-border rounded-[2.5rem] shadow-sm overflow-hidden p-6 md:p-12 min-h-[500px]">
                            {detailTab === 'projects' && (
                                <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-10">
                                        <div>
                                            <h3 className="text-2xl font-black text-brand-text-light tracking-tight">Acara Pernikahan Terkait</h3>
                                            <p className="text-sm text-brand-text-secondary font-medium mt-1">Daftar pekerjaan dan status pembayarannya.</p>
                                        </div>
                                        {memberUnpaidProjects.length > 0 && (
                                            <button 
                                                onClick={handleCreatePayment}
                                                className="px-6 py-3 rounded-2xl bg-brand-accent text-white font-black text-sm uppercase tracking-widest hover:shadow-xl hover:shadow-brand-accent/30 transition-all active:scale-95 whitespace-nowrap"
                                            >
                                                Proses Pembayaran
                                            </button>
                                        )}
                                    </div>

                                    <div className="w-full overflow-x-auto pb-4">
                                        <FreelancerProjects 
                                            projects={projects} 
                                            teamProjectPayments={teamProjectPayments} 
                                            member={member} 
                                            formatCurrency={formatCurrency} 
                                            formatDate={formatDate}
                                            projectsToPay={projectsToPay}
                                            onToggleProject={(paymentId: number) => setProjectsToPay(prev => prev.includes(paymentId) ? prev.filter(i => i !== paymentId) : [...prev, paymentId])}
                                            showOnlyUnpaid={false}
                                            onNavigateToProject={(projectId: number) => navigate(`/projects/${projectId}`)}
                                        />
                                    </div>
                                </div>
                            )}

                            {detailTab === 'payments' && (
                                <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                                    <h3 className="text-2xl font-black text-brand-text-light tracking-tight mb-10">Riwayat Pembayaran</h3>
                                    
                                    <div className="space-y-6 max-w-4xl">
                                        {memberRecords.length === 0 ? (
                                            <div className="text-center py-20 border-2 border-dashed border-brand-border rounded-[2rem]">
                                                <HistoryIcon className="w-12 h-12 text-brand-text-secondary/20 mx-auto mb-4" />
                                                <p className="text-brand-text-secondary font-medium">Belum ada riwayat pembayaran.</p>
                                            </div>
                                        ) : (
                                            memberRecords.map(record => (
                                                <div key={record.id} className="bg-brand-bg/50 border border-brand-border/50 rounded-3xl p-6 hover:border-brand-accent/30 transition-all group">
                                                    <div className="flex flex-wrap items-center justify-between gap-4">
                                                        <div className="flex items-center gap-4">
                                                            <div className="p-4 rounded-2xl bg-white/5 border border-white/10 text-brand-accent group-hover:bg-brand-accent group-hover:text-white transition-all">
                                                                <FileTextIcon className="w-6 h-6" />
                                                            </div>
                                                            <div>
                                                                <p className="font-mono text-xs text-brand-text-secondary font-bold uppercase tracking-widest">{record.recordNumber}</p>
                                                                <p className="text-lg font-black text-brand-text-light mt-0.5">{formatDate(record.date)}</p>
                                                            </div>
                                                        </div>
                                                        <div className="flex items-center gap-6">
                                                            <div className="text-right">
                                                                <p className="text-[10px] text-brand-text-secondary font-bold uppercase tracking-widest mb-1">Total Dibayar</p>
                                                                <p className="text-xl font-black text-green-500">{formatCurrency(record.totalAmount)}</p>
                                                            </div>
                                                            <button 
                                                                onClick={() => setPaymentSlipToView(record)}
                                                                className="p-3 rounded-xl bg-white/5 border border-white/10 text-brand-text-secondary hover:bg-brand-surface hover:text-brand-accent transition-all"
                                                            >
                                                                <EyeIcon className="w-5 h-5" />
                                                            </button>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))
                                        )}
                                    </div>
                                </div>
                            )}

                            {detailTab === 'performance' && (
                                <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                                    <h3 className="text-2xl font-black text-brand-text-light tracking-tight mb-10">Evaluasi Kinerja</h3>
                                    <div className="max-w-4xl">
                                        <PerformanceTab 
                                            member={member} 
                                            onSetRating={handleSetRating} 
                                            newNote={newNote} 
                                            setNewNote={setNewNote} 
                                            newNoteType={newNoteType} 
                                            setNewNoteType={setNewNoteType} 
                                            onAddNote={handleAddNote} 
                                            onDeleteNote={(noteId: number) => { handleDeleteNote(noteId); }} 
                                        />
                                    </div>
                                </div>
                            )}

                            {detailTab === 'create-payment' && (
                                <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                                    <div className="flex items-center gap-4 mb-10">
                                        <button onClick={() => setDetailTab('projects')} className="p-2 rounded-xl bg-white/5 text-brand-text-secondary hover:text-brand-accent transition-all">
                                            <ChevronLeftIcon className="w-5 h-5" />
                                        </button>
                                        <h3 className="text-2xl font-black text-brand-text-light tracking-tight">Proses Pembayaran</h3>
                                    </div>

                                    <div className="max-w-5xl mx-auto">
                                        <CreatePaymentTab
                                            member={member}
                                            paymentDetails={{
                                                projects: memberUnpaidProjects.filter(p => projectsToPay.includes(p.id)),
                                                total: typeof paymentAmount === 'number' ? paymentAmount : 0
                                            }}
                                            paymentAmount={paymentAmount}
                                            setPaymentAmount={setPaymentAmount}
                                            isInstallment={isInstallment}
                                            setIsInstallment={setIsInstallment}
                                            onPay={handlePay}
                                            onSetTab={() => setDetailTab('projects')}
                                            renderPaymentDetailsContent={() => renderPaymentSlipBody({ 
                                                id: `TEMP-${Date.now()}`, 
                                                recordNumber: `PAY-FR-${String(member.id).slice(-4)}-${Date.now()}`, 
                                                teamMemberId: member.id, 
                                                teamMemberName: member.name,
                                                teamMemberRole: member.role,
                                                date: new Date().toISOString(), 
                                                projectPaymentIds: projectsToPay, 
                                                totalAmount: typeof paymentAmount === 'number' ? paymentAmount : 0,
                                                items: [] // This prop isn't used in renderPaymentSlipBody but needed for type
                                            } as any)}
                                            cards={cards}
                                            monthlyBudgetPocket={monthlyBudgetPocket}
                                            paymentSourceId={paymentSourceId}
                                            setPaymentSourceId={setPaymentSourceId}
                                            onSign={() => { setIsSignatureModalOpen(true); }}
                                            isSubmitting={isSubmittingPayment}
                                        />
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </main>

            {/* Modals */}
            <Modal isOpen={!!paymentSlipToView} onClose={() => setPaymentSlipToView(null)} title={`Slip Pembayaran: ${paymentSlipToView?.recordNumber}`} size="3xl">
                {paymentSlipToView && (
                    <>
                        <div className="printable-area">
                            {renderPaymentSlipBody(paymentSlipToView)}
                        </div>
                        <div className="mt-8 flex justify-end gap-3 non-printable">
                            <button 
                                onClick={() => setIsSignatureModalOpen(true)}
                                className="px-6 py-3 rounded-2xl bg-brand-surface border border-brand-border text-sm font-bold text-brand-text-light hover:bg-brand-bg transition-all"
                            >
                                <PencilIcon className="w-4 h-4 inline-block mr-2" />
                                Tanda Tangani
                            </button>
                            <button 
                                onClick={() => window.print()}
                                className="px-8 py-3 rounded-2xl bg-brand-accent text-white font-black text-sm uppercase tracking-widest shadow-lg shadow-brand-accent/25 hover:shadow-brand-accent/40 transition-all"
                            >
                                <PrinterIcon className="w-4 h-4 inline-block mr-2" />
                                Cetak Slip
                            </button>
                        </div>
                    </>
                )}
            </Modal>

            <Modal isOpen={isSignatureModalOpen} onClose={() => setIsSignatureModalOpen(false)} title="Bubuhkan Tanda Tangan">
                <SignaturePad onClose={() => setIsSignatureModalOpen(false)} onSave={handleSaveSignature} />
            </Modal>
        </div>
    );
};

export default TeamDetailPage;
