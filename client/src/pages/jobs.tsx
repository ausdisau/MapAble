import { useQuery } from "@tanstack/react-query";
import { JobCard } from "@/components/job-card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Card } from "@/components/ui/card";
import { Search, SlidersHorizontal, Briefcase } from "lucide-react";
import { useState } from "react";
import type { Job } from "@shared/schema";

const categoryFilters = [
  { label: "All", value: "all" },
  { label: "Care", value: "care" },
  { label: "Transport", value: "transport" },
  { label: "Support", value: "support" },
  { label: "Employment", value: "employment" },
];

export default function JobsPage() {
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState("all");

  const { data: jobs, isLoading } = useQuery<Job[]>({
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
    <div className="p-4 md:p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-black tracking-tight" data-testid="text-page-title">Find a Job</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Discover employment opportunities in disability support services
          </p>
        </div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Briefcase className="w-4 h-4" />
          <span>{jobs?.length || 0} opportunities</span>
        </div>
      </div>

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

      {isLoading ? (
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
        <Card className="p-12 text-center">
          <Briefcase className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-40" />
          <h3 className="font-bold text-lg mb-1">No jobs found</h3>
          <p className="text-sm text-muted-foreground">
            Try adjusting your search or category filter
          </p>
        </Card>
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
    </div>
  );
}
