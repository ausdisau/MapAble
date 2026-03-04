import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MapPin, Clock, DollarSign, ArrowRight } from "lucide-react";
import type { Job } from "@shared/schema";
import { Link } from "wouter";

interface JobCardProps {
  job: Job;
}

const categoryColors: Record<string, { badge: string; accent: string }> = {
  care: {
    badge: "bg-blue-100 dark:bg-blue-950/50 text-blue-800 dark:text-blue-300",
    accent: "bg-blue-500",
  },
  transport: {
    badge: "bg-emerald-100 dark:bg-emerald-950/50 text-emerald-800 dark:text-emerald-300",
    accent: "bg-emerald-500",
  },
  employment: {
    badge: "bg-violet-100 dark:bg-violet-950/50 text-violet-800 dark:text-violet-300",
    accent: "bg-violet-500",
  },
  support: {
    badge: "bg-amber-100 dark:bg-amber-950/50 text-amber-800 dark:text-amber-300",
    accent: "bg-amber-500",
  },
};

export function JobCard({ job }: JobCardProps) {
  const colors = categoryColors[job.category.toLowerCase()] || categoryColors.support;

  return (
    <Card className="flex flex-row hover-elevate">
      <div className={`w-1.5 rounded-l-md flex-shrink-0 ${colors.accent}`} />
      <div className="flex flex-col flex-1 p-4 gap-3 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <h3 className="font-black text-lg truncate" data-testid={`text-job-title-${job.id}`}>
              {job.title}
            </h3>
            <div className="flex items-center gap-3 mt-1 text-sm text-muted-foreground flex-wrap">
              <span className="flex items-center gap-1">
                <MapPin className="w-3 h-3" /> {job.location}
              </span>
              <span className="flex items-center gap-1">
                <Clock className="w-3 h-3" /> {job.jobType}
              </span>
            </div>
          </div>
          <Badge className={colors.badge}>{job.category}</Badge>
        </div>

        <p className="text-sm text-muted-foreground line-clamp-2">{job.description}</p>

        {job.salary && (
          <div className="flex items-center gap-1 text-sm font-semibold">
            <DollarSign className="w-3.5 h-3.5 text-emerald-500" />
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
            <Button className="w-full gap-1" size="sm" data-testid={`button-view-job-${job.id}`}>
              View Details <ArrowRight className="w-3 h-3" />
            </Button>
          </Link>
        </div>
      </div>
    </Card>
  );
}
