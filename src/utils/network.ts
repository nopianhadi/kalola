export const ensureOnlineOrNotify = (showNotification: (message: string) => void): boolean => {
    const isOnline = typeof navigator !== 'undefined' ? navigator.onLine : false;

    if (!isOnline) {
        showNotification('Harus online untuk melakukan perubahan');
        return false;
    }

    return true;
};
