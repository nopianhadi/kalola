import React from 'react';
import DonutChart from '@/shared/ui/DonutChart';

export { DonutChart };

interface ChartData {
    label: string;
    income: number;
    expense: number;
    balance: number;
}

export const InteractiveCashflowChart: React.FC<{ data: ChartData[] }> = ({ data }) => {
    if (!data || data.length === 0) {
        return <div className="h-64 flex items-center justify-center text-brand-text-secondary">Tidak ada data visual</div>;
    }

    const maxVal = Math.max(...data.map(d => Math.max(d.income, d.expense)), 1000000);
    const padding = 40;
    const width = 800;
    const height = 300;
    
    const xScale = (index: number) => (index / (data.length - 1 || 1)) * (width - padding * 2) + padding;
    const yScale = (val: number) => height - ((val / maxVal) * (height - padding * 2) + padding);

    const incomePoints = data.map((d, i) => `${xScale(i)},${yScale(d.income)}`).join(' ');
    const expensePoints = data.map((d, i) => `${xScale(i)},${yScale(d.expense)}`).join(' ');

    return (
        <div className="w-full overflow-hidden">
            <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto">
                {/* Grid Lines */}
                {[0, 0.25, 0.5, 0.75, 1].map(p => {
                    const y = yScale(maxVal * p);
                    return (
                        <g key={p}>
                            <line x1={padding} y1={y} x2={width - padding} y2={y} stroke="currentColor" className="text-brand-border opacity-20" />
                            <text x={padding - 5} y={y} textAnchor="end" className="text-[10px] fill-brand-text-secondary">{Math.round(p * 100)}%</text>
                        </g>
                    );
                })}

                {/* Income Line */}
                <polyline
                    points={incomePoints}
                    fill="none"
                    stroke="#10b981"
                    strokeWidth="3"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="drop-shadow-sm"
                />
                
                {/* Expense Line */}
                <polyline
                    points={expensePoints}
                    fill="none"
                    stroke="#f43f5e"
                    strokeWidth="3"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="drop-shadow-sm"
                />

                {/* Data Points */}
                {data.map((d, i) => (
                    <g key={i}>
                        <circle cx={xScale(i)} cy={yScale(d.income)} r="4" fill="#10b981" />
                        <circle cx={xScale(i)} cy={yScale(d.expense)} r="4" fill="#f43f5e" />
                        <text x={xScale(i)} y={height - 5} textAnchor="middle" className="text-[10px] fill-brand-text-secondary">{d.label}</text>
                    </g>
                ))}
            </svg>
            <div className="flex justify-center gap-6 mt-4 text-xs font-semibold">
                <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-emerald-500"></div>
                    <span>Pemasukan</span>
                </div>
                <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-rose-500"></div>
                    <span>Pengeluaran</span>
                </div>
            </div>
        </div>
    );
};
