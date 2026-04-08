import { useQuery, useMutation } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { usePageTitle } from "@/hooks/use-page-title";
import { Redirect } from "wouter";
import {
  CalendarDays,
  Clock,
  CheckCircle2,
  Play,
  XCircle,
  DollarSign,
  TrendingUp,
  Download,
  Target,
  AlertTriangle,
  Filter,
  StopCircle,
} from "lucide-react";
import { useState } from "react";
import type { Shift } from "@shared/schema";

interface EarningsData {
  totalEarnings: string;
  completedShifts: number;
  totalShifts: number;
  hourlyRate: string | null;
  earningsByMonth: Record<string, number>;
}

const STATUS_COLORS: Record<string, string> = {
  scheduled: "bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300",
  confirmed: "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300",
  in_progress: "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300",
  completed: "bg-green-100 text-green-800 dark:bg-green-950 dark:text-green-300",
  cancelled: "bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300",
};

export default function WorkerShifts() {
  usePageTitle("My Shifts & Earnings | MapAble");
  const { toast } = useToast();
  const { user } = useAuth();

  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [endShiftId, setEndShiftId] = useState<string | null>(null);
  const [endShiftHours, setEndShiftHours] = useState("");
  const [endShiftNotes, setEndShiftNotes] = useState("");

  const { data: shifts, isLoading: shiftsLoading } = useQuery<Shift[]>({
    queryKey: ["/api/shifts"],
    enabled: user?.role === "carer",
  });

  const { data: earnings, isLoading: earningsLoading } = useQuery<EarningsData>({
    queryKey: ["/api/worker/earnings"],
    enabled: user?.role === "carer",
  });

  const statusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const res = await apiRequest("PATCH", `/api/shifts/${id}/status`, { status });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/shifts"] });
      queryClient.invalidateQueries({ queryKey: ["/api/worker/earnings"] });
      queryClient.invalidateQueries({ queryKey: ["/api/worker/dashboard"] });
      setEndShiftId(null);
      setEndShiftHours("");
      setEndShiftNotes("");
      toast({ title: "Shift updated", description: "Shift status has been updated." });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message || "Failed to update shift.", variant: "destructive" });
    },
  });

  if (user && user.role !== "carer") {
    return <Redirect to="/" />;
  }

  const applyFilters = (shiftList: Shift[]) => {
    let filtered = shiftList;
    if (dateFrom) filtered = filtered.filter(s => s.date >= dateFrom);
    if (dateTo) filtered = filtered.filter(s => s.date <= dateTo);
    if (statusFilter !== "all") filtered = filtered.filter(s => s.status === statusFilter);
    return filtered;
  };

  const handleExportCSV = () => {
    if (!shifts || shifts.length === 0) return;
    const filtered = applyFilters(shifts);
    const headers = ["Date", "Start Time", "End Time", "Hours", "Status", "Service Type", "NDIS Goal", "NDIS Category", "Notes"];
    const rows = filtered.map(s => {
      const startParts = s.startTime.split(":");
      const endParts = s.endTime.split(":");
      const startMins = parseInt(startParts[0]) * 60 + parseInt(startParts[1] || "0");
      const endMins = parseInt(endParts[0]) * 60 + parseInt(endParts[1] || "0");
      const hours = Math.max((endMins - startMins) / 60, 0.25);
      return [
        s.date, s.startTime, s.endTime, hours.toFixed(1), s.status,
        s.serviceType || "", s.ndisGoal || "", s.ndisCategory || "", s.notes || "",
      ];
    });
    const csv = [headers.join(","), ...rows.map(r => r.map(c => `"${c}"`).join(","))].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `shifts-export-${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleEndShift = (shiftId: string) => {
    const shift = shifts?.find(s => s.id === shiftId);
    if (!shift) return;
    const startParts = shift.startTime.split(":");
    const endParts = shift.endTime.split(":");
    const startMins = parseInt(startParts[0]) * 60 + parseInt(startParts[1] || "0");
    const endMins = parseInt(endParts[0]) * 60 + parseInt(endParts[1] || "0");
    const defaultHours = Math.max((endMins - startMins) / 60, 0.25);
    setEndShiftId(shiftId);
    setEndShiftHours(defaultHours.toFixed(1));
    setEndShiftNotes("");
  };

  const confirmEndShift = () => {
    if (!endShiftId || !endShiftHours) return;
    statusMutation.mutate({ id: endShiftId, status: "completed" });
  };

  const isLoading = shiftsLoading || earningsLoading;

  if (isLoading) {
    return (
      <div className="p-6 space-y-6" data-testid="worker-shifts-loading">
        <Skeleton className="h-10 w-48" />
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-24" />)}
        </div>
        <Skeleton className="h-64" />
      </div>
    );
  }

  const allShifts = shifts || [];
  const filteredShifts = applyFilters(allShifts);
  const today = new Date().toISOString().split("T")[0];
  const upcomingShifts = filteredShifts.filter(s => s.date >= today && s.status !== "cancelled" && s.status !== "completed");
  const completedShifts = filteredShifts.filter(s => s.status === "completed");
  const cancelledShifts = filteredShifts.filter(s => s.status === "cancelled");
  const activeShifts = filteredShifts.filter(s => s.status === "in_progress");

  const getShiftActions = (shift: Shift) => {
    const actions: { label: string; status: string; icon: typeof CheckCircle2; variant?: "default" | "outline" | "destructive"; handler?: () => void }[] = [];
    if (shift.status === "scheduled") {
      actions.push({ label: "Confirm", status: "confirmed", icon: CheckCircle2 });
      actions.push({ label: "Cancel", status: "cancelled", icon: XCircle, variant: "destructive" });
    } else if (shift.status === "confirmed") {
      actions.push({ label: "Start Shift", status: "in_progress", icon: Play });
      actions.push({ label: "Cancel", status: "cancelled", icon: XCircle, variant: "destructive" });
    } else if (shift.status === "in_progress") {
      actions.push({ label: "End Shift", status: "completed", icon: StopCircle, handler: () => handleEndShift(shift.id) });
    }
    return actions;
  };

  const renderShiftCard = (shift: Shift) => {
    const actions = getShiftActions(shift);
    const startParts = shift.startTime.split(":");
    const endParts = shift.endTime.split(":");
    const startMins = parseInt(startParts[0]) * 60 + parseInt(startParts[1] || "0");
    const endMins = parseInt(endParts[0]) * 60 + parseInt(endParts[1] || "0");
    const hours = Math.max((endMins - startMins) / 60, 0.25);

    return (
      <Card key={shift.id} className={`p-5 ${shift.status === "in_progress" ? "border-[#2EAA6E] bg-[#2EAA6E]/5" : ""}`} data-testid={`shift-card-${shift.id}`}>
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
          <div className="flex-1 space-y-2">
            <div className="flex items-center gap-2 flex-wrap">
              <Badge className={STATUS_COLORS[shift.status] || ""}>{shift.status.replace("_", " ")}</Badge>
              {shift.ndisCategory && <Badge variant="outline">{shift.ndisCategory}</Badge>}
              {shift.serviceType && <Badge variant="outline" className="text-xs">{shift.serviceType}</Badge>}
            </div>
            <div className="flex items-center gap-4 text-sm">
              <span className="flex items-center gap-1.5 font-medium">
                <CalendarDays className="w-3.5 h-3.5 text-muted-foreground" />
                {shift.date}
              </span>
              <span className="flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-muted-foreground" />
                {shift.startTime} – {shift.endTime} ({hours.toFixed(1)}h)
              </span>
            </div>
            {shift.ndisGoal && (
              <p className="text-sm flex items-center gap-1.5">
                <Target className="w-3.5 h-3.5 text-[#2EAA6E]" /> {shift.ndisGoal}
              </p>
            )}
            {shift.notes && (
              <p className="text-sm text-muted-foreground">{shift.notes}</p>
            )}
          </div>
          {actions.length > 0 && (
            <div className="flex gap-2 shrink-0">
              {actions.map((action) => (
                <Button
                  key={action.status}
                  size="sm"
                  variant={action.variant || "default"}
                  className={action.variant !== "destructive" ? "bg-[#1B6EB5] hover:bg-[#14578F] gap-1" : "gap-1"}
                  onClick={() => action.handler ? action.handler() : statusMutation.mutate({ id: shift.id, status: action.status })}
                  disabled={statusMutation.isPending}
                  data-testid={`button-${action.status}-${shift.id}`}
                >
                  <action.icon className="w-3.5 h-3.5" /> {action.label}
                </Button>
              ))}
            </div>
          )}
        </div>

        {endShiftId === shift.id && (
          <div className="mt-4 pt-4 border-t space-y-3" data-testid={`end-shift-form-${shift.id}`}>
            <h4 className="text-sm font-semibold flex items-center gap-2">
              <StopCircle className="w-4 h-4 text-amber-500" /> Confirm End Shift
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <Label htmlFor="end-hours" className="text-xs">Hours Worked</Label>
                <Input
                  id="end-hours"
                  type="number"
                  min="0.25"
                  step="0.25"
                  value={endShiftHours}
                  onChange={(e) => setEndShiftHours(e.target.value)}
                  data-testid="input-end-shift-hours"
                />
              </div>
              <div>
                <Label htmlFor="end-notes" className="text-xs">Shift Notes (optional)</Label>
                <Textarea
                  id="end-notes"
                  value={endShiftNotes}
                  onChange={(e) => setEndShiftNotes(e.target.value)}
                  rows={1}
                  placeholder="Any notes about this shift..."
                  data-testid="input-end-shift-notes"
                />
              </div>
            </div>
            <div className="flex gap-2">
              <Button
                size="sm"
                className="bg-[#2EAA6E] hover:bg-[#259D61] gap-1"
                onClick={confirmEndShift}
                disabled={statusMutation.isPending || !endShiftHours}
                data-testid="button-confirm-end-shift"
              >
                <CheckCircle2 className="w-3.5 h-3.5" /> Confirm & End
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => setEndShiftId(null)}
                data-testid="button-cancel-end-shift"
              >
                Cancel
              </Button>
            </div>
          </div>
        )}
      </Card>
    );
  };

  return (
    <div className="p-6 space-y-6" data-testid="worker-shifts">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h1 className="text-2xl font-bold flex items-center gap-2" data-testid="text-shifts-heading">
          <CalendarDays className="w-6 h-6 text-[#1B6EB5]" /> My Shifts & Earnings
        </h1>
        <Button variant="outline" className="gap-2" onClick={handleExportCSV} data-testid="button-export-csv">
          <Download className="w-4 h-4" /> Export CSV
        </Button>
      </div>

      {earnings && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Card className="p-5" data-testid="stat-total-earnings">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-lg bg-[#2EAA6E]/10">
                <DollarSign className="w-5 h-5 text-[#2EAA6E]" />
              </div>
              <div>
                <p className="text-2xl font-bold">${Number(earnings.totalEarnings).toFixed(2)}</p>
                <p className="text-xs text-muted-foreground">Total Earnings</p>
              </div>
            </div>
          </Card>
          <Card className="p-5" data-testid="stat-completed-shifts">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-lg bg-[#1B6EB5]/10">
                <CheckCircle2 className="w-5 h-5 text-[#1B6EB5]" />
              </div>
              <div>
                <p className="text-2xl font-bold">{earnings.completedShifts} / {earnings.totalShifts}</p>
                <p className="text-xs text-muted-foreground">Completed / Total Shifts</p>
              </div>
            </div>
          </Card>
          <Card className="p-5" data-testid="stat-rate">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-lg bg-[#E6A817]/10">
                <TrendingUp className="w-5 h-5 text-[#E6A817]" />
              </div>
              <div>
                <p className="text-2xl font-bold">${Number(earnings.hourlyRate || 0).toFixed(2)}/hr</p>
                <p className="text-xs text-muted-foreground">Hourly Rate</p>
              </div>
            </div>
          </Card>
        </div>
      )}

      <Card className="p-4" data-testid="card-filters">
        <div className="flex flex-col sm:flex-row items-start sm:items-end gap-3">
          <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
            <Filter className="w-4 h-4" /> Filters
          </div>
          <div>
            <Label className="text-xs mb-1">From</Label>
            <Input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className="w-40"
              data-testid="input-date-from"
            />
          </div>
          <div>
            <Label className="text-xs mb-1">To</Label>
            <Input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className="w-40"
              data-testid="input-date-to"
            />
          </div>
          <div>
            <Label className="text-xs mb-1">Status</Label>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-40" data-testid="select-status-filter">
                <SelectValue placeholder="All" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="scheduled">Scheduled</SelectItem>
                <SelectItem value="confirmed">Confirmed</SelectItem>
                <SelectItem value="in_progress">In Progress</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>
          </div>
          {(dateFrom || dateTo || statusFilter !== "all") && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => { setDateFrom(""); setDateTo(""); setStatusFilter("all"); }}
              data-testid="button-clear-filters"
            >
              Clear
            </Button>
          )}
        </div>
      </Card>

      <Tabs defaultValue="active">
        <TabsList data-testid="tabs-shift-status">
          <TabsTrigger value="active" data-testid="tab-active">
            Active ({activeShifts.length})
          </TabsTrigger>
          <TabsTrigger value="upcoming" data-testid="tab-upcoming">
            Upcoming ({upcomingShifts.filter(s => s.status !== "in_progress").length})
          </TabsTrigger>
          <TabsTrigger value="completed" data-testid="tab-completed">
            Completed ({completedShifts.length})
          </TabsTrigger>
          <TabsTrigger value="cancelled" data-testid="tab-cancelled">
            Cancelled ({cancelledShifts.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="active" className="space-y-4 mt-4">
          {activeShifts.length === 0 ? (
            <Card className="p-8 text-center" data-testid="empty-active">
              <Play className="w-10 h-10 mx-auto text-muted-foreground mb-3" />
              <p className="text-muted-foreground">No active shifts right now.</p>
            </Card>
          ) : (
            activeShifts.map(renderShiftCard)
          )}
        </TabsContent>

        <TabsContent value="upcoming" className="space-y-4 mt-4">
          {upcomingShifts.filter(s => s.status !== "in_progress").length === 0 ? (
            <Card className="p-8 text-center" data-testid="empty-upcoming">
              <CalendarDays className="w-10 h-10 mx-auto text-muted-foreground mb-3" />
              <p className="text-muted-foreground">No upcoming shifts scheduled.</p>
            </Card>
          ) : (
            upcomingShifts.filter(s => s.status !== "in_progress").map(renderShiftCard)
          )}
        </TabsContent>

        <TabsContent value="completed" className="space-y-4 mt-4">
          {completedShifts.length === 0 ? (
            <Card className="p-8 text-center" data-testid="empty-completed">
              <CheckCircle2 className="w-10 h-10 mx-auto text-muted-foreground mb-3" />
              <p className="text-muted-foreground">No completed shifts yet.</p>
            </Card>
          ) : (
            completedShifts.map(renderShiftCard)
          )}
        </TabsContent>

        <TabsContent value="cancelled" className="space-y-4 mt-4">
          {cancelledShifts.length === 0 ? (
            <Card className="p-8 text-center" data-testid="empty-cancelled">
              <AlertTriangle className="w-10 h-10 mx-auto text-muted-foreground mb-3" />
              <p className="text-muted-foreground">No cancelled shifts.</p>
            </Card>
          ) : (
            cancelledShifts.map(renderShiftCard)
          )}
        </TabsContent>
      </Tabs>

      {earnings && Object.keys(earnings.earningsByMonth).length > 0 && (
        <Card className="p-5" data-testid="card-monthly-earnings">
          <h3 className="font-semibold mb-4 flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-[#2EAA6E]" /> Monthly Earnings
          </h3>
          <div className="space-y-2">
            {Object.entries(earnings.earningsByMonth)
              .sort(([a], [b]) => b.localeCompare(a))
              .map(([month, amount]) => (
                <div key={month} className="flex items-center justify-between py-2 border-b last:border-b-0">
                  <span className="text-sm font-medium">{month}</span>
                  <span className="text-sm font-bold text-[#2EAA6E]">${amount.toFixed(2)}</span>
                </div>
              ))}
          </div>
        </Card>
      )}
    </div>
  );
}
