import React from 'react';
import Modal from '@/shared/ui/Modal';
import { QRCodeSVG } from 'qrcode.react';
import { CopyIcon, DownloadIcon, Share2Icon } from '@/constants';

interface ClientPortalQrModalProps {
    qrModalContent: { title: string; url: string; clientName: string; clientPhone?: string } | null;
    onCloseQrModal: () => void;
    onDownloadQr: (id: string) => void;
    onShareWhatsApp?: (phone: string, url: string) => void;
}

export const ClientPortalQrModal: React.FC<ClientPortalQrModalProps> = ({ 
    qrModalContent, 
    onCloseQrModal, 
    onDownloadQr,
    onShareWhatsApp
}) => {
    if (!qrModalContent) return null;

    return (
        <Modal isOpen={!!qrModalContent} onClose={onCloseQrModal} title={qrModalContent.title} size="md">
            <div className="flex flex-col items-center p-6 text-center">
                <div id="clients-portal-qrcode" className="bg-white p-6 rounded-3xl shadow-2xl mb-8 border-4 border-brand-accent/20">
                    <QRCodeSVG value={qrModalContent.url} size={250} level="H" includeMargin={true} />
                </div>
                <p className="text-sm text-brand-text-secondary mb-8 leading-relaxed">Scan kode ini untuk mengakses Portal Pengantin <strong>{qrModalContent.clientName}</strong> secara instan.</p>
                <div className="grid grid-cols-2 gap-4 w-full">
                    <button onClick={() => onDownloadQr('clients-portal-qrcode')} className="button-secondary flex items-center justify-center gap-2 h-12">
                        <DownloadIcon className="w-5 h-5" /> Download QR
                    </button>
                    {qrModalContent.clientPhone && (
                        <button 
                            onClick={() => onShareWhatsApp?.(qrModalContent.clientPhone!, qrModalContent.url)} 
                            className="button-primary flex items-center justify-center gap-2 h-12 bg-green-600 hover:bg-green-700"
                        >
                            <Share2Icon className="w-5 h-5" /> Share WhatsApp
                        </button>
                    )}
                </div>
            </div>
        </Modal>
    );
};

interface BookingFormShareModalProps {
    isBookingFormShareModalOpen: boolean;
    onCloseBookingModal: () => void;
    bookingFormUrl: string;
    onCopyLink: () => void;
    onDownloadQr: (id: string) => void;
}

export const BookingFormShareModal: React.FC<BookingFormShareModalProps> = ({ 
    isBookingFormShareModalOpen, 
    onCloseBookingModal, 
    bookingFormUrl, 
    onCopyLink, 
    onDownloadQr 
}) => {
    return (
        <Modal isOpen={isBookingFormShareModalOpen} onClose={onCloseBookingModal} title="Bagikan Formulir Booking" size="md">
            <div className="p-6 text-center">
                <div id="clients-booking-form-qrcode" className="bg-white p-5 rounded-3xl shadow-xl mb-8 inline-block border-2 border-brand-border">
                    <QRCodeSVG value={bookingFormUrl} size={200} level="H" includeMargin={true} />
                </div>
                <p className="text-sm text-brand-text-secondary mb-6 leading-relaxed">Calon pengantin dapat melakukan pendaftaran dan booking secara mandiri melalui tautan ini.</p>
                
                <div className="space-y-4">
                    <div className="relative group">
                        <input readOnly value={bookingFormUrl} className="w-full bg-brand-bg border border-brand-border rounded-xl py-3.5 pl-4 pr-12 text-sm text-brand-text-light focus:border-brand-accent outline-none" />
                        <button onClick={onCopyLink} className="absolute right-3 top-1/2 -translate-y-1/2 p-2 text-brand-text-secondary hover:text-brand-accent transition-colors" title="Salin Tautan">
                            <CopyIcon className="w-5 h-5" />
                        </button>
                    </div>
                    
                    <button onClick={() => onDownloadQr('clients-booking-form-qrcode')} className="w-full button-primary flex items-center justify-center gap-3 h-14">
                        <DownloadIcon className="w-5 h-5" /> Simpan QR Code Formulir
                    </button>
                </div>
            </div>
        </Modal>
    );
};
