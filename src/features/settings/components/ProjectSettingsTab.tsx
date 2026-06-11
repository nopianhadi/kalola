import React from 'react';
import { Profile, Project } from '@/types';
import { CategoryManager } from '@/features/settings/components/CategoryManager';
import { ProjectStatusManager } from '@/features/settings/components/ProjectStatusManager';
import { DEFAULT_STATUS_CONFIG, DEFAULT_PROJECT_TYPES, DEFAULT_EVENT_TYPES } from '@/features/settings/utils/settings.utils';
import { FormSection } from '@/shared/ui/FormSection';
import { PackageIcon, CalendarIcon, ListIcon } from '@/constants';

interface ProjectSettingsTabProps {
    profile: Profile;
    setProfile: React.Dispatch<React.SetStateAction<Profile>>;
    projects: Project[];
    projectTypeInput: string;
    setProjectTypeInput: (v: string) => void;
    editingProjectType: string | null;
    setEditingProjectType: (v: string | null) => void;
    eventTypeInput: string;
    setEventTypeInput: (v: string) => void;
    editingEventType: string | null;
    setEditingEventType: (v: string | null) => void;
    handleCategoryUpdate: (field: keyof Profile, categories: string[]) => void;
}

export const ProjectSettingsTab: React.FC<ProjectSettingsTabProps> = ({
    profile, setProfile, projects, projectTypeInput, setProjectTypeInput,
    editingProjectType, setEditingProjectType, eventTypeInput, setEventTypeInput,
    editingEventType, setEditingEventType, handleCategoryUpdate
}) => {
    const projectTypes = profile.projectTypes || [];
    const eventTypes = profile.eventTypes || [];

    const handleUpdate = (field: 'projectTypes' | 'eventTypes', input: string, setInput: any, categories: string[], editing: string | null, setEditing: any) => {
        const val = input.trim(); if (!val) return;
        let updated: string[];
        if (editing) updated = categories.map(c => c === editing ? val : c);
        else updated = categories.includes(val) ? categories : [...categories, val];
        handleCategoryUpdate(field, updated); setInput(''); setEditing(null);
    };

    const handleAddSuggestedItem = (field: 'projectTypes' | 'eventTypes', categories: string[], item: string) => {
        if (categories.includes(item)) return;
        handleCategoryUpdate(field, [...categories, item]);
    };

    const handleAddAllSuggested = (field: 'projectTypes' | 'eventTypes', categories: string[], defaults: string[]) => {
        const toAdd = defaults.filter(s => !categories.includes(s));
        if (!toAdd.length) return;
        handleCategoryUpdate(field, [...categories, ...toAdd]);
    };

    return (
        <div className="max-w-6xl space-y-8">
            {/* Tipe & Jenis Acara */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-10 gap-y-8">
                <div className="space-y-5">
                    <FormSection
                        icon={<PackageIcon className="w-4 h-4" />}
                        title="Tipe Acara / Layanan"
                        subtitle="Jenis layanan yang ditawarkan vendor"
                    />
                    <CategoryManager
                        title="Daftar Tipe Acara"
                        placeholder="Tambah Tipe (e.g. Wedding Photography)"
                        categories={projectTypes}
                        inputValue={projectTypeInput}
                        onInputChange={setProjectTypeInput}
                        onAddOrUpdate={() => handleUpdate('projectTypes', projectTypeInput, setProjectTypeInput, projectTypes, editingProjectType, setEditingProjectType)}
                        onEdit={(cat) => { setEditingProjectType(cat); setProjectTypeInput(cat); }}
                        onDelete={(cat) => confirm(`Hapus "${cat}"?`) && handleCategoryUpdate('projectTypes', projectTypes.filter(c => c !== cat))}
                        editingValue={editingProjectType}
                        onCancelEdit={() => { setEditingProjectType(null); setProjectTypeInput(''); }}
                        suggestedDefaults={DEFAULT_PROJECT_TYPES}
                        onAddSuggested={() => handleAddAllSuggested('projectTypes', projectTypes, DEFAULT_PROJECT_TYPES)}
                        onAddSuggestedItem={(item) => handleAddSuggestedItem('projectTypes', projectTypes, item)}
                    />
                </div>

                <div className="space-y-5">
                    <FormSection
                        icon={<CalendarIcon className="w-4 h-4" />}
                        title="Jenis Acara Pernikahan"
                        subtitle="Rangkaian acara di hari pernikahan"
                    />
                    <CategoryManager
                        title="Daftar Jenis Acara"
                        placeholder="Tambah Jenis (e.g. Akad Nikah)"
                        categories={eventTypes}
                        inputValue={eventTypeInput}
                        onInputChange={setEventTypeInput}
                        onAddOrUpdate={() => handleUpdate('eventTypes', eventTypeInput, setEventTypeInput, eventTypes, editingEventType, setEditingEventType)}
                        onEdit={(cat) => { setEditingEventType(cat); setEventTypeInput(cat); }}
                        onDelete={(cat) => confirm(`Hapus "${cat}"?`) && handleCategoryUpdate('eventTypes', eventTypes.filter(c => c !== cat))}
                        editingValue={editingEventType}
                        onCancelEdit={() => { setEditingEventType(null); setEventTypeInput(''); }}
                        suggestedDefaults={DEFAULT_EVENT_TYPES}
                        onAddSuggested={() => handleAddAllSuggested('eventTypes', eventTypes, DEFAULT_EVENT_TYPES)}
                        onAddSuggestedItem={(item) => handleAddSuggestedItem('eventTypes', eventTypes, item)}
                    />
                </div>
            </div>

            {/* Status Manager */}
            <div className="space-y-5">
                <FormSection
                    icon={<ListIcon className="w-4 h-4" />}
                    title="Manajemen Status Acara Pernikahan"
                    subtitle="Konfigurasi tahapan progres proyek"
                />
                <ProjectStatusManager
                    config={profile.projectStatusConfig || []}
                    onConfigChange={(newConfig) => setProfile(p => ({ ...p, projectStatusConfig: newConfig }))}
                    projects={projects}
                    profile={profile}
                    onAddDefaultStatuses={() => confirm('Gunakan status default?') && handleCategoryUpdate('projectStatusConfig', DEFAULT_STATUS_CONFIG as any)}
                />
            </div>
        </div>
    );
};
