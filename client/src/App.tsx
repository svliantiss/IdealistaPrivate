import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
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

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/login" component={Login} />
      <Route path="/dashboard" component={Dashboard} />
      <Route path="/search" component={Search} />
      <Route path="/rentals/:id" component={PropertyDetails} />
      <Route path="/properties" component={Properties} />
      <Route path="/properties/:id/edit" component={EditProperty} />
      <Route path="/bookings" component={Bookings} />
      <Route path="/sales" component={Sales} />
      <Route path="/active-listings" component={ActiveListings} />
      <Route path="/pending-bookings" component={PendingBookings} />
      <Route path="/total-bookings" component={TotalBookings} />
      <Route path="/commissions" component={CommissionsPage} />
      <Route path="/sold-houses" component={SoldHouses} />
      <Route path="/rental-commissions" component={RentalCommissions} />
      <Route path="/sales-commissions" component={SalesCommissions} />
      <Route path="/employee-stats" component={EmployeeStats} />
      <Route path="/employee-stats/:agentId" component={EmployeeDetail} />
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
