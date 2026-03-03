import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { ThemeProvider, useTheme } from "@/components/theme-provider";
import { Button } from "@/components/ui/button";
import { Moon, Sun } from "lucide-react";
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
    <Button size="icon" variant="ghost" onClick={toggleTheme} data-testid="button-theme-toggle">
      {theme === "dark" ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
    </Button>
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
          <header className="flex items-center justify-between gap-1 p-2 border-b sticky top-0 z-40 bg-background">
            <SidebarTrigger data-testid="button-sidebar-toggle" />
            <ThemeToggle />
          </header>
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
