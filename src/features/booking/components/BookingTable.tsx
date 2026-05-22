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
                        <div key={booking.project.id} className="rounded-2xl bg-white/5 border border-brand-border p-4 shadow-sm">
                            <div className="flex items-start justify-between">
                                <div>
                                    <p className="font-semibold text-brand-text-light leading-tight">{booking.project.clientName}</p>
                                    <p className="text-xs text-brand-text-secondary mt-0.5">{booking.project.projectName}</p>
                                    <p className="text-[11px] text-brand-text-secondary mt-1">{formatDate(booking.lead.date)} • {booking.project.projectType}</p>
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
                                    <button onClick={() => onViewProof?.(booking.project.dpProofUrl!)} className="inline-flex items-center space-x-1 px-2.5 py-1.5 rounded-lg bg-blue-600/10 text-blue-400 hover:bg-blue-600 hover:text-white transition-all text-[10px] font-bold shadow-sm" title="Lihat Bukti Bayar">
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
                                <button onClick={() => onEdit(booking.project.clientId)} className="inline-flex items-center space-x-1 px-2.5 py-1.5 rounded-lg bg-blue-600/10 text-blue-400 hover:bg-blue-600 hover:text-white transition-all text-[10px] font-bold shadow-sm" title="Edit">
                                    <PencilIcon className="w-3.5 h-3.5" />
                                    <span>Edit</span>
                                </button>
                                <button onClick={() => onDelete(booking.project.id, booking.project.clientName)} className="inline-flex items-center space-x-1 px-2.5 py-1.5 rounded-lg bg-red-600/10 text-red-500 hover:bg-red-600 hover:text-white transition-all text-[10px] font-bold shadow-sm" title="Hapus">
                                    <Trash2Icon className="w-3.5 h-3.5" />
                                    <span>Hapus</span>
                                </button>
                                {isNewSection && onStatusChange && (
                                    <button onClick={() => onStatusChange(booking.project.id, BookingStatus.TERKONFIRMASI)} className="inline-flex items-center space-x-1 px-2.5 py-1.5 rounded-lg bg-emerald-600/10 text-emerald-500 hover:bg-emerald-600 hover:text-white transition-all text-[10px] font-bold shadow-sm">
                                        <CheckCircleIcon className="w-3.5 h-3.5" />
                                        <span>Konfirmasi</span>
                                    </button>
                                )}
                                {!isNewSection && onViewDetail && (
                                    <button onClick={() => onViewDetail(booking.project.clientId)} className="inline-flex items-center space-x-1 px-2.5 py-1.5 rounded-lg bg-blue-600/10 text-blue-400 hover:bg-blue-600 hover:text-white transition-all text-[10px] font-bold shadow-sm">
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
                    <thead className="text-xs text-blue-800 uppercase bg-blue-100">
                        <tr>
                            <th className="px-4 py-3 border-r border-blue-200">Tanggal Booking</th>
                            <th className="px-4 py-3 border-r border-blue-200">Nama Pengantin</th>
                            <th className="px-4 py-3 border-r border-blue-200">Nama Acara</th>
                            <th className="px-4 py-3 border-r border-blue-200">Jenis Acara</th>
                            <th className="px-4 py-3 border-r border-blue-200">Lokasi</th>
                            <th className="px-4 py-3 border-r border-blue-200">Package</th>
                            <th className="px-4 py-3 text-right border-r border-blue-200">Total Biaya</th>
                            <th className="px-4 py-3 text-right border-r border-blue-200">DP Dibayar</th>
                            <th className="px-4 py-3 text-center border-r border-blue-200">Bukti Bayar</th>
                            <th className="px-4 py-3 text-center">Aksi</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-blue-200">
                        {bookings.map(booking => {
                            const client = clients.find(c => String(c.id) === String(booking.project.clientId));
                            return (
                                <tr key={booking.project.id} className="hover:bg-brand-bg transition-colors">
                                    <td className="px-4 py-3 whitespace-nowrap border-r border-blue-200">{formatDate(booking.lead.date)}</td>
                                    <td className="px-4 py-3 font-semibold text-brand-text-light border-r border-blue-200">{booking.project.clientName}</td>
                                    <td className="px-4 py-3 border-r border-blue-200">{booking.project.projectName}</td>
                                    <td className="px-4 py-3 border-r border-blue-200">{booking.project.projectType}</td>
                                    <td className="px-4 py-3 border-r border-blue-200">{booking.project.location}</td>
                                    <td className="px-4 py-3 border-r border-blue-200">{booking.project.packageName}</td>
                                    <td className="px-4 py-3 text-right font-semibold border-r border-blue-200">{formatCurrency(booking.project.totalCost)}</td>
                                    <td className="px-4 py-3 text-right font-semibold text-green-400 border-r border-blue-200">{formatCurrency(booking.project.amountPaid)}</td>
                                    <td className="px-4 py-3 text-center border-r border-blue-200">
                                        {booking.project.dpProofUrl ? (
                                            <button
                                                onClick={() => onViewProof?.(booking.project.dpProofUrl!)}
                                                className="inline-flex items-center space-x-1.5 px-2.5 py-1.5 rounded-lg bg-blue-600/10 text-blue-400 hover:bg-blue-600 hover:text-white transition-all shadow-sm group"
                                                title="Lihat Bukti Bayar"
                                            >
                                                <EyeIcon className="w-4 h-4" />
                                                <span className="text-xs font-bold">Lihat Bukti</span>
                                            </button>
                                        ) : (
                                            <span className="text-brand-text-secondary">-</span>
                                        )}
                                    </td>
                                    <td className="px-4 py-3 text-center">
                                        <div className="flex items-center justify-center space-x-1.5">
                                            <button onClick={() => onEdit(booking.project.clientId)} className="inline-flex items-center space-x-1.5 px-2.5 py-1.5 rounded-lg bg-blue-600/10 text-blue-400 hover:bg-blue-600 hover:text-white transition-all shadow-sm group" title="Edit Booking">
                                                <PencilIcon className="w-4 h-4" />
                                                <span className="text-xs font-bold">Edit</span>
                                            </button>
                                            <button onClick={() => onDelete(booking.project.id, booking.project.clientName)} className="inline-flex items-center space-x-1.5 px-2.5 py-1.5 rounded-lg bg-red-600/10 text-red-500 hover:bg-red-600 hover:text-white transition-all shadow-sm group" title="Hapus Booking">
                                                <Trash2Icon className="w-4 h-4" />
                                                <span className="text-xs font-bold">Hapus</span>
                                            </button>
                                            {onOpenWhatsapp && client && (
                                                <button
                                                    onClick={() => onOpenWhatsapp(booking.project, client)}
                                                    className="inline-flex items-center space-x-2 px-3 py-1.5 rounded-lg bg-emerald-600/10 text-emerald-500 hover:bg-emerald-600 hover:text-white transition-all shadow-sm group"
                                                    title="Kirim Pesan WhatsApp"
                                                >
                                                    <WhatsappIcon className="w-4 h-4" /> 
                                                    <span className="text-xs font-bold">Chat</span>
                                                </button>
                                            )}
                                            {isNewSection && onStatusChange && (
                                                <button
                                                    onClick={() => onStatusChange(booking.project.id, BookingStatus.TERKONFIRMASI)}
                                                    className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-emerald-600/10 text-emerald-500 hover:bg-emerald-600 hover:text-white transition-all shadow-sm group"
                                                    title="Konfirmasi Booking"
                                                >
                                                    <CheckCircleIcon className="w-4 h-4" />
                                                    <span className="text-xs font-bold">Konfirmasi</span>
                                                </button>
                                            )}
                                            {!isNewSection && onViewDetail && (
                                                <button
                                                    onClick={() => onViewDetail(booking.project.clientId)}
                                                    className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-blue-600/10 text-blue-400 hover:bg-blue-600 hover:text-white transition-all shadow-sm group"
                                                    title="Lihat Detail Pengantin"
                                                >
                                                    <EyeIcon className="w-4 h-4" />
                                                    <span className="text-xs font-bold">Detail</span>
                                                </button>
                                            )}
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
