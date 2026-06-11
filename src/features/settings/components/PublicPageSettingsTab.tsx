import React from 'react';
import { Profile, TimelineStep } from '@/types';
import { LayoutGridIcon, PlusIcon, TrashIcon, CheckCircleIcon } from '@/constants';
import { FormSection, FieldLabel, inputCls } from '@/shared/ui/FormSection';

interface PublicPageSettingsTabProps {
    profile: Profile;
    setProfile: React.Dispatch<React.SetStateAction<Profile>>;
    handleProfileSubmit: (e: React.FormEvent) => void;
    isSaving: boolean;
    showSuccess: boolean;
    saveError: string;
}

const DEFAULT_TIMELINE: TimelineStep[] = [
    { id: '1', t: "Konsep & Konsultasi", d: "H-90 • Mematangkan visi hari bahagia Anda bersama tim kami." },
    { id: '2', t: "Pemilihan Vendor & Detail", d: "H-60 • Kurasi terbaik untuk setiap aspek dokumentasi." },
    { id: '3', t: "Technical Meeting", d: "H-14 • Memastikan setiap detail berjalan sempurna." },
    { id: '4', t: "The Wedding Day", d: "Hari H • Kami mengabadikan setiap emosi dengan tulus." },
    { id: '5', t: "Final Handover", d: "H+30 • Hasil karya terbaik sampai di tangan Anda." }
];

export const PublicPageSettingsTab: React.FC<PublicPageSettingsTabProps> = ({ 
    profile, setProfile, handleProfileSubmit, isSaving, showSuccess, saveError 
}) => {
    
    const timeline = profile.publicPageConfig?.timeline || DEFAULT_TIMELINE;

    const handleTimelineChange = (index: number, field: 't' | 'd', value: string) => {
        const newTimeline = [...timeline];
        newTimeline[index] = { ...newTimeline[index], [field]: value };
        setProfile(prev => ({
            ...prev,
            publicPageConfig: {
                ...prev.publicPageConfig,
                timeline: newTimeline
            }
        }));
    };

    const addStep = () => {
        const newStep: TimelineStep = {
            id: Math.random().toString(36).substr(2, 9),
            t: "Langkah Baru",
            d: "Deskripsi langkah baru..."
        };
        setProfile(prev => ({
            ...prev,
            publicPageConfig: {
                ...prev.publicPageConfig,
                timeline: [...timeline, newStep]
            }
        }));
    };

    const removeStep = (index: number) => {
        const newTimeline = timeline.filter((_, i) => i !== index);
        setProfile(prev => ({
            ...prev,
            publicPageConfig: {
                ...prev.publicPageConfig,
                timeline: newTimeline
            }
        }));
    };

    const handleIntroChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        setProfile(prev => ({
            ...prev,
            publicPageConfig: {
                ...prev.publicPageConfig,
                introduction: e.target.value
            }
        }));
    };

    return (
        <form onSubmit={handleProfileSubmit} className="space-y-6 max-w-4xl mx-auto">
            <FormSection icon={<LayoutGridIcon className="w-4 h-4" />} title="Halaman Publik & Portfolio">
                <div>
                    <FieldLabel optional>Pesan Pengantar (Introduction)</FieldLabel>
                    <textarea
                        value={profile.publicPageConfig?.introduction || ''}
                        onChange={handleIntroChange}
                        className={inputCls + ' h-20 resize-none'}
                        placeholder="Tulis pesan pengantar singkat untuk calon pengantin..."
                    />
                </div>

                <div>
                    <div className="flex justify-between items-center mb-3">
                        <FieldLabel>Timeline & Workflow</FieldLabel>
                        <button type="button" onClick={addStep} className="flex items-center gap-1.5 text-xs font-semibold text-brand-accent hover:text-brand-accent/80 transition">
                            <PlusIcon className="w-3.5 h-3.5" /> Tambah Langkah
                        </button>
                    </div>
                    <div className="space-y-3">
                        {timeline.map((step, index) => (
                            <div key={step.id || index} className="relative flex items-start gap-4 bg-brand-bg border border-brand-border rounded-xl p-4">
                                <div className="w-6 h-6 rounded-full bg-brand-accent text-white flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">
                                    {index + 1}
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 flex-1">
                                    <input
                                        value={step.t}
                                        onChange={(e) => handleTimelineChange(index, 't', e.target.value)}
                                        className={inputCls + ' font-semibold'}
                                        placeholder="Judul langkah..."
                                    />
                                    <textarea
                                        value={step.d}
                                        onChange={(e) => handleTimelineChange(index, 'd', e.target.value)}
                                        className={inputCls + ' md:col-span-2 h-10 resize-none text-xs'}
                                        placeholder="Deskripsi singkat..."
                                    />
                                </div>
                                <button type="button" onClick={() => removeStep(index)} className="p-1.5 text-red-400 hover:bg-red-50 hover:text-red-600 rounded-lg transition flex-shrink-0">
                                    <TrashIcon className="w-4 h-4" />
                                </button>
                            </div>
                        ))}
                    </div>
                </div>
            </FormSection>

            {saveError && <div className="p-3 rounded-xl bg-red-400/10 border border-red-400/20 text-red-400 text-sm font-bold text-center">{saveError}</div>}
            {showSuccess && <div className="p-3 rounded-xl bg-green-400/10 border border-green-400/20 text-green-400 text-sm font-bold text-center flex items-center justify-center gap-2"><CheckCircleIcon className="w-4 h-4" /> Perubahan berhasil disimpan!</div>}

            <div className="flex justify-end pt-4 border-t border-brand-border">
                <button type="submit" disabled={isSaving} className="px-10 py-2.5 rounded-xl bg-blue-600 text-white text-sm font-bold hover:bg-blue-700 shadow-lg shadow-blue-500/20 transition active:scale-95 disabled:opacity-60">
                    {isSaving ? 'Menyimpan...' : 'Simpan Perubahan'}
                </button>
            </div>
        </form>
    );
};
