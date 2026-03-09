import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { X, Flag, Loader2, AlertTriangle } from "lucide-react";

const BARRIER_TYPES = [
  { value: "lift_out", label: "Lift Out of Order" },
  { value: "ramp_blocked", label: "Ramp Blocked" },
  { value: "path_closed", label: "Path Closed" },
  { value: "door_too_heavy", label: "Door Too Heavy" },
  { value: "kerb_ramp_missing", label: "Kerb Ramp Missing" },
  { value: "inaccessible_toilet", label: "Inaccessible Toilet" },
  { value: "unsafe_crossing", label: "Unsafe Crossing" },
  { value: "driver_bypass", label: "Driver Bypass" },
  { value: "helpful_staff", label: "Helpful Staff (positive)" },
  { value: "other", label: "Other" },
];

const SEVERITIES = [
  { value: "low", label: "Low", desc: "Minor inconvenience", color: "bg-blue-500" },
  { value: "medium", label: "Medium", desc: "Requires alternative route", color: "bg-amber-500" },
  { value: "high", label: "High", desc: "Significantly blocks access", color: "bg-orange-500" },
  { value: "critical", label: "Critical", desc: "No alternative available", color: "bg-red-500" },
];

interface BarrierReportFormProps {
  onClose: () => void;
  onSubmitted: () => void;
}

export function BarrierReportForm({ onClose, onSubmitted }: BarrierReportFormProps) {
  const { toast } = useToast();
  const [locationRef, setLocationRef] = useState("");
  const [barrierType, setBarrierType] = useState("");
  const [severity, setSeverity] = useState("");
  const [description, setDescription] = useState("");

  const submitMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("POST", "/api/community-reports", {
        locationRef,
        barrierType,
        severity,
        description: description || undefined,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/community-reports"] });
      onSubmitted();
    },
    onError: (err) => {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    },
  });

  const isValid = locationRef.trim() && barrierType && severity;

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4" data-testid="barrier-report-overlay" role="dialog" aria-modal="true" aria-labelledby="barrier-report-dialog-title" onKeyDown={(e) => { if (e.key === "Escape") onClose(); }}>
      <Card className="w-full max-w-lg max-h-[90vh] overflow-auto p-0">
        <div className="flex items-center justify-between p-4 border-b border-border">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-amber-500/15 flex items-center justify-center">
              <Flag className="w-4 h-4 text-amber-600" />
            </div>
            <div>
              <h2 id="barrier-report-dialog-title" className="text-lg font-bold" data-testid="text-barrier-report-title">Report an Accessibility Barrier</h2>
              <p className="text-xs text-muted-foreground">Help improve accessibility information for the community</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 min-h-[44px] min-w-[44px] flex items-center justify-center rounded-lg" aria-label="Close" data-testid="button-close-barrier-report">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-4 space-y-5">
          <div className="space-y-2">
            <Label htmlFor="location" className="text-sm font-medium">Location *</Label>
            <Input
              id="location"
              value={locationRef}
              onChange={(e) => setLocationRef(e.target.value)}
              placeholder="e.g., Central Station Platform 3, Westfield Bondi Junction entrance"
              className="min-h-[44px]"
              data-testid="input-barrier-location"
            />
          </div>

          <div className="space-y-2">
            <Label className="text-sm font-medium">Barrier Type *</Label>
            <div className="grid grid-cols-2 gap-2">
              {BARRIER_TYPES.map((bt) => (
                <button
                  key={bt.value}
                  onClick={() => setBarrierType(bt.value)}
                  className={`text-left px-3 py-2.5 rounded-lg text-xs font-medium border min-h-[44px] transition-colors ${
                    barrierType === bt.value
                      ? bt.value === "helpful_staff"
                        ? "bg-[#2EAA6E] text-white border-[#2EAA6E]"
                        : "bg-amber-500 text-white border-amber-500"
                      : "border-border bg-card"
                  }`}
                  data-testid={`button-barrier-type-${bt.value}`}
                >
                  {bt.label}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-sm font-medium">Severity *</Label>
            <div className="grid grid-cols-2 gap-2">
              {SEVERITIES.map((s) => (
                <button
                  key={s.value}
                  onClick={() => setSeverity(s.value)}
                  className={`text-left px-3 py-2.5 rounded-lg border min-h-[44px] transition-colors ${
                    severity === s.value
                      ? `${s.color} text-white border-transparent`
                      : "border-border bg-card"
                  }`}
                  data-testid={`button-severity-${s.value}`}
                >
                  <div className="text-xs font-medium">{s.label}</div>
                  <div className={`text-[10px] ${severity === s.value ? "text-white/80" : "text-muted-foreground"}`}>{s.desc}</div>
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description" className="text-sm font-medium">Description (optional)</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe the barrier in detail..."
              rows={3}
              className="min-h-[44px]"
              data-testid="input-barrier-description"
            />
          </div>
        </div>

        <div className="flex items-center justify-between p-4 border-t border-border">
          <Button variant="outline" onClick={onClose} className="min-h-[44px]" data-testid="button-cancel-barrier-report">
            Cancel
          </Button>
          <Button
            onClick={() => submitMutation.mutate()}
            disabled={!isValid || submitMutation.isPending}
            className="gap-1.5 min-h-[44px] bg-[#1B6EB5] text-white"
            data-testid="button-submit-barrier-report"
          >
            {submitMutation.isPending ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Flag className="w-4 h-4" />
            )}
            Submit Report
          </Button>
        </div>
      </Card>
    </div>
  );
}
