import { useState, useEffect, useCallback } from 'react';
import type { ChatTemplate, Profile } from '@/types';
import {
  processTemplate,
  validateTemplate,
} from '@/utils/chatUtils';
import { upsertProfile } from '@/services/profile';
import { useProfile } from '@/features/settings/api/useProfileQueries';
import { CHAT_TEMPLATES } from '@/constants';

export function useChatTemplates() {
  const { data: userProfileData, refetch: refetchProfile } = useProfile();
  const userProfile = userProfileData as Profile | undefined;
  
  const [templates, setTemplates] = useState<ChatTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  // Monitor online status
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Load templates from profile
  const loadTemplates = useCallback(async () => {
    if (!userProfile) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      // Use templates from user profile if they exist, otherwise fallback to defaults
      const chatTemplates = (userProfile.chatTemplates && userProfile.chatTemplates.length > 0)
        ? userProfile.chatTemplates
        : CHAT_TEMPLATES;
        
      setTemplates(chatTemplates);
    } catch (err: any) {
      console.error('[useChatTemplates] Error loading templates:', err);
      setError(err.message || 'Gagal memuat templates');
    } finally {
      setLoading(false);
    }
  }, [userProfile]);

  useEffect(() => {
    loadTemplates();
  }, [loadTemplates]);

  // Update template
  const updateTemplate = useCallback(
    async (templateId: string, updates: Partial<ChatTemplate>) => {
      if (!userProfile?.id) {
        throw new Error('User profile ID required');
      }

      try {
        setError(null);
        const updatedTemplates = templates.map(t =>
          String(t.id) === String(templateId) ? { ...t, ...updates } : t
        );

        await upsertProfile({
          id: userProfile.id,
          chatTemplates: updatedTemplates
        });
        
        setTemplates(updatedTemplates);
        await refetchProfile();
        return updatedTemplates;
      } catch (err: any) {
        console.error('[useChatTemplates] Error updating template:', err);
        setError(err.message || 'Gagal update template');
        throw err;
      }
    },
    [userProfile, templates, refetchProfile]
  );

  // Add template
  const addTemplate = useCallback(
    async (newTemplate: Omit<ChatTemplate, 'id'>) => {
      if (!userProfile?.id) {
        throw new Error('User profile ID required');
      }

      // Validate
      const validation = validateTemplate({ ...newTemplate, id: 'temp' } as ChatTemplate);
      if (!validation.valid) {
        throw new Error(validation.errors.join(', '));
      }

      try {
        setError(null);
        const template: ChatTemplate = {
          ...newTemplate,
          id: `custom_${Date.now()}`,
        };

        const updatedTemplates = [...templates, template];

        await upsertProfile({
          id: userProfile.id,
          chatTemplates: updatedTemplates
        });

        setTemplates(updatedTemplates);
        await refetchProfile();
        return updatedTemplates;
      } catch (err: any) {
        console.error('[useChatTemplates] Error adding template:', err);
        setError(err.message || 'Gagal menambah template');
        throw err;
      }
    },
    [userProfile, templates, refetchProfile]
  );

  // Delete template
  const deleteTemplate = useCallback(
    async (templateId: string) => {
      if (!userProfile?.id) {
        throw new Error('User profile ID required');
      }

      try {
        setError(null);
        const updatedTemplates = templates.filter(t => String(t.id) !== String(templateId));

        await upsertProfile({
          id: userProfile.id,
          chatTemplates: updatedTemplates
        });

        setTemplates(updatedTemplates);
        await refetchProfile();
        return updatedTemplates;
      } catch (err: any) {
        console.error('[useChatTemplates] Error deleting template:', err);
        setError(err.message || 'Gagal menghapus template');
        throw err;
      }
    },
    [userProfile, templates, refetchProfile]
  );

  // Reset to defaults
  const resetToDefaults = useCallback(async () => {
    if (!userProfile?.id) {
      throw new Error('User profile ID required');
    }

    try {
      setError(null);
      
      await upsertProfile({
        id: userProfile.id,
        chatTemplates: CHAT_TEMPLATES
      });

      setTemplates(CHAT_TEMPLATES);
      await refetchProfile();
      return CHAT_TEMPLATES;
    } catch (err: any) {
      console.error('[useChatTemplates] Error resetting templates:', err);
      setError(err.message || 'Gagal reset templates');
      throw err;
    }
  }, [userProfile, refetchProfile]);

  // Get template by ID
  const getTemplateById = useCallback(
    async (templateId: string) => {
      return templates.find(t => String(t.id) === String(templateId)) || null;
    },
    [templates]
  );

  return {
    templates,
    loading,
    error,
    isOnline,
    updateTemplate,
    addTemplate,
    deleteTemplate,
    resetToDefaults,
    getTemplateById,
    processTemplate,
    validateTemplate,
    reload: loadTemplates,
  };
}
