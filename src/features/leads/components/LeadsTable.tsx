import React from 'react';
import { Lead, LeadSource, LeadStatus } from '@/types';
import { Table, TableHead, TableBody, TableRow, TableHeaderCell, TableCell, TableContainer } from '@/shared/ui/Table';
import { WhatsappIcon, Trash2Icon, UsersIcon } from '@/constants';

const SOURCE_COLORS: Record<string, string> = {
  [LeadSource.FRIENDS_FAMILY]: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
  [LeadSource.INSTAGRAM]: 'bg-pink-500/20 text-pink-400 border-pink-500/30',
  [LeadSource.TIKTOK]: 'bg-slate-500/20 text-slate-300 border-slate-500/30',
  [LeadSource.ADS]: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
};

const STATUS_COLORS: Record<string, string> = {
  [LeadStatus.NEW]: 'bg-yellow-500/20 text-yellow-400',
  [LeadStatus.CONTACTED]: 'bg-blue-500/20 text-blue-400',
  [LeadStatus.CONVERTED]: 'bg-green-500/20 text-green-400',
  [LeadStatus.LOST]: 'bg-red-500/20 text-red-400',
};

interface LeadsTableProps {
  leads: Lead[];
  onWhatsapp: (lead: Lead) => void;
  onConvert: (lead: Lead) => void;
  onDelete: (lead: Lead) => void;
  onStatusChange: (lead: Lead, status: string) => void;
  isLoading?: boolean;
}

const formatDate = (iso: string) => {
  if (!iso) return '-';
  return new Date(iso).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });
};

const LeadsTable: React.FC<LeadsTableProps> = ({
  leads,
  onWhatsapp,
  onConvert,
  onDelete,
  onStatusChange,
  isLoading,
}) => {
  if (isLoading) {
    return (
      <div className="p-8 text-center text-brand-text-secondary animate-pulse">
        Memuat data leads...
      </div>
    );
  }

  if (leads.length === 0) {
    return (
      <div className="p-12 text-center text-brand-text-secondary">
        <p className="font-semibold text-brand-text-primary mb-1">Belum ada leads</p>
        <p className="text-sm">Bagikan link formulir publik untuk mulai menerima calon pengantin.</p>
      </div>
    );
  }

  return (
    <TableContainer>
      <Table hover>
        <TableHead>
          <TableRow>
            <TableHeaderCell>Nama</TableHeaderCell>
            <TableHeaderCell>Kota</TableHeaderCell>
            <TableHeaderCell>WhatsApp</TableHeaderCell>
            <TableHeaderCell>Sumber</TableHeaderCell>
            <TableHeaderCell>Tanggal</TableHeaderCell>
            <TableHeaderCell>Status</TableHeaderCell>
            <TableHeaderCell className="text-right">Aksi</TableHeaderCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {leads.map((lead) => (
            <TableRow key={lead.id}>
              <TableCell className="font-semibold text-brand-text-light">{lead.name}</TableCell>
              <TableCell>{lead.city || '-'}</TableCell>
              <TableCell className="font-mono text-sm">{lead.whatsapp}</TableCell>
              <TableCell>
                <span className={`inline-flex px-2.5 py-1 rounded-lg text-xs font-bold border ${SOURCE_COLORS[lead.source] || 'bg-gray-500/20 text-gray-400'}`}>
                  {lead.source}
                </span>
              </TableCell>
              <TableCell className="text-brand-text-secondary text-sm">{formatDate(lead.createdAt)}</TableCell>
              <TableCell>
                <select
                  value={lead.status}
                  onChange={(e) => onStatusChange(lead, e.target.value)}
                  className={`text-xs font-bold px-2 py-1 rounded-lg border-0 cursor-pointer ${STATUS_COLORS[lead.status] || ''} bg-transparent`}
                >
                  {Object.values(LeadStatus).map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </TableCell>
              <TableCell>
                <div className="flex items-center justify-end gap-1">
                  <button
                    onClick={() => onWhatsapp(lead)}
                    className="p-2 rounded-lg bg-green-500/10 text-green-400 hover:bg-green-500/20 transition-colors"
                    title="Chat WhatsApp"
                  >
                    <WhatsappIcon className="w-4 h-4" />
                  </button>
                  {lead.status !== LeadStatus.CONVERTED && (
                    <button
                      onClick={() => onConvert(lead)}
                      className="p-2 rounded-lg bg-brand-accent/10 text-brand-accent hover:bg-brand-accent/20 transition-colors"
                      title="Konversi ke Klien"
                    >
                      <UsersIcon className="w-4 h-4" />
                    </button>
                  )}
                  <button
                    onClick={() => onDelete(lead)}
                    className="p-2 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-colors"
                    title="Hapus"
                  >
                    <Trash2Icon className="w-4 h-4" />
                  </button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
};

export default LeadsTable;
