import { Layout } from "@/components/layout/Layout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";
import { 
  ArrowUpRight, 
  Users, 
  Building, 
  CreditCard, 
  Clock,
  Plus,
  Search
} from "lucide-react";
import { Link } from "wouter";

const CURRENT_AGENT_ID = 1; // Hardcoded for now (John Doe)

export default function Dashboard() {
  const { data: properties = [] } = useQuery<any[]>({
    queryKey: [`/api/agents/${CURRENT_AGENT_ID}/properties`],
  });

  const { data: bookings = [] } = useQuery<any[]>({
    queryKey: [`/api/bookings?agentId=${CURRENT_AGENT_ID}`],
  });

  const { data: commissions = [] } = useQuery<any[]>({
    queryKey: [`/api/commissions/agent/${CURRENT_AGENT_ID}`],
  });

  const activeListings = properties.filter((p: any) => p.status === 'active').length;
  const pendingBookings = bookings.filter((b: any) => b.status === 'pending').length;
  const totalCommission = commissions.reduce((sum: number, c: any) => 
    sum + parseFloat(c.ownerCommission || 0) + parseFloat(c.bookingCommission || 0), 0
  );

  return (
    <Layout>
      <div className="p-8 space-y-8">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-serif font-bold text-primary">Dashboard</h1>
            <p className="text-muted-foreground mt-1">Welcome back, John. Here's what's happening today.</p>
          </div>
          <Link href="/properties">
            <Button className="bg-sidebar text-white hover:bg-sidebar/90 shadow-md gap-2" data-testid="button-add-property">
              <Plus className="h-4 w-4" />
              Add New Property
            </Button>
          </Link>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[
            { title: "Active Listings", value: activeListings.toString(), change: "+2 this week", icon: Building, color: "text-blue-500" },
            { title: "Pending Bookings", value: pendingBookings.toString(), change: `${pendingBookings} need action`, icon: Clock, color: "text-amber-500" },
            { title: "Total Bookings", value: bookings.length.toString(), change: "+12% vs last month", icon: Users, color: "text-emerald-500" },
            { title: "Commission (YTD)", value: `€${totalCommission.toFixed(0)}`, change: "+8% vs last year", icon: CreditCard, color: "text-violet-500" },
          ].map((stat, i) => (
            <Card key={i} className="shadow-sm hover:shadow-md transition-shadow border-border/50">
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
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Recent Activity */}
          <Card className="col-span-2 shadow-sm border-border/50">
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

          {/* Quick Actions */}
          <Card className="shadow-sm border-border/50 bg-sidebar text-sidebar-foreground">
            <CardHeader>
              <CardTitle className="font-serif text-sidebar-primary-foreground">Quick Actions</CardTitle>
              <CardDescription className="text-sidebar-foreground/70">Common tasks for today.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <Link href="/search">
                <Button variant="secondary" className="w-full justify-start text-left mb-3 bg-sidebar-primary text-white hover:bg-sidebar-primary/90 border-0 cursor-pointer" data-testid="button-find-property">
                  <Search className="mr-2 h-4 w-4" /> Find a Property for Client
                </Button>
              </Link>
              <Link href="/properties">
                <Button variant="outline" className="w-full justify-start text-left border-sidebar-border hover:bg-sidebar-accent hover:text-white bg-transparent text-sidebar-foreground cursor-pointer" data-testid="button-create-listing">
                  <Plus className="mr-2 h-4 w-4" /> Create New Listing
                </Button>
              </Link>
              <Button variant="outline" className="w-full justify-start text-left border-sidebar-border hover:bg-sidebar-accent hover:text-white bg-transparent text-sidebar-foreground cursor-pointer" data-testid="button-manage-clients">
                <Users className="mr-2 h-4 w-4" /> Manage Clients
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </Layout>
  );
}
