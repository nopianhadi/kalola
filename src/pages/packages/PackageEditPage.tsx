import React, { useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { usePackages, emptyPackageForm } from '@/features/packages/hooks/usePackages';
import { usePackages as usePackagesQuery } from '@/features/packages/api/usePackagesQueries';
import { PackageForm } from '@/features/packages/components/PackageForm';
import { ArrowLeftIcon, PackageIcon } from 'lucide-react';

const PackageEditPage: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const isEdit = id && id !== 'new';

    const initializedRef = useRef(false);
    const { data: allPackages = [] } = usePackagesQuery();

    const {
        packageFormData,
        setPackageEditMode,
        unionRegions,
        profile,
        handleDurationOptionChange,
        addDurationOption,
        removeDurationOption,
        expandedDurationIndex,
        setExpandedDurationIndex,
        handleDurationDetailChange,
        addDurationDetail,
        removeDurationDetail,
        handlePackageInputChange,
        handleCoverImageChange,
        handleListChange,
        addListItem,
        removeListItem,
        handlePackageEdit,
        handlePackageSubmit,
        setPackageFormData
    } = usePackages();

    useEffect(() => {
        if (initializedRef.current) return;
        if (isEdit) {
            if (allPackages.length === 0) return;
            const foundPkg = allPackages.find(p => String(p.id) === String(id));
            if (foundPkg) {
                handlePackageEdit(foundPkg);
                initializedRef.current = true;
            }
        } else {
            setPackageEditMode(null);
            setPackageFormData(emptyPackageForm);
            initializedRef.current = true;
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [id, isEdit, allPackages]);

    const onCancel = () => navigate('/packages');

    const onSubmit = async (e: React.FormEvent) => {
        await handlePackageSubmit(e);
        navigate('/packages');
    };

    return (
        <div className="min-h-screen bg-brand-bg">

            {/* ── Sticky Header ── */}
            <header className="sticky top-0 z-40 bg-brand-bg/80 backdrop-blur-xl border-b border-brand-border">
                <div className="max-w-3xl mx-auto px-4 sm:px-6 h-16 flex items-center gap-4">
                    <button
                        onClick={onCancel}
                        className="p-2 rounded-xl border border-brand-border hover:bg-brand-surface text-brand-text-secondary hover:text-brand-text-light transition active:scale-95"
                    >
                        <ArrowLeftIcon className="w-4 h-4" />
                    </button>

                    <div className="h-6 w-px bg-brand-border" />

                    <div className="flex items-center gap-3 flex-1 min-w-0">
                        <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-brand-accent to-blue-600 flex items-center justify-center flex-shrink-0 shadow-md shadow-brand-accent/20">
                            <PackageIcon className="w-4 h-4 text-white" />
                        </div>
                        <div className="min-w-0">
                            <h1 className="text-sm font-bold text-brand-text-light truncate">
                                {isEdit ? 'Edit Package' : 'Package Baru'}
                            </h1>
                            {isEdit && packageFormData.name && (
                                <p className="text-xs text-brand-text-secondary truncate">{packageFormData.name}</p>
                            )}
                        </div>
                    </div>
                </div>
            </header>

            {/* ── Content ── */}
            <main className="max-w-3xl mx-auto px-4 sm:px-6 py-8 pb-20">
                <div className="bg-brand-surface rounded-2xl border border-brand-border p-6 md:p-8">
                    <PackageForm
                        onSubmit={onSubmit}
                        mode={isEdit ? 'edit' : 'add'}
                        formData={packageFormData}
                        onInputChange={handlePackageInputChange}
                        onPriceChange={(raw) => setPackageFormData((prev: any) => ({ ...prev, price: raw }))}
                        onCoverImageChange={handleCoverImageChange}
                        onDurationOptionChange={handleDurationOptionChange}
                        addDurationOption={addDurationOption}
                        removeDurationOption={removeDurationOption}
                        expandedDurationIndex={expandedDurationIndex}
                        setExpandedDurationIndex={setExpandedDurationIndex}
                        onDurationDetailChange={handleDurationDetailChange}
                        addDurationDetail={addDurationDetail}
                        removeDurationDetail={removeDurationDetail}
                        onListChange={handleListChange}
                        addListItem={addListItem}
                        removeListItem={removeListItem}
                        profile={profile}
                        unionRegions={unionRegions}
                        inline={true}
                        onCancel={onCancel}
                    />
                </div>
            </main>
        </div>
    );
};

export default PackageEditPage;
