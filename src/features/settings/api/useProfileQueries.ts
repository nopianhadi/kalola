import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getProfile, upsertProfile } from '@/services/profile';
import { Profile } from '@/types';
import { useApp } from '@/app/AppContext';


export const useProfile = () => {
    const { isAuthenticated, currentUser } = useApp();
    return useQuery<Profile | null>({
        queryKey: ['profile'],
        queryFn: () => getProfile(),
        staleTime: 1000 * 60 * 30,
        enabled: isAuthenticated && !!currentUser,
    });
};

export const useUpdateProfile = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (profile: Partial<Profile>) => upsertProfile(profile as any),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['profile'] });
        },
    });
};

