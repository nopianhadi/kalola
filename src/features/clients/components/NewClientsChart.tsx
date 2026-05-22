import React, { useMemo } from 'react';
import { Client } from '@/types';

interface NewClientsChartProps {
    clients: Client[];
}

const NewClientsChart: React.FC<NewClientsChartProps> = ({ clients }) => {
    const data = useMemo(() => {
        const currentYear = new Date().getFullYear();
        const months = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Ags", "Sep", "Okt", "Nov", "Des"];
        const chartData = months.map(month => ({ name: month, count: 0 }));

        clients.forEach(c => {
            const joinDate = new Date(c.since);
            if (joinDate.getFullYear() === currentYear) {
                const monthIndex = joinDate.getMonth();
                if (monthIndex >= 0 && monthIndex < 12) {
                    chartData[monthIndex].count += 1;
                }
            }
        });
        return chartData;
    }, [clients]);

    const maxCount = Math.max(...data.map(d => d.count), 5);

    return (
        <div className="bg-brand-surface rounded-2xl p-4 md:p-6 border border-brand-border shadow-md">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-2 mb-6 md:mb-8">
                <div>
                    <h3 className="text-base md:text-lg font-bold text-brand-text-light">Pertumbuhan Pengantin</h3>
                    <p className="text-[10px] md:text-xs text-brand-text-secondary">Jumlah pengantin baru yang bergabung di tahun {new Date().getFullYear()}</p>
                </div>
                <div className="px-3 py-1 bg-brand-bg rounded-full border border-brand-border text-[10px] md:text-xs font-medium text-brand-text-secondary">
                    Total: {data.reduce((sum, d) => sum + d.count, 0)} Pengantin
                </div>
            </div>

            <div className="h-40 md:h-52 flex items-end justify-between gap-1 md:gap-3 px-1 md:px-2">
                {data.map((d, i) => {
                    const height = d.count > 0 ? (d.count / maxCount) * 100 : 5;
                    return (
                        <div key={i} className="flex-1 flex flex-col items-center group relative">
                            <div 
                                className={`w-full rounded-t-lg transition-all duration-500 ease-out relative overflow-hidden ${d.count > 0 ? 'bg-gradient-to-t from-brand-accent/40 to-brand-accent shadow-[0_0_15px_rgba(var(--brand-accent-rgb),0.3)]' : 'bg-brand-bg/50 border border-brand-border/30'}`}
                                style={{ height: `${height}%` }}
                            >
                                {d.count > 0 && (
                                    <div className="absolute inset-0 bg-white/20 opacity-0 group-hover:opacity-100 transition-opacity" />
                                )}
                            </div>
                            
                            {/* Value tooltip on hover */}
                            <div className="absolute -top-8 bg-brand-accent text-white text-[10px] px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-all transform scale-90 group-hover:scale-100 pointer-events-none font-bold shadow-xl z-10 whitespace-nowrap after:content-[''] after:absolute after:top-full after:left-1/2 after:-ml-1 after:border-4 after:border-transparent after:border-t-brand-accent">
                                {d.count} Pengantin
                            </div>

                            <span className="mt-3 text-[9px] md:text-[11px] font-medium text-brand-text-secondary group-hover:text-brand-accent transition-colors">
                                {d.name}
                            </span>
                        </div>
                    );
                })}
            </div>

            {/* Summary info */}
            <div className="mt-6 pt-5 border-t border-brand-border flex items-center justify-between text-[10px] md:text-xs">
                <div className="flex items-center gap-2 text-brand-text-secondary">
                    <svg className="w-4 h-4 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                    </svg>
                    <span>Total: <span className="font-bold text-brand-text-light">{data.reduce((sum, d) => sum + d.count, 0)} Pengantin</span></span>
                </div>
                <div className="text-brand-text-secondary">
                    Rata-rata: <span className="font-bold text-brand-text-light">{(data.reduce((sum, d) => sum + d.count, 0) / data.length).toFixed(1)} / bulan</span>
                </div>
            </div>
        </div>
    );
};

export { NewClientsChart };
