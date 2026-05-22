import React from 'react';
import StatCard from '@/shared/ui/StatCard';
import { ClockIcon, DollarSignIcon } from '@/constants';
import { formatDisplayCurrency } from '@/features/contracts/utils/contracts.utils';

interface ContractStatsProps {
    waitingForClient: number;
    totalValue: number;
}

export const ContractStats: React.FC<ContractStatsProps> = ({
    waitingForClient,
    totalValue
}) => {
    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 gap-6">
            <StatCard 
                icon={<ClockIcon className="w-6 h-6"/>} 
                title="Menunggu TTD Klien" 
                value={waitingForClient.toString()} 
                subtitle="Kontrak belum ditandatangani" 
                colorVariant="orange" 
            />
            <StatCard 
                icon={<DollarSignIcon className="w-6 h-6"/>} 
                title="Total Nilai Terkontrak" 
                value={formatDisplayCurrency(totalValue)} 
                subtitle="Nilai keseluruhan kontrak" 
                colorVariant="green" 
            />
        </div>
    );
};
