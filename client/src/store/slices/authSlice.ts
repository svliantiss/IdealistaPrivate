// features/auth/authSlice.ts
import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { RootState } from '..';


export interface Agent {
  id: number;
  email: string;
  name: string;
  emailVerified: boolean;
  onboardingStep: number;
  agency?: string;
  color?: string;
  agencyPhone?: string;
  location?: string[];
}

interface AuthState {
  agent: Agent | null;
  isAuthenticated: boolean;
}

const initialState: AuthState = {
  agent: null,
  isAuthenticated: false,
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setAgent(state, action: PayloadAction<Agent>) {
      state.agent = action.payload;
      state.isAuthenticated = action.payload.onboardingStep >= 4;
    },
    updateOnboardingStep(state, action: PayloadAction<number>) {
      if (state.agent) state.agent.onboardingStep = action.payload;
    },
    logout(state) {

      state.agent = null;
      state.isAuthenticated = false;
      localStorage.removeItem("token");
      
    },

  },
});

export const { setAgent, updateOnboardingStep, logout } = authSlice.actions;
export default authSlice.reducer;


export const selectIsAuthenticated = (state: RootState) =>
  Boolean(state.auth.agent && state.auth.isAuthenticated);

export const selectNeedsOnboarding = (state: RootState) =>
  (state.auth.agent && state.auth.agent.onboardingStep < 4);

// auth selectors
export const selectAuthState = (state: RootState) => {
  const agent = state.auth.agent;
  const token = state.auth.isAuthenticated || localStorage.getItem('token');

  return {
    isAuthenticated: Boolean(agent || token),
    isRegistered: Boolean(agent),
    isOnboardingComplete: agent?.onboardingStep === 4,
  };
};