import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { X, ChevronRight, ChevronLeft, Check, Loader2 } from "lucide-react";
import type { AccessContextProfile } from "@shared/schema";

const MOBILITY_AIDS = [
  { value: "manual_wheelchair", label: "Manual Wheelchair" },
  { value: "power_wheelchair", label: "Power Wheelchair" },
  { value: "walker", label: "Walker / Rollator" },
  { value: "cane", label: "Cane" },
  { value: "crutches", label: "Crutches" },
  { value: "scooter", label: "Mobility Scooter" },
  { value: "none", label: "No Mobility Aid" },
];

const COMMUNICATION_MODES = [
  { value: "text", label: "Text" },
  { value: "voice", label: "Voice" },
  { value: "both", label: "Both Text & Voice" },
  { value: "aac", label: "AAC Device" },
];

interface WizardProps {
  onClose: () => void;
}

export function AccessProfileWizard({ onClose }: WizardProps) {
  const { toast } = useToast();
  const [step, setStep] = useState(0);

  const [mobilityAids, setMobilityAids] = useState<string[]>([]);
  const [maxTransferM, setMaxTransferM] = useState(200);
  const [stairsAllowed, setStairsAllowed] = useState(true);

  const [noiseSensitivity, setNoiseSensitivity] = useState("medium");
  const [crowdSensitivity, setCrowdSensitivity] = useState("medium");
  const [lightSensitivity, setLightSensitivity] = useState("medium");
  const [fewerInterchanges, setFewerInterchanges] = useState(false);

  const [communicationMode, setCommunicationMode] = useState("both");
  const [needsStaffAssistance, setNeedsStaffAssistance] = useState(false);
  const [canTravelAlone, setCanTravelAlone] = useState(true);

  const existingProfile = useQuery<AccessContextProfile | null>({
    queryKey: ["/api/access-profile"],
  });

  useEffect(() => {
    if (existingProfile.data) {
      const p = existingProfile.data;
      if (p.mobilityAids) setMobilityAids(p.mobilityAids as string[]);
      if (p.maxTransferM != null) setMaxTransferM(p.maxTransferM);
      if (p.stairsAllowed != null) setStairsAllowed(p.stairsAllowed);
      if (p.communicationMode) setCommunicationMode(p.communicationMode);
      if (p.sensoryPreferences) {
        const sp = p.sensoryPreferences as Record<string, string | boolean>;
        if (sp.noise) setNoiseSensitivity(sp.noise as string);
        if (sp.crowd) setCrowdSensitivity(sp.crowd as string);
        if (sp.light) setLightSensitivity(sp.light as string);
        if (sp.fewerInterchanges) setFewerInterchanges(sp.fewerInterchanges as boolean);
      }
      if (p.assistancePreferences) {
        const ap = p.assistancePreferences as Record<string, boolean>;
        if (ap.needsStaff != null) setNeedsStaffAssistance(ap.needsStaff);
        if (ap.canTravelAlone != null) setCanTravelAlone(ap.canTravelAlone);
      }
    }
  }, [existingProfile.data]);

  const saveMutation = useMutation({
    mutationFn: async () => {
      const body = {
        mobilityAids,
        maxTransferM,
        stairsAllowed,
        communicationMode,
        sensoryPreferences: {
          noise: noiseSensitivity,
          crowd: crowdSensitivity,
          light: lightSensitivity,
          fewerInterchanges,
        },
        assistancePreferences: {
          needsStaff: needsStaffAssistance,
          canTravelAlone,
        },
        consentScopes: { shareWithChat: true },
      };
      await apiRequest("PUT", "/api/access-profile", body);
    },
    onSuccess: () => {
      toast({ title: "Profile Saved", description: "Your access profile has been updated." });
      queryClient.invalidateQueries({ queryKey: ["/api/access-profile"] });
      onClose();
    },
    onError: (err) => {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    },
  });

  const steps = [
    { title: "Mobility", description: "Tell us about your mobility needs" },
    { title: "Sensory", description: "Your sensory preferences" },
    { title: "Communication & Assistance", description: "How you prefer to communicate and travel" },
  ];

  const toggleMobilityAid = (aid: string) => {
    if (aid === "none") {
      setMobilityAids(["none"]);
    } else {
      setMobilityAids((prev) => {
        const filtered = prev.filter((a) => a !== "none");
        return filtered.includes(aid) ? filtered.filter((a) => a !== aid) : [...filtered, aid];
      });
    }
  };

  const renderSensitivitySelector = (
    label: string,
    value: string,
    onChange: (v: string) => void,
    testId: string
  ) => (
    <div className="space-y-2">
      <Label className="text-sm font-medium">{label}</Label>
      <div className="flex gap-2">
        {["low", "medium", "high"].map((level) => (
          <button
            key={level}
            onClick={() => onChange(level)}
            className={`flex-1 py-2 px-3 rounded-lg text-xs font-medium border min-h-[44px] transition-colors capitalize ${
              value === level
                ? "bg-[#1B6EB5] text-white border-[#1B6EB5]"
                : "border-border bg-card"
            }`}
            data-testid={`${testId}-${level}`}
          >
            {level}
          </button>
        ))}
      </div>
    </div>
  );

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4" data-testid="access-profile-wizard-overlay" role="dialog" aria-modal="true" aria-labelledby="wizard-dialog-title" onKeyDown={(e) => { if (e.key === "Escape") onClose(); }}>
      <Card className="w-full max-w-lg max-h-[90vh] overflow-auto p-0">
        <div className="flex items-center justify-between p-4 border-b border-border">
          <div>
            <h2 id="wizard-dialog-title" className="text-lg font-bold" data-testid="text-wizard-title">Access Profile Setup</h2>
            <p className="text-xs text-muted-foreground">Step {step + 1} of {steps.length}: {steps[step].title}</p>
          </div>
          <button onClick={onClose} className="p-2 min-h-[44px] min-w-[44px] flex items-center justify-center rounded-lg" aria-label="Close" data-testid="button-close-wizard">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex gap-1 px-4 pt-3">
          {steps.map((_, i) => (
            <div
              key={i}
              className={`h-1 flex-1 rounded-full ${i <= step ? "bg-[#1B6EB5]" : "bg-muted"}`}
            />
          ))}
        </div>

        <div className="p-4 space-y-5">
          <p className="text-sm text-muted-foreground">{steps[step].description}</p>

          {step === 0 && (
            <>
              <div className="space-y-2">
                <Label className="text-sm font-medium">Mobility Aids Used</Label>
                <div className="grid grid-cols-2 gap-2">
                  {MOBILITY_AIDS.map((aid) => (
                    <button
                      key={aid.value}
                      onClick={() => toggleMobilityAid(aid.value)}
                      className={`text-left px-3 py-2.5 rounded-lg text-sm border min-h-[44px] transition-colors ${
                        mobilityAids.includes(aid.value)
                          ? "bg-[#1B6EB5] text-white border-[#1B6EB5]"
                          : "border-border bg-card"
                      }`}
                      data-testid={`button-mobility-aid-${aid.value}`}
                    >
                      {aid.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-3">
                <Label className="text-sm font-medium">Maximum Transfer Distance: {maxTransferM}m</Label>
                <Slider
                  value={[maxTransferM]}
                  onValueChange={([v]) => setMaxTransferM(v)}
                  min={10}
                  max={500}
                  step={10}
                  className="py-2"
                  data-testid="slider-max-transfer"
                />
                <div className="flex justify-between text-[10px] text-muted-foreground">
                  <span>10m</span>
                  <span>500m</span>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-sm font-medium">Can Use Stairs</Label>
                  <p className="text-xs text-muted-foreground">Can you manage stairs on a route?</p>
                </div>
                <Switch
                  checked={stairsAllowed}
                  onCheckedChange={setStairsAllowed}
                  data-testid="switch-stairs-allowed"
                />
              </div>
            </>
          )}

          {step === 1 && (
            <>
              {renderSensitivitySelector("Noise Sensitivity", noiseSensitivity, setNoiseSensitivity, "button-noise")}
              {renderSensitivitySelector("Crowd Sensitivity", crowdSensitivity, setCrowdSensitivity, "button-crowd")}
              {renderSensitivitySelector("Light Sensitivity", lightSensitivity, setLightSensitivity, "button-light")}
              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-sm font-medium">Prefer Fewer Interchanges</Label>
                  <p className="text-xs text-muted-foreground">I'd rather take longer routes with fewer changes</p>
                </div>
                <Switch
                  checked={fewerInterchanges}
                  onCheckedChange={setFewerInterchanges}
                  data-testid="switch-fewer-interchanges"
                />
              </div>
            </>
          )}

          {step === 2 && (
            <>
              <div className="space-y-2">
                <Label className="text-sm font-medium">Preferred Communication Mode</Label>
                <div className="grid grid-cols-2 gap-2">
                  {COMMUNICATION_MODES.map((mode) => (
                    <button
                      key={mode.value}
                      onClick={() => setCommunicationMode(mode.value)}
                      className={`text-left px-3 py-2.5 rounded-lg text-sm border min-h-[44px] transition-colors ${
                        communicationMode === mode.value
                          ? "bg-[#1B6EB5] text-white border-[#1B6EB5]"
                          : "border-border bg-card"
                      }`}
                      data-testid={`button-comm-mode-${mode.value}`}
                    >
                      {mode.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-sm font-medium">Needs Staff Assistance</Label>
                  <p className="text-xs text-muted-foreground">I need help from staff at stations/stops</p>
                </div>
                <Switch
                  checked={needsStaffAssistance}
                  onCheckedChange={setNeedsStaffAssistance}
                  data-testid="switch-needs-staff"
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-sm font-medium">Can Travel Alone</Label>
                  <p className="text-xs text-muted-foreground">I'm comfortable traveling independently</p>
                </div>
                <Switch
                  checked={canTravelAlone}
                  onCheckedChange={setCanTravelAlone}
                  data-testid="switch-travel-alone"
                />
              </div>
            </>
          )}
        </div>

        <div className="flex items-center justify-between p-4 border-t border-border">
          <Button
            variant="outline"
            onClick={() => setStep(Math.max(0, step - 1))}
            disabled={step === 0}
            className="gap-1.5 min-h-[44px]"
            data-testid="button-wizard-back"
          >
            <ChevronLeft className="w-4 h-4" />
            Back
          </Button>

          {step < steps.length - 1 ? (
            <Button
              onClick={() => setStep(step + 1)}
              className="gap-1.5 min-h-[44px] bg-[#1B6EB5] text-white"
              data-testid="button-wizard-next"
            >
              Next
              <ChevronRight className="w-4 h-4" />
            </Button>
          ) : (
            <Button
              onClick={() => saveMutation.mutate()}
              disabled={saveMutation.isPending}
              className="gap-1.5 min-h-[44px] bg-[#2EAA6E] text-white"
              data-testid="button-wizard-save"
            >
              {saveMutation.isPending ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Check className="w-4 h-4" />
              )}
              Save Profile
            </Button>
          )}
        </div>
      </Card>
    </div>
  );
}
