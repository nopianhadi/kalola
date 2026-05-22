import React from 'react';
import StatCard from '@/shared/ui/StatCard';
import { UsersIcon, DollarSignIcon, PackageIcon, WhatsappIcon } from '@/constants';
import { formatCurrency } from '@/features/booking/utils/booking.utils';

interface BookingStatsProps {
    allBookingsCount: number;
    totalValue: number;
    mostPopularPackage: string;
    newBookingsCount: number;
    onStatClick: (type: string) => void;
}

const BookingStats: React.FC<BookingStatsProps> = ({
    allBookingsCount,
    totalValue,
    mostPopularPackage,
    newBookingsCount,
    onStatClick
}) => {
    return (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
            <div onClick={() => onStatClick('total')} className="cursor-pointer transition-transform duration-200 hover:scale-105">
                <StatCard 
                    icon={<UsersIcon className="w-6 h-6" />} 
                    title="Total Booking" 
                    value={allBookingsCount.toString()} 
                    subtitle="Semua booking yang masuk" 
                    colorVariant="blue" 
                />
            </div>
            <div onClick={() => onStatClick('value')} className="cursor-pointer transition-transform duration-200 hover:scale-105">
                <StatCard 
                    icon={<DollarSignIcon className="w-6 h-6" />} 
                    title="Total Nilai Booking" 
                    value={formatCurrency(totalValue)} 
                    subtitle="Nilai keseluruhan booking" 
                    colorVariant="orange" 
                />
            </div>
            <div onClick={() => onStatClick('popular')} className="cursor-pointer transition-transform duration-200 hover:scale-105">
                <StatCard 
                    icon={<PackageIcon className="w-6 h-6" />} 
                    title="Package Terpopuler" 
                    value={mostPopularPackage} 
                    subtitle="Package paling banyak dipilih" 
                    colorVariant="purple" 
                />
            </div>
            <div onClick={() => onStatClick('new')} className="cursor-pointer transition-transform duration-200 hover:scale-105">
                <StatCard 
                    icon={<WhatsappIcon className="w-6 h-6" />} 
                    title="Booking Baru" 
                    value={newBookingsCount.toString()} 
                    subtitle="Menunggu konfirmasi" 
                    colorVariant="pink" 
                />
            </div>
        </div>
    );
};

export default BookingStats;
