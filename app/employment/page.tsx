import { ModuleCanvasSection } from "@/components/canvas/ModuleCanvasSection";
import { PublicModulePage } from "@/components/marketing/PublicModulePage";
import { canonicalAlternate } from "@/lib/config/canonical-url";

export const metadata = {
  title: "MapAble Employment | Inclusive work pathways",
  description:
    "Learn how MapAble Employment will support accessible job search, disclosure control and reasonable adjustment requests.",
  alternates: canonicalAlternate("/employment"),
};

export default function EmploymentPage() {
  return (
    <>
      <PublicModulePage
        eyebrow="MapAble Employment"
        title="Inclusive employment pathways where disclosure stays in your control."
        description="MapAble Employment is planned for job seekers, employers and support teams who need accessible job posts, reasonable adjustment requests and careful handling of access information."
        whoFor={[
          "Disabled job seekers exploring inclusive opportunities.",
          "Employers who want to publish accessible, adjustment-aware roles.",
          "Support coordinators and employment partners tracking goals.",
        ]}
        availableNow={[
          "Public module information and pilot contact path.",
          "Signed-in jobs routes for invited pilot users.",
          "Provider finder entry points for employment-related support.",
        ]}
        comingSoon={[
          "Job seeker profiles with controlled disclosure settings.",
          "Accessible job posts and application tracking.",
          "Reasonable adjustment request workflow and employment goals.",
        ]}
        safetyNote="Job seekers will control whether disability, access needs or adjustment information is shared. MapAble will not support automated rejection based on access needs."
        primaryCta={{ label: "Join pilot", href: "/contact" }}
        secondaryCta={{
          label: "Explore provider finder",
          href: "/providers?service=employment",
        }}
      />
      <ModuleCanvasSection module="employment" />
    </>
  );
}
