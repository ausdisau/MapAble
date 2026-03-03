import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MapPin, Clock, DollarSign } from "lucide-react";
import type { Job } from "@shared/schema";
import { Link } from "wouter";

interface JobCardProps {
  job: Job;
}

const categoryColors: Record<string, string> = {
  care: "bg-blue-100 dark:bg-blue-950/50 text-blue-800 dark:text-blue-300",
  transport: "bg-emerald-100 dark:bg-emerald-950/50 text-emerald-800 dark:text-emerald-300",
  employment: "bg-violet-100 dark:bg-violet-950/50 text-violet-800 dark:text-violet-300",
  support: "bg-amber-100 dark:bg-amber-950/50 text-amber-800 dark:text-amber-300",
};

export function JobCard({ job }: JobCardProps) {
  const colorClass = categoryColors[job.category.toLowerCase()] || categoryColors.support;

  return (
    <Card className="flex flex-col p-4 gap-3 hover-elevate">
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <h3 className="font-bold text-base truncate" data-testid={`text-job-title-${job.id}`}>
            {job.title}
          </h3>
          <div className="flex items-center gap-3 mt-1 text-sm text-muted-foreground">
            <span className="flex items-center gap-1">
              <MapPin className="w-3 h-3" /> {job.location}
            </span>
            <span className="flex items-center gap-1">
              <Clock className="w-3 h-3" /> {job.jobType}
            </span>
          </div>
        </div>
        <Badge className={colorClass}>{job.category}</Badge>
      </div>

      <p className="text-sm text-muted-foreground line-clamp-2">{job.description}</p>

      {job.salary && (
        <div className="flex items-center gap-1 text-sm font-semibold">
          <DollarSign className="w-3 h-3 text-muted-foreground" />
          {job.salary}
        </div>
      )}

      <div className="flex flex-wrap gap-1.5">
        {job.requirements?.slice(0, 3).map((req, i) => (
          <Badge key={i} variant="secondary" className="text-xs">
            {req}
          </Badge>
        ))}
      </div>

      <div className="flex gap-2 mt-auto pt-1">
        <Link href={`/jobs/${job.id}`} className="flex-1">
          <Button className="w-full" size="sm" data-testid={`button-view-job-${job.id}`}>
            View Details
          </Button>
        </Link>
      </div>
    </Card>
  );
}
