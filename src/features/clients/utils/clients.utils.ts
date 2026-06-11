import { PaymentStatus } from '@/types';

export const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
    }).format(amount);
};

export const normalizeTerminology = (text: string): string => {
    if (!text) return text;
    return text
        .replace(/Proyek/g, 'Acara Pernikahan')
        .replace(/DP Proyek/g, 'DP Acara Pernikahan')
        .replace(/Pelunasan Proyek/g, 'Pelunasan Acara Pernikahan')
        .replace(/Pembayaran Proyek/g, 'Pembayaran Acara Pernikahan');
};

export const cleanProjectName = (name: string): string => {
    if (!name) return name;
    return name
        .replace(/^Acara Pernikahan\s+/i, '')
        .replace(/\s*\(.*?\)\s*$/, '')
        .trim();
};

export const getPaymentStatusClass = (status: PaymentStatus | null) => {
    if (!status) return 'bg-slate-600 text-white border border-slate-600';
    switch (status) {
        case PaymentStatus.LUNAS: return 'bg-green-600 text-white border border-green-600';
        case PaymentStatus.DP_TERBAYAR: return 'bg-blue-600 text-white border border-blue-600';
        case PaymentStatus.BELUM_BAYAR: return 'bg-amber-500 text-white border border-amber-500';
        default: return 'bg-slate-600 text-white border border-slate-600';
    }
};

export const ensureOnlineOrNotify = (showNotification: (message: string) => void): boolean => {
    if (!navigator.onLine) {
        showNotification('Harus online untuk melakukan perubahan');
        return false;
    }
    return true;
};

export const downloadCSV = (headers: string[], data: (string | number)[][], filename: string) => {
    const csvRows = [
        headers.join(','),
        ...data.map(row =>
            row.map(field => {
                const str = String(field);
                if (str.includes(',') || str.includes('"') || str.includes('\n')) {
                    return `"${str.replace(/"/g, '""')}"`;
                }
                return str;
            }).join(',')
        )
    ];

    const csvString = csvRows.join('\n');
    const BOM = '\uFEFF';
    const blob = new Blob([BOM + csvString], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
};

export const cleanPhoneNumber = (phone: string): string => {
    if (!phone) return '';
    return phone.replace(/[^0-9]/g, '');
};
