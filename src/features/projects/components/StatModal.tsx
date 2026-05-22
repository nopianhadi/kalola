import React from 'react';
import Modal from '@/shared/ui/Modal';
import { StatModalItem } from '@/features/projects/types/project.types';

interface StatModalProps {
    isOpen: boolean;
    onClose: () => void;
    title: string;
    items: StatModalItem[];
}

const StatModal: React.FC<StatModalProps> = ({ isOpen, onClose, title, items }) => {
    return (
        <Modal isOpen={isOpen} onClose={onClose} title={title} size="lg">
            <div className="space-y-4">
                {items.length === 0 ? (
                    <p className="text-center py-8 text-brand-text-secondary">Tidak ada data untuk ditampilkan.</p>
                ) : (
                    <div className="grid gap-3">
                        {items.map((item) => (
                            <div 
                                key={item.id} 
                                className="p-4 rounded-2xl bg-brand-bg border border-brand-border flex items-center justify-between hover:border-brand-accent/50 transition-colors"
                            >
                                <div className="space-y-1">
                                    <p className="font-bold text-brand-text-light">{item.primary}</p>
                                    <p className="text-xs text-brand-text-secondary">{item.secondary}</p>
                                </div>
                                <div className="text-right">
                                    <p className="font-black text-brand-accent">{item.value}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
                <div className="flex justify-end pt-4 border-t border-brand-border">
                    <button onClick={onClose} className="button-secondary">
                        Tutup
                    </button>
                </div>
            </div>
        </Modal>
    );
};

export default StatModal;
