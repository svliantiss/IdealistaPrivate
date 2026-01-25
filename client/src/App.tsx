import { Switch, Route } from "wouter";
import { Toaster } from "sonner";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
// import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import Login from "@/pages/Login";
import Home from "@/pages/Home";
import Dashboard from "@/pages/Dashboard";
import Search from "@/pages/Search";
import Properties from "@/pages/Properties";
import Bookings from "@/pages/Bookings";
import Sales from "@/pages/Sales";
import Admin from "@/pages/Admin";
import AdminLogin from "@/pages/AdminLogin";
import ActiveListings from "@/pages/ActiveListings";
import PendingBookings from "@/pages/PendingBookings";
import TotalBookings from "@/pages/TotalBookings";
import CommissionsPage from "@/pages/CommissionsPage";
import SoldHouses from "@/pages/SoldHouses";
import RentalCommissions from "@/pages/RentalCommissions";
import SalesCommissions from "@/pages/SalesCommissions";
import EmployeeStats from "@/pages/EmployeeStats";
import EmployeeDetail from "@/pages/EmployeeDetail";
import PropertyDetails from "@/pages/PropertyDetails";
import EditProperty from "@/pages/EditProperty";
import Onboarding from "@/pages/Onboarding";
import AccountSettings from "@/pages/AccountSettings";
import { Provider } from 'react-redux';
import { store } from '@/store';
import { AppProviders } from "./store/providers";
import { GlobalLoader } from "./components/ui/GlobalLoader";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { PublicOnlyRoute } from "./components/PublicOnlyRoute";
import { useAuthQuery } from "./store/api/onboarding.api";
import SalesPropertyDetails from "./pages/ViewSalesProperties";
import EditSalesProperty from "./pages/EditSaleProperty";
import { SalesListing } from "./pages/Public/SalesProperties";
import { RentalListing } from "./pages/Public/RentalsProperties";



function Router() {
  const { isError, isLoading } = useAuthQuery();
  console.log({ isError, isLoading })

  return (
    <Switch>
      {/* Public */}
      <PublicOnlyRoute path="/login" component={Login} />
      <PublicOnlyRoute path="/onboarding" component={Onboarding} />


      {/* Protected */}
      <ProtectedRoute path="/dashboard" component={Dashboard} />
      <ProtectedRoute path="/account" component={AccountSettings} />
      <ProtectedRoute path="/search" component={Search} />
      <ProtectedRoute path="/properties" component={Properties} />
      <ProtectedRoute path="/properties/:id/edit" component={EditProperty} />
      <ProtectedRoute path="/sales/:id/edit" component={EditSalesProperty} />
      <ProtectedRoute path="/sales/:id" component={SalesPropertyDetails} />
      <ProtectedRoute path="/rentals/:id" component={PropertyDetails} />
      <ProtectedRoute path="/bookings" component={Bookings} />
      <ProtectedRoute path="/sales" component={Sales} />
      <ProtectedRoute path="/active-listings" component={ActiveListings} />
      <ProtectedRoute path="/pending-bookings" component={PendingBookings} />
      <ProtectedRoute path="/total-bookings" component={TotalBookings} />
      <ProtectedRoute path="/commissions" component={CommissionsPage} />
      <ProtectedRoute path="/sold-houses" component={SoldHouses} />
      <ProtectedRoute path="/rental-commissions" component={RentalCommissions} />
      <ProtectedRoute path="/sales-commissions" component={SalesCommissions} />
      <ProtectedRoute path="/employee-stats" component={EmployeeStats} />
      <ProtectedRoute path="/employee-stats/:agentId" component={EmployeeDetail} />
      <ProtectedRoute path="/" component={Onboarding} />

      {/* Admin (separate auth later if needed) */}
      <Route path="/general/rentals" component={AdminLogin} />
      <Route path="/general/sales" component={SalesListing} />
      <Route path="/general/rentals/:id" component={RentalListing} />
      <Route path="/general/sales/:id" component={SalesListing} />
      <Route path="/admin/login" component={AdminLogin} />
      <Route path="/admin" component={Admin} />

      <Route component={NotFound} />
      <Toaster />

    </Switch>
  );
}


function App() {
  return (
    <AppProviders >
      <QueryClientProvider client={queryClient}>
        <GlobalLoader />
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </QueryClientProvider>
    </AppProviders>
  );
}

export default App;
