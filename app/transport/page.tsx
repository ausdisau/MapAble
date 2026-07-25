import { ModuleCanvasSection } from "@/components/canvas/ModuleCanvasSection";
import { PublicModulePage } from "@/components/marketing/PublicModulePage";
import { TransportFeatureStatus } from "@/components/transport/TransportFeatureStatus";
import { canonicalAlternate } from "@/lib/config/canonical-url";
import { isCareTransportMapEnabled } from "@/lib/config/care-transport-map";
import { transportFeatureSummaries } from "@/lib/transport/feature-status";

export const metadata = {
  title: "MapAble Transport | Accessible travel",
  description:
    "Learn how MapAble Transport supports accessible trip requests, eligibility-aware dispatch, and consent-aware travel records in Australia.",
  alternates: canonicalAlternate("/transport"),
};

export default function TransportHubPage() {
  const mapEnabled = isCareTransportMapEnabled();

  return (
    <>
      <PublicModulePage
        eyebrow="MapAble Transport"
        title="Accessible trip requests with safety and eligibility checks."
        description="MapAble Transport is planned for accessible journeys, provider dispatch, driver field views and participant confirmation while keeping exact address details restricted to authorised people."
        whoFor={[
          "Participants arranging accessible travel and community access.",
          "Transport providers coordinating drivers and suitable vehicles.",
          "Drivers who need clear, need-to-know trip instructions.",
        ]}
        availableNow={transportFeatureSummaries("available_now")}
        comingSoon={[
          ...transportFeatureSummaries("coming_next"),
          ...transportFeatureSummaries("requires_partner").map(
            (item) => `${item} (partner required)`,
          ),
        ]}
        safetyNote={
          <>
            Exact pickup and drop-off details are restricted to authorised
            people. Route estimates are advisory. Driver and vehicle
            eligibility, live trip status, evidence, and partner dispatch are
            not public production claims until their release gates pass. If you
            are in immediate danger, call 000 — MapAble is not an emergency
            service.
          </>
        }
        primaryCta={{
          label: "Request transport (signed in)",
          href: "/transport/request",
        }}
        secondaryCta={
          mapEnabled
            ? {
                label: "Open Care + Transport map",
                href: "/care-transport/map",
              }
            : {
                label: "Find transport providers",
                href: "/providers?service=transport",
              }
        }
      />
      <TransportFeatureStatus />
      <ModuleCanvasSection module="transport" />
    </>
  );
}
