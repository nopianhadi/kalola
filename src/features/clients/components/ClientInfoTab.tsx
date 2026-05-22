import React from 'react';
import { Share2Icon } from '@/constants';
import { Client } from '@/types';
import { cleanPhoneNumber } from '@/features/clients/utils/clients.utils';

interface ClientInfoTabProps {
    client: Client;
    onSharePortal: (client: Client) => void;
}

const DetailRow: React.FC<{ label: string, children: React.ReactNode }> = ({ label, children }) => (
    <div className="py-2.5 grid grid-cols-1 sm:grid-cols-[1fr_2fr] gap-1 sm:gap-4 border-b border-brand-border">
        <dt className="text-sm text-brand-text-secondary">{label}</dt>
        <dd className="text-sm text-brand-text-light font-semibold break-words">{children}</dd>
    </div>
);

const ClientInfoTab: React.FC<ClientInfoTabProps> = ({ client, onSharePortal }) => {

    return (
        <div className="space-y-6 md:space-y-8 tab-content-mobile">
            {/* Mobile: Card-based info display */}
            <div className="md:hidden bg-brand-surface rounded-2xl p-4 border border-brand-border shadow-sm">
                <div className="space-y-3">
                    <div className="pb-2 border-b border-brand-border/50">
                        <p className="text-xs text-brand-text-secondary mb-1">Nama Pengantin</p>
                        <p className="text-sm font-semibold text-brand-text-light">{client.name}</p>
                    </div>
                    <div className="pb-2 border-b border-brand-border/50">
                        <p className="text-xs text-brand-text-secondary mb-1">Jenis Pengantin</p>
                        <p className="text-sm font-semibold text-brand-text-light">{client.clientType}</p>
                    </div>
                    <div className="pb-2 border-b border-brand-border/50">
                        <p className="text-xs text-brand-text-secondary mb-1">Email</p>
                        <p className="text-sm font-semibold text-brand-text-light break-all">{client.email}</p>
                    </div>
                    <div className="pb-2 border-b border-brand-border/50">
                        <p className="text-xs text-brand-text-secondary mb-1">Telepon</p>
                        <a href={`https://wa.me/${cleanPhoneNumber(client.whatsapp || client.phone)}`} target="_blank" rel="noopener noreferrer" className="text-sm font-semibold text-blue-400 hover:underline active:text-blue-300">{client.whatsapp || client.phone}</a>
                    </div>
                    <div className="pb-2 border-b border-brand-border/50">
                        <p className="text-xs text-brand-text-secondary mb-1">No. WhatsApp</p>
                        <a href={`https://wa.me/${cleanPhoneNumber(client.whatsapp || client.phone)}`} target="_blank" rel="noopener noreferrer" className="text-sm font-semibold text-blue-400 hover:underline active:text-blue-300">{client.whatsapp || client.phone}</a>
                    </div>
                    <div className="pb-2 border-b border-brand-border/50">
                        <p className="text-xs text-brand-text-secondary mb-1">Instagram</p>
                        <p className="text-sm font-semibold text-brand-text-light">{client.instagram || '-'}</p>
                    </div>
                    <div>
                        <p className="text-xs text-brand-text-secondary mb-1">Alamat Lengkap</p>
                        <p className="text-sm font-semibold text-brand-text-light">{client.address || '-'}</p>
                    </div>
                    <div>
                        <p className="text-xs text-brand-text-secondary mb-1">Pengantin Sejak</p>
                        <p className="text-sm font-semibold text-brand-text-light">{new Date(client.since).toLocaleDateString('id-ID')}</p>
                    </div>
                </div>
                <button onClick={() => onSharePortal(client)} className="mt-4 w-full button-primary inline-flex items-center justify-center gap-2 text-sm active:scale-95 transition-transform"><Share2Icon className="w-4 h-4" /> Bagikan Portal Pengantin</button>
            </div>

            {/* Desktop: Table-based info display */}
            <div className="hidden md:block">
                <dl>
                    <DetailRow label="Nama Pengantin">{client.name}</DetailRow>
                    <DetailRow label="Jenis Pengantin">{client.clientType}</DetailRow>
                    <DetailRow label="Email">{client.email}</DetailRow>
                    <DetailRow label="Telepon"><a href={`https://wa.me/${cleanPhoneNumber(client.whatsapp || client.phone)}`} target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline">{client.whatsapp || client.phone}</a></DetailRow>
                    <DetailRow label="No. WhatsApp"><a href={`https://wa.me/${cleanPhoneNumber(client.whatsapp || client.phone)}`} target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline">{client.whatsapp || client.phone}</a></DetailRow>
                    <DetailRow label="Instagram">{client.instagram || '-'}</DetailRow>
                    <DetailRow label="Alamat Lengkap">{client.address || '-'}</DetailRow>
                    <DetailRow label="Pengantin Sejak">{new Date(client.since).toLocaleDateString('id-ID')}</DetailRow>
                </dl>
                <button onClick={() => onSharePortal(client)} className="mt-5 button-secondary inline-flex items-center gap-2 text-sm"><Share2Icon className="w-4 h-4" /> Bagikan Portal Pengantin</button>
            </div>

        </div>
    );
};

export default ClientInfoTab;
