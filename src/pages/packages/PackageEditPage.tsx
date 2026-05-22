import React, { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { usePackages, emptyPackageForm } from '@/features/packages/hooks/usePackages';
import { PackageForm } from '@/features/packages/components/PackageForm';
import { ChevronLeftIcon, PackageIcon } from 'lucide-react';

const PackageEditPage: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const isEdit = id && id !== 'new';

    const {
        packageFormData,

        setPackageEditMode,
        unionRegions,
        packagesByCategory,
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

    // Initialize form data if editing
    useEffect(() => {
        if (isEdit) {
            // Find the package in any category
            let foundPkg = null;
            for (const cat in packagesByCategory) {
                const pkg = packagesByCategory[cat].find(p => String(p.id) === String(id));
                if (pkg) {
                    foundPkg = pkg;
                    break;
                }
            }
            if (foundPkg) {
                handlePackageEdit(foundPkg);
            }
        } else {
            setPackageEditMode(null);
            setPackageFormData(emptyPackageForm);
        }
    }, [id, isEdit, packagesByCategory]);

    const onCancel = () => navigate('/packages');

    const onSubmit = async (e: React.FormEvent) => {
        await handlePackageSubmit(e);
        // After successful submit (which sets editMode to null in the hook)
        // But we want to navigate back
        navigate('/packages');
    };

    return (
        <div className="min-h-screen bg-brand-bg relative overflow-x-hidden pb-20">
            <div className="absolute top-0 left-0 w-full h-[400px] bg-gradient-to-b from-brand-accent/10 to-transparent pointer-events-none"></div>
            
            <header className="sticky top-0 z-40 bg-brand-bg/60 backdrop-blur-xl border-b border-brand-border/50">
                <div className="max-w-5xl mx-auto px-4 sm:px-6 h-20 flex items-center justify-between">
                    <div className="flex items-center gap-6">
                        <button 
                            onClick={onCancel}
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
                                <PackageIcon className="w-6 h-6 text-white" />
                            </div>
                            <div>
                                <h1 className="text-xl font-black text-brand-text-light tracking-tight">
                                    {isEdit ? 'Edit Package' : 'Tambah Package Baru'}
                                </h1>
                                <p className="text-[10px] text-brand-text-secondary font-bold uppercase tracking-widest mt-0.5">
                                    {isEdit ? packageFormData.name : 'Data Package Baru'}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </header>

            <main className="max-w-5xl mx-auto px-4 sm:px-6 py-12 relative z-10">
                <div className="bg-brand-surface border border-brand-border rounded-[2.5rem] p-8 md:p-12 shadow-sm">
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
