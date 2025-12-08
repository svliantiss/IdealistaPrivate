import { Layout } from "@/components/layout/Layout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useQuery } from "@tanstack/react-query";
import { 
  ArrowUpRight, 
  Users, 
  Building, 
  CreditCard, 
  Clock,
  Home
} from "lucide-react";
import { Link } from "wouter";
import { AddPropertyDialog } from "@/components/AddPropertyDialog";

const CURRENT_AGENT_ID = 1;


export default function Dashboard() {
  const { data: properties = [] } = useQuery<any[]>({
    queryKey: [`/api/agents/${CURRENT_AGENT_ID}/properties`],
  });

  const { data: bookings = [] } = useQuery<any[]>({
    queryKey: [`/api/bookings`],
  });

  const { data: commissions = [] } = useQuery<any[]>({
    queryKey: [`/api/commissions/agent/${CURRENT_AGENT_ID}`],
  });

  const { data: salesProperties = [] } = useQuery<any[]>({
    queryKey: [`/api/agents/${CURRENT_AGENT_ID}/sales-properties`],
  });

  const { data: allSalesCommissions = [] } = useQuery<any[]>({
    queryKey: [`/api/sales-commissions/agent/${CURRENT_AGENT_ID}`],
  });


  const activeListings = properties.filter((p: any) => p.status === 'active').length + salesProperties.filter((p: any) => p.status === 'active').length;
  const pendingBookings = bookings.filter((b: any) => b.status === 'pending').length;
  const soldHouses = salesProperties.filter((p: any) => p.status === 'sold').length;
  // Filter out cancelled and archived bookings from the total count
  const activeBookings = bookings.filter((b: any) => b.status !== 'cancelled' && b.status !== 'archived');
  
  // Filter out commissions for cancelled bookings
  const activeCommissions = commissions.filter((c: any) => {
    const booking = bookings.find((b: any) => b.id === c.bookingId);
    return booking && booking.status !== 'cancelled';
  });
  const totalCommission = activeCommissions.reduce((sum: number, c: any) => {
    const isOwner = c.ownerAgentId === CURRENT_AGENT_ID;
    const yourCommission = isOwner ? parseFloat(c.ownerCommission || 0) : parseFloat(c.bookingCommission || 0);
    return sum + yourCommission;
  }, 0);
  const totalSalesCommission = allSalesCommissions.reduce((sum: number, c: any) => {
    const isSeller = c.sellerAgentId === CURRENT_AGENT_ID;
    const yourCommission = isSeller ? parseFloat(c.sellerCommission || 0) : parseFloat(c.buyerCommission || 0);
    return sum + yourCommission;
  }, 0);

  return (
    <Layout>
      <div className="p-8 space-y-8">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-serif font-bold text-primary">Dashboard</h1>
            <p className="text-muted-foreground mt-1">Welcome back, Ryan. Here's what's happening today.</p>
          </div>
          <AddPropertyDialog defaultType="choose" />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[
            { title: "Active Listings", value: activeListings.toString(), change: "+2 this week", icon: Building, color: "text-blue-500", link: "/active-listings" },
            { title: "Pending Bookings", value: pendingBookings.toString(), change: `${pendingBookings} need action`, icon: Clock, color: "text-amber-500", link: "/pending-bookings" },
            { title: "Total Bookings", value: activeBookings.length.toString(), change: "+12% vs last month", icon: Users, color: "text-emerald-500", link: "/total-bookings" },
            { title: "Sold Houses", value: soldHouses.toString(), change: "Properties sold", icon: Home, color: "text-green-600", link: "/sold-houses" },
            { title: "Rental Commissions", value: `€${totalCommission.toFixed(0)}`, change: "From bookings", icon: CreditCard, color: "text-violet-500", link: "/rental-commissions" },
            { title: "Sales Commissions", value: `€${totalSalesCommission.toFixed(0)}`, change: "From sales", icon: CreditCard, color: "text-orange-500", link: "/sales-commissions" },
          ].map((stat, i) => (
            <Link key={i} href={stat.link}>
              <Card className="shadow-sm hover:shadow-md transition-shadow border-border/50 cursor-pointer">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">{stat.title}</CardTitle>
                  <stat.icon className={`h-4 w-4 ${stat.color}`} />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold" data-testid={`stat-${stat.title.toLowerCase().replace(/ /g, '-')}`}>{stat.value}</div>
                  <p className="text-xs text-muted-foreground flex items-center mt-1">
                    {stat.change.includes('+') && <ArrowUpRight className="h-3 w-3 mr-1 text-emerald-500" />}
                    {stat.change}
                  </p>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>

        <Card className="shadow-sm border-border/50">
          <CardHeader>
            <CardTitle className="font-serif">Recent Bookings</CardTitle>
            <CardDescription>Latest bookings across your network.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {bookings.slice(0, 4).map((booking: any, i: number) => (
                <div key={i} className="flex items-center justify-between border-b border-border/40 last:border-0 pb-4 last:pb-0">
                  <div className="flex items-center gap-4">
                    <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center font-medium text-muted-foreground text-sm">
                      {booking.clientName?.charAt(0) || 'C'}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-foreground">
                        {booking.clientName} <span className="text-muted-foreground font-normal">requested booking</span>
                      </p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {new Date(booking.checkIn).toLocaleDateString()} - {new Date(booking.checkOut).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <span className={`text-xs px-2 py-1 rounded-full font-medium 
                    ${booking.status === 'pending' ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' : 
                      booking.status === 'confirmed' || booking.status === 'paid' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' : 
                      'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'}`}>
                    {booking.status}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}
