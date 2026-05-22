import React, { useState } from 'react';
import { PencilIcon, SendIcon } from 'lucide-react';
import { Project } from '@/features/projects/types/project.types';

interface ProjectFilesTabProps {
    selectedProject: Project;
    handleSaveFinalLink: (link: string) => Promise<void>;
    handleSendFinalLink: () => void;
}

const ProjectFilesTab: React.FC<ProjectFilesTabProps> = ({ 
    selectedProject, 
    handleSaveFinalLink, 
    handleSendFinalLink 
}) => {
    const [isEditingFinalLink, setIsEditingFinalLink] = useState(false);
    const [tempFinalLink, setTempFinalLink] = useState(selectedProject.finalDriveLink || '');

    const onSave = async () => {
        await handleSaveFinalLink(tempFinalLink);
        setIsEditingFinalLink(false);
    };

    return (
        <div className="space-y-4 tab-content-mobile">
            {/* Mobile */}
            <div className="md:hidden space-y-3">
                <div className="rounded-2xl bg-white/5 border border-brand-border p-4">
                    <h4 className="font-semibold text-brand-text-primary mb-2">File & Tautan</h4>
                    <div className="divide-y divide-brand-border/60 text-sm">
                        <div className="py-3 flex items-center justify-between">
                            <span className="text-brand-text-secondary">Brief/Moodboard</span>
                            {selectedProject.driveLink ? <a href={selectedProject.driveLink} target="_blank" rel="noopener noreferrer" className="text-blue-400 font-semibold">Buka</a> : <span className="text-brand-text-secondary">N/A</span>}
                        </div>
                        <div className="py-3 flex items-center justify-between">
                            <span className="text-brand-text-secondary">File dari Pengantin</span>
                            {selectedProject.clientDriveLink ? <a href={selectedProject.clientDriveLink} target="_blank" rel="noopener noreferrer" className="text-blue-400 font-semibold">Buka</a> : <span className="text-brand-text-secondary">N/A</span>}
                        </div>
                        <div className="py-3 flex flex-col gap-2">
                            <div className="flex justify-between items-center">
                                <span className="text-brand-text-secondary">File Jadi</span>
                                <div className="flex gap-3">
                                    {!isEditingFinalLink && (
                                        <button onClick={() => { setTempFinalLink(selectedProject.finalDriveLink || ''); setIsEditingFinalLink(true); }} className="text-xs text-brand-accent hover:underline flex items-center gap-1">
                                            <PencilIcon className="w-3 h-3" /> Edit
                                        </button>
                                    )}
                                    {selectedProject.finalDriveLink && (
                                        <a href={selectedProject.finalDriveLink} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-400 font-semibold">Buka</a>
                                    )}
                                </div>
                            </div>
                            
                            {isEditingFinalLink ? (
                                <div className="flex items-center gap-2 mt-2">
                                    <input type="url" value={tempFinalLink} onChange={e => setTempFinalLink(e.target.value)} placeholder="https://..." className="flex-1 w-full px-3 py-2 text-sm rounded-lg border border-brand-border bg-brand-surface text-brand-text-primary focus:outline-none focus:ring-2 focus:ring-brand-accent/50 transition-all" />
                                    <button onClick={onSave} className="text-xs px-3 py-2 bg-brand-accent text-white rounded-lg hover:bg-brand-accent/90 transition-colors whitespace-nowrap">Simpan</button>
                                    <button onClick={() => setIsEditingFinalLink(false)} className="text-xs px-2 py-2 text-brand-text-secondary hover:text-brand-text-light">Batal</button>
                                </div>
                            ) : (
                                selectedProject.finalDriveLink ? (
                                    <div className="mt-1">
                                        <button onClick={handleSendFinalLink} className="w-full text-xs py-2 bg-green-500/10 text-green-500 border border-green-500/20 rounded-lg hover:bg-green-500/20 transition-colors flex items-center justify-center gap-1">
                                            <SendIcon className="w-3 h-3" /> Kirim via WA
                                        </button>
                                    </div>
                                ) : (
                                    <span className="text-xs text-brand-text-secondary">Belum tersedia. Klik Edit untuk menambahkan.</span>
                                )
                            )}
                        </div>
                    </div>
                </div>
            </div>
            {/* Desktop existing */}
            <div className="hidden md:block">
                <h4 className="font-semibold text-gradient mb-2">File & Tautan Penting</h4>
                <div className="p-4 bg-brand-bg rounded-lg space-y-3 text-sm">
                    <div className="flex justify-between items-center py-2 border-b border-brand-border"><span className="text-brand-text-secondary">Link Moodboard/Brief (Internal)</span>{selectedProject.driveLink ? <a href={selectedProject.driveLink} target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline font-semibold">Buka Tautan</a> : <span className="text-brand-text-secondary">N/A</span>}</div>
                    <div className="flex justify-between items-center py-2 border-b border-brand-border"><span className="text-brand-text-secondary">Link File dari Pengantin</span>{selectedProject.clientDriveLink ? <a href={selectedProject.clientDriveLink} target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline font-semibold">Buka Tautan</a> : <span className="text-brand-text-secondary">N/A</span>}</div>
                    <div className="py-2 border-t border-brand-border">
                        <div className="flex justify-between items-center mb-2">
                            <span className="text-brand-text-secondary">Link File Jadi (untuk Pengantin)</span>
                            {!isEditingFinalLink && (
                                <div className="flex gap-3 items-center">
                                    {selectedProject.finalDriveLink && (
                                        <button onClick={handleSendFinalLink} className="text-xs py-1.5 px-3 bg-green-500/10 text-green-500 border border-green-500/20 rounded-lg hover:bg-green-500/20 transition-colors flex items-center gap-1">
                                            <SendIcon className="w-3 h-3" /> Kirim WhatsApp
                                        </button>
                                    )}
                                    <button onClick={() => { setTempFinalLink(selectedProject.finalDriveLink || ''); setIsEditingFinalLink(true); }} className="text-xs text-brand-accent hover:underline flex items-center gap-1">
                                        <PencilIcon className="w-3 h-3" /> Edit Link
                                    </button>
                                </div>
                            )}
                        </div>
                        
                        {isEditingFinalLink ? (
                            <div className="flex items-center gap-2 mt-2">
                                <input type="url" value={tempFinalLink} onChange={e => setTempFinalLink(e.target.value)} placeholder="https://drive.google.com/..." className="flex-1 px-3 py-2 text-sm rounded-lg border border-brand-border bg-brand-surface text-brand-text-primary focus:outline-none focus:ring-1 focus:ring-brand-accent transition-all" />
                                <button onClick={onSave} className="text-xs px-4 py-2 bg-brand-accent text-white rounded-lg hover:bg-brand-accent/90 transition-colors">Simpan</button>
                                <button onClick={() => setIsEditingFinalLink(false)} className="text-xs px-3 py-2 text-brand-text-secondary hover:text-brand-text-light">Batal</button>
                            </div>
                        ) : (
                            selectedProject.finalDriveLink ? (
                                <a href={selectedProject.finalDriveLink} target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline font-semibold text-sm break-all">{selectedProject.finalDriveLink}</a>
                            ) : (
                                <div className="text-sm text-brand-text-secondary italic">Belum tersedia. Klik Edit Link untuk menambahkan.</div>
                            )
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ProjectFilesTab;
