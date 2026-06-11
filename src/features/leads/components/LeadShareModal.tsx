import React from 'react';
import Modal from '@/shared/ui/Modal';
import { QRCodeSVG } from 'qrcode.react';
import { CopyIcon, DownloadIcon } from '@/constants';

interface LeadShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  formUrl: string;
  onCopy: () => void;
}

const LeadShareModal: React.FC<LeadShareModalProps> = ({ isOpen, onClose, formUrl, onCopy }) => {
  const handleDownloadQr = () => {
    const svg = document.getElementById('leads-form-qrcode');
    if (!svg) return;
    const svgData = new XMLSerializer().serializeToString(svg);
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();
    img.onload = () => {
      canvas.width = img.width;
      canvas.height = img.height;
      ctx?.drawImage(img, 0, 0);
      const a = document.createElement('a');
      a.download = 'form-leads-qr.png';
      a.href = canvas.toDataURL('image/png');
      a.click();
    };
    img.src = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svgData)));
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Bagikan Formulir Leads" size="md">
      <div className="p-6 text-center">
        <div id="leads-form-qrcode" className="bg-white p-5 rounded-3xl shadow-xl mb-6 inline-block border-2 border-brand-border">
          <QRCodeSVG value={formUrl} size={200} level="H" includeMargin />
        </div>
        <p className="text-sm text-brand-text-secondary mb-6">
          Bagikan link ini ke calon pengantin agar mereka bisa mengisi formulir minat.
        </p>
        <div className="space-y-4">
          <div className="relative">
            <input
              readOnly
              value={formUrl}
              className="w-full bg-brand-bg border border-brand-border rounded-xl py-3.5 pl-4 pr-12 text-sm text-brand-text-light focus:outline-none"
            />
            <button
              onClick={onCopy}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-2 text-brand-text-secondary hover:text-brand-accent"
              title="Salin Tautan"
            >
              <CopyIcon className="w-5 h-5" />
            </button>
          </div>
          <button
            onClick={handleDownloadQr}
            className="w-full button-primary flex items-center justify-center gap-3 h-12"
          >
            <DownloadIcon className="w-5 h-5" />
            Simpan QR Code
          </button>
        </div>
      </div>
    </Modal>
  );
};

export default LeadShareModal;
