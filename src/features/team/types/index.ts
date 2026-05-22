import { TeamMember, PerformanceNoteType } from '@/types';

export interface TeamFormProps {
    isOpen?: boolean;
    onClose?: () => void;
    mode: 'add' | 'edit';
    formData: Omit<TeamMember, 'id' | 'rating' | 'performanceNotes' | 'portalAccessId'>;
    setFormData: React.Dispatch<React.SetStateAction<Omit<TeamMember, 'id' | 'rating' | 'performanceNotes' | 'portalAccessId'>>>;
    onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => void;
    onSubmit: (e: React.FormEvent) => void;
    selectedMember?: TeamMember | null;
    inline?: boolean;
}

export type { PerformanceNoteType };
