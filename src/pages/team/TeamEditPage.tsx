import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTeamMembers } from '@/features/team/api/useTeamQueries';
import { TeamForm } from '@/features/team/components/TeamForm';
import { useApp } from '@/app/AppContext';
import { TeamMember } from '@/types';
import { createTeamMember as createTeamMemberRow, updateTeamMember as updateTeamMemberRow } from '@/services/teamMembers';
import { useQueryClient } from '@tanstack/react-query';
import { ArrowLeftIcon, UsersIcon } from 'lucide-react';
import { generatePrettyAccessId } from '@/utils/idUtils';

const emptyMember: Omit<TeamMember, 'id' | 'rating' | 'performanceNotes' | 'portalAccessId'> = {
    name: '', role: '', email: '', phone: '', standardFee: 0, noRek: '', category: 'Tim'
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

    const onCancel = () => navigate('/member');

    return (
        <div className="min-h-screen bg-brand-bg">
            {/* ── Header ── */}
            <header className="sticky top-0 z-40 bg-brand-bg/80 backdrop-blur-xl border-b border-brand-border">
                <div className="max-w-3xl mx-auto px-4 sm:px-6 h-16 flex items-center gap-4">
                    <button onClick={onCancel}
                        className="p-2 rounded-xl border border-brand-border hover:bg-brand-surface text-brand-text-secondary hover:text-brand-text-light transition active:scale-95">
                        <ArrowLeftIcon className="w-4 h-4" />
                    </button>
                    <div className="h-6 w-px bg-brand-border" />
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                        <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-brand-accent to-blue-600 flex items-center justify-center flex-shrink-0 shadow-md shadow-brand-accent/20">
                            <UsersIcon className="w-4 h-4 text-white" />
                        </div>
                        <div className="min-w-0">
                            <h1 className="text-sm font-bold text-brand-text-light truncate">
                                {isEdit ? 'Edit Tim / Vendor' : 'Tambah Tim / Vendor'}
                            </h1>
                            {isEdit && formData.name && (
                                <p className="text-xs text-brand-text-secondary truncate">{formData.name}</p>
                            )}
                        </div>
                    </div>
                </div>
            </header>

            {/* ── Content ── */}
            <main className="max-w-3xl mx-auto px-4 sm:px-6 py-8 pb-20">
                <div className="bg-brand-surface rounded-2xl border border-brand-border p-6 md:p-8">
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
