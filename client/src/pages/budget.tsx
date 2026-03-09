import { useQuery } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertTriangle, Wallet, TrendingUp, Clock, Car, GraduationCap, DollarSign } from "lucide-react";
import type { ParticipantBudget, ServiceSession, TransportTrip, User } from "@shared/schema";

interface BudgetResponse {
  budgets: ParticipantBudget[];
  currentCareTier: { tier: string; rate: number; hoursUsed: number };
  currentTransportTier: { tier: string; rate: number; kmUsed: number };
}

const categoryLabels: Record<string, { label: string; icon: typeof Clock }> = {
  daily_living: { label: "Daily Living", icon: Clock },
  transport: { label: "Transport", icon: Car },
  capacity_building: { label: "Capacity Building", icon: GraduationCap },
};

function BudgetCard({ budget }: { budget: ParticipantBudget }) {
  const allocated = Number(budget.totalAllocated);
  const used = Number(budget.totalUsed);
  const remaining = allocated - used;
  const percentage = allocated > 0 ? (used / allocated) * 100 : 0;

  const barColor = percentage > 80 ? "bg-red-500" : percentage > 60 ? "bg-amber-500" : "bg-[#2EAA6E]";
  const cat = categoryLabels[budget.category] || { label: budget.category, icon: Wallet };
  const CatIcon = cat.icon;

  return (
    <Card className="p-5" data-testid={`card-budget-${budget.category}`}>
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-md bg-primary/10 flex items-center justify-center">
            <CatIcon className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h3 className="font-bold text-sm">{cat.label}</h3>
            <p className="text-xs text-muted-foreground">{budget.periodStart} to {budget.periodEnd}</p>
          </div>
        </div>
        {percentage > 80 && (
          <Badge variant="destructive" className="gap-1 text-[10px]">
            <AlertTriangle className="w-3 h-3" /> Low Budget
          </Badge>
        )}
      </div>

      <div className="space-y-2">
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">Used</span>
          <span className="font-bold">${used.toLocaleString("en-AU", { minimumFractionDigits: 2 })}</span>
        </div>
        <div className="w-full h-3 bg-muted rounded-full overflow-hidden" role="progressbar" aria-valuenow={percentage} aria-valuemin={0} aria-valuemax={100} aria-label={`${cat.label} budget: ${percentage.toFixed(0)}% used`}>
          <div className={`h-full rounded-full transition-all ${barColor}`} style={{ width: `${Math.min(percentage, 100)}%` }} />
        </div>
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>{percentage.toFixed(1)}% used</span>
          <span>${remaining.toLocaleString("en-AU", { minimumFractionDigits: 2 })} remaining</span>
        </div>
        <div className="text-xs text-muted-foreground pt-1">
          Total allocated: <span className="font-semibold text-foreground">${allocated.toLocaleString("en-AU", { minimumFractionDigits: 2 })}</span>
        </div>
      </div>
    </Card>
  );
}

function TierIndicator({ label, tier, rate, usage, unit }: { label: string; tier: string; rate: number; usage: number; unit: string }) {
  return (
    <Card className="p-5" data-testid={`card-tier-${label.toLowerCase().replace(/\s/g, "-")}`}>
      <div className="flex items-center gap-2 mb-2">
        <TrendingUp className="w-4 h-4 text-[#E6A817]" />
        <h3 className="font-bold text-sm">{label}</h3>
      </div>
      <div className="flex items-baseline gap-2">
        <span className="text-2xl font-black" style={{ color: "#E6A817" }}>${rate.toFixed(2)}</span>
        <span className="text-sm text-muted-foreground">/{unit === "hours" ? "hr" : "km"}</span>
      </div>
      <Badge variant="secondary" className="mt-2 text-xs">{tier}</Badge>
      <p className="text-xs text-muted-foreground mt-2">
        {usage.toFixed(1)} {unit} this month
      </p>
    </Card>
  );
}

export default function BudgetPage() {
  const { data: me } = useQuery<User>({ queryKey: ["/api/me"] });

  const { data: budgetData, isLoading: budgetLoading } = useQuery<BudgetResponse>({
    queryKey: ["/api/budget", me?.id],
    queryFn: async () => {
      const res = await fetch(`/api/budget?participantId=${me?.id}`);
      if (!res.ok) throw new Error("Failed to fetch budget");
      return res.json();
    },
    enabled: !!me?.id,
  });

  const { data: sessions } = useQuery<ServiceSession[]>({
    queryKey: ["/api/sessions", me?.id],
    queryFn: async () => {
      const res = await fetch(`/api/sessions?participantId=${me?.id}`);
      if (!res.ok) throw new Error("Failed to fetch sessions");
      return res.json();
    },
    enabled: !!me?.id,
  });

  const { data: trips } = useQuery<TransportTrip[]>({
    queryKey: ["/api/trips", me?.id],
    queryFn: async () => {
      const res = await fetch(`/api/trips?participantId=${me?.id}`);
      if (!res.ok) throw new Error("Failed to fetch trips");
      return res.json();
    },
    enabled: !!me?.id,
  });

  if (budgetLoading || !me) {
    return (
      <div className="p-4 md:p-6 max-w-7xl mx-auto space-y-6">
        <Skeleton className="h-8 w-64" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => <Card key={i} className="p-5"><Skeleton className="h-32 w-full" /></Card>)}
        </div>
      </div>
    );
  }

  const hasLowBudget = budgetData?.budgets.some((b) => {
    const pct = Number(b.totalAllocated) > 0 ? (Number(b.totalUsed) / Number(b.totalAllocated)) * 100 : 0;
    return pct > 80;
  });

  return (
    <div className="p-4 md:p-6 max-w-7xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-black tracking-tight" data-testid="text-page-title">Budget Dashboard</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Track your NDIS plan budget across all categories
        </p>
      </div>

      {hasLowBudget && (
        <div className="bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 rounded-md p-4 flex items-start gap-3" role="alert" aria-live="polite" data-testid="alert-low-budget">
          <AlertTriangle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="font-bold text-sm text-red-800 dark:text-red-300">Budget Alert</h3>
            <p className="text-xs text-red-700 dark:text-red-400 mt-0.5">
              One or more budget categories have exceeded 80% usage. Contact your support coordinator to review your plan.
            </p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {budgetData?.budgets.map((b) => (
          <BudgetCard key={b.id} budget={b} />
        ))}
      </div>

      {budgetData && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <TierIndicator
            label="Current Care Rate"
            tier={budgetData.currentCareTier.tier}
            rate={budgetData.currentCareTier.rate}
            usage={budgetData.currentCareTier.hoursUsed}
            unit="hours"
          />
          <TierIndicator
            label="Current Transport Rate"
            tier={budgetData.currentTransportTier.tier}
            rate={budgetData.currentTransportTier.rate}
            usage={budgetData.currentTransportTier.kmUsed}
            unit="km"
          />
        </div>
      )}

      <Card className="overflow-hidden">
        <div className="bg-gradient-to-r from-[#14578F] via-[#1B6EB5] to-[#2384C9] px-6 py-4">
          <h2 className="text-lg font-black text-white flex items-center gap-2">
            <DollarSign className="w-5 h-5" /> Recent Activity
          </h2>
        </div>
        <div className="divide-y">
          {sessions?.slice(0, 5).map((s) => (
            <div key={s.id} className="px-6 py-3 flex items-center justify-between text-sm" data-testid={`row-session-${s.id}`}>
              <div>
                <span className="font-medium">Care Session</span>
                <span className="text-muted-foreground ml-2">{s.date}</span>
                <Badge variant="secondary" className="ml-2 text-[10px]">{s.tierApplied}</Badge>
              </div>
              <div className="text-right">
                <span className="font-bold">${Number(s.totalCharge || 0).toFixed(2)}</span>
                <span className="text-xs text-muted-foreground ml-1">({s.actualHours}hrs @ ${Number(s.hourlyRate || 0).toFixed(2)}/hr)</span>
              </div>
            </div>
          ))}
          {trips?.slice(0, 5).map((t) => (
            <div key={t.id} className="px-6 py-3 flex items-center justify-between text-sm" data-testid={`row-trip-${t.id}`}>
              <div>
                <span className="font-medium">Transport Trip</span>
                <span className="text-muted-foreground ml-2">{t.date}</span>
                <Badge variant="secondary" className="ml-2 text-[10px]">{t.tierApplied}</Badge>
              </div>
              <div className="text-right">
                <span className="font-bold">${Number(t.totalCharge || 0).toFixed(2)}</span>
                <span className="text-xs text-muted-foreground ml-1">({t.distanceKm}km @ ${Number(t.perKmRate || 0).toFixed(2)}/km)</span>
              </div>
            </div>
          ))}
          {(!sessions?.length && !trips?.length) && (
            <div className="px-6 py-8 text-center text-sm text-muted-foreground">No recent activity</div>
          )}
        </div>
      </Card>
    </div>
  );
}
