import React from 'react';
import { Project, Client, BookingStatus } from '@/types';
import { PencilIcon, Trash2Icon, WhatsappIcon, EyeIcon, CheckCircleIcon } from '@/constants';
import { formatCurrency, formatDate } from '@/features/booking/utils/booking.utils';

interface BookingTableProps {
    title: string;
    bookings: { lead: any; project: Project }[];
    clients: Client[];
    onEdit: (clientId: string) => void;
    onDelete: (projectId: string, clientName: string) => void;
    onStatusChange?: (projectId: string, status: BookingStatus) => void;
    onViewProof?: (url: string) => void;
    onOpenWhatsapp?: (project: Project, client: Client) => void;
    onViewDetail?: (clientId: string) => void;
    isNewSection?: boolean;
    dateFilters?: {
        from: string;
        to: string;
        onFromChange: (val: string) => void;
        onToChange: (val: string) => void;
    };
}

const BookingTable: React.FC<BookingTableProps> = ({
    title,
    bookings,
    clients,
    onEdit,
    onDelete,
    onStatusChange,
    onViewProof,
    onOpenWhatsapp,
    onViewDetail,
    isNewSection,
    dateFilters
}) => {
    return (
        <div className="bg-brand-surface rounded-2xl shadow-lg border border-brand-border h-full">
            <div className="p-4 border-b border-brand-border flex justify-between items-center">
                <h3 className="font-semibold text-brand-text-light">{title} ({bookings.length})</h3>
            </div>
            
            {dateFilters && (
                <div className="p-4 flex items-center gap-4">
                    <input 
                        type="date" 
                        value={dateFilters.from} 
                        onChange={e => dateFilters.onFromChange(e.target.value)} 
                        className="input-field !rounded-lg !border !bg-brand-bg p-2.5 w-full" 
                        placeholder="Dari Tanggal" 
                    />
                    <input 
                        type="date" 
                        value={dateFilters.to} 
                        onChange={e => dateFilters.onToChange(e.target.value)} 
                        className="input-field !rounded-lg !border !bg-brand-bg p-2.5 w-full" 
                        placeholder="Sampai Tanggal" 
                    />
                </div>
            )}

            {/* Mobile cards */}
            <div className="md:hidden p-4 space-y-3">
                {bookings.map(booking => {
                    const client = clients.find(c => String(c.id) === String(booking.project.clientId));
                    return (
                        <div key={booking.project.id} className="rounded-2xl bg-brand-surface border border-brand-border p-4 shadow-sm">
                            <div className="flex items-start justify-between">
                                <div>
                                    <p className="font-semibold text-brand-text-light leading-tight">{booking.project.clientName}</p>
                                    <p className="text-xs text-brand-text-secondary mt-0.5">{booking.project.projectName}</p>
                                    <p className="text-[11px] text-brand-text-secondary mt-1">{formatDate(booking.lead.date)} • <span className="inline-flex rounded-full bg-blue-600 px-2 py-0.5 text-[10px] font-black uppercase text-white">{booking.project.projectType}</span></p>
                                </div>
                                <div className="text-right">
                                    <p className="text-sm font-semibold">{booking.project.packageName}</p>
                                    <p className="text-xs text-brand-text-secondary">{booking.project.location}</p>
                                </div>
                            </div>
                            <div className="mt-3 grid grid-cols-2 gap-y-2 text-sm">
                                <span className="text-brand-text-secondary">Total Biaya</span>
                                <span className="text-right font-semibold">{formatCurrency(booking.project.totalCost)}</span>
                                <span className="text-brand-text-secondary">DP Dibayar</span>
                                <span className="text-right font-semibold text-green-400">{formatCurrency(booking.project.amountPaid)}</span>
                            </div>
                            <div className="mt-3 flex items-center justify-end gap-1.5 flex-wrap">
                                {booking.project.dpProofUrl && (
                                    <button onClick={() => onViewProof?.(booking.project.dpProofUrl!)} className="inline-flex items-center space-x-1 px-2.5 py-1.5 rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-all text-[10px] font-bold shadow-sm" title="Lihat Bukti Bayar">
                                        <EyeIcon className="w-3.5 h-3.5" />
                                        <span>Bukti</span>
                                    </button>
                                )}
                                {onOpenWhatsapp && client && (
                                    <button onClick={() => onOpenWhatsapp(booking.project, client)} className="inline-flex items-center space-x-1 px-2.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 transition-colors text-[10px] font-bold text-white shadow-sm" title="WhatsApp">
                                        <WhatsappIcon className="w-3.5 h-3.5" /> 
                                        <span>WA</span>
                                    </button>
                                )}
                                <button onClick={() => onEdit(booking.project.clientId)} className="inline-flex items-center space-x-1 px-2.5 py-1.5 rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-all text-[10px] font-bold shadow-sm" title="Edit">
                                    <PencilIcon className="w-3.5 h-3.5" />
                                    <span>Edit</span>
                                </button>
                                <button onClick={() => onDelete(booking.project.id, booking.project.clientName)} className="inline-flex items-center space-x-1 px-2.5 py-1.5 rounded-lg bg-red-600 text-white hover:bg-red-700 transition-all text-[10px] font-bold shadow-sm" title="Hapus">
                                    <Trash2Icon className="w-3.5 h-3.5" />
                                    <span>Hapus</span>
                                </button>
                                {isNewSection && onStatusChange && (
                                    <button onClick={() => onStatusChange(booking.project.id, BookingStatus.TERKONFIRMASI)} className="inline-flex items-center space-x-1 px-2.5 py-1.5 rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 transition-all text-[10px] font-bold shadow-sm">
                                        <CheckCircleIcon className="w-3.5 h-3.5" />
                                        <span>Konfirmasi</span>
                                    </button>
                                )}
                                {!isNewSection && onViewDetail && (
                                    <button onClick={() => onViewDetail(booking.project.clientId)} className="inline-flex items-center space-x-1 px-2.5 py-1.5 rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-all text-[10px] font-bold shadow-sm">
                                        <EyeIcon className="w-3.5 h-3.5" />
                                        <span>Detail</span>
                                    </button>
                                )}
                            </div>
                        </div>
                    );
                })}
                {bookings.length === 0 && (
                    <p className="text-center py-6 text-sm text-brand-text-secondary">Tidak ada booking {isNewSection ? 'baru' : ''} yang tersedia.</p>
                )}
            </div>

            {/* Desktop table */}
            <div className="hidden md:block overflow-x-auto">
                <table className="w-full text-sm text-left">
                    <thead className="text-[10px] tracking-wider text-slate-700 uppercase bg-slate-100">
                        <tr>
                            <th className="px-4 py-3.5 font-bold border-r border-slate-300">Tanggal Booking</th>
                            <th className="px-4 py-3.5 font-bold border-r border-slate-300">Nama Pengantin</th>
                            <th className="px-4 py-3.5 font-bold border-r border-slate-300">Nama Acara</th>
                            <th className="px-4 py-3.5 font-bold border-r border-slate-300">Jenis Acara</th>
                            <th className="px-4 py-3.5 font-bold border-r border-slate-300">Lokasi</th>
                            <th className="px-4 py-3.5 font-bold border-r border-slate-300">Package</th>
                            <th className="px-4 py-3.5 text-right font-bold border-r border-slate-300">Total Biaya</th>
                            <th className="px-4 py-3.5 text-right font-bold border-r border-slate-300">DP Dibayar</th>
                            <th className="px-4 py-3.5 text-center font-bold border-r border-slate-300">Bukti Bayar</th>
                            <th className="px-4 py-3.5 text-center font-bold">Aksi</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white/40 divide-y divide-slate-300">
                        {bookings.map(booking => {
                            const client = clients.find(c => String(c.id) === String(booking.project.clientId));
                            return (
                                <tr key={booking.project.id} className="hover:bg-brand-input/40 transition-colors">
                                    <td className="px-4 py-3.5 whitespace-nowrap text-brand-text-primary border-r border-slate-300">{formatDate(booking.lead.date)}</td>
                                    <td className="px-4 py-3.5 font-semibold text-brand-text-light border-r border-slate-300">{booking.project.clientName}</td>
                                    <td className="px-4 py-3.5 text-brand-text-primary border-r border-slate-300">{booking.project.projectName}</td>
                                    <td className="px-4 py-3.5 border-r border-slate-300">
                                        <span className="inline-flex rounded-full bg-blue-600 px-2.5 py-1 text-[10px] font-black uppercase tracking-wider text-white">{booking.project.projectType}</span>
                                    </td>
                                    <td className="px-4 py-3.5 text-brand-text-secondary border-r border-slate-300">{booking.project.location}</td>
                                    <td className="px-4 py-3.5 text-brand-text-secondary border-r border-slate-300">{booking.project.packageName}</td>
                                    <td className="px-4 py-3.5 text-right font-semibold text-brand-text-light border-r border-slate-300">{formatCurrency(booking.project.totalCost)}</td>
                                    <td className="px-4 py-3.5 text-right font-semibold text-brand-success border-r border-slate-300">{formatCurrency(booking.project.amountPaid)}</td>
                                    <td className="px-4 py-3.5 text-center border-r border-slate-300">
                                        {booking.project.dpProofUrl ? (
                                            <button
                                                onClick={() => onViewProof?.(booking.project.dpProofUrl!)}
                                                className="inline-flex items-center space-x-1.5 px-2.5 py-1.5 rounded-lg bg-brand-accent text-white hover:bg-brand-accent-hover transition-all text-[11px] font-semibold shadow-sm"
                                                title="Lihat Bukti Bayar"
                                            >
                                                <EyeIcon className="w-3.5 h-3.5" />
                                                <span>Bukti</span>
                                            </button>
                                        ) : (
                                            <span className="text-brand-text-secondary">-</span>
                                        )}
                                    </td>
                                    <td className="px-4 py-3.5 text-center">
                                        <div className="flex items-center justify-center space-x-2">
                                            {isNewSection && onStatusChange ? (
                                                <button
                                                    onClick={() => onStatusChange(booking.project.id, BookingStatus.TERKONFIRMASI)}
                                                    className="inline-flex items-center space-x-1 px-3 py-1.5 rounded-lg bg-brand-success text-white hover:bg-green-700 transition-all text-xs font-bold shadow-sm"
                                                    title="Konfirmasi Booking"
                                                >
                                                    <CheckCircleIcon className="w-3.5 h-3.5" />
                                                    <span>Konfirmasi</span>
                                                </button>
                                            ) : (
                                                onViewDetail && (
                                                    <button
                                                        onClick={() => onViewDetail(booking.project.clientId)}
                                                        className="inline-flex items-center space-x-1 px-3 py-1.5 rounded-lg bg-brand-surface border border-brand-border text-brand-text-primary hover:bg-brand-input transition-all text-xs font-bold"
                                                        title="Lihat Detail Pengantin"
                                                    >
                                                        <EyeIcon className="w-3.5 h-3.5" />
                                                        <span>Detail</span>
                                                    </button>
                                                )
                                            )}

                                            {/* Dropdown context menu for secondary actions */}
                                            <details className="relative inline-block text-left">
                                                <summary className="list-none inline-flex h-8 w-8 cursor-pointer items-center justify-center rounded-lg text-brand-text-secondary hover:bg-brand-input hover:text-brand-text-primary transition-all">
                                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h.01M12 12h.01M19 12h.01M6 12a1 1 0 11-2 0 1 1 0 012 0zm7 0a1 1 0 11-2 0 1 1 0 012 0zm7 0a1 1 0 11-2 0 1 1 0 012 0z" />
                                                    </svg>
                                                </summary>
                                                <div className="absolute right-0 z-30 mt-1.5 w-40 origin-top-right rounded-xl border border-brand-border bg-brand-surface p-1 text-left shadow-xl animate-in fade-in zoom-in-95 duration-100">
                                                    <button
                                                        onClick={() => onEdit(booking.project.clientId)}
                                                        className="w-full flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-semibold text-brand-text-primary hover:bg-brand-input transition-colors"
                                                    >
                                                        <PencilIcon className="w-3.5 h-3.5 text-brand-text-secondary" />
                                                        <span>Edit Booking</span>
                                                    </button>
                                                    
                                                    {onOpenWhatsapp && client && (
                                                        <button
                                                            onClick={() => onOpenWhatsapp(booking.project, client)}
                                                            className="w-full flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-semibold text-brand-text-primary hover:bg-brand-input transition-colors"
                                                        >
                                                            <WhatsappIcon className="w-3.5 h-3.5 text-brand-success" />
                                                            <span>Chat WhatsApp</span>
                                                        </button>
                                                    )}
                                                    
                                                    <hr className="my-1 border-brand-border/60" />
                                                    
                                                    <button
                                                        onClick={() => onDelete(booking.project.id, booking.project.clientName)}
                                                        className="w-full flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-semibold bg-red-600 text-white hover:bg-red-700 transition-colors"
                                                    >
                                                        <Trash2Icon className="w-3.5 h-3.5 text-brand-danger" />
                                                        <span>Hapus Booking</span>
                                                    </button>
                                                </div>
                                            </details>
                                        </div>
                                    </td>
                                </tr>
                            );
                        })}
                        {bookings.length === 0 && (
                            <tr>
                                <td colSpan={10} className="text-center py-8 text-brand-text-secondary">Tidak ada booking {isNewSection ? 'baru' : ''} yang tersedia.</td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default BookingTable;
