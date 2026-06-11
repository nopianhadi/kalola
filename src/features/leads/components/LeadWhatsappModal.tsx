import React, { useState, useEffect, useMemo } from 'react';
import Modal from '@/shared/ui/Modal';
import { WhatsappIcon, cleanPhoneNumber, DEFAULT_PACKAGE_SHARE_TEMPLATE } from '@/constants';
import { Lead, Profile } from '@/types';
import { processTemplate } from '@/utils/chatUtils';

interface LeadWhatsappModalProps {
  lead: Lead;
  profile: Profile | null | undefined;
  onClose: () => void;
  onSent?: () => void;
  showNotification: (message: string) => void;
}

const LeadWhatsappModal: React.FC<LeadWhatsappModalProps> = ({
  lead,
  profile,
  onClose,
  onSent,
  showNotification,
}) => {
  const origin = window.location.origin;
  const packageLink = `${origin}/#/public-packages`;
  const bookingFormLink = `${origin}/#/book`;

  const defaultMessage = useMemo(() => {
    const template = profile?.packageShareTemplate || DEFAULT_PACKAGE_SHARE_TEMPLATE;
    return processTemplate(template, {
      leadName: lead.name,
      companyName: profile?.companyName || 'Kami',
      packageLink,
      bookingFormLink,
    });
  }, [lead.name, profile, packageLink, bookingFormLink]);

  const [message, setMessage] = useState(defaultMessage);

  useEffect(() => {
    setMessage(defaultMessage);
  }, [defaultMessage]);

  const handleShare = () => {
    if (!lead.whatsapp) {
      showNotification('Nomor WhatsApp lead tidak tersedia.');
      return;
    }
    const phone = cleanPhoneNumber(lead.whatsapp);
    const url = `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
    window.open(url, '_blank');
    onSent?.();
    onClose();
  };

  return (
    <Modal isOpen onClose={onClose} title={`Chat WhatsApp — ${lead.name}`} size="lg">
      <div className="space-y-4">
        <p className="text-sm text-brand-text-secondary">
          Draf pesan otomatis untuk calon pengantin. Anda bisa mengedit sebelum mengirim.
        </p>
        <textarea
          rows={10}
          className="w-full px-4 py-3 rounded-xl border border-brand-border bg-brand-bg text-brand-text-primary text-sm resize-none focus:outline-none focus:ring-2 focus:ring-brand-accent/30"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
        />
        <div className="flex gap-3 justify-end">
          <button type="button" onClick={onClose} className="button-secondary px-6">
            Batal
          </button>
          <button
            type="button"
            onClick={handleShare}
            className="button-primary px-6 flex items-center gap-2 bg-green-600 hover:bg-green-700"
          >
            <WhatsappIcon className="w-5 h-5" />
            Buka WhatsApp
          </button>
        </div>
      </div>
    </Modal>
  );
};

export default LeadWhatsappModal;
