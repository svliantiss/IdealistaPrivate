import { Route, Redirect } from "wouter";
import { useSelector } from "react-redux";
import { selectAuthState } from "@/store/slices/authSlice";

export function ProtectedRoute({ component: Component, ...rest }: any) {
  const { isAuthenticated, isOnboardingComplete } =
    useSelector(selectAuthState);

  if (!isAuthenticated) {
    return <Redirect to="/onboarding" />;
  }

  return <Route {...rest} component={Component} />;
}
