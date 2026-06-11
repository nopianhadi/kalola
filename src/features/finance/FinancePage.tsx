import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import {
    FileTextIcon, ClipboardListIcon, CreditCardIcon,
    TrendingUpIcon, BarChart2Icon, DollarSignIcon
} from 'lucide-react';
import { FinanceTab } from '@/features/finance/types/finance.types';
import { useFinanceData } from '@/features/finance/hooks/useFinanceData';
import { useFinanceFilterState, useFinanceFilterLogic } from '@/features/finance/hooks/useFinanceFilters';
import { useFinanceActions } from '@/features/finance/hooks/useFinanceActions';
import { useFinanceAnalytics } from '@/features/finance/hooks/useFinanceAnalytics';
import { getMonthDateRange } from '@/features/finance/utils/finance.utils';
import { useProjects } from '@/features/projects/api/useProjects';
import { useProfile } from '@/features/settings/api/useProfileQueries';



// Components
import { FinanceHeader } from '@/features/finance/components/FinanceHeader';
import { FinanceStats } from '@/features/finance/components/FinanceStats';
import { TransactionList } from '@/features/finance/components/TransactionList';
import { PocketGrid } from '@/features/finance/components/PocketGrid';
import { CardGrid } from '@/features/finance/components/CardGrid';
import { CashflowView } from '@/features/finance/components/CashflowView';
import { ReportView } from '@/features/finance/components/ReportView';
import { CardReportTab } from '@/features/finance/components/CardReportTab';
import { ProfitabilityReportView } from '@/features/finance/components/ProfitabilityReportView';
import { FinanceModals } from '@/features/finance/components/FinanceModals';
import Modal from '@/shared/ui/Modal';

export const FinancePage: React.FC = () => {
    const location = useLocation();
    // Fetch local data (replaces god context props)
    const { data: profileData } = useProfile();
    const { data: projectsData } = useProjects({ limit: 100 });

    const profile = profileData || ({
        incomeCategories: [],
        expenseCategories: [],
        projectStatusConfig: [],
    } as any);
    const projects = projectsData || [];

    // State
    const [activeTab, setActiveTab] = useState<FinanceTab>('transactions');
    const [isInfoModalOpen, setIsInfoModalOpen] = useState(false);
    const [, setHistoryModalState] = useState<any>(null);
    const [reportFilters, setReportFilters] = useState({ client: 'all', ...getMonthDateRange(new Date()) });
    const [profitReportFilters, setProfitReportFilters] = useState({ month: new Date().getMonth(), year: new Date().getFullYear() });

    // Hooks
    const {
        filters, handleFilterChange, categoryFilter, setCategoryFilter,
        page, setPage, limit
    } = useFinanceFilterState();

    // Reset page on filter change
    React.useEffect(() => {
        setPage(1);
    }, [filters, categoryFilter]);

    // Data fetching
    const { transactions, totalTransactions, pockets, cards, summary, isLoading } = useFinanceData({
        page,
        limit,
        search: filters.searchTerm,
        filters: {
            type: categoryFilter.type === 'all' ? undefined : categoryFilter.type,
            category: categoryFilter.category === 'Semua' ? undefined : categoryFilter.category,
            dateFrom: filters.dateFrom,
            dateTo: filters.dateTo
        }
    });

    // Derived logic
    const { filteredTransactions, categoryTotals, filteredSummary } = useFinanceFilterLogic({
        transactions: transactions || [],
        filters,
        categoryFilter
    });

    const actions = useFinanceActions();

    useEffect(() => {
        if (location.state?.onboarding && location.state?.focus === 'cards') {
            setActiveTab('cards');
            actions.handleOpenModal('card', 'add');
        }
    }, [location.state, actions]);

    const analytics = useFinanceAnalytics({
        transactions, pockets, cards, projects, profile,
        filteredTransactions, reportFilters, profitReportFilters
    });

    const downloadCsv = (filename: string, rows: Array<Record<string, unknown>>) => {
        if (rows.length === 0) return;

        const headers = Object.keys(rows[0]);
        const escapeCell = (value: unknown) => {
            const text = String(value ?? '');
            return `"${text.replace(/"/g, '""')}"`;
        };
        const csv = [
            headers.join(','),
            ...rows.map(row => headers.map(header => escapeCell(row[header])).join(','))
        ].join('\n');

        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = filename;
        link.click();
        URL.revokeObjectURL(url);
    };

    const downloadTransactionsCsv = () => {
        downloadCsv('transaksi-keuangan.csv', filteredTransactions.map(tx => ({
            tanggal: tx.date,
            tipe: tx.type,
            kategori: tx.category,
            deskripsi: tx.description,
            metode: tx.method,
            jumlah: tx.amount,
        })));
    };

    const downloadReportCsv = () => {
        downloadCsv('laporan-keuangan.csv', analytics.reportTransactions.map(tx => ({
            tanggal: tx.date,
            tipe: tx.type,
            kategori: tx.category,
            deskripsi: tx.description,
            metode: tx.method,
            jumlah: tx.amount,
        })));
    };

    const downloadProfitCsv = () => {
        downloadCsv('laporan-laba-pengantin.csv', analytics.projectProfitabilityData.map(item => ({
            pengantin: item.clientName,
            package: item.totalPackageRevenue,
            tambahan: item.totalCustomCosts,
            transport: item.totalTransportCosts,
            terbayar: item.totalIncome,
            biaya_produksi: item.totalCost,
            laba: item.profit,
        })));
    };

    const renderTabContent = () => {
        switch (activeTab) {
            case 'transactions':
                return (
                    <TransactionList
                        transactions={transactions}
                        filteredTransactions={filteredTransactions}
                        projects={projects}
                        cards={cards}
                        pockets={pockets}
                        filters={filters}
                        onFilterChange={handleFilterChange}
                        categoryFilter={categoryFilter}
                        onCategoryFilterChange={setCategoryFilter}
                        categoryTotals={categoryTotals}
                        onDownloadCSV={downloadTransactionsCsv}
                        onEdit={(t) => actions.handleOpenModal('transaction', 'edit', t)}
                        onDelete={(id) => actions.handleDelete('transaction', id)}
                        // Pagination
                        page={page}
                        setPage={setPage}
                        limit={limit}
                        totalItems={totalTransactions}
                        isLoading={isLoading}
                        onCloseBudget={() => { }} // Placeholder
                    />
                );
            case 'pockets':
                return (
                    <PocketGrid
                        pockets={pockets}
                        cards={cards}
                        summary={summary}
                        onWithdraw={(p) => actions.handleOpenModal('transfer', 'add', { ...p, type: 'withdraw' })}
                        onDeposit={(p) => actions.handleOpenModal('transfer', 'add', { ...p, type: 'deposit' })}
                        onEdit={(p) => actions.handleOpenModal('pocket', 'edit', p)}
                        onDelete={(id) => actions.handleDelete('pocket', id)}
                        onAddPocket={() => actions.handleOpenModal('pocket', 'add')}
                        onViewHistory={(p) => setHistoryModalState({ type: 'pocket', item: p })}
                    />
                );
            case 'cards':
                return (
                    <CardGrid
                        cards={cards}

                        stats={analytics.cardStats}
                        onEdit={(c) => actions.handleOpenModal('card', 'edit', c)}
                        onDelete={(id) => actions.handleDelete('card', id)}
                        onAddCard={() => actions.handleOpenModal('card', 'add')}
                        onTopUp={() => actions.handleOpenModal('topup-cash', 'add')}
                        onViewHistory={(c) => setHistoryModalState({ type: 'card', item: c })}
                    />
                );
            case 'cashflow':
                return (
                    <CashflowView
                        metrics={analytics.cashflowMetrics}
                        netProfit={filteredSummary.net}
                        chartData={analytics.cashflowChartData}
                        expenseDonutData={analytics.expenseDonutData}
                    />
                );
            case 'laporan':
                return (
                    <ReportView
                        reportFilters={reportFilters}
                        setReportFilters={setReportFilters}
                        clientOptions={analytics.reportClientOptions}
                        reportTransactions={analytics.reportTransactions}
                        metrics={analytics.generalReportMetrics}
                        profile={profile}
                        projects={projects}
                        cards={cards}
                        pockets={pockets}
                        onDownloadCSV={downloadReportCsv}
                    />
                );
            case 'laporanKartu':
                return <CardReportTab transactions={transactions} cards={cards} profile={profile} projects={projects} pockets={pockets} />;
            case 'labaProject':
                return (
                    <ProfitabilityReportView
                        filters={profitReportFilters}
                        setFilters={setProfitReportFilters}
                        metrics={analytics.profitReportMetrics}
                        data={analytics.projectProfitabilityData}
                        profile={profile}
                        projects={projects}
                        onDownloadCSV={downloadProfitCsv}
                    />
                );
            default:
                return null;
        }
    };

    const tabs = [
        { id: 'transactions', label: 'Transaksi', icon: FileTextIcon },
        { id: 'pockets', label: 'Kantong', icon: ClipboardListIcon },
        { id: 'cards', label: 'Kartu Bank dan Tunai Vendor', icon: CreditCardIcon },
        { id: 'cashflow', label: 'Arus Kas', icon: TrendingUpIcon },
        { id: 'laporan', label: 'Laporan Umum', icon: BarChart2Icon },
        { id: 'laporanKartu', label: 'Laporan Kartu', icon: CreditCardIcon },
        { id: 'labaProject', label: 'Laba Proyek', icon: DollarSignIcon },
    ];

    return (
        <div className="space-y-6">
            <FinanceHeader
                onAddTransaction={() => actions.handleOpenModal('transaction', 'add')}
                onOpenInfoModal={() => setIsInfoModalOpen(true)}
            />

            <FinanceStats
                summary={summary}
                onStatClick={(type) => {
                    if (type === 'assets' || type === 'pockets') setActiveTab('cards');
                    else setActiveTab('transactions');
                }}
            />

            {/* Tab Navigation */}
            <div className="border-b border-brand-border non-printable widget-animate">
                <nav className="-mb-px flex space-x-6 overflow-x-auto scrollbar-hide">
                    {tabs.map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id as FinanceTab)}
                            className={`shrink-0 inline-flex items-center gap-2 py-3 px-1 border-b-2 font-medium text-sm transition-colors ${String(activeTab) === String(tab.id) ? 'border-brand-accent text-brand-accent' : 'border-transparent text-brand-text-secondary hover:text-brand-text-light'}`}
                        >
                            <tab.icon className="w-5 h-5" />
                            {tab.label}
                        </button>
                    ))}
                </nav>
            </div>

            <div className="widget-animate">
                {renderTabContent()}
            </div>

            {/* Shared Modals */}
            <FinanceModals
                modalState={actions.modalState}
                onClose={actions.handleCloseModal}
                form={actions.form}
                setForm={actions.setForm}
                onFormChange={actions.handleFormChange}
                onSubmit={actions.handleSubmit}
                cards={cards}
                pockets={pockets}
                projects={projects}
                profile={profile}
            />

            <Modal isOpen={isInfoModalOpen} onClose={() => setIsInfoModalOpen(false)} title="Panduan Halaman Keuangan">
                <div className="space-y-4 text-sm text-brand-text-primary">
                    <p>Halaman ini adalah pusat komando Keuangan bisnis Anda. Gunakan berbagai tab untuk mendapatkan gambaran lengkap.</p>
                    <ul className="list-disc list-inside space-y-2">
                        <li><strong>Transaksi:</strong> Catat semua pemasukan dan pengeluaran. Gunakan filter untuk menganalisis per kategori.</li>
                        <li><strong>Kantong:</strong> Alokasikan dana virtual untuk tabungan alat atau anggaran operasional.</li>
                        <li><strong>Kartu Bank dan Tunai Vendor:</strong> Lacak saldo di semua akun bank, kartu kredit, dan kas tunai.</li>
                        <li><strong>Arus Kas:</strong> Lihat tren tren pemasukan dan pengeluaran secara visual.</li>
                        <li><strong>Laporan:</strong> Hasilkan laporan profesional per proyek atau per periode.</li>
                    </ul>
                </div>
            </Modal>
        </div>
    );
};

export default FinancePage;
