import { Layout } from "@/components/layout/Layout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
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

export default function Dashboard() {
  return (
    <Layout>
      <div className="p-8 space-y-8">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-serif font-bold text-primary">Dashboard</h1>
            <p className="text-muted-foreground mt-1">Welcome back, John. Here's what's happening today.</p>
          </div>
          <Button className="bg-sidebar text-white hover:bg-sidebar/90 shadow-md gap-2">
            <Plus className="h-4 w-4" />
            Add New Property
          </Button>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[
            { title: "Active Listings", value: "24", change: "+2 this week", icon: Building, color: "text-blue-500" },
            { title: "Pending Bookings", value: "8", change: "4 need action", icon: Clock, color: "text-amber-500" },
            { title: "Total Clients", value: "142", change: "+12% vs last month", icon: Users, color: "text-emerald-500" },
            { title: "Commission (YTD)", value: "€45,250", change: "+8% vs last year", icon: CreditCard, color: "text-violet-500" },
          ].map((stat, i) => (
            <Card key={i} className="shadow-sm hover:shadow-md transition-shadow border-border/50">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">{stat.title}</CardTitle>
                <stat.icon className={`h-4 w-4 ${stat.color}`} />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stat.value}</div>
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
              <CardTitle className="font-serif">Recent Activity</CardTitle>
              <CardDescription>Latest actions across your network.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {[
                  { user: "Sarah Miller", action: "requested a booking for", target: "Villa Azure", time: "2 hours ago", status: "Pending" },
                  { user: "David Chen", action: "shared listing", target: "Sunset Apartment", time: "5 hours ago", status: "Shared" },
                  { user: "You", action: "updated availability for", target: "Downtown Loft", time: "Yesterday", status: "Updated" },
                  { user: "Maria Garcia", action: "confirmed booking for", target: "Beachfront Condo", time: "Yesterday", status: "Confirmed" },
                ].map((item, i) => (
                  <div key={i} className="flex items-center justify-between border-b border-border/40 last:border-0 pb-4 last:pb-0">
                    <div className="flex items-center gap-4">
                      <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center font-medium text-muted-foreground text-sm">
                        {item.user.charAt(0)}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-foreground">
                          {item.user} <span className="text-muted-foreground font-normal">{item.action}</span> {item.target}
                        </p>
                        <p className="text-xs text-muted-foreground mt-0.5">{item.time}</p>
                      </div>
                    </div>
                    <span className={`text-xs px-2 py-1 rounded-full font-medium 
                      ${item.status === 'Pending' ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' : 
                        item.status === 'Confirmed' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' : 
                        'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'}`}>
                      {item.status}
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
                <Button variant="secondary" className="w-full justify-start text-left mb-3 bg-sidebar-primary text-white hover:bg-sidebar-primary/90 border-0 cursor-pointer">
                  <Search className="mr-2 h-4 w-4" /> Find a Property for Client
                </Button>
              </Link>
              <Button variant="outline" className="w-full justify-start text-left border-sidebar-border hover:bg-sidebar-accent hover:text-white bg-transparent text-sidebar-foreground cursor-pointer">
                <Plus className="mr-2 h-4 w-4" /> Create New Listing
              </Button>
              <Button variant="outline" className="w-full justify-start text-left border-sidebar-border hover:bg-sidebar-accent hover:text-white bg-transparent text-sidebar-foreground cursor-pointer">
                <Users className="mr-2 h-4 w-4" /> Manage Clients
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </Layout>
  );
}
