import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useApp } from '@/app/AppContext';
import { listNotifications, markNotificationAsRead, markAllNotificationsAsRead } from '../services/notifications';



export function useNotifications() {
    const queryClient = useQueryClient();
    const { isAuthenticated } = useApp();

    const { data: notifications = [], isLoading } = useQuery({
        queryKey: ['notifications'],
        queryFn: listNotifications,
        staleTime: 5 * 60 * 1000,
        enabled: isAuthenticated,
    });


    const markReadMutation = useMutation<void, Error, number>({
        mutationFn: markNotificationAsRead,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['notifications'] });
        },
    });

    const markAllReadMutation = useMutation<void, Error, void>({
        mutationFn: markAllNotificationsAsRead,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['notifications'] });
        },
    });


    // Realtime subscription disabled for local backend migration
    /*
    useEffect(() => {
        const channel = supabase
            .channel('realtime-notifications-hook')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'notifications' }, () => {
                queryClient.invalidateQueries({ queryKey: ['notifications'] });
            })
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [queryClient]);
    */

    return {
        notifications,
        isLoading,
        handleMarkAsRead: (id: number) => markReadMutation.mutate(id),
        handleMarkAllAsRead: () => markAllReadMutation.mutate(),
        unreadCount: notifications.filter(n => !n.isRead).length
    };
}
