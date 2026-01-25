// queries/onboarding.queries.ts
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { sendOtp, verifyOtp, updateBranding, updateContact } from './../api/onboarding.api';
import { useDispatch, useSelector } from 'react-redux';
import { Agent, setAgent, updateOnboardingStep } from './../slices/authSlice';
import { RootState } from '../../store';
import { setLoading } from '../slices/uiSlice';

export const useSendOtp = () => useMutation<void, Error, { email: string; name: string }, unknown>({
  mutationFn: sendOtp,
}); // now takes { email, name }

export const useVerifyOtp = () => {
  const dispatch = useDispatch();
  return useMutation<{ agent: Agent; token: string }, Error, { email: string; otp: string }>({
    mutationFn: verifyOtp,
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
};

export const useUpdateBranding = () => {
  const agentId = useSelector((state: RootState) => state.auth.agent?.id);
  const dispatch = useDispatch();
  return useMutation<{ agent: Agent }, Error, { agencyName: string; agencyColor: string; agencyLogo?: string }>({
    mutationFn: (data: { agencyName: string; agencyColor: string; agencyLogo?: string }) =>
      updateBranding({ agentId: agentId!, ...data }),
    onSuccess: (data) => {
      dispatch(setAgent(data.agent));
      dispatch(updateOnboardingStep(3));
    },
  });
};

export const useUpdateContact = () => {
  const agentId = useSelector((state: RootState) => state.auth.agent?.id);
  const dispatch = useDispatch();
  return useMutation<{ agent: Agent }, Error, { agencyPhone: string; website?: string; locations: string[] }>({
    mutationFn: (data: { agencyPhone: string; locations: string[], website?: string }) => {
      console.log({ website: data.website })
      return updateContact({ agentId: agentId!, ...data })
    },
    onSuccess: (data) => {
      dispatch(setAgent(data.agent));
      dispatch(updateOnboardingStep(4));
    },
    onMutate: () => {
      dispatch(setLoading(true));
    },
    onSettled: () => {
      dispatch(setLoading(false));
    },
  });
};