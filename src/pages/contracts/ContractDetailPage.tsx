import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
    FileTextIcon, 
    ChevronLeftIcon,
    CalendarIcon,
    DownloadIcon,
    PrinterIcon,
    QrCodeIcon,
    CheckSquareIcon,
    UserIcon,
    BriefcaseIcon,
    Share2Icon
} from '@/constants';

import { useContract, useUpdateContract } from '@/features/contracts/api/useContractQueries';
import { useProjects } from '@/features/projects/api/useProjects';
import { useClients } from '@/features/clients/api/useClients';
import { useProfile } from '@/features/settings/api/useProfileQueries';
import { useApp } from '@/app/AppContext';
import ContractDocument from '@/features/contracts/components/ContractDocument';
import { handleDownloadPDF, handleDownloadPDFWithoutTTD } from '@/features/contracts/utils/pdf.utils';
import Modal from '@/shared/ui/Modal';
import SignaturePad from '@/shared/ui/SignaturePad';
import { UniversalShareModal } from '@/shared/components/UniversalShareModal';


const ContractDetailPage: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();

    const { showNotification } = useApp();

    const [isSignatureModalOpen, setIsSignatureModalOpen] = useState(false);
    const [isShareModalOpen, setIsShareModalOpen] = useState(false);

    const { data: contract, isLoading: isContractLoading } = useContract(id || '');
    const { data: projects = [] } = useProjects();
    const { data: clients = [] } = useClients();
    const { data: profile } = useProfile();
    const updateContractMutation = useUpdateContract();

    if (isContractLoading || !profile) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-brand-bg">
                <div className="flex flex-col items-center gap-4">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-accent"></div>
                    <p className="text-brand-text-secondary text-sm font-medium animate-pulse">Memuat Detail Kontrak...</p>
                </div>
            </div>
        );
    }

    if (!contract) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center bg-brand-bg p-4 text-center">
                <div className="w-24 h-24 bg-brand-surface rounded-3xl flex items-center justify-center mb-6 border border-brand-border">
                    <FileTextIcon className="w-10 h-10 text-brand-text-secondary opacity-20" />
                </div>
                <h2 className="text-xl font-black text-brand-text-light mb-2">Kontrak Tidak Ditemukan</h2>
                <p className="text-brand-text-secondary mb-8 max-w-xs">Maaf, kontrak yang Anda cari tidak tersedia atau telah dihapus.</p>
                <button 
                    onClick={() => navigate('/contract')}
                    className="px-6 py-3 bg-brand-accent text-white font-bold rounded-2xl hover:shadow-lg hover:shadow-brand-accent/25 transition-all active:scale-95"
                >
                    Kembali ke Daftar
                </button>
            </div>
        );
    }

    const project = projects.find(p => String(p.id) === String(contract.projectId));
    const client = clients.find(c => String(c.id) === String(contract.clientId));
    const contractUrl = `https://vandel-pro.web.app/#/public/contract/${contract.id}`;


    const handleSaveSignature = async (signatureDataUrl: string) => {
        try {
            await updateContractMutation.mutateAsync({ 
                id: contract.id, 
                patch: { vendorSignature: signatureDataUrl } 
            });
            setIsSignatureModalOpen(false);
            showNotification("Tanda tangan vendor berhasil disimpan.");
        } catch (e) {
            showNotification("Gagal menyimpan tanda tangan.");
        }
    };

    return (
        <div className="min-h-screen bg-brand-bg relative overflow-x-hidden">
            {/* Background Decorative Elements */}
            <div className="absolute top-0 left-0 w-full h-[400px] bg-gradient-to-b from-brand-accent/10 to-transparent pointer-events-none"></div>
            <div className="absolute top-[-10%] right-[-5%] w-[40%] h-[40%] bg-brand-accent/5 rounded-full blur-[120px] pointer-events-none"></div>

            {/* Header */}
            <header className="sticky top-0 z-40 bg-brand-bg/60 backdrop-blur-xl border-b border-brand-border/50">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 h-20 flex items-center justify-between">
                    <div className="flex items-center gap-6">
                        <button 
                            onClick={() => navigate('/contract')}
                            className="group flex items-center gap-2 p-2 rounded-2xl hover:bg-brand-surface transition-all active:scale-95 border border-transparent hover:border-brand-border"
                        >
                            <div className="p-2 rounded-xl bg-brand-surface border border-brand-border group-hover:bg-brand-accent group-hover:text-white transition-all">
                                <ChevronLeftIcon className="w-5 h-5" />
                            </div>
                            <span className="text-sm font-bold text-brand-text-secondary group-hover:text-brand-text-light hidden sm:block transition-colors">Kembali ke Daftar</span>
                        </button>
                        
                        <div className="h-8 w-[1px] bg-brand-border hidden sm:block"></div>

                        <div className="flex items-center gap-4">
                            <div className="hidden sm:flex w-12 h-12 rounded-2xl bg-gradient-to-br from-brand-accent to-blue-600 items-center justify-center shadow-xl shadow-brand-accent/20">
                                <FileTextIcon className="w-6 h-6 text-white" />
                            </div>
                            <div>
                                <h1 className="text-xl font-black text-brand-text-light tracking-tight truncate max-w-[200px] md:max-w-md">Detail Kontrak Digital</h1>
                                <div className="flex items-center gap-2 mt-0.5">
                                    <span className={`text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full ${contract.clientSignature ? 'bg-green-100 text-green-600 border-green-200' : 'bg-yellow-100 text-yellow-600 border-yellow-200'} border`}>
                                        {contract.clientSignature ? 'Selesai' : 'Menunggu Klien'}
                                    </span>
                                    <span className="text-brand-text-secondary text-[10px] font-bold">•</span>
                                    <p className="text-[10px] text-brand-text-secondary font-bold uppercase tracking-widest truncate max-w-[150px]">{project?.projectName || 'No Project'}</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </header>

            <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8 md:py-12 relative z-10">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                    {/* Sidebar */}
                    <aside className="lg:col-span-4 space-y-6">
                        {/* Summary Card */}
                        <div className="bg-brand-surface border border-brand-border rounded-[2.5rem] p-8 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group">
                            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                                <FileTextIcon className="w-24 h-24 text-brand-accent -mr-8 -mt-8 rotate-12" />
                            </div>
                            
                            <div className="relative z-10">
                                <h2 className="text-2xl font-black text-brand-text-light leading-tight mb-2">Ringkasan Kontrak</h2>
                                <p className="text-brand-text-secondary font-semibold flex items-center gap-2 mb-8">
                                    <CalendarIcon className="w-4 h-4 text-brand-accent" />
                                    Dibuat pada {new Date(contract.createdAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
                                </p>

                                <div className="space-y-6">
                                    <div className="flex items-center gap-4 p-4 rounded-2xl bg-brand-bg border border-brand-border/50">
                                        <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center text-blue-600">
                                            <UserIcon className="w-5 h-5" />
                                        </div>
                                        <div>
                                            <p className="text-[10px] text-brand-text-secondary font-black uppercase tracking-widest">Klien</p>
                                            <p className="text-sm font-bold text-brand-text-light">{client?.name || 'Unknown Client'}</p>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-4 p-4 rounded-2xl bg-brand-bg border border-brand-border/50">
                                        <div className="w-10 h-10 rounded-xl bg-purple-100 flex items-center justify-center text-purple-600">
                                            <BriefcaseIcon className="w-5 h-5" />
                                        </div>
                                        <div>
                                            <p className="text-[10px] text-brand-text-secondary font-black uppercase tracking-widest">Proyek</p>
                                            <p className="text-sm font-bold text-brand-text-light">{project?.projectName || 'Unknown Project'}</p>
                                        </div>
                                    </div>
                                </div>

                                <div className="mt-8 pt-8 border-t border-brand-border/30">
                                    <div className="grid grid-cols-2 gap-4 mb-6">
                                        <div className="flex flex-col gap-2">
                                            <span className="text-[10px] text-slate-400 uppercase font-black tracking-widest">Vendor</span>
                                            <div className={`flex items-center gap-2 text-xs font-bold ${contract.vendorSignature || profile.signatureBase64 ? 'text-green-600' : 'text-yellow-600'}`}>
                                                <div className={`w-2 h-2 rounded-full ${contract.vendorSignature || profile.signatureBase64 ? 'bg-green-500' : 'bg-yellow-500'}`}></div>
                                                {contract.vendorSignature || profile.signatureBase64 ? 'Sudah TTD' : 'Belum TTD'}
                                            </div>
                                        </div>
                                        <div className="flex flex-col gap-2">
                                            <span className="text-[10px] text-slate-400 uppercase font-black tracking-widest">Klien</span>
                                            <div className={`flex items-center gap-2 text-xs font-bold ${contract.clientSignature ? 'text-green-600' : 'text-yellow-600'}`}>
                                                <div className={`w-2 h-2 rounded-full ${contract.clientSignature ? 'bg-green-500' : 'bg-yellow-500'}`}></div>
                                                {contract.clientSignature ? 'Sudah TTD' : 'Belum TTD'}
                                            </div>
                                        </div>
                                    </div>
                                    
                                    <div className="flex flex-col gap-3">
                                        {!contract.vendorSignature && (
                                            <button 
                                                onClick={() => setIsSignatureModalOpen(true)}
                                                className="w-full flex items-center justify-center gap-2 px-5 py-3 rounded-2xl bg-brand-accent text-white font-bold hover:shadow-lg hover:shadow-brand-accent/25 transition-all active:scale-95"
                                            >
                                                <CheckSquareIcon className="w-4 h-4" />
                                                Tanda Tangani
                                            </button>
                                        )}
                                        <div className="flex gap-3">
                                            <button 
                                                onClick={() => setIsShareModalOpen(true)}
                                                className="flex-1 flex items-center justify-center gap-2 px-5 py-3 rounded-2xl bg-green-50 border border-green-100 text-sm font-bold text-green-600 hover:bg-green-100 transition-all active:scale-95"
                                            >
                                                <Share2Icon className="w-4 h-4" />
                                                Kirim WA
                                            </button>
                                            <button 
                                                onClick={() => {
                                                    navigator.clipboard.writeText(contractUrl);
                                                    showNotification('Link kontrak disalin!');
                                                }}
                                                className="flex-1 flex items-center justify-center gap-2 px-5 py-3 rounded-2xl bg-blue-50 border border-blue-100 text-sm font-bold text-blue-600 hover:bg-blue-100 transition-all active:scale-95"
                                            >
                                                <QrCodeIcon className="w-4 h-4" />
                                                Salin Link
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Actions Card */}
                        <div className="bg-brand-surface border border-brand-border rounded-[2.5rem] p-8 shadow-sm">
                            <h3 className="text-lg font-black text-brand-text-light mb-6">Unduh & Cetak</h3>
                            <div className="space-y-3">
                                <button 
                                    onClick={() => handleDownloadPDF(contract)}
                                    className="w-full flex items-center justify-between p-4 rounded-2xl bg-brand-bg border border-brand-border hover:border-brand-accent/30 transition-all group"
                                >
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600">
                                            <DownloadIcon className="w-5 h-5" />
                                        </div>
                                        <span className="text-sm font-bold text-brand-text-light">Unduh Versi PDF</span>
                                    </div>
                                    <ChevronLeftIcon className="w-4 h-4 text-brand-text-secondary rotate-180 group-hover:text-brand-accent transition-colors" />
                                </button>

                                <button 
                                    onClick={() => handleDownloadPDFWithoutTTD(contract, projects, profile)}
                                    className="w-full flex items-center justify-between p-4 rounded-2xl bg-brand-bg border border-brand-border hover:border-brand-accent/30 transition-all group"
                                >
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-xl bg-orange-50 flex items-center justify-center text-orange-600">
                                            <PrinterIcon className="w-5 h-5" />
                                        </div>
                                        <span className="text-sm font-bold text-brand-text-light">Cetak Draft (Polos)</span>
                                    </div>
                                    <ChevronLeftIcon className="w-4 h-4 text-brand-text-secondary rotate-180 group-hover:text-brand-accent transition-colors" />
                                </button>
                            </div>
                        </div>
                    </aside>

                    {/* Main Content */}
                    <div className="lg:col-span-8 space-y-8">
                        <div className="bg-brand-surface border border-brand-border rounded-[2.5rem] shadow-sm overflow-hidden flex flex-col min-h-[800px]">
                            <div className="h-1.5 w-full bg-gradient-to-r from-brand-accent/20 via-brand-accent to-blue-500/20"></div>
                            
                            <div className="p-4 md:p-10 flex-1 bg-white">
                                <div className="mb-8 flex items-center justify-between non-printable">
                                    <div className="flex items-center gap-3">
                                        <FileTextIcon className="w-6 h-6 text-brand-accent" />
                                        <h3 className="text-xl font-black text-brand-text-light tracking-tight">Dokumen Kontrak</h3>
                                    </div>
                                </div>

                                <div className="border border-slate-100 rounded-3xl overflow-hidden shadow-inner bg-slate-50/30 p-4 md:p-8">
                                    {project && (
                                        <ContractDocument 
                                            id="contract-content-to-print"
                                            contract={contract} 
                                            project={project} 
                                            profile={profile} 
                                        />
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </main>

            {/* Signature Modal */}
            <Modal 
                isOpen={isSignatureModalOpen} 
                onClose={() => setIsSignatureModalOpen(false)} 
                title="Tanda Tangan Digital (Vendor)"
                size="lg"
            >
                <SignaturePad onSave={handleSaveSignature} onClose={() => setIsSignatureModalOpen(false)} />
            </Modal>

            {/* WhatsApp Share Modal */}
            <UniversalShareModal 
                isOpen={isShareModalOpen}
                onClose={() => setIsShareModalOpen(false)}
                type="contractShareTemplate"
                profile={profile}
                variables={{
                    '{clientName}': client?.name || '',
                    '{companyName}': profile.companyName,
                    '{contractLink}': contractUrl
                }}
                phone={client?.whatsapp || client?.phone}
                title="Kirim Kontrak Digital"
                showNotification={showNotification}
            />
        </div>
    );
};

export default ContractDetailPage;
