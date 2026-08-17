import { PublicModulePage } from "@/components/marketing/PublicModulePage";
import { canonicalAlternate } from "@/lib/config/canonical-url";

export const metadata = {
  title: "MapAble Marketplace | Disability aids and everyday essentials",
  description:
    "Learn how MapAble Marketplace will help people find disability aids, equipment and daily essentials with clear funding context — without claiming live checkout today.",
  alternates: canonicalAlternate("/marketplace"),
};

export default function MarketplaceProgrammePage() {
  return (
    <PublicModulePage
      eyebrow="MapAble Marketplace"
      title="Find aids, equipment and everyday essentials with disability-first context."
      description="MapAble Marketplace is planned as a trusted place to discover assistive technology, mobility aids and daily living products — with community reviews and NDIS-aware framing. Live catalogue checkout is not a Year-One production claim."
      whoFor={[
        "Participants and families looking for disability aids and daily essentials.",
        "Small vendors and disability-owned businesses wanting a focused channel.",
        "Support coordinators helping people source equipment with clear funding context.",
      ]}
      availableNow={[
        "Public programme information and pilot enquiry path.",
        "Links to Access Map and provider discovery for related supports.",
        "Signed-in shop prototypes only when MAPABLE_MARKETPLACE_ENABLED is on (pilot).",
      ]}
      comingSoon={[
        "Browseable catalogue with accessibility attributes and community reviews.",
        "NDIS support-item metadata and plan-manager friendly invoices.",
        "Verified vendor listings without pay-to-rank placement.",
      ]}
      safetyNote="MapAble will not claim products are automatically NDIS-funded. Pricing, registration status and suitability must stay accurate — marketplace commerce remains pilot-gated until readiness criteria pass."
      primaryCta={{ label: "Join pilot", href: "/contact" }}
      secondaryCta={{
        label: "Explore accessible places",
        href: "/accessibility-map",
      }}
    />
  );
}
