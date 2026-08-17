import { PublicModulePage } from "@/components/marketing/PublicModulePage";
import { canonicalAlternate } from "@/lib/config/canonical-url";

export const metadata = {
  title: "MapAble Kids | Family and early supports",
  description:
    "Learn how MapAble Kids will support families seeking early intervention, therapy and school-related disability supports.",
  alternates: canonicalAlternate("/kids"),
};

export default function KidsModulePage() {
  return (
    <PublicModulePage
      eyebrow="MapAble Kids"
      title="Family-centred pathways for early supports and school-related help."
      description="MapAble Kids is planned to help families find early intervention, therapy and school support options with clear consent and privacy for children’s information."
      whoFor={[
        "Families seeking early intervention and therapy pathways.",
        "Support coordinators helping children and young people.",
        "Schools and community partners coordinating accessible supports.",
      ]}
      availableNow={[
        "Public module information and pilot contact path.",
        "Provider finder entry points for related family supports.",
        "Links to Care and Access Map for overlapping needs.",
      ]}
      comingSoon={[
        "Child-aware profiles with guardian-controlled disclosure.",
        "Therapy and early intervention discovery workflows.",
        "School support coordination tools for invited pilots.",
      ]}
      safetyNote="Children’s data needs stronger safeguards. MapAble will not market live Kids booking or claim school placement decisions. Guardian consent and human review remain mandatory."
      primaryCta={{ label: "Join pilot", href: "/contact" }}
      secondaryCta={{
        label: "Explore provider finder",
        href: "/provider-finder",
      }}
    />
  );
}
