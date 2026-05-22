import React from 'react';
import PageHeader from '@/layouts/PageHeader';
import { Button } from '@/shared/ui';
import { PlusIcon, UsersIcon, DownloadIcon } from '@/constants';

interface ClientHeaderProps {
    onAddClient: () => void;
    onDownloadClients: () => void;
}

export const ClientHeader: React.FC<ClientHeaderProps> = ({
    onAddClient,
    onDownloadClients
}) => {
    return (
        <PageHeader 
            title="Data Pengantin" 
            subtitle="Kelola semua database pengantin, progres acara pernikahan, dan status pembayaran mereka secara terpadu."
            icon={<UsersIcon className="w-6 h-6" />}
        >
            <Button 
                onClick={onDownloadClients} 
                variant="secondary"
                size="sm"
                leftIcon={<DownloadIcon className="w-4 h-4" />}
            >
                <span className="hidden md:inline">Export Excel</span>
                <span className="md:hidden">Excel</span>
            </Button>
            <Button 
                onClick={onAddClient}
                variant="primary"
                size="sm"
                leftIcon={<PlusIcon className="w-5 h-5" />}
            >
                Tambah Pengantin
            </Button>
        </PageHeader>
    );
};
