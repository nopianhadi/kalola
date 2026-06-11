import React from 'react';
import { Profile } from '@/types';
import { HomeIcon, PhoneIcon, MapPinIcon, LinkIcon, MailIcon, ImageIcon, CheckCircleIcon, PencilIcon } from '@/constants';
import { FormSection, FieldLabel, inputCls } from '@/shared/ui/FormSection';
import { CloudinaryAvatarUpload } from '@/shared/ui/CloudinaryAvatarUpload';
import { uploadLogo, uploadImage } from '@/services/upload';
import { upsertProfile } from '@/services/profile';

interface ProfileSettingsTabProps {
    profile: Profile;
    setProfile: React.Dispatch<React.SetStateAction<Profile>>;
    handleProfileSubmit: (e: React.FormEvent) => void;
    isSaving: boolean;
    showSuccess: boolean;
    saveError: string;
}

export const ProfileSettingsTab: React.FC<ProfileSettingsTabProps> = ({ profile, setProfile, handleProfileSubmit, isSaving, showSuccess, saveError }) => {
    const [logoUploading, setLogoUploading] = React.useState(false);
    const [sigUploading, setSigUploading] = React.useState(false);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setProfile(prev => ({ ...prev, [name]: value }));
    };

    const handleLogoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        if (file.size > 5 * 1024 * 1024) { alert('Maksimal 5MB'); return; }
        setLogoUploading(true);
        try {
            const result = await uploadLogo(file);
            // Simpan ke state lokal DAN langsung persist ke DB (sama seperti avatar)
            setProfile(prev => ({ ...prev, logoBase64: result.url }));
            await upsertProfile({ id: profile.id, logoBase64: result.url });
        } catch (err: any) {
            alert(`Gagal upload logo: ${err.message}`);
        } finally {
            setLogoUploading(false);
        }
    };

    const handleSignatureChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        if (file.size > 5 * 1024 * 1024) { alert('Maksimal 5MB'); return; }
        setSigUploading(true);
        try {
            const result = await uploadImage(file, 'general');
            // Simpan ke state lokal DAN langsung persist ke DB
            setProfile(prev => ({ ...prev, signatureBase64: result.url }));
            await upsertProfile({ id: profile.id, signatureBase64: result.url });
        } catch (err: any) {
            alert(`Gagal upload tanda tangan: ${err.message}`);
        } finally {
            setSigUploading(false);
        }
    };

    return (
        <form onSubmit={handleProfileSubmit} className="space-y-6 max-w-4xl mx-auto">
            {/* Foto Profil Admin */}
            <FormSection icon={<ImageIcon className="w-4 h-4" />} title="Foto Profil Admin">
                <div className="flex justify-center py-2">
                    <CloudinaryAvatarUpload
                        value={profile.avatar ?? null}
                        context="profile"
                        onChange={async (url) => {
                            try {
                                await upsertProfile({ avatar: url });
                                setProfile(prev => ({ ...prev, avatar: url }));
                            } catch {
                                alert('Gagal menyimpan foto profil.');
                            }
                        }}
                        name={profile.fullName || profile.companyName || 'Admin'}
                        size="xl"
                        variant="team"
                        label="Foto Profil Admin"
                    />
                </div>
            </FormSection>

            <FormSection icon={<HomeIcon className="w-4 h-4" />} title="Informasi Vendor">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div>
                        <FieldLabel>Nama Perusahaan / Vendor</FieldLabel>
                        <div className="relative">
                            <HomeIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-brand-text-secondary" />
                            <input name="companyName" value={profile.companyName} onChange={handleInputChange} className={inputCls + ' pl-10 font-bold'} placeholder="Nama Vendor" required />
                        </div>
                    </div>
                    <div>
                        <FieldLabel optional>No. WhatsApp Bisnis</FieldLabel>
                        <div className="relative">
                            <PhoneIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-brand-text-secondary" />
                            <input name="phone" value={profile.phone} onChange={handleInputChange} className={inputCls + ' pl-10 font-mono'} placeholder="08xxxxxxxx" />
                        </div>
                    </div>
                    <div>
                        <FieldLabel optional>Email Bisnis</FieldLabel>
                        <div className="relative">
                            <MailIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-brand-text-secondary" />
                            <input name="email" value={profile.email} onChange={handleInputChange} className={inputCls + ' pl-10'} placeholder="email@vendor.com" />
                        </div>
                    </div>
                    <div>
                        <FieldLabel optional>Website / Portofolio</FieldLabel>
                        <div className="relative">
                            <LinkIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-brand-text-secondary" />
                            <input name="website" value={profile.website} onChange={handleInputChange} className={inputCls + ' pl-10'} placeholder="www.vendor.com" />
                        </div>
                    </div>
                    <div className="md:col-span-2">
                        <FieldLabel optional>Alamat Kantor</FieldLabel>
                        <div className="relative">
                            <MapPinIcon className="absolute left-3 top-3 w-4 h-4 text-brand-text-secondary" />
                            <textarea name="address" value={profile.address} onChange={handleInputChange} className={inputCls + ' pl-10 h-20 resize-none'} placeholder="Alamat lengkap kantor..." />
                        </div>
                    </div>
                </div>
            </FormSection>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormSection icon={<ImageIcon className="w-4 h-4" />} title="Logo Studio">
                    <div className="flex flex-col items-center gap-4 py-2">
                        <div className="w-32 h-32 rounded-2xl bg-white border-2 border-dashed border-brand-border flex items-center justify-center overflow-hidden">
                            {profile.logoBase64 ? (
                                <img src={profile.logoBase64} alt="Logo" className="w-full h-full object-contain p-3" />
                            ) : (
                                <ImageIcon className="w-10 h-10 text-brand-text-secondary opacity-30" />
                            )}
                        </div>
                        <input type="file" onChange={handleLogoChange} className="hidden" id="logo-upload" accept="image/*" disabled={logoUploading} />
                        <label htmlFor="logo-upload" className={`px-6 py-2 rounded-xl border border-brand-border text-xs font-bold cursor-pointer hover:bg-brand-bg transition flex items-center gap-2 ${logoUploading ? 'opacity-50 pointer-events-none' : ''}`}>
                            {logoUploading ? (
                                <><div className="w-3.5 h-3.5 border-2 border-current border-t-transparent rounded-full animate-spin" /> Mengupload...</>
                            ) : (
                                <><ImageIcon className="w-3.5 h-3.5" /> Ganti Logo</>
                            )}
                        </label>
                    </div>
                </FormSection>

                <FormSection icon={<PencilIcon className="w-4 h-4" />} title="Tanda Tangan Digital">
                    <div className="flex flex-col items-center gap-4 py-2">
                        <div className="w-32 h-32 rounded-2xl bg-white border-2 border-dashed border-brand-border flex items-center justify-center overflow-hidden">
                            {profile.signatureBase64 ? (
                                <img src={profile.signatureBase64} alt="TTD" className="w-full h-full object-contain filter invert opacity-80" />
                            ) : (
                                <PencilIcon className="w-10 h-10 text-brand-text-secondary opacity-30" />
                            )}
                        </div>
                        <input type="file" onChange={handleSignatureChange} className="hidden" id="sig-upload" accept="image/*" disabled={sigUploading} />
                        <label htmlFor="sig-upload" className={`px-6 py-2 rounded-xl border border-brand-border text-xs font-bold cursor-pointer hover:bg-brand-bg transition flex items-center gap-2 ${sigUploading ? 'opacity-50 pointer-events-none' : ''}`}>
                            {sigUploading ? (
                                <><div className="w-3.5 h-3.5 border-2 border-current border-t-transparent rounded-full animate-spin" /> Mengupload...</>
                            ) : (
                                <><PencilIcon className="w-3.5 h-3.5" /> Ganti TTD</>
                            )}
                        </label>
                    </div>
                </FormSection>
            </div>

            {saveError && <div className="p-4 rounded-xl bg-red-400/10 border border-red-400/20 text-red-400 text-sm font-bold text-center">{saveError}</div>}
            {showSuccess && <div className="p-4 rounded-xl bg-green-400/10 border border-green-400/20 text-green-400 text-sm font-bold text-center flex items-center justify-center gap-2"><CheckCircleIcon className="w-5 h-5" /> Perubahan berhasil disimpan!</div>}

            <div className="flex justify-end pt-4 border-t border-brand-border">
                <button type="submit" disabled={isSaving} className="px-10 py-2.5 rounded-xl bg-blue-600 text-white text-sm font-bold hover:bg-blue-700 shadow-lg shadow-blue-500/20 transition active:scale-95 disabled:opacity-60">
                    {isSaving ? 'Menyimpan...' : 'Simpan Perubahan'}
                </button>
            </div>
        </form>
    );
};
