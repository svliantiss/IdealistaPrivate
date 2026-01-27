// /services/profileApi.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { uploadToR2 } from './../../lib/utils';
import { useDispatch } from 'react-redux';
import { setLoading } from '@/store/slices/uiSlice';
import { toast } from 'sonner';

const API_BASE = 'http://localhost:3003/api'; // adjust your backend URL

export const useProfile = () => {

    const dispatch = useDispatch();
    return useQuery({
        queryKey: ['profile'],
        queryFn: async () => {
            dispatch(setLoading(true));
            try {
                const res = await fetch(`${API_BASE}/profile`, {
                    headers: {
                        Authorization: `Bearer ${localStorage.getItem('token')}`,
                    },
                });


                if (!res.ok) throw new Error('Failed to fetch profile');
                const data = await res.json();
                console.log("Fetched profile data:", data.agent);
                return data.agent;
            } catch (error) {
                console.error("Error fetching profile:", error);
                throw error;
            } finally {
                dispatch(setLoading(false));
            }
        },
        // 🔑 IMPORTANT
        staleTime: 1000 * 60 * 10, // 10 minutes → no refetch
        gcTime: 1000 * 60 * 60, // 1 hour in memory
        refetchOnWindowFocus: false,
        refetchOnReconnect: false,
        retry: 1,

    });
};

export const useUpdateProfile = () => {
    const dispatch = useDispatch();
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (payload: {
            agencyName?: string;
            agencyEmail?: string;
            color?: string;
            secondaryColor?: string;
            website?: string;
            agencyPhone?: string;
            locations?: string[];
            logoFile?: File | null;
            logo?: string;
            name?: string;
            email?: string;
            phone?: string;
        }) => {
            
            dispatch(setLoading(true));
            
            console.log("color", payload.color)
            // Upload logo if file is provided
            if (payload.logoFile) {
                payload.logo = await uploadToR2(payload.logoFile);
            }
            console.log({ payload })
            const res = await fetch(`${API_BASE}/profile`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${localStorage.getItem('token')}`,
                },
                body: JSON.stringify(payload),
            });

            if (!res.ok) {
                const errorData = await res.json();
                console.log({ errorData })
                throw new Error(errorData.error || 'Failed to update profile');
            }

            return res.json();
        },
        onSuccess: (data) => {
            // queryClient.setQueryData(['profile'], data.agent);
            // queryClient.invalidateQueries({ queryKey: ["profile"] })
            toast.success('Profile updated successfully');
        },
        onError: (err: any) => {
            toast.error(err.message || 'Failed to update profile');
        },
        onSettled: () => dispatch(setLoading(false)),
    });
};
