import React, { useState } from 'react';
import { User, ViewType } from '@/types';
import Modal from '@/shared/ui/Modal';
import { PlusIcon, PencilIcon, Trash2Icon, MailIcon, UsersIcon, KeyIcon } from '@/constants';
import { createUser, updateUser, deleteUser } from '@/services/users';
import { FormSection, FieldLabel, inputCls, selectCls } from '@/shared/ui/FormSection';

interface TeamSettingsTabProps {
    users: User[];
    setUsers: React.Dispatch<React.SetStateAction<User[]>>;
    currentUser: User | null;
}

const VIEW_TYPES: { value: ViewType; label: string }[] = [
    { value: ViewType.DASHBOARD, label: 'Dashboard' },
    { value: ViewType.CALENDAR, label: 'Kalendar' },
    { value: ViewType.BOOKING, label: 'Booking' },
    { value: ViewType.PROJECTS, label: 'Acara' },
    { value: ViewType.FINANCE, label: 'Finance' },
    { value: ViewType.CLIENTS, label: 'Klien' },
    { value: ViewType.TEAM, label: 'Team & Vendor' },
    { value: ViewType.SETTINGS, label: 'Settings' },
];

export const TeamSettingsTab: React.FC<TeamSettingsTabProps> = ({ users, setUsers, currentUser }) => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [modalMode, setModalMode] = useState<'add' | 'edit'>('add');
    const [selectedUser, setSelectedUser] = useState<User | null>(null);
    const [form, setForm] = useState({ fullName: '', email: '', password: '', confirmPassword: '', role: 'Member' as User['role'], permissions: [] as ViewType[] });
    const [error, setError] = useState('');

    const handleOpenModal = (mode: 'add' | 'edit', user?: User) => {
        setModalMode(mode);
        setSelectedUser(user || null);
        if (mode === 'edit' && user) {
            setForm({ fullName: user.fullName, email: user.email, role: user.role, password: '', confirmPassword: '', permissions: user.permissions || [] });
        } else {
            setForm({ fullName: '', email: '', password: '', confirmPassword: '', role: 'Member', permissions: [] });
        }
        setError(''); setIsModalOpen(true);
    };

    const handleFormSubmit = async (e: React.FormEvent) => {
        e.preventDefault(); setError('');
        if (form.password && form.password !== form.confirmPassword) { setError('Password tidak cocok'); return; }
        try {
            if (modalMode === 'add') {
                const created = await createUser({ ...form });
                setUsers(prev => [...prev, created]);
            } else if (selectedUser) {
                const updated = await updateUser(selectedUser.id, { ...form });
                setUsers(prev => prev.map(u => String(u.id) === String(selectedUser.id) ? updated : u));
            }
            setIsModalOpen(false);
        } catch (err: any) { setError(err?.message || 'Gagal'); }
    };

    const handleDeleteUser = async (user: User) => {
        if (!confirm(`Hapus ${user.fullName}?`)) return;
        try { await deleteUser(user.id); setUsers(prev => prev.filter(u => String(u.id) !== String(user.id))); }
        catch (err: any) { alert(err?.message || 'Gagal'); }
    };

    return (
        <div className="space-y-6 max-w-6xl mx-auto">
            <div className="flex justify-between items-center bg-white p-6 rounded-2xl border border-brand-border shadow-sm">
                <div>
                    <h3 className="text-lg font-bold text-brand-text-light">Manajemen Team & Akses</h3>
                    <p className="text-xs text-brand-text-secondary mt-1">Kelola anggota tim dan hak akses mereka ke fitur aplikasi.</p>
                </div>
                <button onClick={() => handleOpenModal('add')} className="button-primary py-2.5 px-6 rounded-xl flex items-center gap-2">
                    <PlusIcon className="w-5 h-5" /> Tambah Anggota
                </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {users.map(user => (
                    <div key={user.id} className="group bg-white border border-brand-border rounded-2xl p-6 transition-all hover:border-brand-accent/30 shadow-sm flex flex-col">
                        <div className="flex justify-between items-start mb-4">
                            <div className="w-12 h-12 rounded-2xl bg-brand-accent/10 text-brand-accent flex items-center justify-center text-xl font-bold">{user.fullName[0].toUpperCase()}</div>
                            <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button onClick={() => handleOpenModal('edit', user)} className="p-2 text-brand-text-secondary hover:text-brand-accent hover:bg-brand-accent/10 rounded-lg"><PencilIcon className="w-4 h-4" /></button>
                                {String(user.id) !== String(currentUser?.id) && <button onClick={() => handleDeleteUser(user)} className="p-2 text-brand-text-secondary hover:text-red-400 hover:bg-red-400/10 rounded-lg"><Trash2Icon className="w-4 h-4" /></button>}
                            </div>
                        </div>
                        <h4 className="font-bold text-brand-text-light text-lg">{user.fullName}</h4>
                        <p className="text-sm text-brand-text-secondary flex items-center gap-1.5"><MailIcon className="w-3.5 h-3.5" /> {user.email}</p>
                        <div className="mt-4 pt-4 border-t border-brand-border/50">
                            <div className="flex items-center justify-between"><span className="text-[10px] font-bold text-brand-text-secondary uppercase tracking-wider">Role</span><span className={`px-2.5 py-1 rounded-lg text-[10px] font-bold ${user.role === 'Admin' ? 'bg-brand-accent/10 text-brand-accent border border-brand-accent/20' : 'bg-brand-surface border border-brand-border text-brand-text-secondary'}`}>{user.role}</span></div>
                            <div className="mt-4"><span className="text-[10px] font-bold text-brand-text-secondary uppercase tracking-wider block mb-2">Akses Menu</span><div className="flex flex-wrap gap-1.5">{user.role === 'Admin' ? <span className="px-2 py-1 rounded-lg bg-green-400/10 text-green-400 border border-green-400/20 text-[10px] font-bold">Semua Akses</span> : user.permissions?.map(p => <span key={p} className="px-2 py-1 rounded-lg bg-brand-surface border border-brand-border text-brand-text-secondary text-[10px] uppercase font-bold">{p}</span>)}</div></div>
                        </div>
                    </div>
                ))}
            </div>

            <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={modalMode === 'add' ? 'Tambah Anggota Tim' : 'Edit Anggota Tim'} size="2xl">
                <form onSubmit={handleFormSubmit} className="space-y-6 -mt-6 md:-mt-8">
                    <FormSection icon={<UsersIcon className="w-4 h-4" />} title="Profil Anggota Tim" />

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <FieldLabel>Nama Lengkap</FieldLabel>
                            <input value={form.fullName} onChange={e => setForm(p => ({ ...p, fullName: e.target.value }))} className={inputCls + ' font-bold'} placeholder="Cth: Ahmad Budi" required />
                        </div>
                        <div>
                            <FieldLabel>Email Login</FieldLabel>
                            <input type="email" value={form.email} onChange={e => setForm(p => ({ ...p, email: e.target.value }))} className={inputCls} placeholder="email@vendor.com" required />
                        </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <FieldLabel>{modalMode === 'add' ? 'Kata Sandi' : 'Ganti Kata Sandi'}{modalMode === 'edit' && <span className="ml-1 font-normal text-brand-text-secondary/60">(opsional)</span>}</FieldLabel>
                            <input type="password" value={form.password} onChange={e => setForm(p => ({ ...p, password: e.target.value }))} className={inputCls + ' font-mono'} placeholder="••••••••" required={modalMode === 'add'} />
                        </div>
                        <div>
                            <FieldLabel>Konfirmasi Sandi</FieldLabel>
                            <input type="password" value={form.confirmPassword} onChange={e => setForm(p => ({ ...p, confirmPassword: e.target.value }))} className={inputCls + ' font-mono'} placeholder="••••••••" required={modalMode === 'add'} />
                        </div>
                    </div>

                    <FormSection icon={<KeyIcon className="w-4 h-4" />} title="Hak Akses Aplikasi" />

                    <div>
                        <FieldLabel>Role Akses</FieldLabel>
                        <select value={form.role} onChange={e => setForm(p => ({ ...p, role: e.target.value as User['role'] }))} className={selectCls + ' font-bold text-blue-600'}>
                            <option value="Member">Member (Akses Menu Terpilih)</option>
                            <option value="Admin">Admin (Akses Penuh)</option>
                        </select>
                    </div>

                    {form.role === 'Member' && (
                        <div>
                            <FieldLabel>Izin Akses Menu</FieldLabel>
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-1">
                                {VIEW_TYPES.map(vt => (
                                    <button
                                        key={vt.value}
                                        type="button"
                                        onClick={() => setForm(p => ({ ...p, permissions: p.permissions.includes(vt.value) ? p.permissions.filter(x => x !== vt.value) : [...p.permissions, vt.value] }))}
                                        className={`px-3 py-2.5 rounded-xl border text-xs font-bold transition-all ${form.permissions.includes(vt.value) ? 'bg-blue-600 border-blue-600 text-white shadow-md shadow-blue-500/20' : 'bg-brand-surface border-brand-border text-brand-text-secondary hover:border-blue-400 hover:text-blue-500'}`}
                                    >
                                        {vt.label}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    {error && <div className="p-3 bg-red-400/10 border border-red-400/20 text-red-500 text-xs font-bold rounded-xl text-center">⚠ {error}</div>}

                    <div className="flex justify-end gap-3 pt-5 border-t border-brand-border">
                        <button type="button" onClick={() => setIsModalOpen(false)} className="px-6 py-2.5 rounded-xl text-sm font-semibold text-brand-text-secondary hover:bg-brand-bg transition">Batal</button>
                        <button type="submit" className="px-8 py-2.5 rounded-xl text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 shadow-lg shadow-blue-500/20 transition active:scale-95">
                            {modalMode === 'add' ? 'Daftarkan' : 'Update'}
                        </button>
                    </div>
                </form>
            </Modal>
        </div>
    );
};
