import { useState, useMemo } from 'react';
import { Project } from '@/features/projects/types/project.types';

interface UseProjectsFiltersProps {
    projects: Project[];
}

export const useProjectsFilters = ({ projects }: UseProjectsFiltersProps) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [dateFrom, setDateFrom] = useState('');
    const [dateTo, setDateTo] = useState('');
    const [viewMode, setViewMode] = useState<'list' | 'kanban'>('list');
    const [page, setPage] = useState(1);
    const [limit] = useState(10);

    const filteredProjects = useMemo(() => {
        return projects.filter(project => {
            const matchesSearch = 
                project.projectName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                project.clientName.toLowerCase().includes(searchTerm.toLowerCase());
            
            const matchesStatus = statusFilter === 'all' || project.status === statusFilter;
            
            const projectDate = new Date(project.date);
            const matchesDateFrom = !dateFrom || projectDate >= new Date(dateFrom);
            const matchesDateTo = !dateTo || projectDate <= new Date(dateTo);

            return matchesSearch && matchesStatus && matchesDateFrom && matchesDateTo;
        });
    }, [projects, searchTerm, statusFilter, dateFrom, dateTo]);


    const completedAndCancelledProjects = useMemo(() => {
        return filteredProjects.filter(p => p.status === 'Selesai' || p.status === 'Dibatalkan');
    }, [filteredProjects]);

    return {
        searchTerm,
        setSearchTerm,
        statusFilter,
        setStatusFilter,
        dateFrom,
        setDateFrom,
        dateTo,
        setDateTo,
        viewMode,
        setViewMode,
        completedAndCancelledProjects,
        page,
        setPage,
        limit
    };
};
