import React from 'react';
import { Profile } from '@/types';
import { CategoryManager } from '@/features/settings/components/CategoryManager';
import { FormSection } from '@/shared/ui/FormSection';
import { PackageIcon } from '@/constants';
import { DEFAULT_PACKAGE_CATEGORIES } from '@/features/settings/utils/settings.utils';

interface PackageSettingsTabProps {
    profile: Profile;
    packageCategoryInput: string;
    setPackageCategoryInput: (v: string) => void;
    editingPackageCategory: string | null;
    setEditingPackageCategory: (v: string | null) => void;
    handleCategoryUpdate: (field: keyof Profile, categories: string[]) => void;
}

export const PackageSettingsTab: React.FC<PackageSettingsTabProps> = ({
    profile, packageCategoryInput, setPackageCategoryInput, editingPackageCategory, setEditingPackageCategory,
    handleCategoryUpdate
}) => {
    const categories = profile.packageCategories || [];

    const handleUpdate = () => {
        const val = packageCategoryInput.trim(); if (!val) return;
        let updated: string[];
        if (editingPackageCategory) updated = categories.map(c => c === editingPackageCategory ? val : c);
        else updated = categories.includes(val) ? categories : [...categories, val];
        handleCategoryUpdate('packageCategories', updated); setPackageCategoryInput(''); setEditingPackageCategory(null);
    };

    const handleAddSuggestedItem = (item: string) => {
        if (categories.includes(item)) return;
        handleCategoryUpdate('packageCategories', [...categories, item]);
    };

    const handleAddAllSuggested = () => {
        const toAdd = DEFAULT_PACKAGE_CATEGORIES.filter(s => !categories.includes(s));
        if (!toAdd.length) return;
        handleCategoryUpdate('packageCategories', [...categories, ...toAdd]);
    };

    return (
        <div className="max-w-2xl space-y-5">
            <FormSection icon={<PackageIcon className="w-4 h-4" />} title="Kategori Package" subtitle="Kelola jenis-jenis kategori paket layanan" />
            <CategoryManager
                title="Daftar Kategori Package"
                placeholder="Tambah Kategori (e.g. Wedding)"
                categories={categories}
                inputValue={packageCategoryInput}
                onInputChange={setPackageCategoryInput}
                onAddOrUpdate={handleUpdate}
                onEdit={(cat) => { setEditingPackageCategory(cat); setPackageCategoryInput(cat); }}
                onDelete={(cat) => confirm(`Hapus "${cat}"?`) && handleCategoryUpdate('packageCategories', categories.filter(c => c !== cat))}
                editingValue={editingPackageCategory}
                onCancelEdit={() => { setEditingPackageCategory(null); setPackageCategoryInput(''); }}
                suggestedDefaults={DEFAULT_PACKAGE_CATEGORIES}
                onAddSuggested={handleAddAllSuggested}
                onAddSuggestedItem={handleAddSuggestedItem}
            />
        </div>
    );
};
