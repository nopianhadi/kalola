import React from 'react';
import { Contract } from '@/types';
import { CheckSquareIcon, ClockIcon } from '@/constants';

export const formatCurrency = (amount: number, options?: {
    showDecimals?: boolean;
    compact?: boolean;
    currencySymbol?: boolean;
    thousandsSeparator?: boolean;
}) => {
    const { showDecimals = true, compact = false, currencySymbol = true, thousandsSeparator = true } = options || {};

    if (!isFinite(amount)) {
        return currencySymbol ? 'Rp 0' : '0';
    }

    if (!thousandsSeparator) {
        const cleanAmount = Math.abs(amount);
        const numberPart = cleanAmount.toLocaleString('id-ID', {
            minimumFractionDigits: showDecimals ? 2 : 0,
            maximumFractionDigits: showDecimals ? 2 : 0
        });
        return currencySymbol ? `Rp ${numberPart}` : numberPart;
    }

    return new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        minimumFractionDigits: showDecimals ? 2 : 0,
        maximumFractionDigits: showDecimals ? 2 : 0,
        notation: compact ? 'compact' : 'standard'
    }).format(amount);
};

export const formatDocumentCurrency = (amount: number) => {
    return formatCurrency(amount, { showDecimals: false });
};

export const formatDisplayCurrency = (amount: number) => {
    return formatCurrency(amount, { showDecimals: false });
};

export const formatDate = (dateString: string) => {
    if (!dateString) return '[Tanggal belum diisi]';
    return new Date(dateString).toLocaleDateString('id-ID', {
        year: 'numeric', month: 'long', day: 'numeric'
    });
};

export const getSignatureStatus = (contract: Contract) => {
    if (contract.vendorSignature && contract.clientSignature) {
        return { text: 'Lengkap', color: 'bg-green-500/20 text-green-400', icon: React.createElement(CheckSquareIcon, { className: "w-4 h-4 text-green-500" }) };
    }
    if (contract.vendorSignature && !contract.clientSignature) {
        return { text: 'Menunggu TTD Klien', color: 'bg-blue-500/20 text-blue-400', icon: React.createElement(ClockIcon, { className: "w-4 h-4 text-blue-500" }) };
    }
    return { text: 'Menunggu TTD Anda', color: 'bg-yellow-500/20 text-yellow-400', icon: React.createElement(ClockIcon, { className: "w-4 h-4 text-yellow-500" }) };
};
