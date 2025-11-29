import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";
import { 
  LayoutDashboard, 
  Search, 
  Building2, 
  CalendarDays, 
  MessageSquare, 
  Settings, 
  LogOut 
} from "lucide-react";
import logoImg from "@assets/generated_images/minimalist_building_logo_icon.png";

export function Sidebar() {
  const [location] = useLocation();

  const navItems = [
    { icon: LayoutDashboard, label: "Dashboard", href: "/" },
    { icon: Search, label: "Find Properties", href: "/search" },
    { icon: Building2, label: "My Inventory", href: "/properties" },
    { icon: CalendarDays, label: "Bookings", href: "/bookings" },
    { icon: MessageSquare, label: "Messages", href: "/messages" },
  ];

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
      </nav>

      <div className="p-4 border-t border-sidebar-border">
        <div className="flex items-center gap-3 px-3 py-2 rounded-md hover:bg-sidebar-accent cursor-pointer mb-2">
          <div className="h-8 w-8 rounded-full bg-sidebar-primary/20 flex items-center justify-center text-sidebar-primary font-bold border border-sidebar-primary/30">
            JD
          </div>
          <div className="overflow-hidden">
            <p className="text-sm font-medium truncate">John Doe</p>
            <p className="text-xs text-sidebar-foreground/60 truncate">Marbella Luxury RE</p>
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
