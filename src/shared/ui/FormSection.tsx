/**
 * FormSection — shared section header component matching PackageForm design system.
 * Table-style header: left accent bar + subtle dark background + border-y.
 *
 * Usage:
 *   <FormSection icon={<UsersIcon />} title="Informasi Tim" subtitle="Opsional sub-judul" />
 *   <FieldLabel>Nama</FieldLabel>
 *   <FormDivider />   ← gunakan kalau ingin divider antar section tanpa header
 */

import React from 'react';

// ── Section Header ─────────────────────────────────────────────────────────────
interface FormSectionProps {
    icon?: React.ReactNode;
    title: string;
    subtitle?: string;
    /** Jika ada children, render sebagai wrapper section dengan header + content */
    children?: React.ReactNode;
    /** tambahan class untuk container */
    className?: string;
    /** opsional status (untuk kompatibilitas dengan ClientForm) */
    status?: string;
    statusText?: string;
}

export const FormSection: React.FC<FormSectionProps> = ({ icon, title, subtitle, children, className = '' }) => {
    const header = (
        <div className={`flex items-center gap-3 -mx-6 md:-mx-8 px-5 md:px-7 py-3 bg-slate-100/80 border-y border-slate-200 ${className}`}>
            <div className="w-1 h-8 rounded-full bg-brand-accent flex-shrink-0" />
            {icon && (
                <div className="w-7 h-7 rounded-lg bg-brand-accent/15 text-brand-accent flex items-center justify-center flex-shrink-0">
                    {icon}
                </div>
            )}
            <div className="flex-1 min-w-0">
                <h3 className="text-sm font-bold text-brand-text-light leading-none">{title}</h3>
                {subtitle && <p className="text-xs text-brand-text-secondary/80 mt-0.5">{subtitle}</p>}
            </div>
        </div>
    );

    if (children) {
        return (
            <>
                {header}
                <div className="space-y-4">{children}</div>
            </>
        );
    }

    return header;
};

// ── Field Label ────────────────────────────────────────────────────────────────
interface FieldLabelProps {
    children: React.ReactNode;
    optional?: boolean;
    htmlFor?: string;
}

export const FieldLabel: React.FC<FieldLabelProps> = ({ children, optional, htmlFor }) => (
    <label htmlFor={htmlFor} className="block text-xs font-semibold text-brand-text-secondary mb-1.5">
        {children}
        {optional && <span className="ml-1 font-normal text-brand-text-secondary/60">(opsional)</span>}
    </label>
);

// ── Input classes (reusable string) ───────────────────────────────────────────
export const inputCls = 'w-full px-4 py-2.5 rounded-xl border border-brand-border bg-white text-sm text-brand-text-light focus:outline-none focus:ring-2 focus:ring-brand-accent/30 focus:border-brand-accent transition';

export const selectCls = 'w-full px-4 py-2.5 rounded-xl border border-brand-border bg-white text-sm font-medium text-brand-text-light focus:outline-none focus:ring-2 focus:ring-brand-accent/30 focus:border-brand-accent transition';

// ── Action Buttons ─────────────────────────────────────────────────────────────
interface FormActionsProps {
    onCancel?: () => void;
    submitLabel?: string;
    cancelLabel?: string;
    isSubmitting?: boolean;
}

export const FormActions: React.FC<FormActionsProps> = ({
    onCancel,
    submitLabel = 'Simpan',
    cancelLabel = 'Batal',
    isSubmitting = false,
}) => (
    <div className="flex items-center justify-end gap-3 pt-6 border-t border-brand-border">
        {onCancel && (
            <button
                type="button"
                onClick={onCancel}
                className="px-6 py-2.5 rounded-xl text-sm font-semibold text-brand-text-secondary hover:bg-brand-bg hover:text-brand-text-light transition"
            >
                {cancelLabel}
            </button>
        )}
        <button
            type="submit"
            disabled={isSubmitting}
            className="px-8 py-2.5 rounded-xl text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 shadow-lg shadow-blue-500/20 transition active:scale-95 disabled:opacity-60 disabled:cursor-not-allowed"
        >
            {isSubmitting ? 'Menyimpan...' : submitLabel}
        </button>
    </div>
);
