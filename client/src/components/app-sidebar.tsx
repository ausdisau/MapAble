import { useLocation, Link } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import {
  LayoutDashboard,
  HeartHandshake,
  Briefcase,
  Bus,
  MessageSquare,
  Settings,
  ShieldCheck,
  PanelLeftClose,
  PanelLeftOpen,
  DollarSign,
  Wallet,
  FileText,
  Bot,
  LogOut,
  CalendarDays,
  Building2,
  ClipboardList,
  User as UserIcon,
  TrendingUp,
  Mail,
  ShoppingCart,
  Map,
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  SidebarFooter,
  useSidebar,
} from "@/components/ui/sidebar";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import logoImage from "@assets/Accessible_Australia_Logo_Design_1772582762574.png";

type NavItem = { title: string; url: string; icon: typeof LayoutDashboard; audioDesc: string };

const participantNavItems: NavItem[] = [
  { title: "Dashboard", url: "/", icon: LayoutDashboard, audioDesc: "View your dashboard overview" },
  { title: "Book a Carer", url: "/care", icon: HeartHandshake, audioDesc: "Find and book verified NDIS support workers" },
  { title: "Groceries", url: "/groceries", icon: ShoppingCart, audioDesc: "Order groceries for delivery or book a support worker to shop for you" },
  { title: "Shifts", url: "/shifts", icon: CalendarDays, audioDesc: "Manage shift schedules and track NDIS goal alignment" },
  { title: "Find a Job", url: "/jobs", icon: Briefcase, audioDesc: "Browse disability support employment opportunities" },
  { title: "Get Transport", url: "/transport", icon: Bus, audioDesc: "Arrange wheelchair accessible transport services" },
  { title: "Accessibility Map", url: "/accessibility-map", icon: Map, audioDesc: "Explore accessible places, parking, lifts and routes on an interactive map" },
  { title: "MapAble Chat", url: "/chat", icon: Bot, audioDesc: "Chat with your accessibility-aware travel assistant" },
  { title: "Pricing", url: "/pricing", icon: DollarSign, audioDesc: "View NDIS-aligned pricing for care and transport services" },
  { title: "Budget", url: "/budget", icon: Wallet, audioDesc: "View your NDIS budget usage and remaining funds" },
  { title: "Invoices", url: "/invoices", icon: FileText, audioDesc: "View and manage your NDIS invoices and claims" },
  { title: "ABN Lookup", url: "/abn-lookup", icon: Building2, audioDesc: "Search and verify Australian Business Numbers" },
  { title: "Messages", url: "/messages", icon: MessageSquare, audioDesc: "View your conversations and messages" },
  { title: "Settings", url: "/settings", icon: Settings, audioDesc: "Manage your account and accessibility preferences" },
];

const workerNavItems: NavItem[] = [
  { title: "Dashboard", url: "/worker/dashboard", icon: LayoutDashboard, audioDesc: "View your worker dashboard overview" },
  { title: "My Shifts", url: "/worker/shifts", icon: CalendarDays, audioDesc: "View and manage your shifts and earnings" },
  { title: "My Bookings", url: "/worker/bookings", icon: ClipboardList, audioDesc: "Accept or decline booking requests" },
  { title: "Availability", url: "/worker/availability", icon: CalendarDays, audioDesc: "Set your weekly availability and blockouts" },
  { title: "My Profile", url: "/worker/profile", icon: UserIcon, audioDesc: "Update your worker profile and details" },
  { title: "MapAble Chat", url: "/chat", icon: Bot, audioDesc: "Chat with your accessibility-aware travel assistant" },
  { title: "Messages", url: "/messages", icon: MessageSquare, audioDesc: "View your conversations and messages" },
  { title: "Email", url: "/email", icon: Mail, audioDesc: "View and manage your email inbox" },
  { title: "Settings", url: "/settings", icon: Settings, audioDesc: "Manage your account and accessibility preferences" },
];

const adminNavItems: NavItem[] = [
  { title: "Geo Management", url: "/admin/geo", icon: Map, audioDesc: "Manage map layers, features, imports and categories" },
];

function getNavItems(role?: string): NavItem[] {
  const base = role === "carer" ? workerNavItems : participantNavItems;
  if (role === "admin") return [...base, ...adminNavItems];
  return base;
}

function speakDescription(text: string) {
  if (typeof window !== "undefined" && window.speechSynthesis) {
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 1;
    utterance.pitch = 1;
    window.speechSynthesis.speak(utterance);
  }
}

export function AppSidebar() {
  const [location, setLocation] = useLocation();
  const { toggleSidebar, state } = useSidebar();
  const { user, logout } = useAuth();
  const isCollapsed = state === "collapsed";
  const navItems = getNavItems(user?.role);

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className={isCollapsed ? "p-2" : "p-4 pb-5"}>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <div
              className={`flex items-center cursor-pointer select-none ${isCollapsed ? "justify-center" : "gap-3.5"}`}
              data-testid="button-logo-dropdown"
              role="button"
              tabIndex={0}
              aria-label="Open navigation menu"
            >
              <img src={logoImage} alt="MapAble" className={`rounded-lg object-contain shrink-0 transition-all ${isCollapsed ? "w-8 h-8" : "w-12 h-12"}`} data-testid="img-sidebar-logo" />
              {!isCollapsed && (
                <div className="flex flex-col overflow-hidden">
                  <div className="flex items-baseline gap-1.5">
                    <span className="text-xl font-black tracking-tight text-brand-gold">MapAble</span>
                    <span className="text-[10px] font-bold text-brand-gold/70">4.0</span>
                  </div>
                  <span className="text-[11px] text-muted-foreground leading-none tracking-wide mt-0.5">Empowering Independence</span>
                </div>
              )}
            </div>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-64">
            {navItems.map((item) => (
              <DropdownMenuItem
                key={item.title + item.url}
                onFocus={() => speakDescription(item.audioDesc)}
                onSelect={() => setLocation(item.url)}
                aria-description={item.audioDesc}
                data-testid={`dropdown-nav-${item.title.toLowerCase().replace(/\s/g, "-")}`}
              >
                <item.icon className="w-4 h-4" />
                <span>{item.title}</span>
              </DropdownMenuItem>
            ))}
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onFocus={() => speakDescription("Toggle the sidebar open or closed")}
              onSelect={toggleSidebar}
              aria-description="Toggle the sidebar open or closed"
              data-testid="dropdown-toggle-sidebar"
            >
              {isCollapsed ? <PanelLeftOpen className="w-4 h-4" /> : <PanelLeftClose className="w-4 h-4" />}
              <span>Toggle Sidebar</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>{user?.role === "carer" ? "Worker" : "Navigation"}</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {navItems.map((item) => {
                const isActive = location === item.url || (item.url !== "/" && item.url !== "/worker/dashboard" && location.startsWith(item.url));
                const isDashboardActive = (item.url === "/" || item.url === "/worker/dashboard") && location === item.url;
                const active = isActive || isDashboardActive;
                return (
                  <SidebarMenuItem key={item.title + item.url}>
                    <SidebarMenuButton
                      asChild
                      data-active={active}
                      tooltip={item.title}
                      className={active ? "bg-sidebar-accent text-sidebar-accent-foreground" : ""}
                    >
                      <Link
                        href={item.url}
                        data-testid={`link-nav-${item.title.toLowerCase().replace(/\s/g, "-")}`}
                        aria-label={`${item.title} — ${item.audioDesc}`}
                        onFocus={() => speakDescription(item.audioDesc)}
                      >
                        <item.icon className={`w-4 h-4 ${active ? "text-brand-teal" : ""}`} />
                        <span className={active ? "font-semibold" : ""}>{item.title}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter className="p-4 relative space-y-2">
        <div className="absolute top-1 left-6 w-1.5 h-1.5 rounded-full opacity-40 bg-brand-gold" />
        <div className="absolute top-3 right-5 w-1 h-1 rounded-full opacity-30 bg-brand-gold" />
        <div className="absolute bottom-2 left-10 w-1 h-1 rounded-full opacity-25 bg-brand-gold" />
        {user && !isCollapsed && (
          <div className="flex items-center justify-between px-1">
            <span className="text-xs text-muted-foreground truncate">{user.fullName}</span>
            <button
              onClick={() => logout()}
              className="text-muted-foreground/60 p-1 rounded-md transition-colors"
              aria-label="Sign out"
              data-testid="button-logout"
            >
              <LogOut className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
        {user && isCollapsed && (
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton
                onClick={() => logout()}
                tooltip="Sign out"
                data-testid="button-logout-collapsed"
              >
                <LogOut className="w-4 h-4" />
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        )}
        <Badge variant="outline" className="no-default-active-elevate gap-2 py-1.5 px-3 border-brand-teal/30 bg-brand-teal/10 text-brand-teal justify-center" data-testid="badge-ndis-registered">
          <ShieldCheck className="w-3.5 h-3.5 shrink-0" />
          {!isCollapsed && <span className="text-xs font-semibold">NDIS Registered Provider</span>}
        </Badge>
      </SidebarFooter>
    </Sidebar>
  );
}
