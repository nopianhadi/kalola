import React from 'react';
import { Profile } from '@/types';
import { CategoryManager } from '@/features/settings/components/CategoryManager';
import { FormSection } from '@/shared/ui/FormSection';
import { CreditCardIcon, DollarSignIcon } from '@/constants';
import { DEFAULT_INCOME_CATEGORIES, DEFAULT_EXPENSE_CATEGORIES } from '@/features/settings/utils/settings.utils';

interface FinanceSettingsTabProps {
    profile: Profile;
    incomeCategoryInput: string;
    setIncomeCategoryInput: (v: string) => void;
    editingIncomeCategory: string | null;
    setEditingIncomeCategory: (v: string | null) => void;
    expenseCategoryInput: string;
    setExpenseCategoryInput: (v: string) => void;
    editingExpenseCategory: string | null;
    setEditingExpenseCategory: (v: string | null) => void;
    handleCategoryUpdate: (field: keyof Profile, categories: string[]) => void;
}

export const FinanceSettingsTab: React.FC<FinanceSettingsTabProps> = ({
    profile, incomeCategoryInput, setIncomeCategoryInput, editingIncomeCategory, setEditingIncomeCategory,
    expenseCategoryInput, setExpenseCategoryInput, editingExpenseCategory, setEditingExpenseCategory,
    handleCategoryUpdate
}) => {
    const incomeCategories = profile.incomeCategories || [];
    const expenseCategories = profile.expenseCategories || [];

    const handleUpdate = (field: 'incomeCategories' | 'expenseCategories', input: string, setInput: any, categories: string[], editing: string | null, setEditing: any) => {
        const val = input.trim(); if (!val) return;
        let updated: string[];
        if (editing) updated = categories.map(c => c === editing ? val : c);
        else updated = categories.includes(val) ? categories : [...categories, val];
        handleCategoryUpdate(field, updated); setInput(''); setEditing(null);
    };

    const handleAddSuggestedItem = (field: 'incomeCategories' | 'expenseCategories', categories: string[], item: string) => {
        if (categories.includes(item)) return;
        handleCategoryUpdate(field, [...categories, item]);
    };

    const handleAddAllSuggested = (field: 'incomeCategories' | 'expenseCategories', categories: string[], defaults: string[]) => {
        const toAdd = defaults.filter(s => !categories.includes(s));
        if (!toAdd.length) return;
        handleCategoryUpdate(field, [...categories, ...toAdd]);
    };

    return (
        <div className="max-w-6xl space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-10 gap-y-8">
                {/* Pemasukan */}
                <div className="space-y-5">
                    <FormSection
                        icon={<DollarSignIcon className="w-4 h-4" />}
                        title="Kategori Pemasukan"
                        subtitle="Sumber penerimaan dana"
                    />
                    <CategoryManager
                        title="Daftar Kategori Pemasukan"
                        placeholder="Tambah Kategori (e.g. Booking Fee)"
                        categories={incomeCategories}
                        inputValue={incomeCategoryInput}
                        onInputChange={setIncomeCategoryInput}
                        onAddOrUpdate={() => handleUpdate('incomeCategories', incomeCategoryInput, setIncomeCategoryInput, incomeCategories, editingIncomeCategory, setEditingIncomeCategory)}
                        onEdit={(cat) => { setEditingIncomeCategory(cat); setIncomeCategoryInput(cat); }}
                        onDelete={(cat) => confirm(`Hapus "${cat}"?`) && handleCategoryUpdate('incomeCategories', incomeCategories.filter(c => c !== cat))}
                        editingValue={editingIncomeCategory}
                        onCancelEdit={() => { setEditingIncomeCategory(null); setIncomeCategoryInput(''); }}
                        suggestedDefaults={DEFAULT_INCOME_CATEGORIES}
                        onAddSuggested={() => handleAddAllSuggested('incomeCategories', incomeCategories, DEFAULT_INCOME_CATEGORIES)}
                        onAddSuggestedItem={(item) => handleAddSuggestedItem('incomeCategories', incomeCategories, item)}
                    />
                </div>

                {/* Pengeluaran */}
                <div className="space-y-5">
                    <FormSection
                        icon={<CreditCardIcon className="w-4 h-4" />}
                        title="Kategori Pengeluaran"
                        subtitle="Jenis-jenis pengeluaran operasional"
                    />
                    <CategoryManager
                        title="Daftar Kategori Pengeluaran"
                        placeholder="Tambah Kategori (e.g. Gaji Team)"
                        categories={expenseCategories}
                        inputValue={expenseCategoryInput}
                        onInputChange={setExpenseCategoryInput}
                        onAddOrUpdate={() => handleUpdate('expenseCategories', expenseCategoryInput, setExpenseCategoryInput, expenseCategories, editingExpenseCategory, setEditingExpenseCategory)}
                        onEdit={(cat) => { setEditingExpenseCategory(cat); setExpenseCategoryInput(cat); }}
                        onDelete={(cat) => confirm(`Hapus "${cat}"?`) && handleCategoryUpdate('expenseCategories', expenseCategories.filter(c => c !== cat))}
                        editingValue={editingExpenseCategory}
                        onCancelEdit={() => { setEditingExpenseCategory(null); setExpenseCategoryInput(''); }}
                        suggestedDefaults={DEFAULT_EXPENSE_CATEGORIES}
                        onAddSuggested={() => handleAddAllSuggested('expenseCategories', expenseCategories, DEFAULT_EXPENSE_CATEGORIES)}
                        onAddSuggestedItem={(item) => handleAddSuggestedItem('expenseCategories', expenseCategories, item)}
                    />
                </div>
            </div>
        </div>
    );
};
