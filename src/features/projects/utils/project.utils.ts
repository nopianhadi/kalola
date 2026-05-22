import { Project, Profile, ProjectStatusConfig } from '@/features/projects/types/project.types';

export const ensureOnlineOrNotify = (showNotification: (message: string) => void): boolean => {
    if (!navigator.onLine) {
        showNotification('Harus online untuk melakukan perubahan');
        return false;
    }
    return true;
};

export const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(amount);
};

export const getSubStatusText = (project: Project): string => {
    if (project.activeSubStatuses && project.activeSubStatuses.length > 0) {
        return project.activeSubStatuses.join(', ');
    }
    return project.status;
};

export const getStatusColor = (status: string, config: ProjectStatusConfig[]): string => {
    const statusConfig = config.find(c => c.name === status);
    return statusConfig ? statusConfig.color : '#64748b'; // slate-500 default
};

export const getStatusClass = (status: string, config: ProjectStatusConfig[]) => {
    const color = getStatusColor(status, config);
    const colorMap: { [key: string]: string } = {
        '#10b981': 'status-badge status-success', // Selesai
        '#3b82f6': 'status-badge status-info', // Dikonfirmasi
        '#8b5cf6': 'status-badge status-purple', // Editing
        '#f97316': 'status-badge status-orange', // Produksi Fisik
        '#06b6d4': 'status-badge status-cyan', // Dikirim
        '#eab308': 'status-badge status-warning', // Tertunda
        '#6366f1': 'status-badge status-info', // Persiapan
        '#ef4444': 'status-badge status-danger', // Dibatalkan
        '#14b8a6': 'status-badge status-cyan', // Revisi
    };
    return colorMap[color] || 'status-badge status-gray';
};

/** Progress 0-100 from project.progress or derived from status order / defaultProgress in config */
export const getDisplayProgress = (project: Project, config: ProjectStatusConfig[]): number => {
    const raw = project.progress;
    if (typeof raw === 'number' && !Number.isNaN(raw) && raw >= 0 && raw <= 100) return Math.round(raw);
    const idx = config.findIndex(s => s.name === project.status);
    if (idx === -1) return 0;
    const statusConfig = config[idx];
    if (statusConfig.defaultProgress != null && statusConfig.defaultProgress !== undefined) {
        return Math.min(100, Math.max(0, statusConfig.defaultProgress));
    }
    return Math.round(((idx + 1) / config.length) * 100);
};

export const getProgressForStatus = (status: string, config: ProjectStatusConfig[]): number => {
    const s = config.find(c => c.name === status);
    if (!s) return 0;
    return s.defaultProgress ?? 0;
};

export interface BriefingData {
    text: string;
    whatsappLink: string;
    googleCalendarLink: string;
    icsDataUri: string;
}

export const generateBriefingData = (project: Project, profile: Profile): BriefingData => {
    const date = new Date(project.date).toLocaleDateString('id-ID', {
        day: 'numeric',
        month: 'long',
        year: 'numeric'
    });

    const teamList = project.team && project.team.length > 0
        ? project.team.map(t => `- ${t.name}`).join('\n')
        : 'Tim belum ditugaskan.';

    const parts = [];
    parts.push(`${date}`);
    parts.push(`*${project.projectName}*`);
    parts.push(`\n*Tim Bertugas:*\n${teamList}`);

    if (project.startTime || project.endTime || project.location) parts.push('');

    if (project.startTime) parts.push(`*Waktu Mulai:* ${project.startTime}`);
    if (project.endTime) parts.push(`*Waktu Selesai:* ${project.endTime}`);
    if (project.location) parts.push(`*Lokasi :* ${project.location}`);

    if (project.notes) {
        parts.push('');
        parts.push(`*Catatan:*\n${project.notes}`);
    }

    if (project.location || project.driveLink) parts.push('');

    if (project.location) {
        const mapsQuery = encodeURIComponent(project.location);
        const mapsLink = `https://www.google.com/maps/search/?api=1&query=${mapsQuery}`;
        parts.push(`*Link Lokasi:*\n${mapsLink}`);
    }

    if (project.driveLink) {
        if (project.location) parts.push('');
        parts.push(`*Link Moodboard:*\n${project.driveLink}`);
    }

    if (profile.briefingTemplate) {
        parts.push('\n---\n');
        parts.push(profile.briefingTemplate);
    }

    const text = parts.join('\n').replace(/\n\n\n+/g, '\n\n').trim();

    const toGoogleCalendarFormat = (d: Date) => d.toISOString().replace(/-|:|\.\d{3}/g, '');
    const timeRegex = /(\d{2}:\d{2})/;
    const startTimeMatch = project.startTime?.match(timeRegex);
    const endTimeMatch = project.endTime?.match(timeRegex);

    let googleCalendarLink = '';
    let icsDataUri = '';

    if (startTimeMatch) {
        const projectDateOnly = project.date.split('T')[0];
        const startDate = new Date(`${projectDateOnly}T${startTimeMatch[1]}:00`);
        const isInternalEvent = profile.eventTypes?.includes(project.projectType) || false;
        const durationHours = isInternalEvent ? 2 : 8;

        const endDate = endTimeMatch
            ? new Date(`${projectDateOnly}T${endTimeMatch[1]}:00`)
            : new Date(startDate.getTime() + durationHours * 60 * 60 * 1000);

        const googleDates = `${toGoogleCalendarFormat(startDate)}/${toGoogleCalendarFormat(endDate)}`;
        const calendarDescription = `Briefing untuk ${project.projectName}:\n\n${text}`;

        googleCalendarLink = `https://www.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(project.projectName)}&dates=${googleDates}&details=${encodeURIComponent(calendarDescription)}&location=${encodeURIComponent(project.location || '')}`;

        const icsDescription = calendarDescription.replace(/\n/g, '\\n');
        icsDataUri = [
            'BEGIN:VCALENDAR',
            'VERSION:2.0',
            'BEGIN:VEVENT',
            `UID:${project.id}@venapictures.com`,
            `DTSTAMP:${toGoogleCalendarFormat(new Date())}`,
            `DTSTART:${toGoogleCalendarFormat(startDate)}`,
            `DTEND:${toGoogleCalendarFormat(endDate)}`,
            `SUMMARY:${project.projectName}`,
            `DESCRIPTION:${icsDescription}`,
            `LOCATION:${project.location || ''}`,
            'END:VEVENT',
            'END:VCALENDAR'
        ].join('\n');
    }

    return {
        text,
        whatsappLink: `whatsapp://send?text=${encodeURIComponent(text)}`,
        googleCalendarLink,
        icsDataUri
    };
};

export const formatDateFull = (dateString: string) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('id-ID', {
        weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
    });
};

export interface StatModalItem {
    id: number | string;
    primary: string;
    secondary: string;
    value: string;
}

export interface StatModalData {
    title: string;
    items: StatModalItem[];
    total: number | null;
}

export const getStatModalData = (
    type: 'count' | 'deadline' | 'top_type' | 'status_dist' | null,
    projects: Project[],
    _profile: Profile
): StatModalData | null => {
    if (!type) return null;

    const activeProjectsList = projects.filter(p => p.status !== 'Selesai' && p.status !== 'Dibatalkan');
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const in7Days = new Date(today);
    in7Days.setDate(in7Days.getDate() + 7);

    switch (type) {
        case 'count':
            return {
                title: 'Daftar Acara Pernikahan Yang Sedang berjalan dan Baru',
                items: activeProjectsList.map(p => ({
                    id: p.id,
                    primary: p.projectName,
                    secondary: p.clientName,
                    value: p.status
                })),
                total: null
            };
        case 'deadline':
            const deadlineSoonList = activeProjectsList.filter(p => {
                const d = new Date(p.deadlineDate || p.date);
                d.setHours(0, 0, 0, 0);
                return d >= today && d <= in7Days;
            });
            return {
                title: 'Acara Pernikahan dengan Deadline Dekat',
                items: deadlineSoonList.map(p => ({
                    id: p.id,
                    primary: p.projectName,
                    secondary: p.clientName,
                    value: new Date(p.deadlineDate || p.date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })
                })),
                total: null
            };
        case 'status_dist':
            const statusCounts = activeProjectsList.reduce((acc, p) => {
                acc[p.status] = (acc[p.status] || 0) + 1;
                return acc;
            }, {} as Record<string, number>);
            const topStatus = Object.keys(statusCounts).length > 0
                ? Object.entries(statusCounts).sort(([, a], [, b]) => b - a)[0][0]
                : 'N/A';
            const statusProjects = activeProjectsList.filter(p => p.status === topStatus);
            return {
                title: `Acara Pernikahan dengan Status: ${topStatus}`,
                items: statusProjects.map(p => ({
                    id: p.id,
                    primary: p.projectName,
                    secondary: p.clientName,
                    value: p.status
                })),
                total: null
            };
        case 'top_type':
            const projectTypeCounts = projects.reduce((acc, p) => {
                acc[p.projectType] = (acc[p.projectType] || 0) + 1;
                return acc;
            }, {} as Record<string, number>);

            const topProjectType = Object.keys(projectTypeCounts).length > 0
                ? Object.entries(projectTypeCounts).sort(([, a], [, b]) => b - a)[0][0]
                : 'N/A';

            const topTypeProjects = projects.filter(p => p.projectType === topProjectType);

            return {
                title: `Daftar Acara Pernikahan Jenis: ${topProjectType}`,
                items: topTypeProjects.map(p => ({
                    id: p.id,
                    primary: p.projectName,
                    secondary: p.clientName,
                    value: p.projectType
                })),
                total: null
            };
        default:
            return null;
    }
};

