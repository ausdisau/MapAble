import { PublicModulePage } from "@/components/marketing/PublicModulePage";
import { canonicalAlternate } from "@/lib/config/canonical-url";

export const metadata = {
  title: "MapAble Moves | Mobility and rehabilitation supports",
  description:
    "Learn how MapAble Moves will help people find physical therapy, rehabilitation and mobility training supports.",
  alternates: canonicalAlternate("/moves"),
};

export default function MovesModulePage() {
  return (
    <PublicModulePage
      eyebrow="MapAble Moves"
      title="Move better with therapy and mobility supports you can trust."
      description="MapAble Moves is planned for physical therapy, rehabilitation and mobility training — connecting people to providers who understand disability and access needs."
      whoFor={[
        "Participants working on mobility, strength or rehabilitation goals.",
        "Allied health providers offering accessible therapy services.",
        "Support teams coordinating transport and care around therapy visits.",
      ]}
      availableNow={[
        "Public module information and pilot enquiry pathway.",
        "Provider finder and Care links for related supports.",
        "Transport programme information for therapy trip planning.",
      ]}
      comingSoon={[
        "Therapy discovery with accessibility requirements.",
        "Session scheduling handoffs with Care and Transport.",
        "Progress notes that stay under participant consent control.",
      ]}
      safetyNote="MapAble Moves will not claim clinical outcomes or prescribe therapy. Clinical decisions stay with qualified practitioners; the platform coordinates discovery and journey support only."
      primaryCta={{ label: "Join pilot", href: "/contact" }}
      secondaryCta={{
        label: "Learn about Transport",
        href: "/transport",
      }}
    />
  );
}
