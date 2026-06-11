import React, { useEffect, useState } from 'react';
import { UniversalShareModal } from '@/shared/components/UniversalShareModal';
import { DEFAULT_BILLING_TEMPLATES } from '@/constants';
import { formatCurrency } from '@/features/clients/utils/clients.utils';
import { BillingChatModalProps } from '@/features/clients/types';

/**
 * BillingChatModal — generates the billing message and opens UniversalShareModal directly.
 * No intermediate modal; one step to WhatsApp.
 */
const BillingChatModal: React.FC<BillingChatModalProps> = ({
    isOpen,
    onClose,
    client,
    projects,
    userProfile,
    showNotification,
}) => {
    const [message, setMessage] = useState('');

    const BILLING_TEMPLATES =
        userProfile.billingTemplates && userProfile.billingTemplates.length > 0
            ? userProfile.billingTemplates
            : DEFAULT_BILLING_TEMPLATES;

    useEffect(() => {
        if (!isOpen || !client) return;

        const projectsWithBalance = projects.filter(
            p => String(p.clientId) === String(client.id) && p.totalCost - (p.amountPaid || 0) > 0
        );
        if (projectsWithBalance.length === 0) return;

        const totalDue = projectsWithBalance.reduce(
            (sum, p) => sum + (p.totalCost - (p.amountPaid || 0)),
            0
        );

        const projectDetails = projectsWithBalance
            .map(
                p =>
                    `- Acara: *${p.projectName}*\n  Sisa Tagihan: ${formatCurrency(p.totalCost - (p.amountPaid || 0))}`
            )
            .join('\n');

        const path = window.location.pathname.replace(/index\.html$/, '');
        const portalLink = `${window.location.origin}${path}#/p/${client.portalAccessId}`;

        const template = BILLING_TEMPLATES[0].template;

        const processedMessage = template
            .replace('{clientName}', client.name)
            .replace('{projectDetails}', projectDetails)
            .replace('{totalDue}', formatCurrency(totalDue))
            .replace('{portalLink}', portalLink)
            .replace('{bankAccount}', userProfile.bankAccount || 'N/A')
            .replace(/{companyName}/g, userProfile.companyName || 'Tim Kami');

        setMessage(processedMessage);
    }, [isOpen, client, projects, userProfile, BILLING_TEMPLATES]);

    if (!client) return null;

    return (
        <UniversalShareModal
            isOpen={isOpen}
            onClose={onClose}
            title={`Kirim Tagihan ke ${client.name}`}
            initialMessage={message}
            phone={client.whatsapp || client.phone}
            profile={userProfile}
            showNotification={showNotification}
        />
    );
};

export default BillingChatModal;
