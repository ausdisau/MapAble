import { useQuery } from "@tanstack/react-query";
import { useParams } from "wouter";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import {
  MapPin,
  Clock,
  DollarSign,
  ArrowLeft,
  Briefcase,
  CheckCircle2,
  Send,
  Bookmark,
} from "lucide-react";
import { Link } from "wouter";
import { usePageTitle } from "@/hooks/use-page-title";
import { useAuth } from "@/hooks/use-auth";
import { JobCoverageNotice } from "@/features/geo/JobCoverageNotice";
import type { Job } from "@shared/schema";

export default function JobDetailPage() {
  const params = useParams<{ id: string }>();
  const { user } = useAuth();

  const { data: job, isLoading } = useQuery<Job>({
    queryKey: ["/api/jobs", params.id],
  });

  usePageTitle(job?.title ? `${job.title} | Find a Job` : "Job Detail");

  if (isLoading) {
    return (
      <div className="p-4 md:p-6 max-w-4xl mx-auto space-y-6">
        <Skeleton className="h-8 w-48" />
        <Card className="p-6">
          <Skeleton className="h-6 w-3/4 mb-4" />
          <Skeleton className="h-4 w-1/2 mb-2" />
          <Skeleton className="h-20 w-full" />
        </Card>
      </div>
    );
  }

  if (!job) {
    return (
      <div className="p-4 md:p-6 max-w-4xl mx-auto text-center py-20">
        <h2 className="text-xl font-bold mb-2">Job not found</h2>
        <Link href="/jobs">
          <Button variant="secondary" data-testid="button-back-to-jobs">Back to Jobs</Button>
        </Link>
      </div>
    );
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

  const colors = categoryColors[job.category.toLowerCase()] || categoryColors.support;

  return (
    <div className="p-4 md:p-6 max-w-4xl mx-auto space-y-6">
      <Link href="/jobs">
        <Button variant="ghost" size="sm" className="gap-1" data-testid="button-back">
          <ArrowLeft className="w-4 h-4" /> Back to Jobs
        </Button>
      </Link>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          <Card>
            <div className={`h-2 rounded-t-md ${colors.accent}`} />
            <div className="p-6">
              <div className="flex items-start justify-between gap-3 flex-wrap">
                <div>
                  <h1 className="text-2xl font-black tracking-tight" data-testid="text-job-title">
                    {job.title}
                  </h1>
                  <div className="flex items-center gap-3 mt-2 text-sm text-muted-foreground flex-wrap">
                    <span className="flex items-center gap-1">
                      <MapPin className="w-3 h-3" /> {job.location}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" /> {job.jobType}
                    </span>
                    {job.salary && (
                      <span className="flex items-center gap-1">
                        <DollarSign className="w-3 h-3" /> {job.salary}
                      </span>
                    )}
                  </div>
                </div>
                <Badge className={colors.badge}>{job.category}</Badge>
              </div>

              <Separator className="my-4" />

              <div>
                <h3 className="font-bold text-sm mb-2">Description</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{job.description}</p>
              </div>

              {job.requirements && job.requirements.length > 0 && (
                <>
                  <Separator className="my-4" />
                  <div>
                    <h3 className="font-bold text-sm mb-3">Requirements</h3>
                    <div className="space-y-2">
                      {job.requirements.map((req, i) => (
                        <div key={i} className="flex items-center gap-2 text-sm">
                          <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                          <span>{req}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              )}
            </div>
          </Card>
        </div>

        <div className="space-y-4">
          <Card className="p-5">
            <h3 className="font-bold text-sm mb-3">Job Summary</h3>
            <div className="space-y-3 text-sm">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-full bg-blue-100 dark:bg-blue-950/40 flex items-center justify-center flex-shrink-0">
                  <Briefcase className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                </div>
                <span>{job.jobType}</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-full bg-emerald-100 dark:bg-emerald-950/40 flex items-center justify-center flex-shrink-0">
                  <MapPin className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                </div>
                <span>{job.location}</span>
              </div>
              {job.salary && (
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-full bg-amber-100 dark:bg-amber-950/40 flex items-center justify-center flex-shrink-0">
                    <DollarSign className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                  </div>
                  <span>{job.salary}</span>
                </div>
              )}
            </div>
          </Card>

          {user?.role === "carer" && (
            <JobCoverageNotice location={job.location} />
          )}

          <Button className="w-full gap-2" data-testid="button-apply-job">
            <Send className="w-4 h-4" /> Apply Now
          </Button>
          <Button variant="secondary" className="w-full gap-2" data-testid="button-save-job">
            <Bookmark className="w-4 h-4" /> Save Job
          </Button>
        </div>
      </div>
    </div>
  );
}
