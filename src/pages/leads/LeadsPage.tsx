import React, { useState, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import PageHeader from '@/layouts/PageHeader';
import StatCard from '@/shared/ui/StatCard';
import {
  TargetIcon,
  Share2Icon,
  WhatsappIcon,
  UsersIcon,
  TrendingUpIcon,
} from '@/constants';
import { Lead, LeadSource, LeadStatus } from '@/types';
import { useApp } from '@/app/AppContext';
import { useProfile } from '@/features/settings/api/useProfileQueries';
import {
  useLeads,
  useLeadStats,
  useUpdateLead,
  useConvertLead,
  useDeleteLead,
} from '@/features/leads/api/useLeads';
import LeadsTable from '@/features/leads/components/LeadsTable';
import LeadWhatsappModal from '@/features/leads/components/LeadWhatsappModal';
import LeadShareModal from '@/features/leads/components/LeadShareModal';

const SOURCE_OPTIONS = Object.values(LeadSource);
const STATUS_OPTIONS = Object.values(LeadStatus);

const LeadsPage: React.FC = () => {
  const { showNotification } = useApp();
  const { data: profile } = useProfile();
  const navigate = useNavigate();

  const [search, setSearch] = useState('');
  const [sourceFilter, setSourceFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [cityFilter, setCityFilter] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [whatsappLead, setWhatsappLead] = useState<Lead | null>(null);
  const [isShareOpen, setIsShareOpen] = useState(false);

  const { data: allLeads = [], isLoading } = useLeads({ limit: 500 });
  const { data: stats } = useLeadStats({ dateFrom: dateFrom || undefined, dateTo: dateTo || undefined });

  const updateLead = useUpdateLead();
  const convertLead = useConvertLead();
  const deleteLead = useDeleteLead();

  const formUrl = `${window.location.origin}/#/public-leads`;

  const filteredLeads = useMemo(() => {
    let result = allLeads;

    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(
        (l) =>
          l.name.toLowerCase().includes(q) ||
          l.whatsapp.includes(q) ||
          (l.city || '').toLowerCase().includes(q)
      );
    }
    if (sourceFilter) result = result.filter((l) => l.source === sourceFilter);
    if (statusFilter) result = result.filter((l) => l.status === statusFilter);
    if (cityFilter) result = result.filter((l) => (l.city || '').toLowerCase().includes(cityFilter.toLowerCase()));

    if (dateFrom || dateTo) {
      const from = dateFrom ? new Date(dateFrom) : null;
      const to = dateTo ? new Date(dateTo) : null;
      if (from) from.setHours(0, 0, 0, 0);
      if (to) to.setHours(23, 59, 59, 999);
      result = result.filter((l) => {
        const d = new Date(l.createdAt);
        return (!from || d >= from) && (!to || d <= to);
      });
    }

    return result;
  }, [allLeads, search, sourceFilter, statusFilter, cityFilter, dateFrom, dateTo]);

  const sourceChartData = useMemo(() => {
    const dist = filteredLeads.reduce((acc, l) => {
      acc[l.source] = (acc[l.source] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    return Object.entries(dist).sort(([, a], [, b]) => b - a);
  }, [filteredLeads]);

  // Top cities from ALL leads (not filtered) for the city filter cards
  const topCities = useMemo(() => {
    const dist = allLeads.reduce((acc, l) => {
      const c = (l.city || '').trim();
      if (!c) return acc;
      acc[c] = (acc[c] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    return Object.entries(dist)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 6);
  }, [allLeads]);

  const lostCount = useMemo(
    () => filteredLeads.filter((l) => l.status === LeadStatus.LOST).length,
    [filteredLeads]
  );

  const handleCopyLink = useCallback(() => {
    navigator.clipboard.writeText(formUrl);
    showNotification('Link formulir leads berhasil disalin!');
  }, [formUrl, showNotification]);

  const handleWhatsapp = (lead: Lead) => setWhatsappLead(lead);

  const handleWhatsappSent = async (lead: Lead) => {
    if (lead.status === LeadStatus.NEW) {
      try {
        await updateLead.mutateAsync({ id: lead.id, status: LeadStatus.CONTACTED });
        showNotification('Status lead diperbarui ke Dihubungi.');
      } catch {
        // non-blocking
      }
    }
  };

  const handleStatusChange = async (lead: Lead, status: string) => {
    try {
      await updateLead.mutateAsync({ id: lead.id, status });
      showNotification('Status lead diperbarui.');
    } catch {
      showNotification('Gagal memperbarui status.');
    }
  };

  const handleConvert = async (lead: Lead) => {
    if (!window.confirm(`Konversi "${lead.name}" menjadi klien?`)) return;
    try {
      const result = await convertLead.mutateAsync(lead.id);
      showNotification(`"${lead.name}" berhasil dikonversi ke klien.`);
      if (result.client?.id) {
        navigate(`/clients/${result.client.id}`);
      }
    } catch {
      showNotification('Gagal mengonversi lead ke klien.');
    }
  };

  const handleDelete = async (lead: Lead) => {
    if (!window.confirm(`Hapus lead "${lead.name}"?`)) return;
    try {
      await deleteLead.mutateAsync(lead.id);
      showNotification('Lead berhasil dihapus.');
    } catch {
      showNotification('Gagal menghapus lead.');
    }
  };

  const conversionRate = stats && stats.total > 0
    ? ((stats.converted / stats.total) * 100).toFixed(1) + '%'
    : '0%';

  return (
    <div className="space-y-6">
      <PageHeader
        title="Calon Pengantin Dashboard"
        subtitle="Kelola calon pengantin, analisis sumber leads, dan hubungi langsung via WhatsApp."
        icon={<TargetIcon className="w-6 h-6" />}
      >
        <button
          onClick={() => setIsShareOpen(true)}
          className="px-4 py-2 rounded-xl bg-white/10 text-white border border-white/20 hover:bg-white/20 transition-all text-xs font-bold flex items-center gap-2"
        >
          <Share2Icon className="w-4 h-4" />
          Link Form Publik
        </button>
      </PageHeader>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <StatCard
          icon={<TargetIcon className="w-6 h-6" />}
          title="Total Calon Pengantin"
          value={String(stats?.total ?? filteredLeads.length)}
          iconBgColor="bg-yellow-500/20"
          iconColor="text-yellow-400"
          colorVariant="orange"
        />
        <StatCard
          icon={<WhatsappIcon className="w-6 h-6" />}
          title="Calon Pengantin Baru"
          value={String(stats?.newLeads ?? filteredLeads.filter((l) => l.status === LeadStatus.NEW).length)}
          iconBgColor="bg-blue-500/20"
          iconColor="text-blue-400"
          colorVariant="blue"
        />
        <StatCard
          icon={<UsersIcon className="w-6 h-6" />}
          title="Sudah Jadi Pengantin"
          value={String(stats?.converted ?? filteredLeads.filter((l) => l.status === LeadStatus.CONVERTED).length)}
          iconBgColor="bg-green-500/20"
          iconColor="text-green-400"
          colorVariant="green"
        />
        <StatCard
          icon={<TrendingUpIcon className="w-6 h-6" />}
          title="Tingkat Konversi"
          value={conversionRate}
          iconBgColor="bg-purple-500/20"
          iconColor="text-purple-400"
          colorVariant="purple"
        />
        <StatCard
          icon={
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
            </svg>
          }
          title="Calon Pengantin Hilang"
          value={String(lostCount)}
          iconBgColor="bg-red-500/20"
          iconColor="text-red-400"
          colorVariant="orange"
        />
      </div>

      {/* Top City Filter Cards */}
      {topCities.length > 0 && (
        <div className="bg-brand-surface rounded-2xl border border-brand-border p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-bold text-brand-text-light flex items-center gap-2">
              <svg className="w-4 h-4 text-brand-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              Kota Terbanyak
            </h3>
            {cityFilter && (
              <button
                onClick={() => setCityFilter('')}
                className="text-xs text-brand-accent hover:underline font-medium"
              >
                Reset filter
              </button>
            )}
          </div>
          <div className="flex flex-wrap gap-2">
            {topCities.map(([city, count]) => {
              const isActive = cityFilter.toLowerCase() === city.toLowerCase();
              return (
                <button
                  key={city}
                  onClick={() => setCityFilter(isActive ? '' : city)}
                  className={`flex items-center gap-2 px-3 py-2 rounded-xl border text-xs font-semibold transition-all ${isActive
                    ? 'bg-brand-accent text-white border-brand-accent shadow-md'
                    : 'bg-brand-bg border-brand-border text-brand-text-secondary hover:border-brand-accent hover:text-brand-text-light'
                    }`}
                >
                  <span>{city}</span>
                  <span className={`px-1.5 py-0.5 rounded-md text-[10px] font-bold ${isActive ? 'bg-white/20 text-white' : 'bg-brand-accent/10 text-brand-accent'
                    }`}>
                    {count}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Source Analytics */}
      {sourceChartData.length > 0 && (
        <div className="bg-brand-surface rounded-2xl border border-brand-border p-5">
          <h3 className="text-sm font-bold text-brand-text-light mb-4">Analisis Sumber Leads</h3>
          <div className="space-y-3">
            {sourceChartData.map(([source, count]) => {
              const pct = filteredLeads.length > 0 ? (count / filteredLeads.length) * 100 : 0;
              return (
                <div key={source}>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-brand-text-secondary font-medium">{source}</span>
                    <span className="text-brand-text-primary font-bold">{count} ({pct.toFixed(0)}%)</span>
                  </div>
                  <div className="h-2 bg-brand-bg rounded-full overflow-hidden">
                    <div
                      className="h-full bg-brand-accent rounded-full transition-all"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="bg-brand-surface rounded-2xl border border-brand-border p-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3">
          <input
            type="text"
            placeholder="Cari nama / WA / kota..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="px-3 py-2.5 rounded-xl border border-brand-border bg-brand-bg text-sm text-brand-text-light focus:outline-none focus:ring-2 focus:ring-brand-accent/30"
          />
          <select
            value={sourceFilter}
            onChange={(e) => setSourceFilter(e.target.value)}
            className="px-3 py-2.5 rounded-xl border border-brand-border bg-brand-bg text-sm text-brand-text-light"
          >
            <option value="">Semua Sumber</option>
            {SOURCE_OPTIONS.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2.5 rounded-xl border border-brand-border bg-brand-bg text-sm text-brand-text-light"
          >
            <option value="">Semua Status</option>
            {STATUS_OPTIONS.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
          <input
            type="text"
            placeholder="Filter kota..."
            value={cityFilter}
            onChange={(e) => setCityFilter(e.target.value)}
            className="px-3 py-2.5 rounded-xl border border-brand-border bg-brand-bg text-sm text-brand-text-light"
          />
          <input
            type="date"
            value={dateFrom}
            onChange={(e) => setDateFrom(e.target.value)}
            className="px-3 py-2.5 rounded-xl border border-brand-border bg-brand-bg text-sm text-brand-text-light"
            title="Dari tanggal"
          />
          <input
            type="date"
            value={dateTo}
            onChange={(e) => setDateTo(e.target.value)}
            className="px-3 py-2.5 rounded-xl border border-brand-border bg-brand-bg text-sm text-brand-text-light"
            title="Sampai tanggal"
          />
        </div>
      </div>

      {/* Table */}
      <div className="bg-brand-surface rounded-2xl border border-brand-border overflow-hidden">
        <div className="px-5 py-4 border-b border-brand-border">
          <h3 className="font-bold text-brand-text-light">
            Daftar Leads ({filteredLeads.length})
          </h3>
        </div>
        <LeadsTable
          leads={filteredLeads}
          onWhatsapp={handleWhatsapp}
          onConvert={handleConvert}
          onDelete={handleDelete}
          onStatusChange={handleStatusChange}
          isLoading={isLoading}
        />
      </div>

      {whatsappLead && (
        <LeadWhatsappModal
          lead={whatsappLead}
          profile={profile}
          onClose={() => setWhatsappLead(null)}
          onSent={() => handleWhatsappSent(whatsappLead)}
          showNotification={showNotification}
        />
      )}

      <LeadShareModal
        isOpen={isShareOpen}
        onClose={() => setIsShareOpen(false)}
        formUrl={formUrl}
        onCopy={handleCopyLink}
      />
    </div>
  );
};

export default LeadsPage;
