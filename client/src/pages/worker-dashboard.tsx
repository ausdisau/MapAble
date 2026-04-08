import { useQuery } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { usePageTitle } from "@/hooks/use-page-title";
import { useAuth } from "@/hooks/use-auth";
import {
  CalendarDays,
  Clock,
  Star,
  AlertTriangle,
  CheckCircle2,
  Play,
  DollarSign,
  Users,
  ClipboardList,
  ArrowRight,
  ShieldCheck,
  TrendingUp,
  Timer,
  Briefcase,
} from "lucide-react";
import { Link, Redirect } from "wouter";
import { useState, useEffect } from "react";
import type { Shift } from "@shared/schema";

interface DashboardData {
  worker: {
    id: string;
    title: string;
    hourlyRate: string | null;
    ndisVerified: boolean;
    rating: string;
    reviewCount: number;
    specializations: string[] | null;
    insuranceExpiry: string | null;
  };
  user: { id: string; fullName: string; email: string; role: string };
  todayShifts: Shift[];
  upcomingShifts: Shift[];
  activeShift: Shift | null;
  completedCount: number;
  totalShifts: number;
  pendingBookings: number;
  activeBookingsCount: number;
  monthHours: number;
  monthEarnings: number;
  rating: string;
  reviewCount: number;
  recentReviews: { id: string; rating: number; comment: string | null; createdAt: string; participant?: { fullName: string } }[];
  complianceAlerts: string[];
}

const STATUS_COLORS: Record<string, string> = {
  scheduled: "bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300",
  confirmed: "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300",
  in_progress: "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300",
  completed: "bg-green-100 text-green-800 dark:bg-green-950 dark:text-green-300",
  cancelled: "bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300",
};

function LiveTimer({ startTime }: { startTime: string }) {
  const [elapsed, setElapsed] = useState("");

  useEffect(() => {
    const parseStart = () => {
      const now = new Date();
      const [h, m] = startTime.split(":").map(Number);
      const start = new Date(now);
      start.setHours(h, m, 0, 0);
      return start;
    };

    const update = () => {
      const start = parseStart();
      const diff = Math.max(0, Date.now() - start.getTime());
      const hours = Math.floor(diff / 3600000);
      const mins = Math.floor((diff % 3600000) / 60000);
      const secs = Math.floor((diff % 60000) / 1000);
      setElapsed(`${hours.toString().padStart(2, "0")}:${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`);
    };

    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, [startTime]);

  return (
    <span className="font-mono text-lg font-bold text-[#2EAA6E]" data-testid="text-live-timer">{elapsed}</span>
  );
}

export default function WorkerDashboard() {
  usePageTitle("Worker Dashboard | MapAble");
  const { user } = useAuth();

  const { data, isLoading, error } = useQuery<DashboardData>({
    queryKey: ["/api/worker/dashboard"],
    enabled: user?.role === "carer",
    refetchInterval: 30000,
  });

  if (user && user.role !== "carer") {
    return <Redirect to="/" />;
  }

  if (isLoading) {
    return (
      <div className="p-6 space-y-6" data-testid="worker-dashboard-loading">
        <Skeleton className="h-12 w-64" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-28" />
          ))}
        </div>
        <Skeleton className="h-64" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="p-6" data-testid="worker-dashboard-error">
        <Card className="p-8 text-center">
          <AlertTriangle className="w-12 h-12 mx-auto text-amber-500 mb-4" />
          <h2 className="text-xl font-bold mb-2">Unable to load dashboard</h2>
          <p className="text-muted-foreground">Make sure you're logged in as a support worker.</p>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6" data-testid="worker-dashboard">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold" data-testid="text-worker-greeting">
            G'day, {data.user.fullName.split(" ")[0]}!
          </h1>
          <p className="text-muted-foreground mt-1">{data.worker.title}</p>
        </div>
        <div className="flex items-center gap-3">
          {data.worker.ndisVerified && (
            <Badge className="bg-[#2EAA6E]/10 text-[#2EAA6E] border-[#2EAA6E]/30 gap-1" data-testid="badge-ndis-verified">
              <ShieldCheck className="w-3.5 h-3.5" /> NDIS Verified
            </Badge>
          )}
          <Badge variant="outline" className="gap-1" data-testid="badge-rating">
            <Star className="w-3.5 h-3.5 fill-[#E6A817] text-[#E6A817]" />
            {Number(data.rating).toFixed(1)} ({data.reviewCount})
          </Badge>
        </div>
      </div>

      {data.complianceAlerts.length > 0 && (
        <Card className="border-amber-300 bg-amber-50 dark:bg-amber-950/30 dark:border-amber-700 p-4" data-testid="card-compliance-alerts">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400 mt-0.5 shrink-0" />
            <div>
              <h3 className="font-semibold text-amber-800 dark:text-amber-300 mb-1">Compliance Alerts</h3>
              <ul className="space-y-1">
                {data.complianceAlerts.map((alert, i) => (
                  <li key={i} className="text-sm text-amber-700 dark:text-amber-400">• {alert}</li>
                ))}
              </ul>
            </div>
          </div>
        </Card>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-5" data-testid="stat-month-hours">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-lg bg-[#1B6EB5]/10">
              <Clock className="w-5 h-5 text-[#1B6EB5]" />
            </div>
            <div>
              <p className="text-2xl font-bold">{data.monthHours}</p>
              <p className="text-xs text-muted-foreground">Hours This Month</p>
            </div>
          </div>
        </Card>

        <Card className="p-5" data-testid="stat-month-earnings">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-lg bg-[#2EAA6E]/10">
              <DollarSign className="w-5 h-5 text-[#2EAA6E]" />
            </div>
            <div>
              <p className="text-2xl font-bold">${data.monthEarnings.toFixed(2)}</p>
              <p className="text-xs text-muted-foreground">Earnings This Month</p>
            </div>
          </div>
        </Card>

        <Card className="p-5" data-testid="stat-active-bookings">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-lg bg-[#E6A817]/10">
              <Briefcase className="w-5 h-5 text-[#E6A817]" />
            </div>
            <div>
              <p className="text-2xl font-bold">{data.activeBookingsCount}</p>
              <p className="text-xs text-muted-foreground">Active Bookings</p>
            </div>
          </div>
        </Card>

        <Card className="p-5" data-testid="stat-pending-bookings">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-lg bg-purple-500/10">
              <ClipboardList className="w-5 h-5 text-purple-500" />
            </div>
            <div>
              <p className="text-2xl font-bold">{data.pendingBookings}</p>
              <p className="text-xs text-muted-foreground">Pending Bookings</p>
            </div>
          </div>
        </Card>
      </div>

      {data.activeShift && (
        <Card className="border-[#2EAA6E] bg-[#2EAA6E]/5 p-5" data-testid="card-active-shift">
          <div className="flex items-center gap-3 mb-3">
            <Play className="w-5 h-5 text-[#2EAA6E]" />
            <h3 className="font-semibold text-[#2EAA6E]">Active Shift</h3>
            <Badge className="bg-[#2EAA6E]/20 text-[#2EAA6E] border-[#2EAA6E]/30 gap-1 animate-pulse">
              <Timer className="w-3 h-3" /> Live
            </Badge>
          </div>
          <div className="flex flex-col sm:flex-row sm:items-center gap-4">
            <div className="flex-1">
              <div className="flex items-center gap-4 mb-2">
                <p className="font-medium">Started at {data.activeShift.startTime}</p>
                <LiveTimer startTime={data.activeShift.startTime} />
              </div>
              {data.activeShift.ndisGoal && (
                <p className="text-sm text-muted-foreground mt-1">Goal: {data.activeShift.ndisGoal}</p>
              )}
              {data.activeShift.notes && (
                <p className="text-sm text-muted-foreground mt-1">{data.activeShift.notes}</p>
              )}
            </div>
            <Link href="/worker/shifts">
              <Button size="sm" data-testid="button-view-active-shift">Manage Shift</Button>
            </Link>
          </div>
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="p-5" data-testid="card-today-shifts">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold flex items-center gap-2">
              <CalendarDays className="w-4 h-4 text-[#1B6EB5]" /> Today's Schedule ({data.todayShifts.length})
            </h3>
            <Link href="/worker/shifts">
              <Button variant="ghost" size="sm" className="text-[#1B6EB5] gap-1" data-testid="link-all-shifts">
                View All <ArrowRight className="w-3.5 h-3.5" />
              </Button>
            </Link>
          </div>
          {data.todayShifts.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-6">No shifts scheduled for today.</p>
          ) : (
            <div className="space-y-3">
              {data.todayShifts.map((shift) => (
                <div key={shift.id} className="flex items-center justify-between py-2 border-b last:border-b-0" data-testid={`shift-today-${shift.id}`}>
                  <div>
                    <p className="text-sm font-medium">{shift.startTime} – {shift.endTime}</p>
                    {shift.ndisGoal && <p className="text-xs text-muted-foreground">{shift.ndisGoal}</p>}
                  </div>
                  <Badge className={STATUS_COLORS[shift.status] || ""}>{shift.status.replace("_", " ")}</Badge>
                </div>
              ))}
            </div>
          )}
        </Card>

        <Card className="p-5" data-testid="card-upcoming-shifts">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold flex items-center gap-2">
              <Clock className="w-4 h-4 text-[#1B6EB5]" /> Upcoming Shifts
            </h3>
          </div>
          {data.upcomingShifts.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-6">No upcoming shifts scheduled.</p>
          ) : (
            <div className="space-y-3">
              {data.upcomingShifts.map((shift) => (
                <div key={shift.id} className="flex items-center justify-between py-2 border-b last:border-b-0" data-testid={`shift-upcoming-${shift.id}`}>
                  <div>
                    <p className="text-sm font-medium">{shift.date}</p>
                    <p className="text-xs text-muted-foreground">{shift.startTime} – {shift.endTime}</p>
                  </div>
                  <Badge className={STATUS_COLORS[shift.status] || ""}>{shift.status.replace("_", " ")}</Badge>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>

      <Card className="p-5" data-testid="card-recent-reviews">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold flex items-center gap-2">
            <Star className="w-4 h-4 text-[#E6A817]" /> Recent Reviews
          </h3>
          <div className="flex items-center gap-1 text-sm font-medium">
            <TrendingUp className="w-3.5 h-3.5 text-[#2EAA6E]" />
            {Number(data.rating).toFixed(1)} avg
          </div>
        </div>
        {data.recentReviews.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-6">No reviews yet.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {data.recentReviews.map((review) => (
              <div key={review.id} className="p-3 rounded-lg bg-muted/50" data-testid={`review-${review.id}`}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-medium">{review.participant?.fullName || "Participant"}</span>
                  <div className="flex items-center gap-0.5">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star key={i} className={`w-3 h-3 ${i < review.rating ? "fill-[#E6A817] text-[#E6A817]" : "text-gray-300"}`} />
                    ))}
                  </div>
                </div>
                {review.comment && <p className="text-xs text-muted-foreground">{review.comment}</p>}
              </div>
            ))}
          </div>
        )}
      </Card>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Link href="/worker/bookings">
          <Card className="p-5 hover:shadow-md transition-shadow cursor-pointer group" data-testid="link-card-bookings">
            <div className="flex items-center gap-3">
              <Users className="w-5 h-5 text-[#1B6EB5] group-hover:scale-110 transition-transform" />
              <div>
                <p className="font-semibold">Bookings</p>
                <p className="text-xs text-muted-foreground">Accept & manage requests</p>
              </div>
            </div>
          </Card>
        </Link>
        <Link href="/worker/profile">
          <Card className="p-5 hover:shadow-md transition-shadow cursor-pointer group" data-testid="link-card-profile">
            <div className="flex items-center gap-3">
              <ShieldCheck className="w-5 h-5 text-[#2EAA6E] group-hover:scale-110 transition-transform" />
              <div>
                <p className="font-semibold">Profile</p>
                <p className="text-xs text-muted-foreground">Update your details</p>
              </div>
            </div>
          </Card>
        </Link>
        <Link href="/worker/availability">
          <Card className="p-5 hover:shadow-md transition-shadow cursor-pointer group" data-testid="link-card-availability">
            <div className="flex items-center gap-3">
              <CalendarDays className="w-5 h-5 text-[#E6A817] group-hover:scale-110 transition-transform" />
              <div>
                <p className="font-semibold">Availability</p>
                <p className="text-xs text-muted-foreground">Set your schedule</p>
              </div>
            </div>
          </Card>
        </Link>
      </div>
    </div>
  );
}
