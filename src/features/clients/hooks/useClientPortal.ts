import { useState, useCallback } from 'react';
import { Client, Profile } from '@/types';

export function useClientPortal(userProfile: Profile) {
    const [isBookingFormShareModalOpen, setIsBookingFormShareModalOpen] = useState(false);
    const [qrModalContent, setQrModalContent] = useState<{ title: string, url: string } | null>(null);
    const [sharePreview, setSharePreview] = useState<{ title: string, message: string, phone: string } | null>(null);

    const getBookingFormUrl = useCallback(() => {
        const basePath = window.location.pathname.replace(/index\.html$/, '');
        return `${window.location.origin}${basePath}#/b/${userProfile.id}`;
    }, [userProfile.id]);

    const handleSharePortal = useCallback((client: Client) => {
        const basePath = window.location.pathname.replace(/index\.html$/, '');
        const portalUrl = `${window.location.origin}${basePath}#/p/${client.portalAccessId}`;
        const companyName = userProfile.companyName || 'Weddfinter';
        const firstName = client.name.split(' ')[0];

        const text = 
            `Halo *${firstName}*! 👋\n\n` +
            `Untuk memudahkan Anda memantau progres Acara Pernikahan, melihat invoice, dan tanda terima pembayaran, kami telah menyediakan *Client Portal* khusus untuk Anda di *${companyName}* 💍\n\n` +
            `🌐 *Klik Link Portal Anda di sini:*\n${portalUrl}\n\n` +
            `Anda bisa buka link ini kapan saja untuk cek update terbaru. Terima kasih! 🙏`;

        setSharePreview({
            title: `Bagikan Portal Client - ${client.name}`,
            message: text,
            phone: client.whatsapp || client.phone
        });
    }, [userProfile.companyName]);

    return {
        isBookingFormShareModalOpen,
        setIsBookingFormShareModalOpen,
        qrModalContent,
        setQrModalContent,
        sharePreview,
        setSharePreview,
        getBookingFormUrl,
        handleSharePortal
    };
}
