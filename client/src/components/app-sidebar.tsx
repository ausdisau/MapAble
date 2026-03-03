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
} from "@/components/ui/sidebar";

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

  return (
    <Sidebar>
      <SidebarHeader className="p-4">
        <Link href="/">
          <div className="flex items-center gap-3 cursor-pointer" data-testid="link-home">
            <div className="w-9 h-9 rounded-md bg-primary flex items-center justify-center">
              <ShieldCheck className="w-5 h-5 text-primary-foreground" />
            </div>
            <div>
              <span className="text-lg font-black tracking-tight">MapAble</span>
              <span className="text-[10px] font-bold text-muted-foreground ml-1">3.0</span>
            </div>
          </div>
        </Link>
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
                    <SidebarMenuButton asChild data-active={isActive}>
                      <Link href={item.url} data-testid={`link-nav-${item.title.toLowerCase().replace(/\s/g, "-")}`}>
                        <item.icon className="w-4 h-4" />
                        <span>{item.title}</span>
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
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <ShieldCheck className="w-3 h-3" />
          <span>NDIS Registered</span>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
