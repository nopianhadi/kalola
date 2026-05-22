import React from 'react';
import { 
    ClockIcon, 
    CheckCircle2Icon, 
    CreditCardIcon, 
    AlertCircleIcon
} from 'lucide-react';
import { Project, Transaction } from '@/types';

interface TimelineEvent {
    id: string;
    type: 'status' | 'payment' | 'contract' | 'team';
    title: string;
    description: string;
    timestamp: string;
    icon: React.ElementType;
    color: string;
}

interface ProjectTimelineProps {
    project: Project;
    transactions: Transaction[];
}

const ProjectTimeline: React.FC<ProjectTimelineProps> = ({ project, transactions }) => {
    const events: TimelineEvent[] = React.useMemo(() => {
        const allEvents: TimelineEvent[] = [];

        // 1. Status History Events
        if (project.statusHistory) {
            project.statusHistory.forEach((h, idx) => {
                allEvents.push({
                    id: `status-${idx}-${h.timestamp}`,
                    type: 'status',
                    title: `Status: ${h.value}`,
                    description: `Perubahan status proyek menjadi ${h.value}`,
                    timestamp: h.timestamp,
                    icon: CheckCircle2Icon,
                    color: 'text-blue-500 bg-blue-500/10'
                });
            });
        }

        // 2. Payment Events
        transactions.filter(t => String(t.projectId) === String(project.id)).forEach(t => {
            allEvents.push({
                id: `payment-${t.id}`,
                type: 'payment',
                title: `Pembayaran: ${t.description}`,
                description: `Transaksi sebesar Rp ${t.amount.toLocaleString('id-ID')}`,
                timestamp: t.date,
                icon: CreditCardIcon,
                color: 'text-green-500 bg-green-500/10'
            });
        });

        // 3. Project Creation
        allEvents.push({
            id: `created-${project.id}`,
            type: 'status',
            title: 'Proyek Dibuat',
            description: `Proyek "${project.projectName}" resmi didaftarkan`,
            timestamp: project.date, // Falling back to project date as creation date for now
            icon: ClockIcon,
            color: 'text-brand-accent bg-brand-accent/10'
        });

        // Sort by timestamp descending
        return allEvents.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    }, [project, transactions]);

    if (events.length === 0) {
        return (
            <div className="py-10 text-center">
                <AlertCircleIcon className="w-8 h-8 text-brand-text-secondary mx-auto mb-3 opacity-20" />
                <p className="text-xs text-brand-text-secondary font-medium">Belum ada aktivitas tercatat.</p>
            </div>
        );
    }

    return (
        <div className="relative pl-4 space-y-6 before:absolute before:left-0 before:top-2 before:bottom-2 before:w-0.5 before:bg-brand-border/50">
            {events.map((event, idx) => (
                <div key={event.id} className="relative group animate-in fade-in slide-in-from-left-2 duration-300" style={{ animationDelay: `${idx * 100}ms` }}>
                    {/* Dot */}
                    <div className={`absolute -left-[21px] top-1 w-3 h-3 rounded-full border-2 border-brand-surface ring-4 ring-brand-bg transition-all group-hover:scale-125 ${event.color.split(' ')[1].replace('/10', '')} ${event.color.split(' ')[0]}`}></div>
                    
                    <div className="flex items-start gap-4 p-3 rounded-2xl border border-brand-border/30 bg-brand-bg/50 group-hover:border-brand-accent/30 group-hover:bg-brand-surface transition-all">
                        <div className={`p-2 rounded-xl ${event.color}`}>
                            <event.icon className="w-4 h-4" />
                        </div>
                        <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between gap-2 mb-0.5">
                                <h6 className="text-[11px] font-black text-brand-text-light truncate uppercase tracking-tight">{event.title}</h6>
                                <span className="text-[9px] font-bold text-brand-text-secondary whitespace-nowrap">
                                    {new Date(event.timestamp).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}
                                </span>
                            </div>
                            <p className="text-[10px] text-brand-text-secondary font-medium leading-relaxed">
                                {event.description}
                            </p>
                        </div>
                    </div>
                </div>
            ))}
        </div>
    );
};

export default ProjectTimeline;
