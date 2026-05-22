import React from 'react';
import { StarIcon, Trash2Icon } from '@/constants';
import { TeamMember, PerformanceNote, PerformanceNoteType } from '@/types';

const StarRating: React.FC<{ rating: number; onSetRating?: (rating: number) => void }> = ({ rating, onSetRating }) => (
    <div className="flex items-center">
        {[1, 2, 3, 4, 5].map(star => (
            <button
                key={star}
                type="button"
                onClick={onSetRating ? () => onSetRating(star) : undefined}
                className={`p-1 ${onSetRating ? 'cursor-pointer' : ''}`}
                disabled={!onSetRating}
                aria-label={`Set rating to ${star}`}
            >
                <StarIcon className={`w-5 h-5 ${star <= rating ? 'text-yellow-400 fill-current' : 'text-gray-600'}`} />
            </button>
        ))}
    </div>
);

const getNoteTypeClass = (type: PerformanceNoteType) => {
    switch (type) {
        case PerformanceNoteType.PRAISE: return 'bg-green-500/20 text-green-400';
        case PerformanceNoteType.CONCERN: return 'bg-yellow-500/20 text-yellow-400';
        case PerformanceNoteType.LATE_DEADLINE: return 'bg-red-500/20 text-red-400';
        case PerformanceNoteType.GENERAL:
        default: return 'bg-gray-500/20 text-gray-400';
    }
}

interface PerformanceTabProps {
    member: TeamMember;
    onSetRating: (rating: number) => void;
    newNote: string;
    setNewNote: (note: string) => void;
    newNoteType: PerformanceNoteType;
    setNewNoteType: (type: PerformanceNoteType) => void;
    onAddNote: () => void;
    onDeleteNote: (noteId: number) => void;
}

export const PerformanceTab: React.FC<PerformanceTabProps> = ({
    member, onSetRating, newNote, setNewNote, newNoteType, setNewNoteType, onAddNote, onDeleteNote
}) => (
    <div>
        <div className="bg-white/5 backdrop-blur-md border border-white/10 p-5 rounded-2xl shadow-lg mb-6 transition-all">
            <h4 className="text-base font-semibold text-brand-text-light mb-2">Peringkat Kinerja Keseluruhan</h4>
            <p className="text-sm text-brand-text-secondary mb-3">Beri peringkat pada Tim / Vendor ini berdasarkan kinerja mereka secara umum.</p>
            <div className="flex justify-center">
                <StarRating rating={member.rating} onSetRating={onSetRating} />
            </div>
        </div>

        <div className="mb-6">
            <h4 className="text-base font-semibold text-brand-text-light mb-3">Tambah Catatan Kinerja Baru</h4>
            <div className="bg-white/5 backdrop-blur-md border border-white/10 p-5 rounded-2xl shadow-lg space-y-4">
                <div className="input-group">
                    <textarea
                        value={newNote}
                        onChange={(e) => setNewNote(e.target.value)}
                        className="input-field"
                        rows={3}
                        placeholder=" "
                        id="newPerformanceNote"
                    />
                    <label htmlFor="newPerformanceNote" className="input-label">Tulis catatan...</label>
                </div>
                <div className="flex justify-between items-center">
                    <div className="input-group !mb-0 flex-grow">
                        <select
                            id="newNoteType"
                            value={newNoteType}
                            onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setNewNoteType(e.target.value as PerformanceNoteType)}
                            className="input-field"
                        >
                            {Object.values(PerformanceNoteType).map((type: string) => (
                                <option key={type} value={type}>{type}</option>
                            ))}
                        </select>
                        <label htmlFor="newNoteType" className="input-label">Jenis Catatan</label>
                    </div>
                    <button onClick={onAddNote} className="button-primary ml-4">Tambah Catatan</button>
                </div>
            </div>
        </div>

        <div>
            <h4 className="text-base font-semibold text-brand-text-light mb-3">Riwayat Catatan Kinerja</h4>
            <div className="space-y-3 max-h-80 overflow-y-auto">
                {member.performanceNotes.length > 0 ? member.performanceNotes.map((note: PerformanceNote) => (
                    <div key={note.id} className="bg-white/5 backdrop-blur-md border border-white/10 p-4 rounded-xl shadow-sm flex justify-between items-start transition-all hover:bg-white/10">
                        <div>
                            <div className="flex items-center gap-2 mb-1">
                                <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${getNoteTypeClass(note.type)}`}>{note.type}</span>
                                <span className="text-xs text-brand-text-secondary">{new Date(note.date).toLocaleDateString('id-ID')}</span>
                            </div>
                            <p className="text-sm text-brand-text-primary">{note.note}</p>
                        </div>
                        <button onClick={() => onDeleteNote(note.id)} className="p-1.5 text-brand-text-secondary hover:text-red-400">
                            <Trash2Icon className="w-4 h-4" />
                        </button>
                    </div>
                )) : (
                    <p className="text-center text-sm text-brand-text-secondary py-8">Belum ada catatan kinerja.</p>
                )}
            </div>
        </div>
    </div>
);
