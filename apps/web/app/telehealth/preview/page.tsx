import type { Metadata } from "next";
import { headers } from "next/headers";
import { notFound } from "next/navigation";

import { HealthcarePreview } from "@/components/telehealth/healthcare-preview/HealthcarePreview";
import { availableHealthcareCoachProviders } from "@/lib/telehealth/healthcare-coach-providers";
import { isHealthcareMediaLabEnabled } from "@/lib/telehealth/healthcare-media-lab";

export const metadata: Metadata = {
  title: "Healthcare practice visit",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

export default async function HealthcarePreviewPage() {
  if (process.env.MAPABLE_HEALTHCARE_PREVIEW_ENABLED !== "true") notFound();
  const host = (await headers()).get("host");
  return (
    <HealthcarePreview
      mediaLab={isHealthcareMediaLabEnabled(host)}
      coachProviders={availableHealthcareCoachProviders(host)}
    />
  );
}
