import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTeamMembers } from '@/features/team/api/useTeamQueries';
import { TeamForm } from '@/features/team/components/TeamForm';
import { useApp } from '@/app/AppContext';
import { TeamMember } from '@/types';
import { createTeamMember as createTeamMemberRow, updateTeamMember as updateTeamMemberRow } from '@/services/teamMembers';
import { useQueryClient } from '@tanstack/react-query';
import { ChevronLeftIcon, UsersIcon } from 'lucide-react';
import { generatePrettyAccessId } from '@/utils/idUtils';

const emptyMember: Omit<TeamMember, 'id' | 'rating' | 'performanceNotes' | 'portalAccessId'> = { 
    name: '', 
    role: '', 
    email: '', 
    phone: '', 
    standardFee: 0, 
    noRek: '', 
    category: 'Tim' 
};

const TeamEditPage: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const { showNotification } = useApp();
    const { data: teamMembers = [] } = useTeamMembers();

    const isEdit = id && id !== 'new';
    const [formData, setFormData] = useState(emptyMember);
    const [selectedMember, setSelectedMember] = useState<TeamMember | null>(null);

    useEffect(() => {
        if (isEdit && teamMembers.length > 0) {
            const member = teamMembers.find(m => m.id === Number(id));
            if (member) {
                setSelectedMember(member);
                setFormData({
                    name: member.name || '',
                    role: member.role || '',
                    email: member.email || '',
                    phone: member.phone || '',
                    standardFee: typeof member.standardFee === 'number' ? member.standardFee : 0,
                    noRek: member.noRek || '',
                    category: member.category || 'Tim'
                });
            }
        }
    }, [id, teamMembers, isEdit]);

    const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: name === 'standardFee' ? Number(value) : value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            if (!isEdit) {
                const payload: Omit<TeamMember, 'id'> = {
                    ...formData,
                    rating: 0,
                    performanceNotes: [],
                    portalAccessId: generatePrettyAccessId(formData.name),
                } as any;
                const created = await createTeamMemberRow(payload);
                queryClient.invalidateQueries({ queryKey: ['teamMembers'] });
                showNotification(`Tim / Vendor ${created.name} berhasil ditambahkan.`);
                navigate('/member');
            } else if (selectedMember) {
                const updated = await updateTeamMemberRow(selectedMember.id, formData as Partial<TeamMember>);
                queryClient.invalidateQueries({ queryKey: ['teamMembers'] });
                showNotification(`Data ${updated.name} berhasil diperbarui.`);
                navigate('/member');
            }
        } catch (err: any) {
            showNotification(`Gagal menyimpan data: ${err?.message || 'Coba lagi.'}`);
        }
    };

    return (
        <div className="min-h-screen bg-brand-bg relative overflow-x-hidden">
            <div className="absolute top-0 left-0 w-full h-[400px] bg-gradient-to-b from-brand-accent/10 to-transparent pointer-events-none"></div>
            
            <header className="sticky top-0 z-40 bg-brand-bg/60 backdrop-blur-xl border-b border-brand-border/50">
                <div className="max-w-5xl mx-auto px-4 sm:px-6 h-20 flex items-center justify-between">
                    <div className="flex items-center gap-6">
                        <button 
                            onClick={() => navigate('/member')}
                            className="group flex items-center gap-2 p-2 rounded-2xl hover:bg-brand-surface transition-all active:scale-95 border border-transparent hover:border-brand-border"
                        >
                            <div className="p-2 rounded-xl bg-brand-surface border border-brand-border group-hover:bg-brand-accent group-hover:text-white transition-all">
                                <ChevronLeftIcon className="w-5 h-5" />
                            </div>
                            <span className="text-sm font-bold text-brand-text-secondary group-hover:text-brand-text-light hidden sm:block transition-colors">Batal</span>
                        </button>
                        
                        <div className="h-8 w-[1px] bg-brand-border hidden sm:block"></div>

                        <div className="flex items-center gap-4">
                            <div className="hidden sm:flex w-12 h-12 rounded-2xl bg-gradient-to-br from-brand-accent to-blue-600 items-center justify-center shadow-xl shadow-brand-accent/20">
                                <UsersIcon className="w-6 h-6 text-white" />
                            </div>
                            <div>
                                <h1 className="text-xl font-black text-brand-text-light tracking-tight">
                                    {isEdit ? 'Edit Tim / Vendor' : 'Tambah Tim / Vendor'}
                                </h1>
                                <p className="text-[10px] text-brand-text-secondary font-bold uppercase tracking-widest mt-0.5">
                                    {isEdit ? formData.name : 'Data Baru'}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </header>

            <main className="max-w-3xl mx-auto px-4 sm:px-6 py-12 relative z-10">
                <div className="bg-brand-surface border border-brand-border rounded-[2.5rem] p-8 md:p-12 shadow-sm">
                    <TeamForm
                        mode={isEdit ? 'edit' : 'add'}
                        formData={formData}
                        setFormData={setFormData}
                        onChange={handleFormChange}
                        onSubmit={handleSubmit}
                        selectedMember={selectedMember}
                        inline={true}
                    />
                </div>
            </main>
        </div>
    );
};

export default TeamEditPage;
