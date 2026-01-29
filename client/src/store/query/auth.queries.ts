import { useMutation } from "@tanstack/react-query";
import { getMe, requestLoginOtp, verifyLoginOtp } from "./../api/onboarding.api";
import { useDispatch } from "react-redux";
import { Agent, setAgent } from "../slices/authSlice";
import { setLoading } from "../slices/uiSlice";

import { useQuery } from '@tanstack/react-query';
import { getAuthHeader, api } from "../api/baseApi";

export const useRequestLoginOtp = () => useMutation<unknown, Error, { email: string }>({
    mutationFn: requestLoginOtp,
});


export const useVerifyLoginOtp = () => {
    const dispatch = useDispatch();
    return useMutation<{ agent: Agent; token: string }, Error, { email: string; otp: string }>({
        onMutate: () => {
            dispatch(setLoading(true));
        },

        onSettled: () => {
            dispatch(setLoading(false));
        },
        mutationFn: (data) => {
            return verifyLoginOtp(data)
        },
        onSuccess: (data: any) => {
            localStorage.setItem("token", data.token);
            let agentData = {
                id: data.agent.id,
                email: data.agent.email,
                name: data.agent.name,
                emailVerified: data.agent.emailVerified,
                onboardingStep: data.agent.onboardingStep,
                agency: data.agent.agency,
                color: data.agent.agency?.primaryColor,
                agencyPhone: data.agent.agency?.phone,
                location: data.agent.agency?.locations,
            }
            console.log("Login successful:", agentData);
            dispatch(setAgent(agentData));
        },

    });
}
// src/store/query/auth.queries.ts


export const useCurrentAgent = () => {
    return useQuery({
        queryKey: ['current-agent'],
        queryFn: async () => {
            const response = await api.get('/api/auth/me',
                { headers: getAuthHeader() }
            );
            return response.data;
        },
        staleTime: 5 * 60 * 1000, // 5 minutes
    });
};