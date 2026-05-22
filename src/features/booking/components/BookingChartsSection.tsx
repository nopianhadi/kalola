import React, { useState, useMemo } from 'react';
import DonutChart from '@/shared/ui/DonutChart';
import { Project } from '@/types';
import { formatCurrency } from '@/features/booking/utils/booking.utils';

interface BookingChartProps {
    bookings: { lead: any; project: Project }[];
}

const BookingChart: React.FC<BookingChartProps> = ({ bookings }) => {
    const [tooltip, setTooltip] = useState<{ x: number; y: number; data: { name: string; count: number; value: number } } | null>(null);

    const chartData = useMemo(() => {
        const currentYear = new Date().getFullYear();
        const months = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Ags", "Sep", "Okt", "Nov", "Des"];
        const data = months.map(month => ({ name: month, count: 0, value: 0 }));

        bookings.forEach(booking => {
            const bookingDate = new Date(booking.lead.date);
            if (bookingDate.getFullYear() === currentYear) {
                const monthIndex = bookingDate.getMonth();
                data[monthIndex].count += 1;
                data[monthIndex].value += booking.project.totalCost;
            }
        });
        return data;
    }, [bookings]);

    const maxCount = Math.max(...chartData.map(d => d.count), 1);
    const maxValue = Math.max(...chartData.map(d => d.value), 1);
    const hasData = chartData.some(d => d.count > 0 || d.value > 0);

    if (!hasData) {
        return (
            <div className="bg-brand-surface p-6 rounded-2xl shadow-lg border border-brand-border h-full">
                <h3 className="font-bold text-lg text-gradient mb-6">Grafik Booking Tahun Ini</h3>
                <div className="flex flex-col items-center justify-center py-12 text-center">
                    <div className="w-20 h-20 rounded-2xl bg-brand-bg border-2 border-dashed border-brand-border flex items-center justify-center mb-3">
                        <svg className="w-10 h-10 text-brand-text-secondary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                        </svg>
                    </div>
                    <p className="text-sm font-medium text-brand-text-light mb-1">Belum Ada Booking Tahun Ini</p>
                    <p className="text-xs text-brand-text-secondary">Data booking akan muncul di sini</p>
                </div>
            </div>
        );
    }

    return (
        <div className="bg-brand-surface p-6 rounded-2xl shadow-lg border border-brand-border h-full">
            <h3 className="font-bold text-lg text-gradient mb-2">Grafik Booking Tahun Ini</h3>
            <p className="text-xs text-brand-text-secondary mb-6">Jumlah dan nilai booking per bulan</p>
            <div className="h-48 flex justify-between items-end gap-1.5 relative bg-brand-bg/30 rounded-lg p-3">
                {chartData.map((item, index) => {
                    const countHeight = Math.max((item.count / maxCount) * 100, 3);
                    const valueHeight = Math.max((item.value / maxValue) * 100, 3);
                    const isHovered = tooltip?.data.name === item.name;
                    return (
                        <div
                            key={item.name}
                            className="flex-1 flex flex-col items-center justify-end h-full group relative cursor-pointer"
                            onMouseEnter={() => setTooltip({ x: (index / chartData.length) * 100, y: 0, data: item })}
                            onMouseLeave={() => setTooltip(null)}
                        >
                            <div className="flex-1 flex items-end w-full justify-center gap-0.5">
                                <div
                                    className={`w-1/2 rounded-t-md transition-all duration-300 ${isHovered ? 'bg-blue-500 shadow-lg' : 'bg-blue-500/40 hover:bg-blue-500/60'}`}
                                    style={{ height: `${countHeight}%` }}
                                ></div>
                                <div
                                    className={`w-1/2 rounded-t-md transition-all duration-300 ${isHovered ? 'bg-green-500 shadow-lg' : 'bg-green-500/40 hover:bg-green-500/60'}`}
                                    style={{ height: `${valueHeight}%` }}
                                ></div>
                            </div>
                            <span className={`text-[10px] mt-2 transition-colors ${isHovered ? 'text-brand-accent font-semibold' : 'text-brand-text-secondary'}`}>
                                {item.name}
                            </span>
                        </div>
                    );
                })}
                {tooltip && (
                    <div className="absolute -top-2 left-1/2 -translate-x-1/2 bg-gradient-to-br from-brand-surface to-brand-bg border-2 border-brand-accent/30 p-3 rounded-xl shadow-2xl text-xs z-10 min-w-[160px]">
                        <p className="font-bold text-center border-b border-brand-accent/30 pb-1.5 mb-2 text-brand-accent">{tooltip.data.name}</p>
                        <div className="space-y-1.5">
                            <div className="flex items-center justify-between gap-3">
                                <div className="flex items-center gap-1.5">
                                    <span className="w-2.5 h-2.5 bg-blue-500 rounded-full"></span>
                                    <span className="text-brand-text-secondary">Jumlah</span>
                                </div>
                                <span className="font-semibold text-blue-400">{tooltip.data.count}</span>
                            </div>
                            <div className="flex items-center justify-between gap-3">
                                <div className="flex items-center gap-1.5">
                                    <span className="w-2.5 h-2.5 bg-green-500 rounded-full"></span>
                                    <span className="text-brand-text-secondary">Nilai</span>
                                </div>
                                <span className="font-semibold text-green-400">{formatCurrency(tooltip.data.value)}</span>
                            </div>
                        </div>
                    </div>
                )}
            </div>
            <div className="flex justify-center items-center gap-6 text-xs mt-4">
                <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-blue-500/40 rounded-md"></div>
                    <span className="text-brand-text-secondary">Jumlah Booking</span>
                </div>
                <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-green-500/40 rounded-md"></div>
                    <span className="text-brand-text-secondary">Nilai Booking</span>
                </div>
            </div>
        </div>
    );
};

interface BookingChartsSectionProps {
    bookings: { lead: any; project: Project }[];
    packageData: { label: string; value: number; color: string }[];
}

const BookingChartsSection: React.FC<BookingChartsSectionProps> = ({ bookings, packageData }) => {
    return (
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
            <div className="lg:col-span-3">
                <BookingChart bookings={bookings} />
            </div>
            <div className="lg:col-span-2 bg-brand-surface p-6 rounded-2xl shadow-lg border border-brand-border h-full">
                <h3 className="font-bold text-lg text-gradient mb-4">Distribusi Package</h3>
                <DonutChart data={packageData} />
            </div>
        </div>
    );
};

export default BookingChartsSection;
