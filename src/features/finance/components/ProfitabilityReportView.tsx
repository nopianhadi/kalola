import React from 'react';
import { DownloadIcon, PrinterIcon, DollarSignIcon, UsersIcon, TrendingUpIcon, TargetIcon } from 'lucide-react';
import { Project, Profile } from '@/types';
import { formatCurrency } from '@/features/finance/utils/finance.utils';
import StatCard from '@/shared/ui/StatCard';

interface ProfitabilityReportViewProps {
    filters: { month: number; year: number };
    setFilters: React.Dispatch<React.SetStateAction<{ month: number; year: number }>>;
    metrics: any;
    data: any[];
    profile: Profile;
    projects: Project[];
    onDownloadCSV: () => void;
}

export const ProfitabilityReportView: React.FC<ProfitabilityReportViewProps> = ({
    filters,
    setFilters,
    metrics,
    data,
    profile,
    projects,
    onDownloadCSV
}) => {
    const monthOptions = Array.from({ length: 12 }, (_, i) => ({ value: i, name: new Date(0, i).toLocaleString('id-ID', { month: 'long' }) }));
    const yearOptions = Array.from(new Set(projects.map(p => new Date(p.date).getFullYear()))).sort((a, b) => b - a);

    return (
        <div className="space-y-6 printable-area widget-animate">
            <div className="bg-brand-surface p-4 rounded-xl flex flex-col md:flex-row gap-4 items-center non-printable border border-brand-border">
                <h4 className="text-md font-semibold text-gradient whitespace-nowrap">Filter Laporan Laba:</h4>
                <select 
                    name="year" 
                    value={filters.year} 
                    onChange={e => setFilters(p => ({ ...p, year: Number(e.target.value) }))} 
                    className="input-field !rounded-lg !border p-2.5 w-full md:w-auto"
                >
                    {yearOptions.map(y => <option key={y} value={y}>{y}</option>)}
                </select>
                <select 
                    name="month" 
                    value={filters.month} 
                    onChange={e => setFilters(p => ({ ...p, month: Number(e.target.value) }))} 
                    className="input-field !rounded-lg !border p-2.5 w-full md:w-auto"
                >
                    {monthOptions.map(m => <option key={m.value} value={m.value}>{m.name}</option>)}
                </select>
                <div className="flex items-center gap-2 ml-auto">
                    <button onClick={onDownloadCSV} className="button-secondary inline-flex items-center gap-2">
                        <DownloadIcon className="w-5 h-5" />Unduh CSV
                    </button>
                    <button onClick={() => window.print()} className="button-primary inline-flex items-center gap-2">
                        <PrinterIcon className="w-5 h-5" />Cetak PDF
                    </button>
                </div>
            </div>

            {/* Desktop Metrics */}
            <div className="hidden md:grid grid-cols-2 lg:grid-cols-4 gap-4 non-printable">
                <StatCard icon={<DollarSignIcon className="w-6 h-6" />} title="Total Laba Periode Ini" value={formatCurrency(metrics.totalProfit)} colorVariant="blue" />
                <StatCard icon={<UsersIcon className="w-6 h-6" />} title="Pengantin Paling Profit" value={metrics.mostProfitableClient} colorVariant="green" />
                <StatCard icon={<TrendingUpIcon className="w-6 h-6" />} title="Jumlah Proyek Profit" value={`${metrics.profitableProjectsCount} dari ${data.length}`} colorVariant="orange" />
                <StatCard icon={<TargetIcon className="w-6 h-6" />} title="Rata-rata Laba/Proyek" value={formatCurrency(metrics.avgProfit)} colorVariant="purple" />
            </div>

            <div className="bg-brand-surface p-6 rounded-2xl border border-brand-border print:border-none print:p-0">
                <div className="print:hidden">
                    <h3 className="text-lg font-bold mb-2 text-gradient">Laporan Laba per Pengantin</h3>
                    <p className="text-sm text-brand-text-primary mb-4">
                        Menampilkan profitabilitas untuk proyek pada <strong>{monthOptions.find(m => m.value === filters.month)?.name} {filters.year}</strong>.
                    </p>
                </div>
                
                {/* Print Only Header */}
                <div className="hidden print:block text-black mb-6">
                    <h1 className="text-xl font-bold">{profile.companyName}</h1>
                    <p>{profile.address}</p>
                    <div className="mt-4 pt-4 border-t-2 border-black">
                        <h2 className="text-lg font-bold">Laporan Laba per Pengantin</h2>
                        <p>Periode: {monthOptions.find(m => m.value === filters.month)?.name} {filters.year}</p>
                    </div>
                </div>

                <div className="overflow-x-auto max-h-[600px] print:max-h-none print:overflow-visible">
                    <table className="w-full text-sm">
                        <thead className="text-xs uppercase print-bg-slate bg-brand-input">
                            <tr className="print-text-black">
                                <th className="p-3 text-left">Pelanggan</th>
                                <th className="p-3 text-right">Harga Package</th>
                                <th className="p-3 text-right">Tambahan</th>
                                <th className="p-3 text-right">Transport</th>
                                <th className="p-3 text-right">Tagihan</th>
                                <th className="p-3 text-right">Terbayar</th>
                                <th className="p-3 text-right">Biaya Prod.</th>
                                <th className="p-3 text-right">Laba</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-brand-border">
                            {data.map(item => {
                                const totalTagihan = item.totalPackageRevenue + item.totalCustomCosts + item.totalTransportCosts;
                                return (
                                    <tr key={item.clientId}>
                                        <td className="p-3">
                                            <p className="font-semibold text-brand-text-light">{item.clientName}</p>
                                            <p className="text-[10px] text-brand-text-secondary">
                                                {item.projects.map((p: any) => p.packageName).join(', ')}
                                            </p>
                                        </td>
                                        <td className="p-3 text-right text-brand-text-secondary">{formatCurrency(item.totalPackageRevenue)}</td>
                                        <td className="p-3 text-right text-orange-400 font-medium">+{formatCurrency(item.totalCustomCosts)}</td>
                                        <td className="p-3 text-right text-brand-text-secondary">{formatCurrency(item.totalTransportCosts)}</td>
                                        <td className="p-3 text-right font-bold text-brand-text-primary">{formatCurrency(totalTagihan)}</td>
                                        <td className="p-3 text-right text-brand-success font-semibold">{formatCurrency(item.totalIncome)}</td>
                                        <td className="p-3 text-right text-brand-danger">{formatCurrency(item.totalCost)}</td>
                                        <td className={`p-3 text-right font-black ${item.profit >= 0 ? 'text-brand-success' : 'text-brand-danger'}`}>
                                            {formatCurrency(item.profit)}
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};
