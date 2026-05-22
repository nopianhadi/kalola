import React from 'react';
import { Package } from '@/types';
import { CameraIcon, Trash2Icon } from '@/constants';
import { formatCurrency } from '@/features/booking/utils/booking.utils';

interface PackageCardProps {
    pkg: Package;
    onEdit: (pkg: Package) => void;
    onDelete: (id: number) => void;
}

const PackageCard: React.FC<PackageCardProps> = ({ pkg, onEdit, onDelete }) => {
    return (
        <div className="relative group animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Background Glow */}
            <div className="absolute -inset-0.5 bg-gradient-to-r from-brand-accent/20 to-blue-500/20 rounded-[2.5rem] blur opacity-20 group-hover:opacity-40 transition duration-700"></div>
            
            <div className="relative h-full flex flex-col bg-white/80 backdrop-blur-xl rounded-[2.5rem] shadow-xl border border-white/60 overflow-hidden transition-all duration-300 hover:translate-y-[-4px] hover:shadow-2xl">
                {/* Image Section */}
                <div className="relative h-44 overflow-hidden">
                    {pkg.coverImage ? (
                        <img 
                            src={pkg.coverImage} 
                            alt={pkg.name} 
                            className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110" 
                            loading="lazy" 
                        />
                    ) : (
                        <div className="w-full h-full bg-brand-accent/5 flex flex-col items-center justify-center">
                            <CameraIcon className="w-12 h-12 text-brand-accent/20" />
                        </div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-60"></div>
                    
                    {/* Badge / Category if needed */}
                    <div className="absolute top-4 left-4">
                        <span className="px-3 py-1.5 rounded-xl bg-white/20 backdrop-blur-md border border-white/30 text-[9px] font-black text-white uppercase tracking-widest">
                            Official Package
                        </span>
                    </div>
                </div>

                {/* Content Section */}
                <div className="p-6 flex-grow flex flex-col">
                    <h4 className="text-xl font-black text-brand-text-light tracking-tight leading-tight line-clamp-2 min-h-[3rem]">
                        {pkg.name}
                    </h4>

                    {/* Price Display - Premium Styled */}
                    <div className="mt-4 p-4 rounded-2xl bg-brand-accent/5 border border-brand-accent/10 relative overflow-hidden group/price">
                        <div className="absolute top-0 right-0 p-2 opacity-10 group-hover/price:opacity-20 transition-opacity">
                            <CameraIcon className="w-8 h-8 text-brand-accent" />
                        </div>
                        
                        <div className="relative">
                            {pkg.durationOptions && pkg.durationOptions.length > 0 ? (
                                <div className="space-y-2">
                                    <span className="text-[10px] font-black text-brand-text-secondary uppercase tracking-widest block mb-1">Mulai Dari</span>
                                    {pkg.durationOptions.slice(0, 2).map((o, i) => (
                                        <div key={i} className="flex justify-between items-center text-sm">
                                            <span className="font-bold text-brand-text-secondary opacity-80">{o.label}</span>
                                            <span className="font-black text-brand-accent">{formatCurrency(o.price)}</span>
                                        </div>
                                    ))}
                                    {pkg.durationOptions.length > 2 && (
                                        <p className="text-[9px] font-black text-brand-accent/60 uppercase tracking-tighter text-right">+{pkg.durationOptions.length - 2} Pilihan Lainnya</p>
                                    )}
                                </div>
                            ) : (
                                <>
                                    <span className="text-[10px] font-black text-brand-text-secondary uppercase tracking-widest block mb-1">Investasi</span>
                                    <span className="text-2xl font-black text-brand-accent tracking-tighter">{formatCurrency(pkg.price)}</span>
                                </>
                            )}
                        </div>
                    </div>

                    {/* Features List */}
                    <div className="mt-6 space-y-4 flex-grow">
                        {pkg.digitalItems.length > 0 && (
                            <div className="space-y-2">
                                <p className="text-[10px] font-black text-brand-text-secondary uppercase tracking-widest">Highlights</p>
                                <ul className="space-y-1.5">
                                    {pkg.digitalItems.slice(0, 3).map((item, i) => (
                                        <li key={i} className="flex items-start gap-2.5 text-xs font-bold text-brand-text-light/80 leading-tight">
                                            <div className="w-1.5 h-1.5 rounded-full bg-brand-accent shrink-0 mt-1"></div>
                                            <span className="line-clamp-1">{item}</span>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        )}
                    </div>

                    {/* Action Buttons */}
                    <div className="mt-8 flex gap-3">
                        <button 
                            onClick={() => onEdit(pkg)} 
                            className="flex-1 py-3 rounded-2xl bg-brand-accent/10 text-brand-accent font-black text-[10px] uppercase tracking-widest hover:bg-brand-accent hover:text-white transition-all duration-300 shadow-sm"
                        >
                            Edit Detail
                        </button>
                        <button 
                            onClick={() => onDelete(pkg.id)} 
                            className="w-12 h-12 rounded-2xl bg-red-600/10 text-red-600 flex items-center justify-center hover:bg-red-600 hover:text-white transition-all duration-300"
                            title="Hapus"
                        >
                            <Trash2Icon className="w-5 h-5" />
                        </button>
                    </div>
                </div>
            </div>
        </div>

    );
};

export default PackageCard;
