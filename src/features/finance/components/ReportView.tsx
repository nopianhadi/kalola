import React from 'react';
import { DownloadIcon, PrinterIcon, ArrowUpIcon, ArrowDownIcon, DollarSignIcon } from 'lucide-react';
import { Transaction, Project, Profile, TransactionType } from '@/types';
import { formatCurrency, PRODUCTION_COST_CATEGORIES } from '@/features/finance/utils/finance.utils';
import StatCard from '@/shared/ui/StatCard';
import { DonutChart } from '@/features/finance/components/FinanceCharts';
import { TransactionTable } from '@/features/finance/components/TransactionTable';

interface ReportViewProps {
    reportFilters: { client: string; dateFrom: string; dateTo: string };
    setReportFilters: React.Dispatch<React.SetStateAction<{ client: string; dateFrom: string; dateTo: string }>>;
    clientOptions: Array<{ id: string; name: string }>;
    reportTransactions: Transaction[];
    metrics: any;
    profile: Profile;
    projects: Project[];
    cards: any[];
    pockets: any[];
    onDownloadCSV: () => void;
}

export const ReportView: React.FC<ReportViewProps> = ({
    reportFilters,
    setReportFilters,
    clientOptions,
    reportTransactions,
    metrics,
    profile,
    projects,
    cards,
    pockets,
    onDownloadCSV
}) => {
    return (
        <div className="space-y-6 printable-area widget-animate">
            <div className="bg-brand-surface p-4 rounded-xl flex flex-col md:flex-row gap-4 items-center non-printable border border-brand-border">
                <h4 className="text-md font-semibold text-gradient whitespace-nowrap">Filter Laporan:</h4>
                <select 
                    name="client" 
                    value={reportFilters.client} 
                    onChange={e => setReportFilters(p => ({ ...p, client: e.target.value }))} 
                    className="input-field !rounded-lg !border p-2.5 w-full md:w-auto"
                >
                    <option value="all">Semua Pengantin</option>
                    {clientOptions.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
                <input 
                    type="date" 
                    name="dateFrom" 
                    value={reportFilters.dateFrom} 
                    onChange={e => setReportFilters(p => ({ ...p, dateFrom: e.target.value }))} 
                    className="input-field !rounded-lg !border p-2.5 w-full md:w-auto" 
                />
                <input 
                    type="date" 
                    name="dateTo" 
                    value={reportFilters.dateTo} 
                    onChange={e => setReportFilters(p => ({ ...p, dateTo: e.target.value }))} 
                    className="input-field !rounded-lg !border p-2.5 w-full md:w-auto" 
                />
                <div className="flex items-center gap-2 ml-auto">
                    <button onClick={onDownloadCSV} className="button-secondary inline-flex items-center gap-2">
                        <DownloadIcon className="w-5 h-5" />Unduh CSV
                    </button>
                    <button onClick={() => window.print()} className="button-primary inline-flex items-center gap-2">
                        <PrinterIcon className="w-5 h-5" />Cetak PDF
                    </button>
                </div>
            </div>

            {/* Content depends on filter type */}
            {reportFilters.client === 'all' ? (
                metrics && <GeneralReport metrics={metrics} transactions={reportTransactions} filters={reportFilters} profile={profile} projects={projects} cards={cards} pockets={pockets} />
            ) : (
                <ClientReport transactions={reportTransactions} clientName={clientOptions.find(c => String(c.id) === String(reportFilters.client))?.name || ''} filters={reportFilters} profile={profile} projects={projects} cards={cards} pockets={pockets} />
            )}
        </div>
    );
};

const GeneralReport = ({ metrics, transactions, filters, profile, projects, cards, pockets }: { metrics: any, transactions: Transaction[], filters: any, profile: Profile, projects: Project[], cards: any[], pockets: any[] }) => {
    const periodText = `${filters.dateFrom || ''} - ${filters.dateTo || ''}`;
    return (
        <div className="space-y-6">
            <div className="hidden print:block text-black mb-6">
                <h1 className="text-xl font-bold">{profile.companyName}</h1>
                <p className="text-sm">{profile.address}</p>
                <div className="mt-4 pt-4 border-t-2 border-black">
                    <h2>Laporan Keuangan Umum</h2>
                    <p>Periode: {periodText}</p>
                </div>
            </div>
            <div className="print:hidden">
                <h2 className="text-2xl font-bold mb-2 text-gradient">Laporan Keuangan Umum</h2>
                <p className="mb-6 text-brand-text-primary">Periode: {periodText}</p>
            </div>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard icon={<ArrowUpIcon className="w-6 h-6" />} title="Total Pemasukan" value={formatCurrency(metrics.reportIncome)} colorVariant="green" />
                <StatCard icon={<ArrowDownIcon className="w-6 h-6" />} title="Total Pengeluaran" value={formatCurrency(metrics.reportExpense)} colorVariant="pink" />
                <StatCard icon={<DollarSignIcon className="w-6 h-6" />} title="Laba / Rugi Bersih" value={formatCurrency(metrics.reportIncome - metrics.reportExpense)} colorVariant="blue" />
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-brand-surface p-6 rounded-2xl border border-brand-border"><h3 className="font-bold mb-4">Analisis Pemasukan</h3><DonutChart data={metrics.incomeDonut} /></div>
                <div className="bg-brand-surface p-6 rounded-2xl border border-brand-border"><h3 className="font-bold mb-4">Analisis Pengeluaran</h3><DonutChart data={metrics.expenseDonut} /></div>
            </div>
            <div className="bg-brand-surface p-6 rounded-2xl border border-brand-border">
                <h3 className="font-bold mb-4">Rincian Semua Transaksi</h3>
                <TransactionTable transactions={transactions} projects={projects} cards={cards} pockets={pockets} />
            </div>
        </div>
    );
};

const ClientReport = ({ transactions, clientName, filters, profile, projects, cards, pockets }: { transactions: Transaction[], clientName: string, filters: any, profile: Profile, projects: Project[], cards: any[], pockets: any[] }) => {
    const periodText = `${filters.dateFrom || ''} - ${filters.dateTo || ''}`;
    const income = transactions.filter((t: Transaction) => t.type === TransactionType.INCOME);
    const cost = transactions.filter((t: Transaction) => t.type === TransactionType.EXPENSE && PRODUCTION_COST_CATEGORIES.includes(t.category));
    const totalIncome = income.reduce((s: number, t: Transaction) => s + t.amount, 0);
    const totalCost = cost.reduce((s: number, t: Transaction) => s + t.amount, 0);
    
    const relevantProjects = projects.filter((p: Project) => transactions.some((t: Transaction) => String(t.projectId) === String(p.id)));
    const baseProjectValue = relevantProjects.reduce((sum: number, p: Project) => sum + (p.totalCost - (p.customCosts?.reduce((s: number, c: any) => s + c.amount, 0) || 0) - (Number(p.transportCost) || 0)), 0);
    const totalCustomCosts = relevantProjects.reduce((sum: number, p: Project) => sum + (p.customCosts?.reduce((s: number, c: any) => s + c.amount, 0) || 0), 0);
    const totalTransportFees = relevantProjects.reduce((sum: number, p: Project) => sum + (Number(p.transportCost) || 0), 0);

    return (
        <div className="space-y-6">
            <div className="hidden print:block text-black mb-6">
                <h1 className="text-xl font-bold">{profile.companyName}</h1>
                <p className="text-sm">{profile.address}</p>
                <div className="mt-4 pt-4 border-t-2 border-black">
                    <h2>Laporan Profitabilitas Pengantin</h2>
                    <p>Pengantin: {clientName} | Periode: {periodText}</p>
                </div>
            </div>
            <div className="print:hidden">
                <h2 className="text-2xl font-bold mb-2 text-gradient">Laporan Profitabilitas Pengantin</h2>
                <p className="mb-6 text-brand-text-primary">Pengantin: <span className="font-semibold">{clientName}</span> | Periode: {periodText}</p>
            </div>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard icon={<ArrowUpIcon className="w-6 h-6" />} title="Total Pemasukan" value={formatCurrency(totalIncome)} colorVariant="green" />
                <StatCard icon={<ArrowDownIcon className="w-6 h-6" />} title="Total Biaya Produksi" value={formatCurrency(totalCost)} colorVariant="pink" />
                <StatCard icon={<DollarSignIcon className="w-6 h-6" />} title="Laba Kotor" value={formatCurrency(totalIncome - totalCost)} colorVariant="blue" />
            </div>
            <div className="bg-brand-surface p-6 rounded-2xl border border-brand-border">
                <h3 className="font-bold mb-4">Konfigurasi Biaya Proyek</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="p-4 bg-brand-bg rounded-xl border border-brand-border/50">
                        <p className="text-xs text-brand-text-secondary uppercase font-bold mb-1">Package Utama</p>
                        <p className="text-xl font-bold">{formatCurrency(baseProjectValue)}</p>
                    </div>
                    <div className="p-4 bg-brand-bg rounded-xl border border-brand-border/50">
                        <p className="text-xs text-orange-400 uppercase font-bold mb-1">Biaya Tambahan</p>
                        <p className="text-xl font-bold text-orange-400">+{formatCurrency(totalCustomCosts)}</p>
                    </div>
                    <div className="p-4 bg-brand-bg rounded-xl border border-brand-border/50">
                        <p className="text-xs text-brand-text-secondary uppercase font-bold mb-1">Biaya Transport</p>
                        <p className="text-xl font-bold">{formatCurrency(totalTransportFees)}</p>
                    </div>
                </div>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-brand-surface p-6 rounded-2xl border border-brand-border">
                    <h3 className="font-bold mb-4">Pemasukan</h3>
                    <TransactionTable transactions={income} projects={projects} cards={cards} pockets={pockets} />
                </div>
                <div className="bg-brand-surface p-6 rounded-2xl border border-brand-border">
                    <h3 className="font-bold mb-4">Biaya Produksi</h3>
                    <TransactionTable transactions={cost} projects={projects} cards={cards} pockets={pockets} />
                </div>
            </div>
        </div>
    );
};
