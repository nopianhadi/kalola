import React from 'react';
import Modal from '@/shared/ui/Modal';
import RupiahInput from '@/shared/form/RupiahInput';
import { UsersIcon, BriefcaseIcon } from '@/constants';
import { TeamFormProps } from '../types';
import { FormSection, FieldLabel, inputCls, selectCls, FormActions } from '@/shared/ui/FormSection';

export const TeamForm: React.FC<TeamFormProps> = ({
    isOpen = false,
    onClose = () => {},
    mode,
    formData,
    setFormData,
    onChange,
    onSubmit,
    selectedMember,
    inline = false
}) => {
    const formContent = (
        <form onSubmit={onSubmit} className="space-y-6 -mt-6 md:-mt-8">

            {/* ── Informasi Utama ── */}
            <FormSection icon={<UsersIcon className="w-4 h-4" />} title="Informasi Tim / Vendor" />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <FieldLabel htmlFor="name">Nama Lengkap</FieldLabel>
                    <input id="name" type="text" name="name" value={formData.name} onChange={onChange}
                        className={inputCls + ' font-semibold'} placeholder="Nama Lengkap" required />
                </div>
                <div>
                    <FieldLabel htmlFor="role">Peran / Jabatan</FieldLabel>
                    <input id="role" type="text" name="role" value={formData.role} onChange={onChange}
                        className={inputCls + ' font-semibold'} placeholder="Cth: Fotografer" required />
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <FieldLabel htmlFor="email" optional>Email</FieldLabel>
                    <input id="email" type="email" name="email" value={formData.email} onChange={onChange}
                        className={inputCls} placeholder="email@contoh.com" />
                </div>
                <div>
                    <FieldLabel htmlFor="p_phone" optional>Nomor Telepon / WhatsApp</FieldLabel>
                    <input id="p_phone" type="tel" name="phone" value={formData.phone} onChange={onChange}
                        className={inputCls + ' font-mono'} placeholder="08xxxxxxxx" />
                </div>
            </div>

            {/* ── Detail Administratif ── */}
            <FormSection icon={<BriefcaseIcon className="w-4 h-4" />} title="Detail Administratif" />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <FieldLabel htmlFor="standardFee">Fee Standar (IDR)</FieldLabel>
                    <RupiahInput
                        id="standardFee"
                        name="standardFee"
                        value={String(formData.standardFee ?? '')}
                        onChange={(raw) => setFormData(prev => ({ ...prev, standardFee: Number(raw) }))}
                        className={inputCls + ' font-bold text-blue-600 text-right'}
                    />
                </div>
                <div>
                    <FieldLabel htmlFor="noRek" optional>Nomor Rekening / E-Wallet</FieldLabel>
                    <input id="noRek" type="text" name="noRek" value={formData.noRek} onChange={onChange}
                        className={inputCls + ' font-semibold'} placeholder="Cth: BCA 1234567890" />
                </div>
            </div>

            <div>
                <FieldLabel htmlFor="category">Kategori</FieldLabel>
                <select id="category" name="category" value={formData.category} onChange={onChange} className={selectCls}>
                    <option value="Tim">Tim Internal</option>
                    <option value="Vendor">Vendor Eksternal</option>
                </select>
                <p className="text-xs text-brand-text-secondary mt-1">Pilih "Tim" untuk tim internal Anda, atau "Vendor" untuk pihak ketiga.</p>
            </div>

            <FormActions
                onCancel={!inline ? onClose : undefined}
                submitLabel={mode === 'add' ? 'Simpan' : 'Update'}
            />
        </form>
    );

    if (inline) return formContent;

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={mode === 'add' ? 'Tambah Tim / Vendor Baru' : `Edit Data: ${selectedMember?.name}`}
            size="2xl"
        >
            {formContent}
        </Modal>
    );
};
