import React from 'react';
import { 
    CalendarIcon, 
    MapPinIcon, 
    CheckCircleIcon, 
    ArrowRightIcon, 
    SendIcon, 
    UsersIcon,
    PackageIcon,
    ClockIcon,
    ExternalLinkIcon,
    HistoryIcon
} from 'lucide-react';
import { Project, Profile, Transaction } from '@/types';
import ProjectTimeline from './ProjectTimeline';
import { cleanProjectName } from '@/features/clients/utils/clients.utils';

interface ProjectDashboardCardProps {
    project: Project;
    profile: Profile;
    transactions: Transaction[];
    onStatusUpdate: (status: string) => Promise<void>;
    onSubStatusToggle: (name: string, checked: boolean) => Promise<void>;
    onSendWhatsApp: () => void;
}

const ProjectDashboardCard: React.FC<ProjectDashboardCardProps> = ({
    project,
    profile,
    transactions,
    onStatusUpdate,
    onSubStatusToggle,
    onSendWhatsApp
}) => {
    const [showHistory, setShowHistory] = React.useState(false);
    const statusConfig = profile.projectStatusConfig.find(s => s.name === project.status);
    const subStatuses = statusConfig?.subStatuses || [];
    
    // Group team by internal/vendor
    const internalTeam = (project.team || []).filter(m => (m as any).category !== 'Vendor');
    const vendors = (project.team || []).filter(m => (m as any).category === 'Vendor');

    const getStatusStyles = (statusName: string) => {
        const config = profile.projectStatusConfig.find(s => s.name === statusName);
        if (!config) return 'bg-brand-surface border-brand-border text-brand-text-secondary';
        
        // Simple color mapping based on common names or just use a default brand color
        const colorMap: Record<string, string> = {
            'Baru': 'border-blue-500/50 text-blue-400 bg-blue-500/5',
            'Selesai': 'border-green-500/50 text-green-400 bg-green-500/5',
            'Proses': 'border-orange-500/50 text-orange-400 bg-orange-500/5',
            'Batal': 'border-red-500/50 text-red-400 bg-red-500/5',
        };
        
        return colorMap[statusName] || 'border-brand-accent/50 text-brand-accent bg-brand-accent/5';
    };

    return (
        <div className="bg-brand-surface border border-brand-border rounded-3xl overflow-hidden shadow-sm hover:shadow-md transition-all group">
            {/* Header: Project Name & Date */}
            <div className="p-6 border-b border-brand-border/50 bg-gradient-to-r from-brand-surface to-brand-bg/30">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div>
                        <div className="flex items-center gap-2 mb-1">
                            <h4 className="text-lg font-black text-brand-text-light tracking-tight">{cleanProjectName(project.projectName)}</h4>
                            <span className={`px-2 py-0.5 rounded-lg text-[10px] font-bold uppercase tracking-widest border ${getStatusStyles(project.status)}`}>
                                {project.status}
                            </span>
                        </div>
                        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-brand-text-secondary font-medium">
                            <div className="flex items-center gap-1.5">
                                <CalendarIcon className="w-3.5 h-3.5 text-brand-accent" />
                                {new Date(project.date).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
                            </div>
                            <div className="flex items-center gap-1.5">
                                <MapPinIcon className="w-3.5 h-3.5 text-brand-accent" />
                                {project.location}
                            </div>
                            <div className="flex items-center gap-1.5">
                                <PackageIcon className="w-3.5 h-3.5 text-brand-accent" />
                                {project.packageName}
                            </div>
                        </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                        <select 
                            value={project.status}
                            onChange={(e) => onStatusUpdate(e.target.value)}
                            className="bg-brand-bg border border-brand-border rounded-xl px-3 py-2 text-xs font-bold text-brand-text-light focus:ring-2 focus:ring-brand-accent/50 outline-none transition-all"
                        >
                            {profile.projectStatusConfig.map((s, index) => (
                                <option key={s.id || s.name || index} value={s.name}>{s.name}</option>
                            ))}
                        </select>
                        <button 
                            onClick={onSendWhatsApp}
                            className="p-2 rounded-xl bg-green-500/10 text-green-500 border border-green-500/20 hover:bg-green-500 hover:text-white transition-all active:scale-95"
                            title="Kirim Update via WhatsApp"
                        >
                            <SendIcon className="w-4 h-4" />
                        </button>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12">
                {/* Left Side: Progress & Checklist */}
                <div className="lg:col-span-7 p-6 border-b lg:border-b-0 lg:border-r border-brand-border/50">
                    <div className="flex items-center justify-between mb-4">
                        <h5 className="text-xs font-black text-brand-text-secondary uppercase tracking-widest flex items-center gap-2">
                            <ClockIcon className="w-3.5 h-3.5" />
                            Progress & Sub-Tahapan
                        </h5>
                        <div className="text-[10px] font-bold text-brand-accent bg-brand-accent/10 px-2 py-0.5 rounded-full">
                            {project.activeSubStatuses?.length || 0} / {subStatuses.length} Selesai
                        </div>
                    </div>

                    {subStatuses.length > 0 ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            {subStatuses.map(sub => {
                                const isDone = project.activeSubStatuses?.includes(sub.name);
                                return (
                                    <label 
                                        key={sub.name}
                                        className={`flex items-center gap-3 p-3 rounded-2xl border transition-all cursor-pointer ${
                                            isDone 
                                            ? 'bg-brand-accent/5 border-brand-accent/30 text-brand-text-light' 
                                            : 'bg-brand-bg/50 border-brand-border text-brand-text-secondary hover:border-brand-accent/50'
                                        }`}
                                    >
                                        <div className={`w-5 h-5 rounded-lg border-2 flex items-center justify-center transition-all ${
                                            isDone ? 'bg-brand-accent border-brand-accent shadow-sm shadow-brand-accent/20' : 'border-brand-border bg-brand-surface'
                                        }`}>
                                            {isDone && <CheckCircleIcon className="w-3.5 h-3.5 text-white" />}
                                        </div>
                                        <input 
                                            type="checkbox" 
                                            className="hidden" 
                                            checked={isDone}
                                            onChange={(e) => onSubStatusToggle(sub.name, e.target.checked)}
                                        />
                                        <div className="min-w-0">
                                            <p className="text-xs font-bold truncate">{sub.name}</p>
                                        </div>
                                    </label>
                                );
                            })}
                        </div>
                    ) : (
                        <div className="py-8 text-center bg-brand-bg/30 rounded-2xl border border-dashed border-brand-border">
                            <p className="text-xs text-brand-text-secondary italic">Belum ada sub-tahapan untuk status ini.</p>
                        </div>
                    )}

                    {/* Timeline Toggle Section */}
                    <div className="mt-8 pt-6 border-t border-brand-border/50">
                        <button 
                            onClick={() => setShowHistory(!showHistory)}
                            className="flex items-center justify-between w-full group/btn"
                        >
                            <h5 className="text-xs font-black text-brand-text-secondary uppercase tracking-widest flex items-center gap-2 group-hover/btn:text-brand-accent transition-colors">
                                <HistoryIcon className="w-3.5 h-3.5" />
                                Aktivitas Terbaru
                            </h5>
                            <div className="text-[10px] font-bold text-brand-text-secondary group-hover/btn:text-brand-accent flex items-center gap-1 transition-colors">
                                {showHistory ? 'Sembunyikan' : 'Lihat Riwayat'}
                                <ArrowRightIcon className={`w-3 h-3 transition-transform ${showHistory ? 'rotate-90' : ''}`} />
                            </div>
                        </button>
                        
                        {showHistory && (
                            <div className="mt-6 animate-in fade-in slide-in-from-top-2 duration-300">
                                <ProjectTimeline project={project} transactions={transactions} />
                            </div>
                        )}
                    </div>

                    {/* Links Section */}
                    <div className="mt-8 pt-6 border-t border-brand-border/50">
                        <h5 className="text-[10px] font-black text-brand-text-secondary uppercase tracking-widest mb-4">File & Tautan Cepat</h5>
                        <div className="flex flex-wrap gap-3">
                            {project.driveLink && (
                                <a href={project.driveLink} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-500/5 border border-blue-500/20 text-blue-400 text-xs font-bold hover:bg-blue-500 hover:text-white transition-all">
                                    <ExternalLinkIcon className="w-3.5 h-3.5" />
                                    Link Moodboard
                                </a>
                            )}
                            {project.clientDriveLink && (
                                <a href={project.clientDriveLink} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 px-4 py-2 rounded-xl bg-purple-500/5 border border-purple-500/20 text-purple-400 text-xs font-bold hover:bg-purple-500 hover:text-white transition-all">
                                    <ExternalLinkIcon className="w-3.5 h-3.5" />
                                    File Pengantin
                                </a>
                            )}
                            {project.finalDriveLink && (
                                <a href={project.finalDriveLink} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 px-4 py-2 rounded-xl bg-green-500/5 border border-green-500/20 text-green-400 text-xs font-bold hover:bg-green-500 hover:text-white transition-all">
                                    <ExternalLinkIcon className="w-3.5 h-3.5" />
                                    Link File Jadi
                                </a>
                            )}
                        </div>
                    </div>
                </div>

                {/* Right Side: Team Overview */}
                <div className="lg:col-span-5 p-6 bg-brand-bg/20">
                    <h5 className="text-xs font-black text-brand-text-secondary uppercase tracking-widest flex items-center gap-2 mb-6">
                        <UsersIcon className="w-3.5 h-3.5" />
                        Tim & Penugasan
                    </h5>

                    <div className="space-y-6">
                        {/* Internal Team */}
                        <div>
                            <p className="text-[10px] font-bold text-blue-500/70 uppercase tracking-tight mb-3">Tim Internal</p>
                            {internalTeam.length > 0 ? (
                                <div className="space-y-2">
                                    {internalTeam.map((member, idx) => (
                                        <div key={idx} className="flex items-center gap-3 p-2.5 rounded-2xl bg-white/5 border border-brand-border/50">
                                            <div className="w-8 h-8 rounded-full bg-blue-500/10 flex items-center justify-center text-[10px] font-black text-blue-500 border border-blue-500/20">
                                                {member.name.substring(0, 2).toUpperCase()}
                                            </div>
                                            <div className="min-w-0 flex-1">
                                                <p className="text-xs font-black text-brand-text-primary truncate">{member.name}</p>
                                                <p className="text-[10px] font-bold text-brand-text-secondary uppercase">{member.role}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <p className="text-[11px] text-brand-text-secondary italic">Belum ada tim internal.</p>
                            )}
                        </div>

                        {/* Vendors */}
                        <div>
                            <p className="text-[10px] font-bold text-purple-500/70 uppercase tracking-tight mb-3">Vendor Luar</p>
                            {vendors.length > 0 ? (
                                <div className="space-y-2">
                                    {vendors.map((member, idx) => (
                                        <div key={idx} className="flex items-center gap-3 p-2.5 rounded-2xl bg-white/5 border border-brand-border/50">
                                            <div className="w-8 h-8 rounded-full bg-purple-500/10 flex items-center justify-center text-[10px] font-black text-purple-500 border border-purple-500/20">
                                                {member.name.substring(0, 2).toUpperCase()}
                                            </div>
                                            <div className="min-w-0 flex-1">
                                                <p className="text-xs font-black text-brand-text-primary truncate">{member.name}</p>
                                                <p className="text-[10px] font-bold text-brand-text-secondary uppercase">{member.role}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <p className="text-[11px] text-brand-text-secondary italic">Belum ada vendor.</p>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ProjectDashboardCard;
