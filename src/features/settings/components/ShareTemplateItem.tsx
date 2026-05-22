import React from 'react';
import { ShareTemplateConfig } from '@/features/settings/types';
import { RefreshCwIcon, PackageIcon, ClipboardListIcon, FileTextIcon, CheckCircleIcon, CashIcon, Share2Icon, EditIcon, BriefcaseIcon } from '@/constants';
import { escapeRegExp } from '@/features/settings/utils/settings.utils';

interface ShareTemplateItemProps {
    config: ShareTemplateConfig;
    stringValue: string;
    onProfileUpdate: (key: any, val: string) => void;
    onReset: () => void;

}

export const ShareTemplateItem: React.FC<ShareTemplateItemProps> = ({ config, stringValue, onProfileUpdate, onReset }) => {
    const processPreview = (text: string) => {
        let p = text;
        const PREVIEW_VARS: Record<string, string> = {
            clientName: 'Budi & Ani',
            projectName: 'Wedding Budi & Ani',
            packageName: 'Gold Package',
            amountPaid: 'Rp 5.000.000',
            totalCost: 'Rp 10.000.000',
            sisaTagihan: 'Rp 5.000.000',
            portalLink: 'https://example.com/portal/abc123',
            projectDetails: '- Acara Pernikahan: *Wedding Budi & Ani*\n  Sisa Tagihan: Rp 5.000.000',
            totalDue: 'Rp 5.000.000',
            bankAccount: 'BCA 1234567890 a.n. Wedding Studio',
            companyName: 'Wedding Studio',
            leadName: 'Calon Pengantin',
            packageLink: 'https://example.com/packages/abc123',
            bookingFormLink: 'https://example.com/booking/abc123',
            invoiceLink: 'https://example.com/invoice/abc123',
            receiptLink: 'https://example.com/receipt/abc123',
            txDate: '14 Maret 2026',
            txAmount: 'Rp 2.000.000',
            txMethod: 'Transfer BCA',
            txDesc: 'Pelunasan biaya fotografi',
            targetName: 'Vendor Bunga',
        };
        Object.entries(PREVIEW_VARS).forEach(([k, v]) => {
            p = p.replace(new RegExp(escapeRegExp(`{${k}}`), 'g'), v);
        });
        return p;
    };

    const insertVar = (v: string) => {
        const textarea = document.getElementById(`share-${config.key}`) as HTMLTextAreaElement;
        if (textarea) {
            const start = textarea.selectionStart;
            const end = textarea.selectionEnd;
            const text = stringValue;
            const newValue = text.substring(0, start) + v + text.substring(end);
            onProfileUpdate(config.key, newValue);
            setTimeout(() => {
                textarea.focus();
                textarea.setSelectionRange(start + v.length, start + v.length);
            }, 0);
        } else {
            onProfileUpdate(config.key, stringValue + v);
        }
    };

    const getIcon = (emoji: string) => {
        switch(emoji) {
            case '📦': return <PackageIcon className="w-5 h-5" />;
            case '📋': return <ClipboardListIcon className="w-5 h-5" />;
            case '🧾': return <FileTextIcon className="w-5 h-5" />;
            case '✅': return <CheckCircleIcon className="w-5 h-5" />;
            case '💸': return <CashIcon className="w-5 h-5" />;
            case '🔗': return <Share2Icon className="w-5 h-5" />;
            case '🖋️': return <EditIcon className="w-5 h-5" />;
            case '🏦': return <BriefcaseIcon className="w-5 h-5" />;
            default: return <Share2Icon className="w-5 h-5" />;
        }
    };

    return (
        <div className="bg-white/60 backdrop-blur-xl border border-white/50 rounded-3xl p-6 transition-all hover:border-brand-accent/40 hover:shadow-lg hover:shadow-brand-accent/5 flex flex-col h-full group">
            <div className="flex justify-between items-start mb-6">
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-[18px] bg-brand-accent/10 border border-brand-accent/20 text-brand-accent flex items-center justify-center shadow-inner group-hover:scale-110 group-hover:bg-brand-accent group-hover:text-white transition-all duration-300">
                        {getIcon(config.icon as string)}
                    </div>
                    <div>
                        <h4 className="font-bold text-brand-text-light text-[15px]">{config.label}</h4>
                        <p className="text-[11px] text-brand-text-secondary mt-0.5 leading-snug">{config.desc}</p>
                    </div>
                </div>
                <button onClick={onReset} className="p-2 text-brand-text-secondary hover:text-brand-accent hover:bg-brand-accent/10 rounded-full transition-colors" title="Reset ke Default"><RefreshCwIcon className="w-4 h-4" /></button>
            </div>
            <div className="space-y-4 flex-grow">
                <div className="flex flex-wrap gap-2">
                    {config.variables.map(v => (
                        <button key={v.label} onClick={() => insertVar(v.label)} className="px-2.5 py-1.5 rounded-lg text-[10px] bg-brand-bg border border-brand-border hover:bg-brand-accent/10 hover:border-brand-accent/30 hover:text-brand-accent transition-all font-semibold" title={v.desc}>{v.label}</button>
                    ))}
                </div>
                <div className="relative group/textarea">
                    <textarea id={`share-${config.key}`} value={stringValue} onChange={e => onProfileUpdate(config.key, e.target.value)} className="w-full bg-white/80 border border-brand-border/50 focus:border-brand-accent rounded-2xl p-4 min-h-[140px] text-[13px] leading-relaxed font-mono outline-none transition-all resize-y shadow-inner group-hover/textarea:border-brand-accent/30" placeholder={config.placeholder} />
                </div>
            </div>
            <div className="mt-6 pt-5 border-t border-brand-border/40">
                <label className="text-[10px] font-bold text-brand-text-secondary uppercase tracking-wider mb-2.5 block">Preview Pesan Terformat:</label>
                <div className="p-4 bg-brand-bg/50 rounded-2xl border border-brand-border/30"><p className="text-xs text-brand-text-light whitespace-pre-wrap leading-relaxed opacity-90">{processPreview(stringValue)}</p></div>
            </div>
        </div>
    );
};
