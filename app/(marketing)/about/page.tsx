import { MetricsSection } from "@/components/canvas/MetricsSection";
import { RoadmapPhases } from "@/components/canvas/RoadmapPhases";
import { StrategicContrast } from "@/components/canvas/StrategicContrast";
import { TrustLayer } from "@/components/canvas/TrustLayer";
import { PublicInfoPage } from "@/components/marketing/PublicInfoPage";
import {
  metricGroups,
  roadmapPhases,
  trustPrinciples,
} from "@/lib/canvas/canvas-data";
import { canonicalAlternate } from "@/lib/config/canonical-url";

export const metadata = {
  title: "About | MapAble",
  description:
    "About MapAble's accessibility-first disability support operating system.",
  alternates: canonicalAlternate("/about"),
};

export default function AboutPage() {
  return (
    <>
      <PublicInfoPage
        eyebrow="About MapAble"
        title="An accessibility-first operating system for disability support."
        description="MapAble is being developed to connect public discovery, participant choice, provider operations, consent, audit and safeguarding into one coherent platform."
        ctaLabel="Explore modules"
        ctaHref="/care"
        sections={[
          {
            title: "What MapAble is",
            content: (
              <p>
                MapAble is not being built as a simple marketplace. It is being
                shaped as a disability support operating system with marketplace
                features, provider operations, participant controls and quality
                and safeguarding workflows.
              </p>
            ),
          },
          {
            title: "Current status",
            content: (
              <p>
                Public module pages and provider discovery are available for
                exploration and pilot feedback. Operational claims such as NDIS
                registration, WCAG conformance and Australian data sovereignty
                require evidence before being stated as confirmed.
              </p>
            ),
          },
          {
            title: "Design principles",
            content: (
              <ul className="list-disc space-y-2 pl-5">
                <li>Consent before sensitive sharing.</li>
                <li>Deny access by default and audit sensitive access.</li>
                <li>Human confirmation for high-risk actions.</li>
                <li>
                  Accessibility-first design with formal testing before
                  compliance claims.
                </li>
              </ul>
            ),
          },
        ]}
      />
      <StrategicContrast />
      <MetricsSection groups={metricGroups} />
      <RoadmapPhases phases={roadmapPhases} />
      <TrustLayer principles={trustPrinciples} />
    </>
  );
}
