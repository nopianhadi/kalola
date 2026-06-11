import { useState, useEffect, useCallback, useRef } from 'react';
import { ChatTemplate } from '@/types';
import { CHAT_TEMPLATES, DEFAULT_BILLING_TEMPLATES } from '@/constants';
import { useUpdateProfile } from '@/features/settings/api/useProfileQueries';


interface UseSettingsPageProps {
}


export const useSettingsPage = (_props?: UseSettingsPageProps) => {
    const updateProfileMutation = useUpdateProfile();

    const [activeTab, setActiveTab] = useState('profile');
    const [showSuccess, setShowSuccess] = useState(false);
    const [successMessage, setSuccessMessage] = useState('Perubahan berhasil disimpan!');
    const [isSaving, setIsSaving] = useState(false);
    const [saveError, setSaveError] = useState('');


    const showNotification = useCallback((msg: string) => {
        setSuccessMessage(msg);
        setShowSuccess(true);
        setTimeout(() => setShowSuccess(false), 3000);
    }, []);

    useEffect(() => {
        try {
            const tab = window.localStorage.getItem('vena-settings-tab');
            if (tab) {
                setActiveTab(tab);
                window.localStorage.removeItem('vena-settings-tab');
            }
        } catch (e) {}
    }, []);

    /**
     * handleProfileSubmit menerima data profile terbaru sebagai parameter.
     * Ini memastikan data yang disimpan adalah apa yang sedang dilihat user
     * di form, bukan snapshot lama dari React Query cache.
     *
     * Cara penggunaan di SettingsPage:
     *   handleProfileSubmit(e, profile)  ← 'profile' adalah state lokal yang sudah di-update user
     */
    const handleProfileSubmit = useCallback(async (e?: React.FormEvent, latestProfile?: any) => {
        if (e) e.preventDefault();
        if (isSaving) return;
        if (!latestProfile) {
            setSaveError('Data profil tidak tersedia. Coba muat ulang halaman.');
            return;
        }
        setIsSaving(true);
        setSaveError('');
        try {
            await updateProfileMutation.mutateAsync(latestProfile);
            showNotification('Profil berhasil diperbarui!');
        } catch (err: any) {
            setSaveError(err?.message || 'Gagal menyimpan profil.');
        } finally {
            setIsSaving(false);
        }
    }, [isSaving, updateProfileMutation, showNotification]);


    const handleCategoryUpdate = async (field: keyof any, categories: string[], currentProfile?: any) => {
        try {
            await updateProfileMutation.mutateAsync({ id: currentProfile?.id, [field]: categories } as any);
            showNotification('Kategori berhasil diperbarui!');
        } catch (err: any) {
            alert('Gagal menyimpan: ' + (err?.message || 'Coba lagi.'));
        }
    };


    // Chat Template Logic — initialized from constants as fallback
    const [chatTemplates, setChatTemplates] = useState<ChatTemplate[]>(CHAT_TEMPLATES);
    const [billingTemplates, setBillingTemplates] = useState<ChatTemplate[]>(DEFAULT_BILLING_TEMPLATES);
    // Track if templates have been seeded from profile data
    const templatesSeededRef = useRef(false);

    return {
        activeTab,
        setActiveTab,
        showSuccess,
        successMessage,
        isSaving,
        saveError,
        showNotification,
        handleProfileSubmit,
        handleCategoryUpdate,
        chatTemplates,
        setChatTemplates,
        billingTemplates,
        setBillingTemplates,
        templatesSeededRef,
    };
};
