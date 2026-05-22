import { PlusIcon, BriefcaseIcon } from '@/constants';
import PageHeader from '@/layouts/PageHeader';

interface ProjectHeaderProps {
    onOpenInfoModal: () => void;
    onAddProject: () => void;
}

const ProjectHeader: React.FC<ProjectHeaderProps> = ({ onOpenInfoModal, onAddProject }) => {
    return (
        <PageHeader
            title="Kelola Acara Pernikahan Pengantin"
            subtitle="Lacak seluruh progres Acara Pernikahan Pengantin, tim & Vendor , dan status penyelesaian setiap Acara Pernikahan Pengantin."
            icon={<BriefcaseIcon className="w-6 h-6" />}
        >
            <button
                onClick={onOpenInfoModal}
                className="px-4 py-2 rounded-xl bg-white/10 text-white border border-white/20 hover:bg-white/20 transition-all text-xs font-bold"
            >
                Pelajari
            </button>
            <button
                onClick={onAddProject}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white text-blue-600 hover:bg-blue-50 transition-all text-xs sm:text-sm font-black shadow-lg shadow-blue-900/40"
            >
                <PlusIcon className="w-5 h-5" />
                <span>Tambah Acara Pernikahan</span>
            </button>
        </PageHeader>
    );
};

export default ProjectHeader;
