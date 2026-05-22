import { FinancialPocket, Transaction, TransactionType, Project, Card, CardType } from '@/types';

export const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(amount);
};

export const formatCurrencyCSV = (amount: number) => {
    const numberPart = new Intl.NumberFormat('id-ID', { minimumFractionDigits: 0 }).format(amount);
    return `Rp ${numberPart}`;
};

export const getMonthDateRange = (date: Date) => {
    const startOfMonth = new Date(date.getFullYear(), date.getMonth(), 1);
    const endOfMonth = new Date(date.getFullYear(), date.getMonth() + 1, 0);
    return {
        dateFrom: startOfMonth.toISOString().split('T')[0],
        dateTo: endOfMonth.toISOString().split('T')[0]
    };
};

export const downloadCSV = (
    headers: string[],
    data: (string | number | undefined)[][],
    filename: string,
    prefaceRows: (string | number | undefined)[][] = []
) => {
    const DELIM = ';';
    const normalizeField = (field: string | number | undefined) => {
        const str = String(field ?? '');
        if (str.includes(DELIM) || str.includes('"') || str.includes('\n')) {
            return `"${str.replace(/"/g, '""')}"`;
        }
        return str;
    };
    const normalizeRow = (row: (string | number | undefined)[]) => row.map(normalizeField).join(DELIM);

    const csvRows = [
        `sep=${DELIM}`,
        ...prefaceRows.map(normalizeRow),
        headers.map(normalizeField).join(DELIM),
        ...data.map(normalizeRow)
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

export const getTransactionSubDescription = (
    transaction: Transaction,
    projects: Project[],
    cards: Card[],
    pockets: FinancialPocket[]
): string => {
    const isInternal = transaction.category === 'Transfer Internal' || transaction.category === 'Penutupan Anggaran' || transaction.method === 'Sistem';

    const project = transaction.projectId ? projects.find(p => String(p.id) === String(transaction.projectId)) : null;
    const projectText = project ? project.projectName : null;

    if (isInternal) {
        return projectText ? `Proyek: ${projectText}` : '';
    }

    let sourceDestText = '';
    if (transaction.type === TransactionType.INCOME) {
        const card = cards.find(c => String(c.id) === String(transaction.cardId));
        if (card) {
            sourceDestText = card.cardType === CardType.TUNAI
                ? 'Masuk ke Tunai'
                : `Masuk ke ${card.bankName} ${card.lastFourDigits !== 'CASH' ? `**** ${card.lastFourDigits}` : ''}`;
        }
    } else {
        if (transaction.pocketId) {
            const pocket = pockets.find(p => String(p.id) === String(transaction.pocketId));
            if (pocket) {
                sourceDestText = `Dibayar dari kantong "${pocket.name}"`;
            }
        } else if (transaction.cardId) {
            const card = cards.find(c => String(c.id) === String(transaction.cardId));
            if (card) {
                sourceDestText = card.cardType === CardType.TUNAI
                    ? 'Dibayar dari Tunai'
                    : `Dibayar dari ${card.bankName} ${card.lastFourDigits !== 'CASH' ? `**** ${card.lastFourDigits}` : ''}`;
            }
        } else {
            sourceDestText = `Metode: ${transaction.method}`;
        }
    }

    if (sourceDestText && projectText) {
        return `${sourceDestText} • ${projectText}`;
    }

    return sourceDestText || projectText || '';
};

export const PRODUCTION_COST_CATEGORIES = ["Gaji Tim / Vendor", "Transportasi", "Konsumsi", "Sewa Tempat", "Sewa Alat", "Produksi Fisik"];
