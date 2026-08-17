"use client";

import { useSearchParams } from "next/navigation";
import React, { useMemo } from "react";

import { CopilotPanel } from "@/components/copilot/CopilotPanel";
import { AccessibleJourneyAssistant } from "@/components/intelligence/AccessibleJourneyAssistant";
import { CareOSActionWorkbench } from "@/components/intelligence/CareOSActionWorkbench";
import { CareOSActivityPanel } from "@/components/intelligence/CareOSActivityPanel";
import { CareOSAgenticNetwork } from "@/components/intelligence/CareOSAgenticNetwork";
import { CareOSAppointmentMissionPanel } from "@/components/intelligence/CareOSAppointmentMissionPanel";
import { CareSupportIntelligencePanel } from "@/components/intelligence/CareSupportIntelligencePanel";
import { MapAbleCoreBrief } from "@/components/intelligence/MapAbleCoreBrief";

type Props = {
  modelLabel?: string;
  /** Server-derived: only show CareOS panels when MAPABLE_AI_ENABLED=true. */
  careOsPanelsEnabled?: boolean;
};

export function AskPageClient({
  modelLabel,
  careOsPanelsEnabled = false,
}: Props) {
  const searchParams = useSearchParams();
  const initialQuery = useMemo(() => {
    const q = searchParams.get("q")?.trim();
    if (q) return q;

    const provider = searchParams.get("provider")?.trim();
    if (!provider) return undefined;
    const name = provider.replace(/-/g, " ");
    return `Tell me about ${name} and what supports they offer`;
  }, [searchParams]);

  if (!careOsPanelsEnabled) {
    return <CopilotPanel initialQuery={initialQuery} modelLabel={modelLabel} />;
  }

  return (
    <div className="space-y-12">
      <CopilotPanel initialQuery={initialQuery} modelLabel={modelLabel} />
      <CareOSAppointmentMissionPanel />
      <CareOSAgenticNetwork />
      <CareSupportIntelligencePanel />
      <CareOSActionWorkbench />
      <CareOSActivityPanel />
      <MapAbleCoreBrief />
      <AccessibleJourneyAssistant />
    </div>
  );
}
