import React from 'react';
import StatCard from '@/shared/ui/StatCard';
import { UsersIcon, MapPinIcon, DollarSignIcon, TrendingUpIcon } from '@/constants';
import { ClientStats } from '@/features/clients/types';

interface ClientStatsCardsProps {
    stats: ClientStats;
}

export const ClientStatsCards: React.FC<ClientStatsCardsProps> = ({ stats }) => {
    return (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="transition-transform duration-200 hover:scale-105">
                <StatCard
                    icon={<UsersIcon className="w-6 h-6" />}
                    title="Total Pengantin"
                    value={stats.totalClients.toString()}
                    subtitle="Semua pengantin terdaftar"
                    colorVariant="blue"
                />
            </div>
            <div className="transition-transform duration-200 hover:scale-105">
                <StatCard
                    icon={<TrendingUpIcon className="w-6 h-6" />}
                    title="Pengantin Aktif"
                    value={stats.activeClients.toString()}
                    subtitle="Menunggu acara/final"
                    colorVariant="green"
                />
            </div>
            <div className="transition-transform duration-200 hover:scale-105">
                <StatCard
                    icon={<MapPinIcon className="w-6 h-6" />}
                    title="Lokasi Terbanyak"
                    value={stats.mostFrequentLocation}
                    subtitle="Wilayah operasional utama"
                    colorVariant="orange"
                />
            </div>
            <div className="transition-transform duration-200 hover:scale-105">
                <StatCard
                    icon={<DollarSignIcon className="w-6 h-6" />}
                    title="Sisa Tagihan"
                    value={stats.totalReceivables}
                    subtitle="Total piutang pengantin"
                    colorVariant="pink"
                />
            </div>
        </div>
    );
};
