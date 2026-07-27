import { useQuery } from "@tanstack/react-query";
import { WorkerCard } from "@/components/worker-card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Card } from "@/components/ui/card";
import { PageShell } from "@/components/layout/PageShell";
import { EmptyState } from "@/components/layout/EmptyState";
import { Search, SlidersHorizontal, ShieldCheck, Car, Accessibility, Globe, Users, AlertCircle, CalendarDays } from "lucide-react";
import { Link } from "wouter";
import { useState } from "react";
import { usePageTitle } from "@/hooks/use-page-title";
import type { Worker, User } from "@shared/schema";

const filterTags = [
  { label: "All Workers", value: "all", icon: Users },
  { label: "Verified", value: "verified", icon: ShieldCheck },
  { label: "Transport", value: "transport", icon: Car },
  { label: "Wheelchair Accessible", value: "accessible", icon: Accessibility },
];

export default function CarePage() {
  usePageTitle("Book a Carer");
  const searchParams = new URLSearchParams(window.location.search);
  const initialQuery = searchParams.get("q") || "";
  const [search, setSearch] = useState(initialQuery);
  const [activeFilter, setActiveFilter] = useState("all");

  const { data: workers, isLoading, isError, refetch } = useQuery<(Worker & { user?: User })[]>({
    queryKey: ["/api/workers"],
  });

  const filtered = workers?.filter((w) => {
    const matchesSearch =
      !search ||
      w.user?.fullName?.toLowerCase().includes(search.toLowerCase()) ||
      w.title?.toLowerCase().includes(search.toLowerCase()) ||
      w.specializations?.some((s) => s.toLowerCase().includes(search.toLowerCase())) ||
      w.user?.location?.toLowerCase().includes(search.toLowerCase());

    const matchesFilter =
      activeFilter === "all" ||
      (activeFilter === "verified" && w.ndisVerified) ||
      (activeFilter === "transport" && w.transportCapable) ||
      (activeFilter === "accessible" && w.wheelchairAccessible);

    return matchesSearch && matchesFilter;
  });

  return (
    <PageShell
      title="Book a Carer"
      description="Find NDIS verified support workers near you. Browse profiles, check qualifications, and book services with confidence."
      actions={
        <Link href="/shifts">
          <Button variant="outline" className="gap-2" data-testid="link-view-shifts">
            <CalendarDays className="w-4 h-4" /> View Shift Schedule
          </Button>
        </Link>
      }
    >
      <Card className="p-3 shadow-md">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search by name, skill, or location..."
              className="pl-10 rounded-full border-muted"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              data-testid="input-search-workers"
            />
          </div>
          <Button variant="secondary" className="gap-2 rounded-full" data-testid="button-filters">
            <SlidersHorizontal className="w-4 h-4" /> Filters
          </Button>
        </div>
      </Card>

      <div className="flex flex-wrap">
        <Card className="inline-flex flex-wrap gap-1 p-1 shadow-sm">
          {filterTags.map((tag) => {
            const isActive = activeFilter === tag.value;
            const Icon = tag.icon;
            return (
              <Button
                key={tag.value}
                variant={isActive ? "default" : "ghost"}
                size="sm"
                className="gap-1.5 rounded-md"
                onClick={() => setActiveFilter(tag.value)}
                data-testid={`button-filter-${tag.value}`}
              >
                <Icon className="w-3.5 h-3.5" />
                {tag.label}
              </Button>
            );
          })}
        </Card>
      </div>

      <div className="flex items-center gap-4 text-xs text-muted-foreground flex-wrap">
        <span className="flex items-center gap-1">
          <ShieldCheck className="w-3.5 h-3.5 text-brand-teal" /> NDIS Verified
        </span>
        <span className="flex items-center gap-1">
          <Car className="w-3.5 h-3.5" /> Transport Available
        </span>
        <span className="flex items-center gap-1">
          <Accessibility className="w-3.5 h-3.5" /> Wheelchair Accessible
        </span>
        <span className="flex items-center gap-1">
          <Globe className="w-3.5 h-3.5" /> Multilingual
        </span>
      </div>

      {isError ? (
        <EmptyState
          icon={AlertCircle}
          tone="error"
          title="Something went wrong"
          description="We couldn't load the data. Please try again."
          action={<Button onClick={() => refetch()} data-testid="button-retry">Try Again</Button>}
        />
      ) : isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Card key={i} className="p-4">
              <Skeleton className="h-44 w-full rounded-md mb-4" />
              <Skeleton className="h-5 w-3/4 mb-2" />
              <Skeleton className="h-4 w-1/2 mb-2" />
              <Skeleton className="h-3 w-full mb-2" />
              <Skeleton className="h-8 w-full mt-4" />
            </Card>
          ))}
        </div>
      ) : filtered?.length === 0 ? (
        <EmptyState
          icon={Search}
          title="No workers found"
          description="Try adjusting your search or filters"
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filtered?.map((worker) => (
            <WorkerCard key={worker.id} worker={worker} />
          ))}
        </div>
      )}

      <div className="text-center text-xs text-muted-foreground pt-4">
        Showing {filtered?.length || 0} of {workers?.length || 0} support workers
      </div>
    </PageShell>
  );
}
