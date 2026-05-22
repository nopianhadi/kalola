import React from 'react';
import Modal from '@/shared/ui/Modal';
import { CopyIcon } from 'lucide-react';

interface BriefingModalProps {
    isOpen: boolean;
    onClose: () => void;
    briefingText: string;
}

const BriefingModal: React.FC<BriefingModalProps> = ({ isOpen, onClose, briefingText }) => {
    const handleCopy = () => {
        navigator.clipboard.writeText(briefingText);
        // showNotification('Briefing berhasil disalin ke clipboard');
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Bagikan Briefing Acara Pernikahan" size="2xl">
            <div className="space-y-4">
                <div className="p-4 bg-brand-surface rounded-xl border border-brand-border">
                    <textarea 
                        value={briefingText} 
                        readOnly 
                        rows={15} 
                        className="w-full bg-transparent text-sm text-brand-text-primary focus:outline-none resize-none font-mono"
                    ></textarea>
                </div>
                <div className="flex flex-wrap gap-3">
                    <button 
                        onClick={handleCopy}
                        className="button-primary flex-grow flex items-center justify-center gap-2"
                    >
                        <CopyIcon className="w-4 h-4" /> Salin Briefing
                    </button>
                    <a 
                        href={`https://wa.me/?text=${encodeURIComponent(briefingText)}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="button-secondary flex-grow flex items-center justify-center gap-2 bg-[#25D366] text-white border-none hover:bg-[#128C7E]"
                    >
                        Bagikan ke WhatsApp
                    </a>
                </div>
            </div>
        </Modal>
    );
};

export default BriefingModal;
