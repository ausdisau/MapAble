import { useQuery } from "@tanstack/react-query";
import { WorkerCard } from "@/components/worker-card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Card } from "@/components/ui/card";
import { Search, SlidersHorizontal, ShieldCheck, Car, Accessibility, Globe } from "lucide-react";
import { useState } from "react";
import type { Worker, User } from "@shared/schema";

const filterTags = [
  { label: "All", value: "all" },
  { label: "Verified", value: "verified" },
  { label: "Transport", value: "transport" },
  { label: "Wheelchair Accessible", value: "accessible" },
];

export default function CarePage() {
  const [search, setSearch] = useState("");
  const [activeFilter, setActiveFilter] = useState("all");

  const { data: workers, isLoading } = useQuery<(Worker & { user?: User })[]>({
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
    <div className="p-4 md:p-6 max-w-7xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-black tracking-tight" data-testid="text-page-title">Book a Carer</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Find NDIS verified support workers near you
        </p>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search by name, skill, or location..."
            className="pl-9"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            data-testid="input-search-workers"
          />
        </div>
        <Button variant="secondary" className="gap-2" data-testid="button-filters">
          <SlidersHorizontal className="w-4 h-4" /> Filters
        </Button>
      </div>

      <div className="flex flex-wrap gap-2">
        {filterTags.map((tag) => (
          <Badge
            key={tag.value}
            variant={activeFilter === tag.value ? "default" : "secondary"}
            className="cursor-pointer"
            onClick={() => setActiveFilter(tag.value)}
            data-testid={`button-filter-${tag.value}`}
          >
            {tag.label}
          </Badge>
        ))}
      </div>

      <div className="flex items-center gap-4 text-xs text-muted-foreground flex-wrap">
        <span className="flex items-center gap-1">
          <ShieldCheck className="w-3 h-3 text-emerald-500" /> NDIS Verified
        </span>
        <span className="flex items-center gap-1">
          <Car className="w-3 h-3" /> Transport Available
        </span>
        <span className="flex items-center gap-1">
          <Accessibility className="w-3 h-3" /> Wheelchair Accessible
        </span>
        <span className="flex items-center gap-1">
          <Globe className="w-3 h-3" /> Multilingual
        </span>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Card key={i} className="p-4">
              <Skeleton className="h-40 w-full rounded-md mb-4" />
              <Skeleton className="h-4 w-3/4 mb-2" />
              <Skeleton className="h-3 w-1/2 mb-2" />
              <Skeleton className="h-8 w-full mt-4" />
            </Card>
          ))}
        </div>
      ) : filtered?.length === 0 ? (
        <Card className="p-12 text-center">
          <Search className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-40" />
          <h3 className="font-bold text-lg mb-1">No workers found</h3>
          <p className="text-sm text-muted-foreground">
            Try adjusting your search or filters
          </p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered?.map((worker) => (
            <WorkerCard key={worker.id} worker={worker} />
          ))}
        </div>
      )}

      <div className="text-center text-xs text-muted-foreground pt-4">
        Showing {filtered?.length || 0} of {workers?.length || 0} support workers
      </div>
    </div>
  );
}
