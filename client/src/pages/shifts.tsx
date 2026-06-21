import { useQuery, useMutation } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { usePageTitle } from "@/hooks/use-page-title";
import { ShiftCard } from "@/components/shared/ShiftCard";
import {
  Calendar as CalendarIcon,
  Clock,
  Plus,
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  XCircle,
  Play,
  Target,
  User as UserIcon,
  AlertCircle,
} from "lucide-react";
import { useState } from "react";
import { Link } from "wouter";
import type { Shift, Worker, User, WorkerAvailability } from "@shared/schema";

const DAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const FULL_DAY_NAMES = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

const STATUS_COLORS: Record<string, string> = {
  scheduled: "bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300",
  confirmed: "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300",
  in_progress: "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300",
  completed: "bg-green-100 text-green-800 dark:bg-green-950 dark:text-green-300",
  cancelled: "bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300",
};

function getWeekDates(baseDate: Date): Date[] {
  const start = new Date(baseDate);
  start.setDate(start.getDate() - start.getDay());
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(start);
    d.setDate(d.getDate() + i);
    return d;
  });
}

function getMonthDates(year: number, month: number): (Date | null)[][] {
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const weeks: (Date | null)[][] = [];
  let week: (Date | null)[] = [];

  for (let i = 0; i < firstDay.getDay(); i++) week.push(null);
  for (let d = 1; d <= lastDay.getDate(); d++) {
    week.push(new Date(year, month, d));
    if (week.length === 7) {
      weeks.push(week);
      week = [];
    }
  }
  if (week.length > 0) {
    while (week.length < 7) week.push(null);
    weeks.push(week);
  }
  return weeks;
}

function formatDate(d: Date): string {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function WeekView({ shifts, currentDate, onStatusChange }: { shifts: Shift[]; currentDate: Date; onStatusChange: (id: string, status: string) => void }) {
  const weekDates = getWeekDates(currentDate);
  const today = formatDate(new Date());

  return (
    <div className="grid grid-cols-7 gap-2" data-testid="view-week">
      {weekDates.map((date, i) => {
        const dateStr = formatDate(date);
        const dayShifts = shifts.filter((s) => s.date === dateStr);
        const isToday = dateStr === today;

        return (
          <div key={i} className="min-h-[160px]">
            <div className={`text-center py-1.5 rounded-t-md text-xs font-semibold ${isToday ? "bg-primary text-primary-foreground" : "bg-muted"}`}>
              <div>{DAY_NAMES[i]}</div>
              <div className="text-lg font-black">{date.getDate()}</div>
            </div>
            <div className="space-y-1.5 mt-1.5">
              {dayShifts.map((shift) => (
                <ShiftCard key={shift.id} shift={shift} onStatusChange={onStatusChange} />
              ))}
              {dayShifts.length === 0 && (
                <div className="text-center text-[10px] text-muted-foreground py-4 opacity-50">No shifts</div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function MonthView({ shifts, currentDate, onStatusChange }: { shifts: Shift[]; currentDate: Date; onStatusChange: (id: string, status: string) => void }) {
  const weeks = getMonthDates(currentDate.getFullYear(), currentDate.getMonth());
  const today = formatDate(new Date());

  return (
    <div data-testid="view-month">
      <div className="grid grid-cols-7 gap-px bg-muted rounded-t-md overflow-hidden">
        {DAY_NAMES.map((d) => (
          <div key={d} className="text-center py-2 text-xs font-semibold bg-card">{d}</div>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-px bg-muted">
        {weeks.flat().map((date, i) => {
          if (!date) return <div key={i} className="bg-card min-h-[100px] p-1" />;
          const dateStr = formatDate(date);
          const dayShifts = shifts.filter((s) => s.date === dateStr);
          const isToday = dateStr === today;

          return (
            <div key={i} className={`bg-card min-h-[100px] p-1 ${isToday ? "ring-2 ring-primary ring-inset" : ""}`}>
              <div className={`text-xs font-semibold mb-0.5 ${isToday ? "text-primary" : "text-muted-foreground"}`}>
                {date.getDate()}
              </div>
              <div className="space-y-0.5">
                {dayShifts.slice(0, 3).map((shift) => (
                  <div
                    key={shift.id}
                    className={`text-[9px] px-1 py-0.5 rounded truncate ${STATUS_COLORS[shift.status] || "bg-muted"}`}
                    title={`${shift.startTime}-${shift.endTime} ${shift.ndisGoal || ""}`}
                  >
                    {shift.startTime} {shift.ndisGoal ? `- ${shift.ndisGoal}` : ""}
                  </div>
                ))}
                {dayShifts.length > 3 && (
                  <div className="text-[9px] text-muted-foreground pl-1">+{dayShifts.length - 3} more</div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

interface WorkerBlockout {
  id: string;
  workerId: string;
  date: string;
  reason: string | null;
}

function AvailabilityEditor({ workerId }: { workerId: string }) {
  const { toast } = useToast();
  const { data: availability, isLoading } = useQuery<WorkerAvailability[]>({
    queryKey: ["/api/worker-availability", workerId],
    queryFn: async () => {
      const res = await fetch(`/api/worker-availability/${workerId}`);
      if (!res.ok) throw new Error("Failed to fetch availability");
      return res.json();
    },
    enabled: !!workerId,
  });

  const { data: blockouts } = useQuery<WorkerBlockout[]>({
    queryKey: ["/api/worker-blockouts", workerId],
    queryFn: async () => {
      const res = await fetch(`/api/worker-blockouts/${workerId}`);
      if (!res.ok) throw new Error("Failed to fetch blockouts");
      return res.json();
    },
    enabled: !!workerId,
  });

  const [blockoutDate, setBlockoutDate] = useState("");
  const [blockoutReason, setBlockoutReason] = useState("");

  const addBlockout = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/worker-blockouts", {
        workerId,
        date: blockoutDate,
        reason: blockoutReason || null,
      });
      return res.json();
    },
    onSuccess: () => {
      toast({ title: "Blockout date added" });
      queryClient.invalidateQueries({ queryKey: ["/api/worker-blockouts", workerId] });
      setBlockoutDate("");
      setBlockoutReason("");
    },
    onError: () => {
      toast({ title: "Error adding blockout", variant: "destructive" });
    },
  });

  const removeBlockout = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", `/api/worker-blockouts/${id}`);
    },
    onSuccess: () => {
      toast({ title: "Blockout removed" });
      queryClient.invalidateQueries({ queryKey: ["/api/worker-blockouts", workerId] });
    },
  });

  const [editSlots, setEditSlots] = useState<{ dayOfWeek: number; startTime: string; endTime: string }[]>([]);
  const [editing, setEditing] = useState(false);

  const saveMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("PUT", `/api/worker-availability/${workerId}/bulk`, {
        slots: editSlots.map((s) => ({
          workerId,
          dayOfWeek: s.dayOfWeek,
          startTime: s.startTime,
          endTime: s.endTime,
          isRecurring: true,
        })),
      });
      return res.json();
    },
    onSuccess: () => {
      toast({ title: "Availability saved" });
      queryClient.invalidateQueries({ queryKey: ["/api/worker-availability", workerId] });
      setEditing(false);
    },
    onError: () => {
      toast({ title: "Error saving availability", variant: "destructive" });
    },
  });

  const startEditing = () => {
    setEditSlots(
      (availability || []).map((a) => ({
        dayOfWeek: a.dayOfWeek,
        startTime: a.startTime,
        endTime: a.endTime,
      }))
    );
    setEditing(true);
  };

  const addSlot = () => {
    setEditSlots([...editSlots, { dayOfWeek: 1, startTime: "09:00", endTime: "17:00" }]);
  };

  const removeSlot = (index: number) => {
    setEditSlots(editSlots.filter((_, i) => i !== index));
  };

  const updateSlot = (index: number, field: keyof typeof editSlots[number], value: string | number) => {
    const updated = [...editSlots];
    updated[index] = { ...updated[index], [field]: value };
    setEditSlots(updated);
  };

  if (isLoading) return <Card className="p-4"><Skeleton className="h-24 w-full" /></Card>;

  return (
    <>
    <Card className="overflow-hidden" data-testid="card-availability-editor">
      <div className="bg-gradient-to-r from-[#14578F] to-[#1B6EB5] px-5 py-3">
        <h3 className="font-bold text-sm text-white flex items-center gap-2">
          <Clock className="w-4 h-4" /> Weekly Availability
        </h3>
      </div>
      <div className="p-4 space-y-3">
        {!editing ? (
          <>
            {availability && availability.length > 0 ? (
              <div className="space-y-2">
                {FULL_DAY_NAMES.map((dayName, dayIndex) => {
                  const daySlots = availability.filter((a) => a.dayOfWeek === dayIndex);
                  if (daySlots.length === 0) return null;
                  return (
                    <div key={dayIndex} className="flex items-center gap-3 text-sm" data-testid={`availability-day-${dayIndex}`}>
                      <span className="w-24 font-medium text-muted-foreground">{dayName}</span>
                      <div className="flex flex-wrap gap-1">
                        {daySlots.map((slot) => (
                          <Badge key={slot.id} variant="secondary" className="text-xs">
                            {slot.startTime} – {slot.endTime}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-4">No availability set</p>
            )}
            <Button variant="outline" className="w-full gap-2" onClick={startEditing} data-testid="button-edit-availability">
              Edit Availability
            </Button>
          </>
        ) : (
          <>
            <div className="space-y-2">
              {editSlots.map((slot, i) => (
                <div key={i} className="flex items-center gap-2 flex-wrap" data-testid={`edit-slot-${i}`}>
                  <Select value={String(slot.dayOfWeek)} onValueChange={(v) => updateSlot(i, "dayOfWeek", parseInt(v))}>
                    <SelectTrigger className="w-28 h-8 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {FULL_DAY_NAMES.map((name, idx) => (
                        <SelectItem key={idx} value={String(idx)}>{name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Input type="time" value={slot.startTime} onChange={(e) => updateSlot(i, "startTime", e.target.value)} className="w-28 h-8 text-xs" data-testid={`input-start-time-${i}`} />
                  <span className="text-xs text-muted-foreground">to</span>
                  <Input type="time" value={slot.endTime} onChange={(e) => updateSlot(i, "endTime", e.target.value)} className="w-28 h-8 text-xs" data-testid={`input-end-time-${i}`} />
                  <Button size="sm" variant="ghost" className="h-8 px-2 text-red-500" onClick={() => removeSlot(i)} data-testid={`button-remove-slot-${i}`}>
                    <XCircle className="w-4 h-4" />
                  </Button>
                </div>
              ))}
            </div>
            <Button variant="outline" size="sm" className="gap-1" onClick={addSlot} data-testid="button-add-slot">
              <Plus className="w-3 h-3" /> Add Slot
            </Button>
            <div className="flex gap-2">
              <Button className="flex-1" onClick={() => saveMutation.mutate()} disabled={saveMutation.isPending} data-testid="button-save-availability">
                {saveMutation.isPending ? "Saving..." : "Save"}
              </Button>
              <Button variant="outline" className="flex-1" onClick={() => setEditing(false)} data-testid="button-cancel-edit">
                Cancel
              </Button>
            </div>
          </>
        )}
      </div>
    </Card>

    <Card className="overflow-hidden mt-4" data-testid="card-blockout-dates">
      <div className="bg-gradient-to-r from-red-600 to-red-500 px-5 py-3">
        <h3 className="font-bold text-sm text-white flex items-center gap-2">
          <XCircle className="w-4 h-4" /> Blocked Out Dates
        </h3>
      </div>
      <div className="p-4 space-y-3">
        {blockouts && blockouts.length > 0 ? (
          <div className="space-y-2">
            {blockouts.map((b) => (
              <div key={b.id} className="flex items-center justify-between text-sm" data-testid={`blockout-${b.id}`}>
                <div className="flex items-center gap-2">
                  <Badge variant="destructive" className="text-xs">{b.date}</Badge>
                  {b.reason && <span className="text-muted-foreground">{b.reason}</span>}
                </div>
                <Button size="sm" variant="ghost" className="h-6 px-2 text-red-500" onClick={() => removeBlockout.mutate(b.id)} data-testid={`button-remove-blockout-${b.id}`}>
                  <XCircle className="w-3 h-3" />
                </Button>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground text-center py-2">No blockout dates set</p>
        )}
        <div className="flex items-end gap-2 flex-wrap">
          <div className="flex-1 min-w-[140px]">
            <label className="text-xs font-medium text-muted-foreground">Date</label>
            <Input type="date" value={blockoutDate} onChange={(e) => setBlockoutDate(e.target.value)} className="h-8 text-xs" data-testid="input-blockout-date" />
          </div>
          <div className="flex-1 min-w-[140px]">
            <label className="text-xs font-medium text-muted-foreground">Reason (optional)</label>
            <Input value={blockoutReason} onChange={(e) => setBlockoutReason(e.target.value)} placeholder="e.g. Holiday" className="h-8 text-xs" data-testid="input-blockout-reason" />
          </div>
          <Button size="sm" className="gap-1 h-8" onClick={() => addBlockout.mutate()} disabled={!blockoutDate || addBlockout.isPending} data-testid="button-add-blockout">
            <Plus className="w-3 h-3" /> Add
          </Button>
        </div>
      </div>
    </Card>
    </>
  );
}

function BookShiftDialog({ workers, participantId }: { workers: (Worker & { user?: User })[]; participantId: string }) {
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [workerId, setWorkerId] = useState("");
  const [date, setDate] = useState("");
  const [startTime, setStartTime] = useState("09:00");
  const [endTime, setEndTime] = useState("17:00");
  const [ndisGoal, setNdisGoal] = useState("");
  const [ndisCategory, setNdisCategory] = useState("");
  const [recurrence, setRecurrence] = useState("");
  const [notes, setNotes] = useState("");

  const { data: workerAvailability } = useQuery<WorkerAvailability[]>({
    queryKey: ["/api/worker-availability", workerId],
    queryFn: async () => {
      const res = await fetch(`/api/worker-availability/${workerId}`);
      if (!res.ok) return [];
      return res.json();
    },
    enabled: !!workerId,
  });

  const { data: workerBlockoutList } = useQuery<WorkerBlockout[]>({
    queryKey: ["/api/worker-blockouts", workerId],
    queryFn: async () => {
      const res = await fetch(`/api/worker-blockouts/${workerId}`);
      if (!res.ok) return [];
      return res.json();
    },
    enabled: !!workerId,
  });

  const selectedDayOfWeek = date ? new Date(date + "T12:00:00").getDay() : -1;
  const availableSlotsForDay = (workerAvailability || []).filter(a => a.dayOfWeek === selectedDayOfWeek);
  const isBlockedOut = date ? (workerBlockoutList || []).some(b => b.date === date) : false;

  const { data: ndisPlan } = useQuery<{ goals?: Array<{ id: string; name: string; category: string; budget: number }> }>({
    queryKey: ["/api/ndis/plan", participantId],
    queryFn: async () => {
      const res = await fetch(`/api/ndis/plan/${participantId}`);
      if (!res.ok) return null;
      return res.json();
    },
    enabled: !!participantId,
  });

  const goals = ndisPlan?.goals || [];

  const createShift = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/shifts", {
        participantId,
        workerId,
        date,
        startTime,
        endTime,
        ndisGoal: ndisGoal && ndisGoal !== "none" ? ndisGoal : undefined,
        ndisCategory: ndisCategory || undefined,
        recurrenceRule: recurrence && recurrence !== "none" ? recurrence : undefined,
        notes: notes || undefined,
      });
      return res.json();
    },
    onSuccess: () => {
      toast({ title: "Shift booked", description: recurrence ? `Recurring shifts created (${recurrence})` : "Single shift created" });
      queryClient.invalidateQueries({ queryKey: ["/api/shifts"] });
      setOpen(false);
      setWorkerId("");
      setDate("");
      setStartTime("09:00");
      setEndTime("17:00");
      setNdisGoal("");
      setNdisCategory("");
      setRecurrence("");
      setNotes("");
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to create shift", variant: "destructive" });
    },
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="gap-2" data-testid="button-book-shift">
          <Plus className="w-4 h-4" /> Book Shift
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Book a Shift</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 mt-2">
          <div>
            <Label className="text-xs font-semibold">Worker</Label>
            <Select value={workerId} onValueChange={setWorkerId}>
              <SelectTrigger data-testid="select-worker">
                <SelectValue placeholder="Select a worker" />
              </SelectTrigger>
              <SelectContent>
                {workers.map((w) => (
                  <SelectItem key={w.id} value={w.id}>
                    {w.user?.fullName || w.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-xs font-semibold">Date</Label>
            <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} data-testid="input-shift-date" />
          </div>
          {workerId && date && (
            <div className="rounded-md border p-3 text-xs" data-testid="availability-info-panel">
              {isBlockedOut ? (
                <div className="flex items-center gap-2 text-red-600" data-testid="text-blocked-out">
                  <XCircle className="w-3 h-3" />
                  <span className="font-medium">Worker is unavailable on this date (blocked out)</span>
                </div>
              ) : availableSlotsForDay.length > 0 ? (
                <div>
                  <p className="font-medium text-green-700 mb-1 flex items-center gap-1">
                    <Clock className="w-3 h-3" /> Available slots for {FULL_DAY_NAMES[selectedDayOfWeek]}:
                  </p>
                  <div className="flex flex-wrap gap-1">
                    {availableSlotsForDay.map((slot) => (
                      <Badge
                        key={slot.id}
                        variant="secondary"
                        className="cursor-pointer hover:bg-primary hover:text-white transition-colors"
                        data-testid={`slot-badge-${slot.id}`}
                        onClick={() => { setStartTime(slot.startTime); setEndTime(slot.endTime); }}
                      >
                        {slot.startTime} – {slot.endTime}
                      </Badge>
                    ))}
                  </div>
                  <p className="text-muted-foreground mt-1">Click a slot to auto-fill times</p>
                </div>
              ) : workerAvailability && workerAvailability.length > 0 ? (
                <div className="flex items-center gap-2 text-amber-600" data-testid="text-no-slots">
                  <AlertCircle className="w-3 h-3" />
                  <span className="font-medium">Worker has no availability set for {FULL_DAY_NAMES[selectedDayOfWeek]}</span>
                </div>
              ) : (
                <p className="text-muted-foreground">No availability patterns set for this worker (any time accepted)</p>
              )}
            </div>
          )}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs font-semibold">Start Time</Label>
              <Input type="time" value={startTime} onChange={(e) => setStartTime(e.target.value)} data-testid="input-shift-start" />
            </div>
            <div>
              <Label className="text-xs font-semibold">End Time</Label>
              <Input type="time" value={endTime} onChange={(e) => setEndTime(e.target.value)} data-testid="input-shift-end" />
            </div>
          </div>
          <div>
            <Label className="text-xs font-semibold">NDIS Goal</Label>
            <Select value={ndisGoal} onValueChange={(v) => {
              setNdisGoal(v);
              const goal = goals.find((g) => g.name === v);
              if (goal) setNdisCategory(goal.category);
            }}>
              <SelectTrigger data-testid="select-ndis-goal">
                <SelectValue placeholder="Select NDIS goal (optional)" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">None</SelectItem>
                {goals.map((g) => (
                  <SelectItem key={g.id} value={g.name}>{g.name} ({g.category})</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-xs font-semibold">Recurrence</Label>
            <Select value={recurrence} onValueChange={setRecurrence}>
              <SelectTrigger data-testid="select-recurrence">
                <SelectValue placeholder="One-time (default)" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">One-time</SelectItem>
                <SelectItem value="weekly">Weekly (12 weeks)</SelectItem>
                <SelectItem value="fortnightly">Fortnightly (12 weeks)</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-xs font-semibold">Notes</Label>
            <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Additional notes..." className="resize-none" data-testid="input-shift-notes" />
          </div>
          <Button
            className="w-full"
            onClick={() => createShift.mutate()}
            disabled={!workerId || !date || createShift.isPending || isBlockedOut}
            data-testid="button-submit-shift"
          >
            {createShift.isPending ? "Creating..." : "Book Shift"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function NdisPlanPanel({ participantId }: { participantId: string }) {
  const { toast } = useToast();

  const { data: plan, isLoading } = useQuery<{ goals?: Array<{ id: string; name: string; category: string; budget: number }>; planData?: { planId: string; startDate: string; endDate: string; managementType: string } } | null>({
    queryKey: ["/api/ndis/plan", participantId],
    queryFn: async () => {
      const res = await fetch(`/api/ndis/plan/${participantId}`);
      if (!res.ok) return null;
      return res.json();
    },
    enabled: !!participantId,
  });

  const syncMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/ndis/sync-plan", { participantId });
      return res.json();
    },
    onSuccess: () => {
      toast({ title: "NDIS plan synced" });
      queryClient.invalidateQueries({ queryKey: ["/api/ndis/plan", participantId] });
    },
    onError: () => {
      toast({ title: "Sync failed", variant: "destructive" });
    },
  });

  return (
    <Card className="overflow-hidden" data-testid="card-ndis-plan">
      <div className="bg-gradient-to-r from-[#2EAA6E] to-[#25905D] px-5 py-3 flex items-center justify-between">
        <h3 className="font-bold text-sm text-white flex items-center gap-2">
          <Target className="w-4 h-4" /> NDIS Plan Goals
        </h3>
        <Button
          size="sm"
          variant="ghost"
          className="text-white/90 h-7 text-xs"
          onClick={() => syncMutation.mutate()}
          disabled={syncMutation.isPending}
          data-testid="button-sync-ndis"
        >
          {syncMutation.isPending ? "Syncing..." : "Sync Plan"}
        </Button>
      </div>
      <div className="p-4">
        {isLoading ? (
          <Skeleton className="h-20 w-full" />
        ) : plan?.goals ? (
          <div className="space-y-2">
            {(plan.goals as Array<{ id: string; name: string; category: string; budget: number }>).map((goal, i: number) => (
              <div key={i} className="flex items-center justify-between text-sm" data-testid={`ndis-goal-${i}`}>
                <div className="flex items-center gap-2">
                  <Target className="w-3 h-3 text-[#2EAA6E]" />
                  <span className="font-medium">{goal.name}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="text-[10px]">{goal.category}</Badge>
                  <span className="text-xs text-muted-foreground">${goal.budget?.toLocaleString()}</span>
                </div>
              </div>
            ))}
            {plan.planData && (
              <div className="mt-3 pt-3 border-t text-xs text-muted-foreground space-y-1">
                <div>Plan: {plan.planData.startDate} to {plan.planData.endDate}</div>
                <div>Management: {plan.planData.managementType?.replace("_", " ")}</div>
              </div>
            )}
          </div>
        ) : (
          <div className="text-center py-4">
            <p className="text-sm text-muted-foreground mb-2">No NDIS plan data cached</p>
            <Button variant="outline" size="sm" onClick={() => syncMutation.mutate()} disabled={syncMutation.isPending} data-testid="button-sync-ndis-empty">
              Sync NDIS Plan
            </Button>
          </div>
        )}
      </div>
    </Card>
  );
}

export default function ShiftsPage() {
  usePageTitle("Shifts");
  const [calView, setCalView] = useState<"week" | "month">("week");
  const [currentDate, setCurrentDate] = useState(new Date());
  const { toast } = useToast();

  const { data: me } = useQuery<User>({ queryKey: ["/api/me"] });
  const { data: workers } = useQuery<(Worker & { user?: User })[]>({ queryKey: ["/api/workers"] });

  const dateFrom = calView === "week"
    ? formatDate(getWeekDates(currentDate)[0])
    : formatDate(new Date(currentDate.getFullYear(), currentDate.getMonth(), 1));
  const dateTo = calView === "week"
    ? formatDate(getWeekDates(currentDate)[6])
    : formatDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0));

  const { data: shiftsData, isLoading, isError, refetch } = useQuery<Shift[]>({
    queryKey: ["/api/shifts", { dateFrom, dateTo }],
    queryFn: async () => {
      const res = await fetch(`/api/shifts?dateFrom=${dateFrom}&dateTo=${dateTo}`);
      if (!res.ok) throw new Error("Failed to fetch shifts");
      return res.json();
    },
  });

  const statusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const res = await apiRequest("PATCH", `/api/shifts/${id}/status`, { status });
      return res.json();
    },
    onSuccess: (data: { shift?: Shift; session?: { actualHours: string; hourlyRate: string; totalCharge: string } }) => {
      if (data.session) {
        toast({
          title: "Shift completed",
          description: `Service session created: ${data.session.actualHours}hrs @ $${Number(data.session.hourlyRate || 0).toFixed(2)}/hr — Total: $${Number(data.session.totalCharge || 0).toFixed(2)}`,
        });
      } else {
        toast({ title: `Shift ${data.shift?.status?.replace("_", " ")}` });
      }
      queryClient.invalidateQueries({ queryKey: ["/api/shifts"] });
      queryClient.invalidateQueries({ queryKey: ["/api/sessions"] });
      queryClient.invalidateQueries({ queryKey: ["/api/budget"] });
    },
    onError: () => {
      toast({ title: "Error updating shift", variant: "destructive" });
    },
  });

  const handleStatusChange = (id: string, status: string) => {
    statusMutation.mutate({ id, status });
  };

  const navigateDate = (direction: number) => {
    const next = new Date(currentDate);
    if (calView === "week") {
      next.setDate(next.getDate() + direction * 7);
    } else {
      next.setMonth(next.getMonth() + direction);
    }
    setCurrentDate(next);
  };

  const headerLabel = calView === "week"
    ? `${getWeekDates(currentDate)[0].toLocaleDateString("en-AU", { month: "short", day: "numeric" })} – ${getWeekDates(currentDate)[6].toLocaleDateString("en-AU", { month: "short", day: "numeric", year: "numeric" })}`
    : currentDate.toLocaleDateString("en-AU", { month: "long", year: "numeric" });

  const workerForUser = workers?.find((w) => w.userId === me?.id);

  const upcomingShifts = (shiftsData || [])
    .filter((s) => s.status !== "completed" && s.status !== "cancelled")
    .sort((a, b) => a.date.localeCompare(b.date) || a.startTime.localeCompare(b.startTime))
    .slice(0, 5);

  return (
    <div className="p-4 md:p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-3xl font-black tracking-tight" data-testid="text-page-title">Shifts</h1>
          <p className="text-muted-foreground mt-1 text-sm max-w-xl">
            Manage shift schedules, track NDIS goal alignment, and coordinate with support workers.
          </p>
        </div>
        {me && workers && me.role === "participant" && (
          <BookShiftDialog workers={workers} participantId={me.id} />
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-3 space-y-4">
          <Card className="p-4">
            <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
              <div className="flex items-center gap-2">
                <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => navigateDate(-1)} data-testid="button-prev-period">
                  <ChevronLeft className="w-4 h-4" />
                </Button>
                <h2 className="text-sm font-bold min-w-[180px] text-center" data-testid="text-calendar-period">
                  {headerLabel}
                </h2>
                <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => navigateDate(1)} data-testid="button-next-period">
                  <ChevronRight className="w-4 h-4" />
                </Button>
                <Button variant="ghost" size="sm" className="text-xs" onClick={() => setCurrentDate(new Date())} data-testid="button-today">
                  Today
                </Button>
              </div>
              <Tabs value={calView} onValueChange={(v) => setCalView(v as "week" | "month")}>
                <TabsList className="h-8">
                  <TabsTrigger value="week" className="text-xs px-3" data-testid="tab-week">Week</TabsTrigger>
                  <TabsTrigger value="month" className="text-xs px-3" data-testid="tab-month">Month</TabsTrigger>
                </TabsList>
              </Tabs>
            </div>

            {isError ? (
              <Card className="p-8 text-center">
                <AlertCircle className="w-10 h-10 text-red-500 mx-auto mb-3" />
                <h3 className="font-bold mb-1">Failed to load shifts</h3>
                <Button onClick={() => refetch()} size="sm" data-testid="button-retry">Retry</Button>
              </Card>
            ) : isLoading ? (
              <div className="space-y-2">
                {[1, 2, 3].map((i) => <Skeleton key={i} className="h-24 w-full" />)}
              </div>
            ) : calView === "week" ? (
              <WeekView shifts={shiftsData || []} currentDate={currentDate} onStatusChange={handleStatusChange} />
            ) : (
              <MonthView shifts={shiftsData || []} currentDate={currentDate} onStatusChange={handleStatusChange} />
            )}
          </Card>

          {upcomingShifts.length > 0 && (
            <Card className="overflow-hidden">
              <div className="bg-gradient-to-r from-[#E6A817] to-[#D49A15] px-5 py-3">
                <h3 className="font-bold text-sm text-white flex items-center gap-2">
                  <CalendarIcon className="w-4 h-4" /> Upcoming Shifts
                </h3>
              </div>
              <div className="divide-y">
                {upcomingShifts.map((shift) => {
                  const worker = workers?.find((w) => w.id === shift.workerId);
                  return (
                    <div key={shift.id} className="px-5 py-3 flex items-center justify-between gap-3 flex-wrap" data-testid={`row-upcoming-${shift.id}`}>
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-md bg-primary/10 flex items-center justify-center">
                          <UserIcon className="w-5 h-5 text-primary" />
                        </div>
                        <div>
                          <div className="text-sm font-semibold">
                            {worker?.user?.fullName || "Worker"}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {shift.date} • {shift.startTime} – {shift.endTime}
                          </div>
                          {shift.ndisGoal && (
                            <div className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                              <Target className="w-3 h-3" /> {shift.ndisGoal}
                            </div>
                          )}
                        </div>
                      </div>
                      <Badge className={`text-[10px] ${STATUS_COLORS[shift.status] || ""}`}>
                        {shift.status.replace("_", " ")}
                      </Badge>
                    </div>
                  );
                })}
              </div>
            </Card>
          )}
        </div>

        <div className="space-y-4">
          {me && <NdisPlanPanel participantId={me.id} />}
          {workerForUser && <AvailabilityEditor workerId={workerForUser.id} />}

          <Card className="p-4" data-testid="card-quick-links">
            <h3 className="font-bold text-sm mb-3">Quick Links</h3>
            <div className="space-y-2">
              <Link href="/care">
                <Button variant="outline" size="sm" className="w-full justify-start gap-2 text-xs" data-testid="link-find-workers">
                  <UserIcon className="w-3 h-3" /> Find Workers
                </Button>
              </Link>
              <Link href="/budget">
                <Button variant="outline" size="sm" className="w-full justify-start gap-2 text-xs" data-testid="link-view-budget">
                  <Target className="w-3 h-3" /> View Budget
                </Button>
              </Link>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
