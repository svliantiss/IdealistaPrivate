import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import Dashboard from "@/pages/Dashboard";
import Search from "@/pages/Search";
import Properties from "@/pages/Properties";
import Bookings from "@/pages/Bookings";
import Sales from "@/pages/Sales";
import Admin from "@/pages/Admin";
import AdminLogin from "@/pages/AdminLogin";
import ActiveListings from "@/pages/ActiveListings";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Dashboard} />
      <Route path="/search" component={Search} />
      <Route path="/properties" component={Properties} />
      <Route path="/bookings" component={Bookings} />
      <Route path="/sales" component={Sales} />
      <Route path="/active-listings" component={ActiveListings} />
      <Route path="/admin" component={Admin} />
      <Route path="/admin/login" component={AdminLogin} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
