import React from 'react';
import { Package } from '@/types';
import { PencilIcon, Trash2Icon, EyeIcon } from '@/constants';
import { formatCurrency } from '@/features/booking/utils/booking.utils';
import { Badge } from '@/shared/ui';

interface PackageTableProps {
    packagesByCategory: Record<string, Package[]>;
    onEdit: (pkg: Package) => void;
    onDelete: (id: number) => void;
}

const PackageTable: React.FC<PackageTableProps> = ({ packagesByCategory, onEdit, onDelete }) => {
    const allPackages = Object.values(packagesByCategory).flat();

    if (allPackages.length === 0) {
        return (
            <div className="bg-white rounded-2xl p-12 text-center border-2 border-dashed border-slate-200 shadow-sm">
                <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
                    <EyeIcon className="w-8 h-8 text-slate-300" />
                </div>
                <h4 className="text-lg font-bold text-slate-900 mb-2">Belum ada Package</h4>
                <p className="text-sm text-slate-500">Tambahkan package layanan pertama Anda.</p>
            </div>
        );
    }

    const formatPrice = (pkg: Package) => {
        if (pkg.durationOptions && pkg.durationOptions.length > 0) {
            const minPrice = Math.min(...pkg.durationOptions.map(o => o.price));
            return `Mulai ${formatCurrency(minPrice)}`;
        }
        return formatCurrency(pkg.price);
    };

    const getHighlights = (pkg: Package) => {
        if (pkg.digitalItems.length === 0) return '-';
        return pkg.digitalItems.slice(0, 2).join(', ');
    };

    return (
        <div className="bg-white rounded-2xl shadow-lg border border-slate-100 overflow-hidden">
            {/* Desktop Table */}
            <div className="hidden md:block overflow-x-auto">
                <table className="w-full">
                    <thead className="bg-slate-100 border-b-2 border-slate-300">
                        <tr>
                            <th className="text-left px-6 py-4 text-xs font-black uppercase tracking-wider text-slate-700 border-r border-slate-300">Package</th>
                            <th className="text-left px-6 py-4 text-xs font-black uppercase tracking-wider text-slate-700 border-r border-slate-300">Kategori</th>
                            <th className="text-left px-6 py-4 text-xs font-black uppercase tracking-wider text-slate-700 border-r border-slate-300">Harga</th>
                            <th className="text-left px-6 py-4 text-xs font-black uppercase tracking-wider text-slate-700 border-r border-slate-300">Wilayah</th>
                            <th className="text-left px-6 py-4 text-xs font-black uppercase tracking-wider text-slate-700 border-r border-slate-300">Highlights</th>
                            <th className="text-center px-6 py-4 text-xs font-black uppercase tracking-wider text-slate-700">Aksi</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white/40 divide-y divide-slate-300">
                        {Object.entries(packagesByCategory).map(([category, packages]) =>
                            packages.map((pkg) => (
                                <tr key={pkg.id} className="hover:bg-brand-bg transition-colors group">
                                    <td className="px-6 py-4 border-r border-slate-300">
                                        <div className="flex items-center gap-3">
                                            {pkg.coverImage ? (
                                                <img 
                                                    src={pkg.coverImage} 
                                                    alt={pkg.name}
                                                    className="w-12 h-12 rounded-xl object-cover border border-slate-300"
                                                />
                                            ) : (
                                                <div className="w-12 h-12 rounded-xl bg-slate-100 flex items-center justify-center">
                                                    <EyeIcon className="w-5 h-5 text-slate-400" />
                                                </div>
                                            )}
                                            <div>
                                                <h4 className="font-semibold text-brand-text-light text-sm leading-tight">{pkg.name}</h4>
                                                <p className="text-xs text-brand-text-secondary mt-0.5">ID: {pkg.id}</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 border-r border-slate-300">
                                        <Badge variant="outline" size="sm">{category}</Badge>
                                    </td>
                                    <td className="px-6 py-4 border-r border-slate-300">
                                        <span className="font-semibold text-brand-accent text-sm">{formatPrice(pkg)}</span>
                                        {pkg.durationOptions && pkg.durationOptions.length > 1 && (
                                            <p className="text-xs text-slate-500 mt-0.5">
                                                {pkg.durationOptions.length} pilihan durasi
                                            </p>
                                        )}
                                    </td>
                                    <td className="px-6 py-4 border-r border-slate-300">
                                        <Badge variant="info" size="sm">
                                            {pkg.region ? pkg.region.charAt(0).toUpperCase() + pkg.region.slice(1) : 'Semua'}
                                        </Badge>
                                    </td>
                                    <td className="px-6 py-4 border-r border-slate-300">
                                        <p className="text-sm text-brand-text-secondary line-clamp-2 max-w-xs">
                                            {getHighlights(pkg)}
                                        </p>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center justify-center gap-2">
                                            <button
                                                onClick={() => onEdit(pkg)}
                                                className="p-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-colors shadow-sm"
                                                title="Edit"
                                            >
                                                <PencilIcon className="w-4 h-4" />
                                            </button>
                                            <button
                                                onClick={() => onDelete(pkg.id)}
                                                className="p-2 rounded-lg bg-red-600 text-white hover:bg-red-700 transition-colors shadow-sm"
                                                title="Hapus"
                                            >
                                                <Trash2Icon className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {/* Mobile Cards */}
            <div className="md:hidden p-4 space-y-3">
                {Object.entries(packagesByCategory).map(([category, packages]) =>
                    packages.map((pkg) => (
                        <div key={pkg.id} className="p-4 border border-slate-200 rounded-xl bg-white hover:bg-slate-50 transition-colors">
                            <div className="flex items-start gap-3">
                                {pkg.coverImage ? (
                                    <img 
                                        src={pkg.coverImage} 
                                        alt={pkg.name}
                                        className="w-16 h-16 rounded-xl object-cover border border-slate-200 shrink-0"
                                    />
                                ) : (
                                    <div className="w-16 h-16 rounded-xl bg-slate-100 flex items-center justify-center shrink-0">
                                        <EyeIcon className="w-6 h-6 text-slate-400" />
                                    </div>
                                )}
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-start justify-between mb-2">
                                        <h4 className="font-semibold text-slate-900 text-sm leading-tight truncate pr-2">{pkg.name}</h4>
                                        <Badge variant="outline" size="xs">{category}</Badge>
                                    </div>
                                    <div className="space-y-1 mb-3">
                                        <p className="text-sm font-semibold text-brand-accent">{formatPrice(pkg)}</p>
                                        <div className="flex items-center gap-2">
                                            <Badge variant="info" size="xs">
                                                {pkg.region ? pkg.region.charAt(0).toUpperCase() + pkg.region.slice(1) : 'Semua'}
                                            </Badge>
                                            {pkg.durationOptions && pkg.durationOptions.length > 1 && (
                                                <span className="text-xs text-slate-500">
                                                    {pkg.durationOptions.length} durasi
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <p className="text-xs text-slate-500 truncate pr-2">
                                            {getHighlights(pkg)}
                                        </p>
                                        <div className="flex items-center gap-1 shrink-0">
                                            <button
                                                onClick={() => onEdit(pkg)}
                                                className="p-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-colors shadow-sm"
                                                title="Edit"
                                            >
                                                <PencilIcon className="w-4 h-4" />
                                            </button>
                                            <button
                                                onClick={() => onDelete(pkg.id)}
                                                className="p-2 rounded-lg bg-red-600 text-white hover:bg-red-700 transition-colors shadow-sm"
                                                title="Hapus"
                                            >
                                                <Trash2Icon className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};

export default PackageTable;
