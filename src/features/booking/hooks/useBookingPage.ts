import { useState, useMemo } from 'react';
import { Client, Project, BookingStatus, ViewType, NavigationAction } from '@/types';
import { updateProject, deleteProject } from '@/services/projects';

export const useBookingPage = (props: {
    leads: any[];
    clients: Client[];
    projects: Project[];
    setProjects: React.Dispatch<React.SetStateAction<Project[]>>;
    handleNavigation: (view: ViewType, action?: NavigationAction) => void;
    showNotification: (message: string) => void;
}) => {
    const { leads, projects, setProjects, handleNavigation, showNotification } = props;

    // --- UI States ---
    const [dateFrom, setDateFrom] = useState('');
    const [dateTo, setDateTo] = useState('');
    const [viewingProofUrl, setViewingProofUrl] = useState<string | null>(null);
    const [whatsappTemplateModal, setWhatsappTemplateModal] = useState<{ project: Project; client: Client } | null>(null);
    const [activeStatModal, setActiveStatModal] = useState<string | null>(null);
    const [isInfoModalOpen, setIsInfoModalOpen] = useState(false);

    // --- Computed Data ---
    const allBookings = useMemo(() => {
        return projects
            .filter(p => p.bookingStatus)
            .map(project => {
                const lead = leads.find(l => l.notes?.includes(project.clientId)) || {
                    id: `lead-fallback-${project.id}`,
                    name: project.clientName,
                    date: project.date,
                };
                return { lead: lead as any, project };
            })
            .sort((a, b) => new Date(b.lead.date).getTime() - new Date(a.lead.date).getTime());
    }, [projects, leads]);

    const newBookings = useMemo(() => allBookings.filter(b => b.project.bookingStatus === BookingStatus.BARU), [allBookings]);
    const confirmedBookings = useMemo(() => allBookings.filter(b => b.project.bookingStatus === BookingStatus.TERKONFIRMASI), [allBookings]);

    const filteredNewBookings = useMemo(() => {
        return newBookings.filter(booking => {
            const from = dateFrom ? new Date(dateFrom) : null;
            const to = dateTo ? new Date(dateTo) : null;
            if (from) from.setHours(0, 0, 0, 0);
            if (to) to.setHours(23, 59, 59, 999);
            const bookingDate = new Date(booking.lead.date);
            const dateMatch = (!from || bookingDate >= from) && (!to || bookingDate <= to);
            return dateMatch;
        });
    }, [newBookings, dateFrom, dateTo]);

    const packageDonutData = useMemo(() => {
        const packageCounts = allBookings.reduce((acc, booking) => {
            const name = booking.project.packageName || 'Unknown';
            acc[name] = (acc[name] || 0) + 1;
            return acc;
        }, {} as Record<string, number>);

        const colors = ['#3b82f6', '#10b981', '#f97316', '#8b5cf6', '#ef4444'];
        return Object.entries(packageCounts)
            .map(([label, value], i) => ({
                label,
                value,
                color: colors[i % colors.length]
            }));
    }, [allBookings]);

    const mostPopularPackage = useMemo(() => {
        const counts = allBookings.reduce((acc, p) => { 
            acc[p.project.packageName] = (acc[p.project.packageName] || 0) + 1; 
            return acc; 
        }, {} as Record<string, number>);
        return Object.keys(counts).sort((a, b) => counts[b] - counts[a])[0] || 'N/A';
    }, [allBookings]);

    const statModalData = useMemo(() => {
        if (!activeStatModal) return { title: '', bookings: [] };

        switch (activeStatModal) {
            case 'total':
                return { title: 'Semua Booking', bookings: allBookings };
            case 'value':
                return { title: 'Semua Booking (berdasarkan Nilai)', bookings: allBookings };
            case 'popular':
                return { title: `Booking untuk Package: ${mostPopularPackage}`, bookings: allBookings.filter(b => b.project.packageName === mostPopularPackage) };
            case 'new':
                return { title: 'Booking Baru', bookings: newBookings };
            default:
                return { title: '', bookings: [] };
        }
    }, [activeStatModal, allBookings, newBookings, mostPopularPackage]);

    // --- Handlers ---
    const handleDeleteBooking = async (projectId: string, clientName: string) => {
        if (!window.confirm(`Apakah Anda yakin ingin menghapus booking untuk ${clientName}? Tindakan ini tidak dapat dibatalkan.`)) return;
        try {
            await deleteProject(Number(projectId));
            setProjects(prev => prev.filter(p => String(p.id) !== String(projectId)));
            showNotification('Booking berhasil dihapus.');
        } catch (err) {
            console.error('[Booking] Failed to delete booking:', err);
            showNotification('Gagal menghapus booking. Silakan coba lagi.');
        }
    };

    const handleEditBooking = (clientId: string) => {
        handleNavigation(ViewType.CLIENTS, { type: 'VIEW_CLIENT_DETAILS', id: clientId });
    };

    const handleStatusChange = async (projectId: string, newStatus: BookingStatus) => {
        const prevStatus = projects.find(p => String(p.id) === String(projectId))?.bookingStatus;
        // Optimistic update in local state
        setProjects(prev => prev.map(p => (String(p.id) === String(projectId) ? { ...p, bookingStatus: newStatus } : p)));
        try {
            await updateProject(Number(projectId), { bookingStatus: newStatus });
            showNotification(`Booking berhasil ${newStatus === BookingStatus.TERKONFIRMASI ? 'dikonfirmasi' : 'ditolak'}.`);
        } catch (err) {
            console.warn('[Booking] Failed to persist booking status:', err);
            // Revert optimistic update on failure
            setProjects(prev => prev.map(p => (String(p.id) === String(projectId) ? { ...p, bookingStatus: prevStatus } : p)));
            showNotification('Gagal menyimpan perubahan status booking. Silakan coba lagi.');
        }
    };

    return {
        // UI & State
        dateFrom, setDateFrom,
        dateTo, setDateTo,
        viewingProofUrl, setViewingProofUrl,
        whatsappTemplateModal, setWhatsappTemplateModal,
        activeStatModal, setActiveStatModal,
        isInfoModalOpen, setIsInfoModalOpen,
        
        // Data
        allBookings,
        newBookings,
        confirmedBookings,
        filteredNewBookings,
        packageDonutData,
        mostPopularPackage,
        statModalData,
        
        // Handlers
        handleDeleteBooking,
        handleEditBooking,
        handleStatusChange
    };
};
