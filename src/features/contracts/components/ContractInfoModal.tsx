import React from 'react';
import Modal from '@/shared/ui/Modal';

interface ContractInfoModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export const ContractInfoModal: React.FC<ContractInfoModalProps> = ({ isOpen, onClose }) => {
    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Panduan Halaman Kontrak">
            <div className="space-y-4 text-sm text-brand-text-primary">
                <p>Halaman ini adalah pusat arsip digital untuk semua perjanjian kerja Anda.</p>
                <div className="space-y-3">
                    <div className="p-3 bg-brand-bg/50 rounded-lg border border-brand-border">
                        <h4 className="font-bold text-brand-accent mb-1">Buat Kontrak</h4>
                        <p className="text-xs text-brand-text-secondary">Klik tombol "Buat Kontrak" untuk membuka formulir. Pilih klien dan proyek yang relevan, dan sebagian besar data akan terisi otomatis.</p>
                    </div>
                    <div className="p-3 bg-brand-bg/50 rounded-lg border border-brand-border">
                        <h4 className="font-bold text-brand-accent mb-1">E-Signature</h4>
                        <p className="text-xs text-brand-text-secondary">Setelah kontrak dibuat, Anda dapat menandatanganinya secara digital. Klien juga dapat melakukan hal yang sama melalui Portal Klien mereka.</p>
                    </div>
                    <div className="p-3 bg-brand-bg/50 rounded-lg border border-brand-border">
                        <h4 className="font-bold text-brand-accent mb-1">Lacak Status</h4>
                        <p className="text-xs text-brand-text-secondary">Pantau dengan mudah kontrak mana yang sudah lengkap, mana yang menunggu tanda tangan Anda, dan mana yang menunggu tanda tangan klien.</p>
                    </div>
                    <div className="p-3 bg-brand-bg/50 rounded-lg border border-brand-border">
                        <h4 className="font-bold text-brand-accent mb-1">Bagikan Portal</h4>
                        <p className="text-xs text-brand-text-secondary">Gunakan ikon QR code untuk membagikan tautan Portal Klien, tempat mereka dapat melihat dan menandatangani kontrak.</p>
                    </div>
                </div>
            </div>
        </Modal>
    );
};
