import { useQuery } from "@tanstack/react-query";
import { StatCard } from "@/components/stat-card";
import { WorkerCard } from "@/components/worker-card";
import { JobCard } from "@/components/job-card";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
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
} from "lucide-react";
import { Link } from "wouter";
import type { Worker, User, Job } from "@shared/schema";

function HeroSection() {
  return (
    <div className="relative rounded-md bg-gradient-to-br from-primary via-blue-600 to-indigo-700 dark:from-primary dark:via-blue-800 dark:to-indigo-900 p-8 md:p-12 text-white">
      <div className="absolute inset-0 rounded-md bg-[radial-gradient(circle_at_30%_30%,rgba(255,255,255,0.12)_0%,transparent_60%)]" />
      <div className="relative z-10 max-w-2xl">
        <Badge className="mb-4 bg-white/20 text-white border-white/30">
          <ShieldCheck className="w-3 h-3 mr-1" /> NDIS Registered Platform
        </Badge>
        <h1 className="text-3xl md:text-4xl font-black tracking-tight leading-tight mb-3">
          Find verified NDIS support workers & services
        </h1>
        <p className="text-base text-white/80 mb-6 max-w-lg">
          Book carers, arrange transport, and find employment opportunities - all in one accessible platform.
        </p>
        <div className="flex flex-wrap gap-3">
          <Link href="/care">
            <Button size="lg" variant="secondary" className="font-bold gap-2" data-testid="button-hero-care">
              <HeartHandshake className="w-4 h-4" /> Book a Carer
            </Button>
          </Link>
          <Link href="/transport">
            <Button size="lg" variant="outline" className="font-bold gap-2 bg-white/10 border-white/30 text-white backdrop-blur-sm" data-testid="button-hero-transport">
              <Bus className="w-4 h-4" /> Get Transport
            </Button>
          </Link>
          <Link href="/jobs">
            <Button size="lg" variant="outline" className="font-bold gap-2 bg-white/10 border-white/30 text-white backdrop-blur-sm" data-testid="button-hero-jobs">
              <Briefcase className="w-4 h-4" /> Find a Job
            </Button>
          </Link>
        </div>
      </div>

      <div className="absolute bottom-0 right-0 w-48 h-48 md:w-64 md:h-64 opacity-10">
        <div className="w-full h-full rounded-full bg-white/20 blur-3xl" />
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
      color: "bg-blue-100 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400",
    },
    {
      title: "Get Transport",
      description: "Wheelchair accessible transport services",
      icon: Bus,
      href: "/transport",
      color: "bg-emerald-100 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400",
    },
    {
      title: "Find a Job",
      description: "Employment opportunities in disability support",
      icon: Briefcase,
      href: "/jobs",
      color: "bg-violet-100 dark:bg-violet-950/40 text-violet-600 dark:text-violet-400",
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {actions.map((action) => (
        <Link key={action.title} href={action.href}>
          <Card className="p-5 cursor-pointer hover-elevate h-full">
            <div className={`w-10 h-10 rounded-md flex items-center justify-center ${action.color} mb-3`}>
              <action.icon className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-sm mb-1" data-testid={`text-action-${action.title.toLowerCase().replace(/\s/g, "-")}`}>
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
  const { data: workers, isLoading } = useQuery<(Worker & { user?: User })[]>({
    queryKey: ["/api/workers"],
  });

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
          <h2 className="text-lg font-black tracking-tight">Featured Support Workers</h2>
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
  const { data: jobs, isLoading } = useQuery<Job[]>({
    queryKey: ["/api/jobs"],
  });

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
          <h2 className="text-lg font-black tracking-tight">Latest Job Opportunities</h2>
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
      <h3 className="font-bold text-sm mb-3">Why MapAble?</h3>
      <div className="space-y-3">
        {features.map((f, i) => (
          <div key={i} className="flex items-center gap-3">
            <div className="w-7 h-7 rounded-full bg-emerald-100 dark:bg-emerald-950/40 flex items-center justify-center flex-shrink-0">
              <f.icon className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
            </div>
            <span className="text-sm font-medium">{f.label}</span>
          </div>
        ))}
      </div>
    </Card>
  );
}

export default function Dashboard() {
  const { data: workers } = useQuery<Worker[]>({ queryKey: ["/api/workers"] });
  const { data: jobs } = useQuery<Job[]>({ queryKey: ["/api/jobs"] });

  return (
    <div className="space-y-6 p-4 md:p-6 max-w-7xl mx-auto">
      <HeroSection />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard title="Support Workers" value={workers?.length || 0} icon={Users} color="blue" />
        <StatCard title="Active Jobs" value={jobs?.filter(j => j.status === "open").length || 0} icon={Briefcase} color="purple" />
        <StatCard title="Transport Ready" value={workers?.filter(w => w.transportCapable).length || 0} icon={Bus} color="green" />
        <StatCard title="Verified Workers" value={workers?.filter(w => w.ndisVerified).length || 0} icon={ShieldCheck} color="amber" />
      </div>

      <QuickActions />
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
