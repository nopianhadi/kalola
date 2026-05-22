import React, { useState, useCallback } from 'react';
import { MessageSquareIcon, CashIcon, Share2Icon, DEFAULT_BILLING_TEMPLATES, CHAT_TEMPLATES } from '@/constants';
import { Profile, ChatTemplate } from '@/types';
import { TemplateCrudSection } from '@/features/settings/components/TemplateCrudSection';
import { ShareTemplateItem } from '@/features/settings/components/ShareTemplateItem';
import { VARIABLE_CHIPS, BILLING_VARIABLE_CHIPS, SHARE_TEMPLATE_CONFIGS } from '@/features/settings/utils/settings.utils';
import { upsertProfile } from '@/services/profile';


interface MessageSettingsTabProps {
    profile: Profile;
    setProfile: React.Dispatch<React.SetStateAction<Profile>>;
    showSuccess: (msg: string) => void;
}

export const MessageSettingsTab: React.FC<MessageSettingsTabProps> = ({ profile, setProfile, showSuccess }) => {
    const [innerTab, setInnerTab] = useState<'chat' | 'billing' | 'share'>('chat');
    const [isSaving, setIsSaving] = useState(false);

    // Chat Templates State
    const [chatTemplates, setChatTemplates] = useState<ChatTemplate[]>(profile.chatTemplates || CHAT_TEMPLATES);
    const [editingId, setEditingId] = useState<number | string | null>(null);
    const [isAddingNew, setIsAddingNew] = useState(false);
    const [formData, setFormData] = useState({ title: '', template: '' });
    const [formError, setFormError] = useState('');
    const [previewId, setPreviewId] = useState<number | string | null>(null);

    // Billing Templates State
    const [billingTemplates, setBillingTemplates] = useState<ChatTemplate[]>(profile.billingTemplates || DEFAULT_BILLING_TEMPLATES);
    const [billEditingId, setBillEditingId] = useState<number | string | null>(null);
    const [isBillAddingNew, setIsBillAddingNew] = useState(false);
    const [billFormData, setBillFormData] = useState({ title: '', template: '' });
    const [billFormError, setBillFormError] = useState('');
    const [billPreviewId, setBillPreviewId] = useState<number | string | null>(null);

    const persistTemplates = useCallback(async (updated: ChatTemplate[], type: 'chat' | 'billing') => {
        setIsSaving(true);
        try {
            const field = type === 'chat' ? 'chatTemplates' : 'billingTemplates';
            const updatedProfile = await upsertProfile({ ...profile, [field]: updated } as any);
            setProfile(updatedProfile);
            if (type === 'chat') setChatTemplates(updated);
            else setBillingTemplates(updated);
            showSuccess(type === 'chat' ? 'Template berhasil disimpan!' : 'Template tagihan berhasil disimpan!');
        } catch (err: any) {
            alert('Gagal menyimpan: ' + (err?.message || 'Coba lagi.'));
        } finally { setIsSaving(false); }
    }, [profile, setProfile, showSuccess]);

    // Handlers for Chat
    const handleSaveChat = async () => {
        if (!formData.title || !formData.template) { setFormError('Judul dan pesan wajib diisi.'); return; }
        let updated: ChatTemplate[];
        if (editingId) updated = chatTemplates.map(t => String(t.id) === String(editingId) ? { ...t, ...formData } : t);
        else updated = [...chatTemplates, { id: `custom_${Date.now()}`, ...formData }];
        await persistTemplates(updated, 'chat');
        setEditingId(null); setIsAddingNew(false); setFormData({ title: '', template: '' });
    };

    // Handlers for Billing
    const handleSaveBill = async () => {
        if (!billFormData.title || !billFormData.template) { setBillFormError('Judul dan pesan wajib diisi.'); return; }
        let updated: ChatTemplate[];
        if (billEditingId) updated = billingTemplates.map(t => String(t.id) === String(billEditingId) ? { ...t, ...billFormData } : t);
        else updated = [...billingTemplates, { id: `billing_custom_${Date.now()}`, ...billFormData }];
        await persistTemplates(updated, 'billing');
        setBillEditingId(null); setIsBillAddingNew(false); setBillFormData({ title: '', template: '' });
    };

    const insertVar = (variable: string, targetId: string, setFn: any) => {
        const textarea = document.getElementById(targetId) as HTMLTextAreaElement;
        if (textarea) {
            const start = textarea.selectionStart; const end = textarea.selectionEnd;
            setFn((prev: any) => {
                const text = prev.template;
                const newValue = text.substring(0, start) + variable + text.substring(end);
                return { ...prev, template: newValue };
            });
            setTimeout(() => { textarea.focus(); textarea.setSelectionRange(start + variable.length, start + variable.length); }, 0);
        }
    };

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            <div className="flex gap-3 border-b border-brand-border/40 pb-4 overflow-x-auto scrollbar-hide">
                <button 
                    onClick={() => setInnerTab('chat')} 
                    className={`px-5 py-3 rounded-2xl text-[13px] font-bold transition-all whitespace-nowrap flex items-center gap-2.5 ${innerTab === 'chat' ? 'bg-brand-accent text-white shadow-xl shadow-brand-accent/30 scale-[1.02]' : 'bg-white/40 border border-brand-border/20 text-brand-text-secondary hover:bg-white hover:text-brand-accent hover:-translate-y-0.5'}`}
                >
                    <MessageSquareIcon className="w-4 h-4" /> Komunikasi Umum
                </button>
                <button 
                    onClick={() => setInnerTab('billing')} 
                    className={`px-5 py-3 rounded-2xl text-[13px] font-bold transition-all whitespace-nowrap flex items-center gap-2.5 ${innerTab === 'billing' ? 'bg-brand-accent text-white shadow-xl shadow-brand-accent/30 scale-[1.02]' : 'bg-white/40 border border-brand-border/20 text-brand-text-secondary hover:bg-white hover:text-brand-accent hover:-translate-y-0.5'}`}
                >
                    <CashIcon className="w-4 h-4" /> Template Tagihan
                </button>
                <button 
                    onClick={() => setInnerTab('share')} 
                    className={`px-5 py-3 rounded-2xl text-[13px] font-bold transition-all whitespace-nowrap flex items-center gap-2.5 ${innerTab === 'share' ? 'bg-brand-accent text-white shadow-xl shadow-brand-accent/30 scale-[1.02]' : 'bg-white/40 border border-brand-border/20 text-brand-text-secondary hover:bg-white hover:text-brand-accent hover:-translate-y-0.5'}`}
                >
                    <Share2Icon className="w-4 h-4" /> Share Link & Dokumen
                </button>
            </div>

            {innerTab === 'chat' && (
                <TemplateCrudSection
                    title="Chat Templates WhatsApp" subtitle="Template ini langsung tersedia saat Anda membuka chat dengan pengantin." icon={<MessageSquareIcon className="w-5 h-5" />} accentClass="bg-brand-accent/20 text-brand-accent" chipClass="bg-brand-accent/10 text-brand-accent border-brand-accent/20"
                    templates={chatTemplates} variableChips={VARIABLE_CHIPS} editingId={editingId} isAddingNew={isAddingNew} formData={formData} formError={formError} isSaving={isSaving} previewId={previewId}
                    onAddNew={() => { setEditingId(null); setFormData({ title: '', template: '' }); setIsAddingNew(true); }}
                    onEdit={(t) => { setEditingId(t.id); setFormData({ title: t.title, template: t.template }); setIsAddingNew(false); }}
                    onDelete={async (id) => { if (confirm('Hapus template?')) persistTemplates(chatTemplates.filter(t => String(t.id) !== String(id)), 'chat'); }}
                    onSave={handleSaveChat} onCancel={() => { setEditingId(null); setIsAddingNew(false); }} onReset={() => confirm('Reset default?') && persistTemplates(CHAT_TEMPLATES, 'chat')}
                    onPreviewToggle={(id) => setPreviewId(previewId === id ? null : id)} onFormChange={(f, v) => setFormData(p => ({ ...p, [f]: v }))}
                    onInsertVar={(v) => insertVar(v, 'ct-message', setFormData)} textareaId="ct-message"
                />
            )}

            {innerTab === 'billing' && (
                <TemplateCrudSection
                    title="Template Tagihan & Invoice WA" subtitle="Digunakan di tombol 'Kirim Tagihan via WA' pada halaman Manajemen Klien." icon={<CashIcon className="w-5 h-5" />} accentClass="bg-orange-400/20 text-orange-400" chipClass="bg-orange-400/10 text-orange-400 border-orange-400/20"
                    templates={billingTemplates} variableChips={BILLING_VARIABLE_CHIPS} editingId={billEditingId} isAddingNew={isBillAddingNew} formData={billFormData} formError={billFormError} isSaving={isSaving} previewId={billPreviewId}
                    onAddNew={() => { setBillEditingId(null); setBillFormData({ title: '', template: '' }); setIsBillAddingNew(true); }}
                    onEdit={(t) => { setBillEditingId(t.id); setBillFormData({ title: t.title, template: t.template }); setIsBillAddingNew(false); }}
                    onDelete={async (id) => { if (confirm('Hapus template?')) persistTemplates(billingTemplates.filter(t => String(t.id) !== String(id)), 'billing'); }}
                    onSave={handleSaveBill} onCancel={() => { setBillEditingId(null); setIsBillAddingNew(false); }} onReset={() => confirm('Reset default?') && persistTemplates(DEFAULT_BILLING_TEMPLATES, 'billing')}
                    onPreviewToggle={(id) => setBillPreviewId(billPreviewId === id ? null : id)} onFormChange={(f, v) => setBillFormData(p => ({ ...p, [f]: v }))}
                    onInsertVar={(v) => insertVar(v, 'bt-message', setBillFormData)} textareaId="bt-message"
                />
            )}

            {innerTab === 'share' && (
                <div className="space-y-6">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white/70 backdrop-blur-md p-6 rounded-3xl border border-white/50 shadow-sm">
                        <div className="flex items-start gap-4"><div className="w-14 h-14 rounded-[20px] bg-brand-accent/10 text-brand-accent flex items-center justify-center shadow-inner"><Share2Icon className="w-6 h-6" /></div><div><h3 className="text-lg font-black text-brand-text-light">Template Share Link & Dokumen</h3><p className="text-[13px] text-brand-text-secondary mt-1">Pesan khusus untuk membagikan link portal, katalog, dan dokumen PDF.</p></div></div>
                        <button onClick={async () => { setIsSaving(true); try { await upsertProfile(profile); showSuccess('Semua template share berhasil disimpan!'); } catch (err) { alert('Gagal'); } finally { setIsSaving(false); } }} className="button-primary py-3.5 px-6 rounded-2xl font-bold shadow-lg shadow-brand-accent/30 hover:scale-[1.02] transition-transform">Simpan Perubahan</button>
                    </div>
                    <div className="grid grid-cols-1 gap-6">
                        {SHARE_TEMPLATE_CONFIGS.map(config => (
                            <ShareTemplateItem key={config.key} config={config} stringValue={profile[config.key] as string || ''} onProfileUpdate={(k, v) => setProfile(p => ({ ...p, [k]: v }))} onReset={() => setProfile(p => ({ ...p, [config.key]: config.defaultValue }))} />
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};
