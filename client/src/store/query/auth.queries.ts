import { useMutation } from "@tanstack/react-query";
import { getMe, requestLoginOtp, verifyLoginOtp } from "./../api/onboarding.api";
import { useDispatch } from "react-redux";
import { Agent, setAgent } from "../slices/authSlice";
import { setLoading } from "../slices/uiSlice";


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