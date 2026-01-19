import { Route, Redirect, useLocation } from "wouter";
import { useSelector } from "react-redux";
import { selectAuthState, selectNeedsOnboarding } from "@/store/slices/authSlice";

export function PublicOnlyRoute({ component: Component, ...rest }: any) {
  const [location] = useLocation();
  const { isAuthenticated } = useSelector(selectAuthState);
  const needsOnboarding = useSelector(selectNeedsOnboarding);
  console.log("PublicOnlyRoute - isAuthenticated:", isAuthenticated, "needsOnboarding:", needsOnboarding, location);

  if ((isAuthenticated && location.startsWith("/onboarding") && !needsOnboarding) || (isAuthenticated && (location.startsWith("/login") || location === "/"))) {
    return <Redirect to="/dashboard" />;
  }

  // If user needs onboarding and is NOT already on onboarding, redirect
  if (needsOnboarding && !location.startsWith("/onboarding")) {
    return <Redirect to="/onboarding" />;
  }

  // If already authenticated and does NOT need onboarding, redirect away from public page
  if (isAuthenticated && !needsOnboarding) {
    return <Redirect to="/dashboard" />;
  }

  // Otherwise, render the public page (login, register, etc.)
  return <Route {...rest} component={Component} />;
}
