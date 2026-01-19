import { useMutation } from "@tanstack/react-query";
import { requestLoginOtp, verifyLoginOtp } from "./../api/onboarding.api";
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
        onSuccess: (data) => {
            dispatch(setAgent(data.agent));
            localStorage.setItem("token", data.token);
        },

    });
}