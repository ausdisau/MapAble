import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { StatusBadge, type StatusTone } from "@/components/shared/StatusBadge";
import { Target, CheckCircle2, XCircle, Play } from "lucide-react";
import type { Shift } from "@shared/schema";

const shiftTone: Record<string, StatusTone> = {
  scheduled: "info",
  confirmed: "success",
  in_progress: "warning",
  completed: "success",
  cancelled: "destructive",
};

export interface ShiftCardShift extends Shift {
  workerName?: string;
  participantName?: string;
}

interface ShiftCardProps {
  shift: ShiftCardShift;
  onStatusChange?: (id: string, status: string) => void;
}

export function ShiftCard({ shift, onStatusChange }: ShiftCardProps) {
  return (
    <Card className="p-3 text-sm" data-testid={`card-shift-${shift.id}`}>
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <div className="font-semibold truncate">
            {shift.startTime} – {shift.endTime}
          </div>
          {shift.ndisGoal && (
            <div className="flex items-center gap-1 text-xs text-muted-foreground mt-0.5">
              <Target className="w-3 h-3 shrink-0" />
              <span className="truncate">{shift.ndisGoal}</span>
            </div>
          )}
          {shift.ndisCategory && (
            <Badge variant="outline" className="text-[10px] mt-1">
              {shift.ndisCategory}
            </Badge>
          )}
        </div>
        <StatusBadge
          label={shift.status.replace("_", " ")}
          tone={shiftTone[shift.status] ?? "neutral"}
          className="text-[10px] shrink-0"
        />
      </div>
      {shift.notes && (
        <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{shift.notes}</p>
      )}
      {onStatusChange && (
        <div className="flex gap-1 mt-2 flex-wrap">
          {shift.status === "scheduled" && (
            <>
              <Button
                size="sm"
                variant="outline"
                className="h-6 text-[10px] gap-1"
                onClick={() => onStatusChange(shift.id, "confirmed")}
                data-testid={`button-confirm-shift-${shift.id}`}
              >
                <CheckCircle2 className="w-3 h-3" /> Confirm
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="h-6 text-[10px] gap-1 text-destructive"
                onClick={() => onStatusChange(shift.id, "cancelled")}
                data-testid={`button-cancel-shift-${shift.id}`}
              >
                <XCircle className="w-3 h-3" /> Cancel
              </Button>
            </>
          )}
          {shift.status === "confirmed" && (
            <Button
              size="sm"
              variant="outline"
              className="h-6 text-[10px] gap-1"
              onClick={() => onStatusChange(shift.id, "in_progress")}
              data-testid={`button-start-shift-${shift.id}`}
            >
              <Play className="w-3 h-3" /> Start
            </Button>
          )}
          {shift.status === "in_progress" && (
            <Button
              size="sm"
              variant="success"
              className="h-6 text-[10px] gap-1"
              onClick={() => onStatusChange(shift.id, "completed")}
              data-testid={`button-complete-shift-${shift.id}`}
            >
              <CheckCircle2 className="w-3 h-3" /> Complete
            </Button>
          )}
        </div>
      )}
    </Card>
  );
}
