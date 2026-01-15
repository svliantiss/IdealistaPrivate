import { useState } from "react";
import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";
import { 
  LayoutDashboard, 
  Search, 
  Building2, 
  CalendarDays, 
  Home,
  Users,
  LogOut,
  ChevronDown,
  ChevronRight
} from "lucide-react";
import logoImg from "@assets/generated_images/minimalist_building_logo_icon.png";

export function Sidebar() {
  const [location] = useLocation();
  const [propertiesExpanded, setPropertiesExpanded] = useState(
    location === "/properties" || location === "/sales"
  );

  const navItems = [
    { icon: LayoutDashboard, label: "Dashboard", href: "/dashboard" },
    { icon: Users, label: "Team Stats", href: "/employee-stats" },
  ];

  const propertiesSubItems = [
    { icon: Building2, label: "My Rentals", href: "/properties" },
    { icon: Home, label: "For Sale", href: "/sales" },
  ];

  const bottomNavItems = [
    { icon: CalendarDays, label: "Bookings", href: "/bookings" },
    { icon: Search, label: "Find House", href: "/search" },
  ];

  const isPropertiesActive = location === "/properties" || location === "/sales";

  return (
    <div className="h-screen w-64 bg-sidebar text-sidebar-foreground flex flex-col border-r border-sidebar-border fixed left-0 top-0 z-20">
      <div className="p-6 flex items-center gap-3 border-b border-sidebar-border">
        <img src={logoImg} alt="RentNetAgents" className="h-8 w-8 rounded-md" />
        <span className="font-serif font-bold text-xl tracking-tight text-sidebar-primary-foreground">
          RentNetAgents
        </span>
      </div>

      <nav className="flex-1 py-6 px-3 space-y-1">
        {navItems.map((item) => {
          const isActive = location === item.href;
          return (
            <Link key={item.href} href={item.href}>
              <div
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-colors cursor-pointer",
                  isActive
                    ? "bg-sidebar-primary text-sidebar-primary-foreground shadow-sm"
                    : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                )}
              >
                <item.icon className="h-4 w-4" />
                {item.label}
              </div>
            </Link>
          );
        })}

        {/* My Properties - Expandable */}
        <div>
          <div
            onClick={() => setPropertiesExpanded(!propertiesExpanded)}
            className={cn(
              "flex items-center justify-between px-3 py-2.5 rounded-md text-sm font-medium transition-colors cursor-pointer",
              isPropertiesActive
                ? "bg-sidebar-primary/50 text-sidebar-primary-foreground"
                : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
            )}
            data-testid="nav-my-properties"
          >
            <div className="flex items-center gap-3">
              <Building2 className="h-4 w-4" />
              My Properties
            </div>
            {propertiesExpanded ? (
              <ChevronDown className="h-4 w-4" />
            ) : (
              <ChevronRight className="h-4 w-4" />
            )}
          </div>
          
          {propertiesExpanded && (
            <div className="ml-4 mt-1 space-y-1">
              {propertiesSubItems.map((item) => {
                const isActive = location === item.href;
                return (
                  <Link key={item.href} href={item.href}>
                    <div
                      className={cn(
                        "flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors cursor-pointer",
                        isActive
                          ? "bg-sidebar-primary text-sidebar-primary-foreground shadow-sm"
                          : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                      )}
                      data-testid={`nav-${item.label.toLowerCase().replace(/ /g, '-')}`}
                    >
                      <item.icon className="h-4 w-4" />
                      {item.label}
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </div>

        {bottomNavItems.map((item) => {
          const isActive = location === item.href;
          return (
            <Link key={item.href} href={item.href}>
              <div
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-colors cursor-pointer",
                  isActive
                    ? "bg-sidebar-primary text-sidebar-primary-foreground shadow-sm"
                    : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                )}
              >
                <item.icon className="h-4 w-4" />
                {item.label}
              </div>
            </Link>
          );
        })}
      </nav>

      <div className="p-4 border-t border-sidebar-border">
        <div className="flex items-center gap-3 px-3 py-2 rounded-md hover:bg-sidebar-accent cursor-pointer mb-2">
          <div className="h-8 w-8 rounded-full bg-sidebar-primary/20 flex items-center justify-center text-sidebar-primary font-bold border border-sidebar-primary/30">
            RV
          </div>
          <div className="overflow-hidden">
            <p className="text-sm font-medium truncate">Ryan</p>
            <p className="text-xs text-sidebar-foreground/60 truncate">Velmont Properties</p>
          </div>
        </div>
        <button className="w-full flex items-center gap-3 px-3 py-2 text-sm text-sidebar-foreground/60 hover:text-destructive transition-colors">
          <LogOut className="h-4 w-4" />
          Sign Out
        </button>
      </div>
    </div>
  );
}
