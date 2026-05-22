import { useCallback } from 'react';
import { Project, ProjectStatusConfig } from '@/types';
import { updateProject as updateProjectInDb, deleteProject as deleteProjectInDb } from '@/services/projects';

export const useProjects = (
    projects: Project[],
    setProjects: React.Dispatch<React.SetStateAction<Project[]>>,
    showNotification: (message: string) => void
) => {
    const handleStatusUpdate = useCallback(async (projectId: number | string, newStatus: string, config: ProjectStatusConfig[]) => {
        try {
            const project = projects.find(p => String(p.id) === String(projectId));
            if (!project) return;

            const statusConfig = config.find(s => s.name === newStatus);
            const nextProgress = statusConfig?.defaultProgress ?? 0;

            const updated = await updateProjectInDb(Number(projectId), {
                status: newStatus as any,
                progress: nextProgress as any,
                activeSubStatuses: [] as any
            });

            setProjects(prev => prev.map(p => String(p.id) === String(projectId) ? { ...p, status: updated.status, progress: updated.progress, activeSubStatuses: [] } : p));
            showNotification(`Status berhasil diperbarui ke ${newStatus}`);
        } catch (err) {
            showNotification('Gagal memperbarui status.');
        }
    }, [projects, setProjects, showNotification]);

    const handleDeleteProject = useCallback(async (projectId: number | string) => {
        if (!window.confirm('Hapus Acara Pernikahan ini?')) return;
        try {
            await deleteProjectInDb(Number(projectId));
            setProjects(prev => prev.filter(p => String(p.id) !== String(projectId)));
            showNotification('Acara Pernikahan berhasil dihapus.');
        } catch (err) {
            showNotification('Gagal menghapus Acara Pernikahan.');
        }
    }, [setProjects, showNotification]);

    return {
        handleStatusUpdate,
        handleDeleteProject
    };
};
