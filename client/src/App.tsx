import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { SidebarProvider, useSidebar } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { ThemeProvider, useTheme } from "@/components/theme-provider";
import { Button } from "@/components/ui/button";
import { Moon, Sun, Search, Bell, Accessibility, LayoutDashboard, HeartHandshake, Briefcase, Bus, MessageSquare, Settings, PanelLeftClose, PanelLeftOpen } from "lucide-react";
import { useState } from "react";
import { useLocation } from "wouter";
import logoImage from "@assets/Accessible_Australia_Logo_Design_1772582762574.png";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import NotFound from "@/pages/not-found";
import Dashboard from "@/pages/dashboard";
import CarePage from "@/pages/care";
import WorkerDetailPage from "@/pages/worker-detail";
import JobsPage from "@/pages/jobs";
import JobDetailPage from "@/pages/job-detail";
import TransportPage from "@/pages/transport";
import MessagesPage from "@/pages/messages";
import SettingsPage from "@/pages/settings";

function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();
  return (
    <Button size="icon" variant="ghost" onClick={toggleTheme} data-testid="button-theme-toggle" className="text-white/90">
      {theme === "dark" ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
    </Button>
  );
}

function HeaderSearchPill() {
  const [query, setQuery] = useState("");
  return (
    <div className="hidden md:flex items-center gap-2 bg-white/15 backdrop-blur-md border border-white/20 rounded-full px-4 py-1.5 min-w-[240px] lg:min-w-[320px]" data-testid="input-header-search-container">
      <Search className="w-4 h-4 text-white/70 shrink-0" />
      <input
        type="search"
        placeholder="Search workers, jobs, services..."
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        className="bg-transparent border-none outline-none text-sm text-white placeholder:text-white/50 w-full"
        data-testid="input-header-search"
      />
    </div>
  );
}

const mobileNavItems = [
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

function MobileMenuToggle() {
  const { toggleSidebar, state } = useSidebar();
  const [, setLocation] = useLocation();
  const isCollapsed = state === "collapsed";

  return (
    <div className="md:hidden flex items-center">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            className="flex items-center"
            data-testid="button-mobile-menu"
            aria-label="Open navigation menu"
          >
            <img src={logoImage} alt="MapAble" className="h-10 w-auto" data-testid="img-header-logo" />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-64">
          {mobileNavItems.map((item) => (
            <DropdownMenuItem
              key={item.title}
              onFocus={() => speakDescription(item.audioDesc)}
              onSelect={() => setLocation(item.url)}
              aria-description={item.audioDesc}
              data-testid={`mobile-dropdown-nav-${item.title.toLowerCase().replace(/\s/g, "-")}`}
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
            data-testid="mobile-dropdown-toggle-sidebar"
          >
            {isCollapsed ? <PanelLeftOpen className="w-4 h-4" /> : <PanelLeftClose className="w-4 h-4" />}
            <span>Toggle Sidebar</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}

function Router() {
  return (
    <Switch>
      <Route path="/" component={Dashboard} />
      <Route path="/care" component={CarePage} />
      <Route path="/care/:id" component={WorkerDetailPage} />
      <Route path="/care/:id/book" component={WorkerDetailPage} />
      <Route path="/jobs" component={JobsPage} />
      <Route path="/jobs/:id" component={JobDetailPage} />
      <Route path="/transport" component={TransportPage} />
      <Route path="/messages" component={MessagesPage} />
      <Route path="/settings" component={SettingsPage} />
      <Route component={NotFound} />
    </Switch>
  );
}

function AppLayout() {
  const style = {
    "--sidebar-width": "16rem",
    "--sidebar-width-icon": "3rem",
  };

  return (
    <SidebarProvider style={style as React.CSSProperties}>
      <div className="flex h-screen w-full">
        <AppSidebar />
        <div className="flex flex-col flex-1 min-w-0">
          <header
            className="flex items-center justify-between gap-3 px-4 py-2 sticky top-0 z-40"
            style={{ background: "linear-gradient(90deg, #14578F, #1B6EB5, #2384C9)" }}
            data-testid="header-main"
          >
            <div className="flex items-center gap-3 flex-wrap">
              <MobileMenuToggle />
              <HeaderSearchPill />
            </div>
            <div className="flex items-center gap-1 flex-wrap">
              <Button size="icon" variant="ghost" className="text-white/90" data-testid="button-accessibility">
                <Accessibility className="w-4 h-4" />
              </Button>
              <Button size="icon" variant="ghost" className="text-white/90" data-testid="button-notifications">
                <Bell className="w-4 h-4" />
              </Button>
              <ThemeToggle />
            </div>
          </header>
          <div className="flex h-[3px] shrink-0" data-testid="accent-tricolor-strip">
            <div className="flex-1" style={{ backgroundColor: "#2EAA6E" }} />
            <div className="flex-1" style={{ backgroundColor: "#1A4B7A" }} />
            <div className="flex-1" style={{ backgroundColor: "#E6A817" }} />
          </div>
          <main className="flex-1 overflow-auto">
            <Router />
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <ThemeProvider>
          <AppLayout />
          <Toaster />
        </ThemeProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
