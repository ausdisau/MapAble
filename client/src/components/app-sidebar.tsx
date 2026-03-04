import { useLocation, Link } from "wouter";
import {
  LayoutDashboard,
  HeartHandshake,
  Briefcase,
  Bus,
  MessageSquare,
  Settings,
  ShieldCheck,
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
import { Badge } from "@/components/ui/badge";
import logoImage from "@assets/Accessible_Australia_Logo_Design_1772582762574.png";

const navItems = [
  { title: "Dashboard", url: "/", icon: LayoutDashboard },
  { title: "Book a Carer", url: "/care", icon: HeartHandshake },
  { title: "Find a Job", url: "/jobs", icon: Briefcase },
  { title: "Get Transport", url: "/transport", icon: Bus },
  { title: "Messages", url: "/messages", icon: MessageSquare },
  { title: "Settings", url: "/settings", icon: Settings },
];

export function AppSidebar() {
  const [location] = useLocation();
  const { toggleSidebar, state } = useSidebar();
  const isCollapsed = state === "collapsed";

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className={isCollapsed ? "p-2" : "p-4 pb-5"}>
        <div
          className={`flex items-center cursor-pointer select-none ${isCollapsed ? "justify-center" : "gap-3.5"}`}
          onClick={toggleSidebar}
          data-testid="button-sidebar-toggle"
          role="button"
          tabIndex={0}
          onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") toggleSidebar(); }}
          aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          <img src={logoImage} alt="MapAble" className={`rounded-lg object-contain shrink-0 transition-all ${isCollapsed ? "w-8 h-8" : "w-12 h-12"}`} data-testid="img-sidebar-logo" />
          {!isCollapsed && (
            <div className="flex flex-col overflow-hidden">
              <div className="flex items-baseline gap-1.5">
                <span className="text-xl font-black tracking-tight">MapAble</span>
                <span className="text-[10px] font-bold text-muted-foreground">4.0</span>
              </div>
              <span className="text-[11px] text-muted-foreground leading-none tracking-wide mt-0.5">Empowering Independence</span>
            </div>
          )}
        </div>
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
      <SidebarFooter className="p-4">
        <Badge variant="outline" className="no-default-active-elevate gap-2 py-1.5 px-3 border-[#2EAA6E]/30 bg-[#2EAA6E]/10 text-[#2EAA6E] dark:text-[#3CC87F] justify-center" data-testid="badge-ndis-registered">
          <ShieldCheck className="w-3.5 h-3.5 shrink-0" />
          {!isCollapsed && <span className="text-xs font-semibold">NDIS Registered Provider</span>}
        </Badge>
      </SidebarFooter>
    </Sidebar>
  );
}
