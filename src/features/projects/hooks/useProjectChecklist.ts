import { useState, useEffect } from 'react';

import { 
    WeddingDayChecklist 
} from '@/features/projects/types/project.types';
import { 
    listChecklistByProject,
    setChecklistItemCompleted,
    updateChecklistItemFields,
    upsertChecklistItems,
    deleteChecklistItem,
    renameChecklistCategory,
    deleteChecklistItemsByProjectAndCategory,
    initializeDefaultChecklist
} from '@/services/weddingDayChecklist';

export const useProjectChecklist = (
    projectId: number | undefined,
    onChecklistUpdate: (items: WeddingDayChecklist[]) => void,
    showNotification: (msg: string) => void
) => {
    const [isInitializingChecklist, setIsInitializingChecklist] = useState(false);

    useEffect(() => {
        if (!projectId) return;

        const loadChecklist = async () => {
            try {
                const items = await listChecklistByProject(projectId);
                onChecklistUpdate(items);
            } catch (e) {
                console.error('Failed to load checklist:', e);
            }
        };

        loadChecklist();
    }, [projectId]);

    const handleToggleChecklistItem = async (itemId: number | string, currentStatus: boolean, currentList: WeddingDayChecklist[]) => {
        try {
            const updatedRow = await setChecklistItemCompleted(Number(itemId), !currentStatus);
            const newList = currentList.map(item =>
                String(item.id) === String(itemId) ? { ...item, isCompleted: updatedRow.isCompleted, updatedAt: updatedRow.updatedAt } : item
            );
            onChecklistUpdate(newList);
        } catch (err) {
            console.error('Failed to toggle checklist item:', err);
            showNotification('Gagal memperbarui checklist.');
        }
    };

    const handleSaveChecklistNotes = async (itemId: number | string, notes: string, currentList: WeddingDayChecklist[]) => {
        try {
            const updatedRow = await updateChecklistItemFields(Number(itemId), { notes });
            const newList = currentList.map(item =>
                String(item.id) === String(itemId) ? { ...item, notes: updatedRow.notes, updatedAt: updatedRow.updatedAt } : item
            );
            onChecklistUpdate(newList);
        } catch (err) {
            console.error('Failed to save checklist notes:', err);
            showNotification('Gagal menyimpan catatan.');
        }
    };

    const handleSaveItemEdits = async (itemId: number | string, name: string, pic: string, currentList: WeddingDayChecklist[]) => {
        try {
            const updatedRow = await updateChecklistItemFields(Number(itemId), { 
                itemName: name,
                assignedTo: pic || null
            });
            const newList = currentList.map(item =>
                String(item.id) === String(itemId) ? { 
                    ...item, 
                    itemName: updatedRow.itemName, 
                    assignedTo: updatedRow.assignedTo, 
                    updatedAt: updatedRow.updatedAt 
                } : item
            );
            onChecklistUpdate(newList);
        } catch (err) {
            console.error('Failed to save item edits:', err);
            showNotification('Gagal menyimpan perubahan item.');
        }
    };

    const handleAddChecklistItem = async (category: string, itemName: string, currentList: WeddingDayChecklist[]) => {
        if (!projectId) return;
        try {
            const newItem: Partial<WeddingDayChecklist> = {
                projectId,
                category,
                itemName: itemName.trim(),
                isCompleted: false
            };
            const result = await upsertChecklistItems([newItem]);
            onChecklistUpdate([...currentList, ...result]);
        } catch (err) {
            console.error('Failed to add checklist item:', err);
            showNotification('Gagal menambah item checklist.');
        }
    };

    const handleDeleteChecklistItem = async (itemId: number | string, currentList: WeddingDayChecklist[]) => {
        try {
            await deleteChecklistItem(Number(itemId));
            onChecklistUpdate(currentList.filter(item => String(item.id) !== String(itemId)));
        } catch (err) {
            console.error('Failed to delete checklist item:', err);
            showNotification('Gagal menghapus item checklist.');
        }
    };

    const handleSaveCategoryName = async (oldName: string, newName: string) => {
        if (!projectId) return;
        try {
            await renameChecklistCategory(projectId, oldName, newName);
            const refreshedChecklist = await listChecklistByProject(projectId);
            onChecklistUpdate(refreshedChecklist);
            showNotification('Kategori berhasil diubah.');
        } catch (err) {
            console.error('Failed to rename category:', err);
            showNotification('Gagal mengubah nama kategori.');
        }
    };

    const handleDeleteCategory = async (category: string) => {
        if (!projectId) return;
        try {
            await deleteChecklistItemsByProjectAndCategory(projectId, category);
            const refreshedChecklist = await listChecklistByProject(projectId);
            onChecklistUpdate(refreshedChecklist);
            showNotification('Kategori berhasil dihapus.');
        } catch (err) {
            console.error('Failed to delete category:', err);
            showNotification('Gagal menghapus kategori.');
        }
    };

    const handleInitializeChecklist = async (templateConfigs: any[]) => {
        if (!projectId || isInitializingChecklist) return;
        setIsInitializingChecklist(true);
        try {
            const result = await initializeDefaultChecklist(projectId, templateConfigs);
            onChecklistUpdate(result);
            showNotification('Checklist Hari H berhasil dibuat.');
        } catch (err) {
            console.error('Failed to initialize checklist:', err);
            showNotification('Gagal membuat checklist default.');
        } finally {
            setIsInitializingChecklist(false);
        }
    };

    return {
        isInitializingChecklist,
        handleToggleChecklistItem,
        handleSaveChecklistNotes,
        handleSaveItemEdits,
        handleAddChecklistItem,
        handleDeleteChecklistItem,
        handleSaveCategoryName,
        handleDeleteCategory,
        handleInitializeChecklist
    };
};
