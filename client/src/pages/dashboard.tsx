import { useQuery } from "@tanstack/react-query";
import { StatCard } from "@/components/stat-card";
import { WorkerCard } from "@/components/worker-card";
import { JobCard } from "@/components/job-card";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import {
  HeartHandshake,
  Briefcase,
  Bus,
  Users,
  ArrowRight,
  Search,
  ShieldCheck,
  Car,
  Accessibility,
  CheckCircle2,
  AlertCircle,
  AlertTriangle,
  Loader2,
  ShoppingCart,
} from "lucide-react";
import { Link, useLocation } from "wouter";
import { useState } from "react";
import { usePageTitle } from "@/hooks/use-page-title";
import { useToast } from "@/hooks/use-toast";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { Worker, User, Job, GroceryOrder } from "@shared/schema";

const GROCERY_STATUS_LABELS: Record<string, string> = {
  placed: "Placed",
  confirmed: "Confirmed",
  shopping: "Shopping",
  out_for_delivery: "Out for delivery",
  delivered: "Delivered",
  cancelled: "Cancelled",
};

function ActiveGroceryOrders() {
  const { data: orders, isLoading } = useQuery<GroceryOrder[]>({
    queryKey: ["/api/grocery/orders"],
  });

  if (isLoading) return null;
  const active = (orders || []).filter(
    (o) => !["delivered", "cancelled"].includes(o.status),
  );
  if (active.length === 0) return null;

  return (
    <Card className="p-5" data-testid="card-active-grocery-orders">
      <div className="flex items-center justify-between gap-2 mb-4">
        <div className="flex items-center gap-2">
          <ShoppingCart className="w-5 h-5 text-[#2EAA6E]" />
          <h2 className="text-lg font-black tracking-tight">
            Active grocery orders
          </h2>
        </div>
        <Link href="/groceries/orders">
          <Button variant="secondary" size="sm" className="gap-1" data-testid="button-view-all-grocery-orders">
            View all <ArrowRight className="w-3 h-3" />
          </Button>
        </Link>
      </div>
      <ul className="space-y-2">
        {active.slice(0, 3).map((o) => (
          <li key={o.id}>
            <Link href={`/groceries/orders/${o.id}`}>
              <div
                className="flex items-center justify-between gap-3 p-3 rounded-md border hover-elevate cursor-pointer"
                data-testid={`dashboard-grocery-order-${o.id}`}
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-semibold text-sm">
                      Order #{o.id.slice(0, 8)}
                    </span>
                    <Badge variant="secondary" className="text-xs">
                      {GROCERY_STATUS_LABELS[o.status] || o.status}
                    </Badge>
                    {o.workerId && (
                      <Badge variant="outline" className="text-xs">Worker assisted</Badge>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground line-clamp-1 mt-1">
                    {o.deliveryAddress}
                  </p>
                </div>
                <span className="font-black text-[#2EAA6E] text-sm">
                  ${Number(o.totalAmount).toFixed(2)}
                </span>
              </div>
            </Link>
          </li>
        ))}
      </ul>
    </Card>
  );
}

interface AbnStatus {
  hasWorkerProfile: boolean;
  abn: string | null;
  abnVerified: boolean;
}

function AbnVerificationPrompt({ user }: { user: User }) {
  const { toast } = useToast();
  const isWorkerOrProvider = user.role === "carer" || user.role === "provider";

  const { data: abnStatus } = useQuery<AbnStatus>({
    queryKey: ["/api/workers/me/abn-status"],
    enabled: isWorkerOrProvider && user.role === "carer",
  });

  const providerAbn = (user as any).providerAbn as string | null | undefined;
  const isProviderUnverified = user.role === "provider" && !!providerAbn && !user.isVerified;

  const verifyMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/workers/verify-abn", {});
      return res.json();
    },
    onSuccess: (data) => {
      toast({
        title: "ABN verified",
        description: data.businessName ? `Verified against ${data.businessName}` : "Your ABN has been verified.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/workers/me/abn-status"] });
      queryClient.invalidateQueries({ queryKey: ["/api/me"] });
    },
    onError: async (error: any) => {
      toast({
        title: "Verification failed",
        description: error?.message || "Could not verify ABN. Please check it and try again.",
        variant: "destructive",
      });
    },
  });

  if (!isWorkerOrProvider) return null;

  const showWorkerPrompt = user.role === "carer" && abnStatus?.hasWorkerProfile && !abnStatus.abnVerified;
  const showProviderPrompt = isProviderUnverified;

  if (!showWorkerPrompt && !showProviderPrompt) return null;

  const noAbn = user.role === "carer" && abnStatus?.hasWorkerProfile && !abnStatus.abn;

  return (
    <Card
      className="p-5 border-amber-300 dark:border-amber-700 bg-amber-50 dark:bg-amber-950/30"
      data-testid="card-abn-verification-prompt"
    >
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-md bg-amber-200/60 dark:bg-amber-900/60 flex items-center justify-center flex-shrink-0">
          <AlertTriangle className="w-5 h-5 text-amber-700 dark:text-amber-300" />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-bold text-sm text-amber-900 dark:text-amber-100" data-testid="text-abn-prompt-title">
            ABN verification required
          </h3>
          <p className="text-xs text-amber-800 dark:text-amber-200 mt-1">
            {noAbn
              ? "Your worker profile does not have an ABN on file. Add an ABN to your profile, then verify it through the Australian Business Register so your completed work can appear on invoices."
              : "Your ABN has not been verified through the Australian Business Register. Until verified, your completed shifts/sessions will be flagged on invoices and payments to participants will be blocked."}
          </p>
          {(abnStatus?.abn || providerAbn) && (
            <p className="text-xs text-amber-700 dark:text-amber-300 mt-2 font-mono" data-testid="text-abn-prompt-abn">
              ABN on file: {abnStatus?.abn || providerAbn}
            </p>
          )}
          <div className="mt-3 flex flex-wrap gap-2">
            {user.role === "carer" && abnStatus?.abn && (
              <Button
                size="sm"
                onClick={() => verifyMutation.mutate()}
                disabled={verifyMutation.isPending}
                className="gap-1.5"
                data-testid="button-verify-abn"
              >
                {verifyMutation.isPending ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <ShieldCheck className="w-3.5 h-3.5" />
                )}
                {verifyMutation.isPending ? "Verifying..." : "Verify ABN now"}
              </Button>
            )}
            <Link href="/profile">
              <Button size="sm" variant="outline" className="gap-1.5" data-testid="button-manage-abn">
                {noAbn ? "Add ABN" : "Manage profile"}
                <ArrowRight className="w-3.5 h-3.5" />
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </Card>
  );
}

function HeroSection() {
  const [heroQuery, setHeroQuery] = useState("");
  const [, setLocation] = useLocation();

  const handleHeroSearch = () => {
    if (heroQuery.trim()) {
      setLocation("/care?q=" + encodeURIComponent(heroQuery.trim()));
    }
  };

  return (
    <div className="relative rounded-md overflow-visible bg-gradient-to-r from-[#14578F] via-[#1B6EB5] to-[#2384C9] dark:from-[#0F1A2E] dark:via-[#14578F] dark:to-[#1B6EB5] p-8 md:p-12 text-white">
      <div className="absolute inset-0 rounded-md bg-[radial-gradient(ellipse_at_70%_20%,rgba(255,255,255,0.10)_0%,transparent_60%)]" />
      <div
        className="absolute right-8 md:right-16 top-1/2 -translate-y-1/2 w-20 h-28 md:w-28 md:h-40 opacity-[0.07] pointer-events-none"
        style={{
          background: "linear-gradient(180deg, #2EAA6E 33%, #1A4B7A 33% 66%, #E6A817 66%)",
          borderRadius: "50% 50% 50% 50% / 35% 35% 65% 65%",
        }}
        data-testid="deco-pin-silhouette"
      />
      <div className="absolute top-6 right-24 md:right-40 w-2 h-2 rounded-full opacity-30 pointer-events-none" style={{ backgroundColor: "#E6A817" }} />
      <div className="absolute top-12 right-12 md:right-24 w-1.5 h-1.5 rounded-full opacity-25 pointer-events-none" style={{ backgroundColor: "#E6A817" }} />
      <div className="absolute bottom-8 right-20 md:right-36 w-1 h-1 rounded-full opacity-35 pointer-events-none" style={{ backgroundColor: "#E6A817" }} />
      <div className="absolute bottom-16 right-32 md:right-48 w-1.5 h-1.5 rounded-full opacity-20 pointer-events-none" style={{ backgroundColor: "#E6A817" }} />
      <div className="absolute top-20 right-36 md:right-56 w-1 h-1 rounded-full opacity-30 pointer-events-none" style={{ backgroundColor: "#E6A817" }} />
      <div className="relative z-10 max-w-3xl">
        <Badge className="mb-5 bg-white/15 text-white border-white/25 no-default-hover-elevate no-default-active-elevate">
          <ShieldCheck className="w-3 h-3 mr-1" /> NDIS Registered Platform
        </Badge>
        <h1 className="text-3xl md:text-5xl font-black tracking-tight leading-tight mb-5" data-testid="text-hero-heading">
          Find verified NDIS support workers & services
        </h1>
        <p className="text-base md:text-lg text-white/80 mb-6 max-w-xl">
          Book carers, arrange transport, and find employment opportunities — all in one accessible platform.
        </p>

        <div className="space-y-2 mb-8">
          {[
            "NDIS Worker Screening verified",
            "Transport-capable support workers",
            "Arrange services independently",
          ].map((benefit) => (
            <div key={benefit} className="flex items-center gap-2.5">
              <CheckCircle2 className="w-4 h-4 text-[#2EAA6E] flex-shrink-0" />
              <span className="text-sm md:text-base font-medium text-white/90">{benefit}</span>
            </div>
          ))}
        </div>

        <div className="flex flex-col sm:flex-row gap-3 max-w-xl">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search workers, services, locations..."
              className="pl-10 bg-white dark:bg-white/10 text-foreground dark:text-white border-white/20 rounded-md text-sm"
              value={heroQuery}
              onChange={(e) => setHeroQuery(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") handleHeroSearch(); }}
              data-testid="input-hero-search"
            />
          </div>
          <Button
            size="lg"
            className="font-bold gap-2"
            onClick={handleHeroSearch}
            data-testid="button-hero-search"
          >
            <Search className="w-4 h-4" /> Search
          </Button>
        </div>
      </div>

      <div className="absolute bottom-0 right-0 w-48 h-48 md:w-72 md:h-72 opacity-10 pointer-events-none">
        <div className="w-full h-full rounded-full bg-white/30 blur-3xl" />
      </div>
    </div>
  );
}

function QuickActions() {
  const actions = [
    {
      title: "Book a Carer",
      description: "Find verified support workers near you",
      icon: HeartHandshake,
      href: "/care",
      iconBg: "bg-[#E6A817]/15 dark:bg-[#E6A817]/20",
      iconColor: "text-[#C48F14] dark:text-[#E6A817]",
    },
    {
      title: "Get Transport",
      description: "Wheelchair accessible transport services",
      icon: Bus,
      href: "/transport",
      iconBg: "bg-[#E6A817]/15 dark:bg-[#E6A817]/20",
      iconColor: "text-[#C48F14] dark:text-[#E6A817]",
    },
    {
      title: "Find a Job",
      description: "Employment opportunities in disability support",
      icon: Briefcase,
      href: "/jobs",
      iconBg: "bg-[#E6A817]/15 dark:bg-[#E6A817]/20",
      iconColor: "text-[#C48F14] dark:text-[#E6A817]",
    },
    {
      title: "Order Groceries",
      description: "Delivered to your door, or book a worker to shop",
      icon: ShoppingCart,
      href: "/groceries",
      iconBg: "bg-[#E6A817]/15 dark:bg-[#E6A817]/20",
      iconColor: "text-[#C48F14] dark:text-[#E6A817]",
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {actions.map((action) => (
        <Link key={action.title} href={action.href}>
          <Card className="p-5 cursor-pointer hover-elevate h-full">
            <div className={`w-11 h-11 rounded-md flex items-center justify-center ${action.iconBg} mb-3`}>
              <action.icon className={`w-5 h-5 ${action.iconColor}`} />
            </div>
            <h3 className="font-black text-sm mb-1" data-testid={`text-action-${action.title.toLowerCase().replace(/\s/g, "-")}`}>
              {action.title}
            </h3>
            <p className="text-xs text-muted-foreground">{action.description}</p>
            <div className="flex items-center gap-1 text-xs font-semibold text-primary mt-3">
              Explore <ArrowRight className="w-3 h-3" />
            </div>
          </Card>
        </Link>
      ))}
    </div>
  );
}

function FeaturedWorkers() {
  const { data: workers, isLoading, isError, refetch } = useQuery<(Worker & { user?: User })[]>({
    queryKey: ["/api/workers"],
  });

  if (isError) {
    return (
      <div>
        <Card className="p-12 text-center">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h3 className="font-bold text-lg mb-1">Something went wrong</h3>
          <p className="text-sm text-muted-foreground mb-4">We couldn't load the workers. Please try again.</p>
          <Button onClick={() => refetch()} data-testid="button-retry-workers">Try Again</Button>
        </Card>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[1, 2, 3].map((i) => (
          <Card key={i} className="p-4">
            <Skeleton className="h-40 w-full rounded-md mb-4" />
            <Skeleton className="h-4 w-3/4 mb-2" />
            <Skeleton className="h-3 w-1/2" />
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between gap-2 mb-4">
        <div>
          <h2 className="text-xl font-black tracking-tight" data-testid="text-section-featured-workers">Featured Support Workers</h2>
          <p className="text-sm text-muted-foreground">NDIS verified and ready to help</p>
        </div>
        <Link href="/care">
          <Button variant="secondary" size="sm" className="gap-1" data-testid="button-view-all-workers">
            View All <ArrowRight className="w-3 h-3" />
          </Button>
        </Link>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {workers?.slice(0, 3).map((worker) => (
          <WorkerCard key={worker.id} worker={worker} />
        ))}
      </div>
    </div>
  );
}

function RecentJobs() {
  const { data: jobs, isLoading, isError, refetch } = useQuery<Job[]>({
    queryKey: ["/api/jobs"],
  });

  if (isError) {
    return (
      <div>
        <Card className="p-12 text-center">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h3 className="font-bold text-lg mb-1">Something went wrong</h3>
          <p className="text-sm text-muted-foreground mb-4">We couldn't load the jobs. Please try again.</p>
          <Button onClick={() => refetch()} data-testid="button-retry-jobs">Try Again</Button>
        </Card>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {[1, 2].map((i) => (
          <Card key={i} className="p-4">
            <Skeleton className="h-4 w-3/4 mb-2" />
            <Skeleton className="h-3 w-1/2 mb-4" />
            <Skeleton className="h-3 w-full" />
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between gap-2 mb-4">
        <div>
          <h2 className="text-xl font-black tracking-tight" data-testid="text-section-latest-jobs">Latest Job Opportunities</h2>
          <p className="text-sm text-muted-foreground">Work in disability support services</p>
        </div>
        <Link href="/jobs">
          <Button variant="secondary" size="sm" className="gap-1" data-testid="button-view-all-jobs">
            View All <ArrowRight className="w-3 h-3" />
          </Button>
        </Link>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {jobs?.slice(0, 4).map((job) => (
          <JobCard key={job.id} job={job} />
        ))}
      </div>
    </div>
  );
}

function KeyFeatures() {
  const features = [
    { icon: ShieldCheck, label: "NDIS Worker Screening verified" },
    { icon: Car, label: "Transport-capable support workers" },
    { icon: Accessibility, label: "Wheelchair accessible services" },
    { icon: Search, label: "Search by location & skill" },
  ];

  return (
    <Card className="p-5">
      <h3 className="font-black text-base mb-4" data-testid="text-section-why-mapable">Why MapAble?</h3>
      <div className="space-y-3">
        {features.map((f, i) => (
          <div key={i} className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-md bg-[#2EAA6E]/15 dark:bg-[#2EAA6E]/20 flex items-center justify-center flex-shrink-0">
              <f.icon className="w-4 h-4 text-[#2EAA6E]" />
            </div>
            <span className="text-sm font-medium">{f.label}</span>
          </div>
        ))}
      </div>
    </Card>
  );
}

export default function Dashboard() {
  usePageTitle("Dashboard");
  const { data: workers } = useQuery<Worker[]>({ queryKey: ["/api/workers"] });
  const { data: jobs } = useQuery<Job[]>({ queryKey: ["/api/jobs"] });
  const { data: me } = useQuery<User>({ queryKey: ["/api/me"] });

  return (
    <div className="space-y-6 p-4 md:p-6 max-w-7xl mx-auto">
      {me && <AbnVerificationPrompt user={me} />}
      <HeroSection />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard title="Support Workers" value={workers?.length || 0} icon={Users} color="blue" />
        <StatCard title="Active Jobs" value={jobs?.filter(j => j.status === "open").length || 0} icon={Briefcase} color="purple" />
        <StatCard title="Transport Ready" value={workers?.filter(w => w.transportCapable).length || 0} icon={Bus} color="green" />
        <StatCard title="Verified Workers" value={workers?.filter(w => w.ndisVerified).length || 0} icon={ShieldCheck} color="teal" />
      </div>

      <QuickActions />
      <ActiveGroceryOrders />
      <FeaturedWorkers />
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <RecentJobs />
        </div>
        <div>
          <KeyFeatures />
        </div>
      </div>
    </div>
  );
}
