import React, { useState, useEffect, useCallback } from 'react';
import { useSettingsPage } from '@/features/settings/hooks/useSettingsPage';
import { SettingsPageProps } from '@/features/settings/types';
import { ProfileSettingsTab } from '@/features/settings/components/ProfileSettingsTab';
import { FinanceSettingsTab } from '@/features/settings/components/FinanceSettingsTab';
import { TeamSettingsTab } from '@/features/settings/components/TeamSettingsTab';
import { PackageSettingsTab } from '@/features/settings/components/PackageSettingsTab';
import { ProjectSettingsTab } from '@/features/settings/components/ProjectSettingsTab';
import { MessageSettingsTab } from '@/features/settings/components/MessageSettingsTab';
import { PublicPageSettingsTab } from '@/features/settings/components/PublicPageSettingsTab';
import { UsersIcon, CashIcon, PackageIcon, LayoutGridIcon, MessageSquareIcon, GlobeIcon } from '@/constants';

import { useQueryClient, useQuery } from '@tanstack/react-query';
import { useProjects } from '@/features/projects/api/useProjects';
import { listUsers } from '@/services/users';
import { useProfile } from '@/features/settings/api/useProfileQueries';

type TabId = 'profile' | 'public' | 'finance' | 'team' | 'packages' | 'projects' | 'messages';

const TABS = [
    { id: 'profile', label: 'Profil Vendor', icon: UsersIcon },
    { id: 'public', label: 'Halaman Publik', icon: GlobeIcon },
    { id: 'finance', label: 'Keuangan / BANK', icon: CashIcon },
    { id: 'team', label: 'Team & Akses', icon: UsersIcon },
    { id: 'packages', label: 'Kategori Paket', icon: PackageIcon },
    { id: 'projects', label: 'Acara & Status Acara', icon: LayoutGridIcon },
    { id: 'messages', label: 'Template Pesan', icon: MessageSquareIcon },
];

export const SettingsPage: React.FC<SettingsPageProps> = ({ currentUser }) => {
    const { data: profileFromServer, isLoading: isProfileLoading } = useProfile();
    const queryClient = useQueryClient();

    const { data: qProjects } = useProjects();
    const projects = qProjects || [];
    
    const { data: users = [] } = useQuery({ queryKey: ['users'], queryFn: listUsers });
    
    const setUsers = (updater: any) => {
        const current = queryClient.getQueryData(['users']) || [];
        const next = typeof updater === 'function' ? updater(current) : updater;
        queryClient.setQueryData(['users'], next);
        queryClient.invalidateQueries({ queryKey: ['users'] });
    };

    // profile is kept in LOCAL React state so edits are isolated from
    // React Query background refetches. It is seeded once from server data.
    const [profile, setProfile] = useState<any>(null);
    useEffect(() => {
        if (profileFromServer && !profile) {
            setProfile(profileFromServer);
        }
    }, [profileFromServer]);

    const {
        showSuccess, isSaving, saveError,
        showNotification, handleProfileSubmit, handleCategoryUpdate,
        chatTemplates, setChatTemplates, billingTemplates, setBillingTemplates, templatesSeededRef,
    } = useSettingsPage({ currentUser });

    // Seed chat/billing templates from profile once
    useEffect(() => {
        if (profile && !templatesSeededRef.current) {
            if (profile.chatTemplates?.length) setChatTemplates(profile.chatTemplates);
            if (profile.billingTemplates?.length) setBillingTemplates(profile.billingTemplates);
            templatesSeededRef.current = true;
        }
    }, [profile]);

    // Wrap handlers to always pass the latest local profile state
    const handleProfileSubmitWithData = useCallback((e: React.FormEvent) => {
        handleProfileSubmit(e, profile);
    }, [handleProfileSubmit, profile]);

    const handleCategoryUpdateWithProfile = useCallback((field: any, categories: string[]) => {
        handleCategoryUpdate(field, categories, profile);
        // Also update local profile state so UI stays in sync without waiting for refetch
        setProfile((prev: any) => prev ? { ...prev, [field]: categories } : prev);
    }, [handleCategoryUpdate, profile]);

    // Component states
    const [activeTab, setActiveTab] = useState<TabId>('profile');

    // Category Inputs (Internal to page state)
    const [incomeInput, setIncomeInput] = useState('');
    const [editIncome, setEditIncome] = useState<string | null>(null);
    const [expenseInput, setExpenseInput] = useState('');
    const [editExpense, setEditExpense] = useState<string | null>(null);
    const [prjTypeInput, setPrjTypeInput] = useState('');
    const [editPrjType, setEditPrjType] = useState<string | null>(null);
    const [evtTypeInput, setEvtTypeInput] = useState('');
    const [editEvtType, setEditEvtType] = useState<string | null>(null);
    const [pkgCatInput, setPkgCatInput] = useState('');
    const [editPkgCat, setEditPkgCat] = useState<string | null>(null);

    if (isProfileLoading || !profileFromServer || !profile) {
        return <div className="p-8 text-center text-brand-text-secondary animate-pulse font-black uppercase tracking-widest">Memuat Pengaturan...</div>;
    }

    return (
        <div className="p-4 md:p-8 max-w-[1400px] mx-auto space-y-8 animate-in fade-in duration-500">
            <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-2xl md:text-3xl font-black text-brand-text-light tracking-tight">Pengaturan & Konfigurasi</h1>
                    <p className="text-brand-text-secondary text-sm mt-1">Sesuaikan identitas vendor, manajemen tim, dan template sistem.</p>
                </div>
            </header>

            <div className="flex flex-col md:flex-row gap-6 md:gap-8 min-h-[600px]">
                {/* Sidebar Navigation */}
                <aside className="w-full md:w-64 lg:w-72 shrink-0">
                    <nav className="flex md:flex-col gap-2 overflow-x-auto md:overflow-visible pb-2 md:pb-0 scrollbar-hide">
                        {TABS.map((tab) => {
                            const isActive = String(activeTab) === String(tab.id);
                            const Icon = tab.icon;
                            return (
                                <button
                                    key={tab.id}
                                    onClick={() => setActiveTab(tab.id as TabId)}
                                    className={`flex items-center gap-3 px-4 py-3.5 rounded-2xl text-left transition-all duration-300 md:w-full whitespace-nowrap min-w-max md:min-w-0 ${
                                        isActive 
                                        ? 'bg-brand-accent text-white shadow-lg shadow-brand-accent/30 font-bold scale-[1.02]' 
                                        : 'bg-white/40 backdrop-blur-sm border border-brand-border/20 text-brand-text-secondary hover:bg-white hover:text-brand-accent font-medium hover:-translate-y-0.5 hover:shadow-sm'
                                    }`}
                                >
                                    <Icon className={`w-[22px] h-[22px] ${isActive ? 'text-white' : ''}`} />
                                    <span>{tab.label}</span>
                                </button>
                            );
                        })}
                    </nav>
                </aside>

                {/* Content Area */}
                <main className="flex-1 bg-white/70 backdrop-blur-2xl border border-white/40 shadow-xl shadow-brand-border/20 rounded-[28px] overflow-hidden">
                    <div className="h-full p-6 md:p-10 animate-in fade-in slide-in-from-bottom-4 duration-500 fill-mode-both" key={activeTab}>
                        {/* Tab Content Header */}
                        <div className="flex items-center gap-4 mb-8 pb-6 border-b border-brand-border/40">
                            <div className="p-3 bg-brand-accent/10 rounded-2xl">
                                {React.createElement(TABS.find(t => String(t.id) === String(activeTab))?.icon || UsersIcon, { className: "w-6 h-6 text-brand-accent"})}
                            </div>
                            <h2 className="text-2xl font-black text-brand-text-light">{TABS.find(t => String(t.id) === String(activeTab))?.label}</h2>
                        </div>

                        {/* Components */}
                        <div className="w-full max-w-4xl">
                            {activeTab === 'profile' && (
                                <ProfileSettingsTab profile={profile} setProfile={setProfile} handleProfileSubmit={handleProfileSubmitWithData} isSaving={isSaving} showSuccess={showSuccess} saveError={saveError} />
                            )}
                            {activeTab === 'public' && (
                                <PublicPageSettingsTab profile={profile} setProfile={setProfile} handleProfileSubmit={handleProfileSubmitWithData} isSaving={isSaving} showSuccess={showSuccess} saveError={saveError} />
                            )}
                            {activeTab === 'finance' && (
                                <FinanceSettingsTab profile={profile} incomeCategoryInput={incomeInput} setIncomeCategoryInput={setIncomeInput} editingIncomeCategory={editIncome} setEditingIncomeCategory={setEditIncome} expenseCategoryInput={expenseInput} setExpenseCategoryInput={setExpenseInput} editingExpenseCategory={editExpense} setEditingExpenseCategory={setEditExpense} handleCategoryUpdate={handleCategoryUpdateWithProfile} />
                            )}
                            {activeTab === 'team' && (
                                <TeamSettingsTab users={users} setUsers={setUsers} currentUser={currentUser} />
                            )}
                            {activeTab === 'packages' && (
                                <PackageSettingsTab profile={profile} packageCategoryInput={pkgCatInput} setPackageCategoryInput={setPkgCatInput} editingPackageCategory={editPkgCat} setEditingPackageCategory={setEditPkgCat} handleCategoryUpdate={handleCategoryUpdateWithProfile} />
                            )}
                            {activeTab === 'projects' && (
                                <ProjectSettingsTab profile={profile} setProfile={setProfile} projects={projects} projectTypeInput={prjTypeInput} setProjectTypeInput={setPrjTypeInput} editingProjectType={editPrjType} setEditingProjectType={setEditPrjType} eventTypeInput={evtTypeInput} setEventTypeInput={setEvtTypeInput} editingEventType={editEvtType} setEditingEventType={setEditEvtType} handleCategoryUpdate={handleCategoryUpdateWithProfile} />
                            )}
                            {activeTab === 'messages' && (
                                <MessageSettingsTab profile={profile} setProfile={setProfile} showSuccess={showNotification} />
                            )}
                        </div>
                    </div>
                </main>
            </div>
        </div>
    );
};

