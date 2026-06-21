import { useQuery } from "@tanstack/react-query";
import { JobCard } from "@/components/job-card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Card } from "@/components/ui/card";
import { PageShell } from "@/components/layout/PageShell";
import { EmptyState } from "@/components/layout/EmptyState";
import { Search, SlidersHorizontal, Briefcase, AlertCircle } from "lucide-react";
import { useState } from "react";
import { usePageTitle } from "@/hooks/use-page-title";
import type { Job } from "@shared/schema";

const categoryFilters = [
  { label: "All", value: "all" },
  { label: "Care", value: "care" },
  { label: "Transport", value: "transport" },
  { label: "Support", value: "support" },
  { label: "Employment", value: "employment" },
];

export default function JobsPage() {
  usePageTitle("Find a Job");
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState("all");

  const { data: jobs, isLoading, isError, refetch } = useQuery<Job[]>({
    queryKey: ["/api/jobs"],
  });

  const filtered = jobs?.filter((j) => {
    const matchesSearch =
      !search ||
      j.title.toLowerCase().includes(search.toLowerCase()) ||
      j.description.toLowerCase().includes(search.toLowerCase()) ||
      j.location.toLowerCase().includes(search.toLowerCase());

    const matchesCategory =
      activeCategory === "all" ||
      j.category.toLowerCase() === activeCategory.toLowerCase();

    return matchesSearch && matchesCategory;
  });

  return (
    <PageShell
      title="Find a Job"
      description="Discover employment opportunities in disability support services"
      actions={
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Briefcase className="w-4 h-4" />
          <span>{jobs?.length || 0} opportunities</span>
        </div>
      }
    >
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search jobs by title, location, or keyword..."
            className="pl-9"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            data-testid="input-search-jobs"
          />
        </div>
        <Button variant="secondary" className="gap-2" data-testid="button-job-filters">
          <SlidersHorizontal className="w-4 h-4" /> Filters
        </Button>
      </div>

      <Card className="p-1.5 flex flex-wrap gap-1">
        {categoryFilters.map((cat) => (
          <Button
            key={cat.value}
            variant={activeCategory === cat.value ? "default" : "ghost"}
            size="sm"
            onClick={() => setActiveCategory(cat.value)}
            data-testid={`button-category-${cat.value}`}
          >
            {cat.label}
          </Button>
        ))}
      </Card>

      {isError ? (
        <EmptyState
          icon={AlertCircle}
          tone="error"
          title="Something went wrong"
          description="We couldn't load the data. Please try again."
          action={<Button onClick={() => refetch()} data-testid="button-retry">Try Again</Button>}
        />
      ) : isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i} className="p-4">
              <Skeleton className="h-4 w-3/4 mb-2" />
              <Skeleton className="h-3 w-1/2 mb-4" />
              <Skeleton className="h-3 w-full mb-2" />
              <Skeleton className="h-8 w-full mt-4" />
            </Card>
          ))}
        </div>
      ) : filtered?.length === 0 ? (
        <EmptyState
          icon={Briefcase}
          title="No jobs found"
          description="Try adjusting your search or category filter"
          action={
            <Button
              variant="secondary"
              onClick={() => { setSearch(""); setActiveCategory("all"); }}
              data-testid="button-clear-filters"
            >
              Clear Filters
            </Button>
          }
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filtered?.map((job) => (
            <JobCard key={job.id} job={job} />
          ))}
        </div>
      )}

      <div className="text-center text-xs text-muted-foreground pt-4">
        Showing {filtered?.length || 0} of {jobs?.length || 0} jobs
      </div>
    </PageShell>
  );
}
