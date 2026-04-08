import { useQuery, useMutation } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { usePageTitle } from "@/hooks/use-page-title";
import { Redirect } from "wouter";
import {
  CalendarDays,
  Clock,
  Plus,
  Trash2,
  Save,
  AlertTriangle,
  CalendarOff,
  CheckCircle2,
} from "lucide-react";
import { useState } from "react";
import type { WorkerAvailability, WorkerBlockout, Worker } from "@shared/schema";

const DAY_NAMES = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const SHORT_DAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export default function WorkerAvailabilityPage() {
  usePageTitle("My Availability | MapAble");
  const { toast } = useToast();
  const { user } = useAuth();

  const { data: worker } = useQuery<Worker>({
    queryKey: ["/api/worker/me"],
    enabled: user?.role === "carer",
  });

  const { data: availability, isLoading: availLoading } = useQuery<WorkerAvailability[]>({
    queryKey: ["/api/worker-availability", worker?.id],
    enabled: !!worker?.id,
    queryFn: async () => {
      const res = await fetch(`/api/worker-availability/${worker!.id}`, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch availability");
      return res.json();
    },
  });

  const { data: blockouts, isLoading: blockoutsLoading } = useQuery<WorkerBlockout[]>({
    queryKey: ["/api/worker-blockouts", worker?.id],
    enabled: !!worker?.id,
    queryFn: async () => {
      const res = await fetch(`/api/worker-blockouts/${worker!.id}`, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch blockouts");
      return res.json();
    },
  });

  const [editSlots, setEditSlots] = useState<{ dayOfWeek: number; startTime: string; endTime: string }[]>([]);
  const [editing, setEditing] = useState(false);
  const [newBlockoutDate, setNewBlockoutDate] = useState("");
  const [newBlockoutReason, setNewBlockoutReason] = useState("");

  const bulkSaveMutation = useMutation({
    mutationFn: async (slots: { dayOfWeek: number; startTime: string; endTime: string }[]) => {
      const res = await apiRequest("PUT", `/api/worker-availability/${worker!.id}/bulk`, {
        slots: slots.map(s => ({ ...s, workerId: worker!.id })),
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/worker-availability", worker?.id] });
      setEditing(false);
      toast({ title: "Availability saved", description: "Your weekly schedule has been updated." });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to save availability.", variant: "destructive" });
    },
  });

  const addBlockoutMutation = useMutation({
    mutationFn: async (data: { workerId: string; date: string; reason: string | null }) => {
      const res = await apiRequest("POST", "/api/worker-blockouts", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/worker-blockouts", worker?.id] });
      setNewBlockoutDate("");
      setNewBlockoutReason("");
      toast({ title: "Blockout added", description: "Date has been blocked out." });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to add blockout.", variant: "destructive" });
    },
  });

  const deleteBlockoutMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", `/api/worker-blockouts/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/worker-blockouts", worker?.id] });
      toast({ title: "Blockout removed" });
    },
  });

  if (user && user.role !== "carer") {
    return <Redirect to="/" />;
  }

  const isLoading = availLoading || blockoutsLoading;

  if (isLoading) {
    return (
      <div className="p-6 space-y-6" data-testid="worker-availability-loading">
        <Skeleton className="h-10 w-48" />
        <Skeleton className="h-64" />
      </div>
    );
  }

  const slots = availability || [];
  const blockoutList = blockouts || [];

  const startEdit = () => {
    setEditSlots(slots.map(s => ({ dayOfWeek: s.dayOfWeek, startTime: s.startTime, endTime: s.endTime })));
    setEditing(true);
  };

  const addSlot = () => {
    setEditSlots([...editSlots, { dayOfWeek: 1, startTime: "09:00", endTime: "17:00" }]);
  };

  const removeSlot = (idx: number) => {
    setEditSlots(editSlots.filter((_, i) => i !== idx));
  };

  const updateSlot = (idx: number, field: string, value: string | number) => {
    setEditSlots(editSlots.map((s, i) => i === idx ? { ...s, [field]: value } : s));
  };

  const handleSave = () => {
    bulkSaveMutation.mutate(editSlots);
  };

  const handleAddBlockout = () => {
    if (!newBlockoutDate || !worker) return;
    addBlockoutMutation.mutate({
      workerId: worker.id,
      date: newBlockoutDate,
      reason: newBlockoutReason || null,
    });
  };

  const slotsByDay: Record<number, WorkerAvailability[]> = {};
  for (const slot of slots) {
    if (!slotsByDay[slot.dayOfWeek]) slotsByDay[slot.dayOfWeek] = [];
    slotsByDay[slot.dayOfWeek].push(slot);
  }

  return (
    <div className="p-6 space-y-6 max-w-4xl" data-testid="worker-availability">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold flex items-center gap-2" data-testid="text-availability-heading">
          <CalendarDays className="w-6 h-6 text-[#1B6EB5]" /> My Availability
        </h1>
        {!editing ? (
          <Button onClick={startEdit} className="gap-2" data-testid="button-edit-availability">
            <Clock className="w-4 h-4" /> Edit Schedule
          </Button>
        ) : (
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setEditing(false)} data-testid="button-cancel-edit">Cancel</Button>
            <Button onClick={handleSave} disabled={bulkSaveMutation.isPending} className="gap-2" data-testid="button-save-availability">
              <Save className="w-4 h-4" /> {bulkSaveMutation.isPending ? "Saving..." : "Save"}
            </Button>
          </div>
        )}
      </div>

      <Card className="p-6" data-testid="card-weekly-schedule">
        <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Clock className="w-5 h-5 text-[#1B6EB5]" /> Weekly Schedule
        </h2>

        {!editing ? (
          <div className="space-y-2">
            {DAY_NAMES.map((day, idx) => {
              const daySlots = slotsByDay[idx] || [];
              return (
                <div key={idx} className="flex items-center gap-4 py-2 border-b last:border-b-0" data-testid={`day-row-${idx}`}>
                  <span className="w-24 text-sm font-medium">{day}</span>
                  {daySlots.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                      {daySlots.map((slot) => (
                        <Badge key={slot.id} variant="secondary" className="gap-1">
                          <Clock className="w-3 h-3" />
                          {slot.startTime} – {slot.endTime}
                        </Badge>
                      ))}
                    </div>
                  ) : (
                    <span className="text-sm text-muted-foreground">Not available</span>
                  )}
                </div>
              );
            })}
            {slots.length === 0 && (
              <div className="text-center py-6">
                <AlertTriangle className="w-8 h-8 mx-auto text-amber-500 mb-2" />
                <p className="text-muted-foreground">No availability set. Click "Edit Schedule" to configure your weekly hours.</p>
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            {editSlots.map((slot, idx) => (
              <div key={idx} className="flex items-center gap-3 flex-wrap" data-testid={`edit-slot-${idx}`}>
                <select
                  value={slot.dayOfWeek}
                  onChange={(e) => updateSlot(idx, "dayOfWeek", parseInt(e.target.value))}
                  className="border rounded-md px-3 py-2 text-sm bg-background"
                  data-testid={`select-day-${idx}`}
                >
                  {DAY_NAMES.map((day, i) => (
                    <option key={i} value={i}>{day}</option>
                  ))}
                </select>
                <Input
                  type="time"
                  value={slot.startTime}
                  onChange={(e) => updateSlot(idx, "startTime", e.target.value)}
                  className="w-32"
                  data-testid={`input-start-${idx}`}
                />
                <span className="text-muted-foreground">to</span>
                <Input
                  type="time"
                  value={slot.endTime}
                  onChange={(e) => updateSlot(idx, "endTime", e.target.value)}
                  className="w-32"
                  data-testid={`input-end-${idx}`}
                />
                <Button variant="ghost" size="icon" onClick={() => removeSlot(idx)} className="text-red-500" data-testid={`button-remove-slot-${idx}`}>
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            ))}
            <Button variant="outline" onClick={addSlot} className="gap-2 mt-2" data-testid="button-add-slot">
              <Plus className="w-4 h-4" /> Add Time Slot
            </Button>
          </div>
        )}
      </Card>

      <Card className="p-6" data-testid="card-blockouts">
        <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <CalendarOff className="w-5 h-5 text-[#E6A817]" /> Blocked-Out Dates
        </h2>

        <div className="flex flex-col sm:flex-row gap-3 mb-4">
          <div className="flex-1">
            <Label htmlFor="blockout-date" className="text-xs mb-1">Date</Label>
            <Input
              id="blockout-date"
              type="date"
              value={newBlockoutDate}
              onChange={(e) => setNewBlockoutDate(e.target.value)}
              data-testid="input-blockout-date"
            />
          </div>
          <div className="flex-1">
            <Label htmlFor="blockout-reason" className="text-xs mb-1">Reason (optional)</Label>
            <Input
              id="blockout-reason"
              value={newBlockoutReason}
              onChange={(e) => setNewBlockoutReason(e.target.value)}
              placeholder="e.g., Annual leave"
              data-testid="input-blockout-reason"
            />
          </div>
          <div className="flex items-end">
            <Button onClick={handleAddBlockout} disabled={!newBlockoutDate || addBlockoutMutation.isPending} className="gap-2" data-testid="button-add-blockout">
              <Plus className="w-4 h-4" /> Add
            </Button>
          </div>
        </div>

        {blockoutList.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">No blocked-out dates.</p>
        ) : (
          <div className="space-y-2">
            {blockoutList
              .sort((a, b) => a.date.localeCompare(b.date))
              .map((blockout) => (
                <div key={blockout.id} className="flex items-center justify-between py-2 border-b last:border-b-0" data-testid={`blockout-${blockout.id}`}>
                  <div>
                    <span className="text-sm font-medium">{blockout.date}</span>
                    {blockout.reason && (
                      <span className="text-sm text-muted-foreground ml-2">— {blockout.reason}</span>
                    )}
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => deleteBlockoutMutation.mutate(blockout.id)}
                    className="text-red-500 h-8 w-8"
                    data-testid={`button-delete-blockout-${blockout.id}`}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                </div>
              ))}
          </div>
        )}
      </Card>
    </div>
  );
}
