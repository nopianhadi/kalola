import React from 'react';
import { 
    ProjectStatusConfig, 
    ProjectKanbanViewProps 
} from '@/features/projects/types/project.types';
import { 
    getStatusColor, 
    getSubStatusText, 
    getDisplayProgress 
} from '@/features/projects/utils/project.utils';

const ProjectKanbanView: React.FC<ProjectKanbanViewProps> = ({ 
    projects, 
    handleOpenDetailModal, 
    draggedProjectId, 
    handleDragStart, 
    handleDragOver, 
    handleDrop, 
    config 
}) => {

    const ProgressBar: React.FC<{ progress: number, status: string, config: ProjectStatusConfig[] }> = ({ progress, status, config }) => (
        <div className="w-full bg-gray-700 rounded-full h-1.5">
            <div className="h-1.5 rounded-full transition-all duration-300" style={{ width: `${progress}%`, backgroundColor: getStatusColor(status, config) }}></div>
        </div>
    );

    return (
        <div className="flex gap-4 md:gap-6 overflow-x-auto pb-4 overscroll-x-contain scroll-smooth projects-kanban-scroll hide-scrollbar" style={{ WebkitOverflowScrolling: 'touch', touchAction: 'pan-x' }}>
            {config
                .filter(statusConfig => statusConfig.name !== 'Dibatalkan')
                .map(statusConfig => {
                    const status = statusConfig.name;
                    return (
                        <div
                            key={status}
                            className="w-72 min-w-[280px] md:w-80 flex-shrink-0 bg-brand-bg rounded-2xl border border-brand-border snap-start"
                            onDragOver={handleDragOver}
                            onDrop={(e) => handleDrop(e, status)}
                        >
                            <div className="p-4 font-semibold text-brand-text-light border-b-2 flex justify-between items-center sticky top-0 bg-brand-bg/80 backdrop-blur-sm rounded-t-2xl z-10" style={{ borderBottomColor: getStatusColor(status, config) }}>
                                <span>{status}</span>
                                <span className="text-sm font-normal bg-brand-surface text-brand-text-secondary px-2.5 py-1 rounded-full">{projects.filter(p => p.status === status).length}</span>
                            </div>
                            <div className="p-3 space-y-3 min-h-[200px] h-[calc(100vh-380px)] sm:h-[calc(100vh-420px)] overflow-y-auto overscroll-contain" style={{ WebkitOverflowScrolling: 'touch' }}>
                                {projects
                                    .filter(p => p.status === status)
                                    .map(p => (
                                        <div
                                            key={p.id}
                                            draggable
                                            onDragStart={(e) => handleDragStart(e, p.id)}
                                            onClick={() => handleOpenDetailModal(p)}
                                            className={`p-4 bg-brand-surface rounded-xl cursor-grab border-l-4 shadow-lg ${String(draggedProjectId) === String(p.id) ? 'opacity-50 ring-2 ring-brand-accent' : 'opacity-100'}`}
                                            style={{ borderLeftColor: getStatusColor(p.status, config) }}
                                        >
                                            <p className="font-semibold text-sm text-brand-text-light">{p.projectName}</p>
                                            <p className="text-xs text-brand-text-secondary mt-1">{p.clientName}</p>
                                            <p className="text-xs font-bold text-brand-text-primary mt-1">
                                                {getSubStatusText(p)}
                                            </p>
                                            <ProgressBar progress={getDisplayProgress(p, config)} status={p.status} config={config} />
                                            <div className="flex justify-between items-center mt-3 text-xs">
                                                <span className="text-brand-text-secondary">{new Date(p.date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}</span>
                                            </div>
                                        </div>
                                    ))
                                }
                            </div>
                        </div>
                    )
                })
            }
        </div>
    );
};

export default ProjectKanbanView;
