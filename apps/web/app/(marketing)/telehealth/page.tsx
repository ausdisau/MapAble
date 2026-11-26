import Link from "next/link";

import { PublicModulePage } from "@/components/marketing/PublicModulePage";

export const metadata = {
  title: "MapAble Telehealth | Accessible remote support",
  description:
    "Learn how MapAble Telehealth will support consent-aware remote appointments and evidence records.",
};

export default function TelehealthPage() {
  const preview = process.env.MAPABLE_HEALTHCARE_PREVIEW_ENABLED === "true";
  return (
    <PublicModulePage
      eyebrow="MapAble Telehealth"
      title="Remote support appointments with consent, privacy and evidence built in."
      description="MapAble Telehealth is planned for accessible remote appointments, consent prompts and appointment evidence that can connect to the wider MapAble service loop."
      whoFor={[
        "Participants needing remote check-ins or support sessions.",
        "Allied health practitioners and providers offering telehealth.",
        "Support coordinators helping participants prepare for appointments.",
      ]}
      availableNow={[
        "Public module information and pilot contact pathway.",
        "Signed-in pilot routes where enabled for invited users.",
        "Accessibility-first appointment design principles.",
        ...(preview
          ? [
              "A synthetic web practice visit for exploring the participant journey.",
            ]
          : []),
      ]}
      comingSoon={[
        "Waiting room, consent prompts and appointment reminders.",
        "Telehealth session evidence and service log linkage.",
        "Provider operations controls for appointment management.",
      ]}
      safetyNote={
        <>
          Telehealth records and appointment details are sensitive. MapAble will
          keep clinical and support information out of identity-provider
          metadata and restrict access by role and consent.
          {preview && (
            <p className="mt-2">
              <Link className="underline" href="/for-providers">
                Register as a provider
              </Link>
            </p>
          )}
        </>
      }
      primaryCta={{ label: "Join pilot", href: "/contact" }}
      secondaryCta={
        preview
          ? { label: "Try a practice visit", href: "/telehealth/preview" }
          : { label: "Register as provider", href: "/for-providers" }
      }
    />
  );
}
