import { Suspense } from "react";

import { Badge } from "@/components/ui/badge";
import { getMapAbleIntelligenceConfig } from "@/intelligence/config";
import { getInterpreterDisplayName } from "@/lib/config/search-interpreter";

import { AskPageClient } from "./AskPageClient";

export const metadata = {
  title: "Ask MapAble | MapAble",
  description:
    "Accessible Co-Pilot guidance with participant-controlled PRMS records underneath.",
};

export default function AskPage() {
  const modelLabel = getInterpreterDisplayName();
  const careOsPanelsEnabled = getMapAbleIntelligenceConfig().enabled;

  return (
    <div className="mx-auto max-w-3xl px-5 py-10 lg:px-8">
      <Badge
        variant="outline"
        className="mb-4 border-[#005B7F]/20 bg-[#005B7F]/5 text-[#005B7F]"
      >
        Co-Pilot + PRMS
      </Badge>
      <h1 className="mapable-display text-3xl font-black tracking-[-0.04em] text-[#0C1833] sm:text-4xl">
        Ask MapAble
      </h1>
      <p className="mt-3 text-lg leading-8 text-slate-600">
        Friendly guidance on the surface. Participant records, consent checks, and evidence
        underneath.
      </p>
      <div className="mt-8">
        <Suspense fallback={<p className="text-slate-600">Loading Ask MapAble…</p>}>
          <AskPageClient
            modelLabel={modelLabel}
            careOsPanelsEnabled={careOsPanelsEnabled}
          />
        </Suspense>
      </div>
    </div>
  );
}
