import { useDispatch } from 'react-redux';
import { useLocation } from "wouter";
import { Agent, logout } from '../slices/authSlice';
import { api, getAuthHeader } from "./baseApi";
import { useQuery } from '@tanstack/react-query';
import { useEffect } from 'react';
import { toast } from 'sonner';



export const sendOtp = ({ email, name }: { email: string; name: string }) =>
    api.post('/api/auth/request-otp', { email, name }).then(res => res.data);

export const verifyOtp = ({ email, otp }: { email: string; otp: string }) =>
    api.post('/api/auth/verify-otp', { email, otp }).then(res => res.data as { agent: Agent; token: string });

export const updateBranding = ({
    agentId,
    agencyName,
    agencyColor,
    agencySecondaryColor,
}: {
    agentId: number;
    agencyName: string;
    agencyColor: string;
    agencySecondaryColor: string;
}) =>
    api
        .post(
            '/api/onboarding/step3',
            { agencyName, agencyColor, agencySecondaryColor },
            { headers: getAuthHeader() } // <-- attach Bearer token
        )
        .then(res => res.data as { agent: Agent });

export const updateContact = ({
    agentId,
    agencyPhone,
    locations,
    website,
}: {
    agentId: number;
    agencyPhone: string;
    locations: string[];
    website?: string
}) => {
    console.log({ website })
    return api
        .post(
            '/api/onboarding/step4',
            { agencyPhone, locations: locations, website },
            { headers: getAuthHeader() } // <-- attach Bearer token
        )
        .then(res => res.data as { agent: Agent });
}

export const requestLoginOtp = (data: { email: string }) =>
    api.post("/api/auth/request-login-otp", data).then(res => res.data);

export const verifyLoginOtp = (data: { email: string; otp: string }) =>
    api.post("/api/auth/verify-login-otp", data).then(res => res.data as { agent: Agent; token: string });

export const getMe = async () => {
    const token = localStorage.getItem("token");

    if (!token) throw new Error("No token");

    const res = await api.get("/auth/me", {
        headers: {
            Authorization: `Bearer ${token}`,
        },
    });
    console.log({ data: res })

    return res.data;
};


export const useAuthQuery = () => {
    const dispatch = useDispatch();
    const [, setLocation] = useLocation(); // Wouter navigation


    const query = useQuery({
        queryKey: ["auth", "me"],
        queryFn: getMe,
        retry: false,
        staleTime: Infinity,
        gcTime: Infinity,
        refetchOnMount: true,
        refetchOnWindowFocus: false,
    });

    useEffect(() => {
        if (query.isError) {
            // 1️⃣ Logout in Redux
            dispatch(logout());

            // 2️⃣ Show toast
            toast.error("Please sign in to continue");

            // 3️⃣ Redirect to login
            setLocation("/login");
        }
    }, [query.isError, dispatch, setLocation]);

    return query;
};

