import { useLocation, Link } from "wouter";
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

const navItems = [
  { title: "Dashboard", url: "/", icon: LayoutDashboard, audioDesc: "View your dashboard overview" },
  { title: "Book a Carer", url: "/care", icon: HeartHandshake, audioDesc: "Find and book verified NDIS support workers" },
  { title: "Find a Job", url: "/jobs", icon: Briefcase, audioDesc: "Browse disability support employment opportunities" },
  { title: "Get Transport", url: "/transport", icon: Bus, audioDesc: "Arrange wheelchair accessible transport services" },
  { title: "Messages", url: "/messages", icon: MessageSquare, audioDesc: "View your conversations and messages" },
  { title: "Settings", url: "/settings", icon: Settings, audioDesc: "Manage your account and accessibility preferences" },
];

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
  const isCollapsed = state === "collapsed";

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
                    <span className="text-xl font-black tracking-tight" style={{ color: "#E6A817" }}>MapAble</span>
                    <span className="text-[10px] font-bold" style={{ color: "#E6A817", opacity: 0.7 }}>4.0</span>
                  </div>
                  <span className="text-[11px] text-muted-foreground leading-none tracking-wide mt-0.5">Empowering Independence</span>
                </div>
              )}
            </div>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-64">
            {navItems.map((item) => (
              <DropdownMenuItem
                key={item.title}
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
          <SidebarGroupLabel>Navigation</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {navItems.map((item) => {
                const isActive = location === item.url || (item.url !== "/" && location.startsWith(item.url));
                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton
                      asChild
                      data-active={isActive}
                      tooltip={item.title}
                      className={isActive ? "bg-sidebar-accent text-sidebar-accent-foreground" : ""}
                    >
                      <Link href={item.url} data-testid={`link-nav-${item.title.toLowerCase().replace(/\s/g, "-")}`}>
                        <item.icon className={`w-4 h-4 ${isActive ? "text-[#2EAA6E]" : ""}`} />
                        <span className={isActive ? "font-semibold" : ""}>{item.title}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter className="p-4 relative">
        <div className="absolute top-1 left-6 w-1.5 h-1.5 rounded-full opacity-40" style={{ backgroundColor: "#E6A817" }} />
        <div className="absolute top-3 right-5 w-1 h-1 rounded-full opacity-30" style={{ backgroundColor: "#E6A817" }} />
        <div className="absolute bottom-2 left-10 w-1 h-1 rounded-full opacity-25" style={{ backgroundColor: "#E6A817" }} />
        <Badge variant="outline" className="no-default-active-elevate gap-2 py-1.5 px-3 border-[#2EAA6E]/30 bg-[#2EAA6E]/10 text-[#2EAA6E] dark:text-[#3CC87F] justify-center" data-testid="badge-ndis-registered">
          <ShieldCheck className="w-3.5 h-3.5 shrink-0" />
          {!isCollapsed && <span className="text-xs font-semibold">NDIS Registered Provider</span>}
        </Badge>
      </SidebarFooter>
    </Sidebar>
  );
}
