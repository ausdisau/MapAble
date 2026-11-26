import type { Metadata } from "next";
import { headers } from "next/headers";
import { notFound } from "next/navigation";

import { HealthcarePreview } from "@/components/telehealth/healthcare-preview/HealthcarePreview";
import { isHealthcareMediaLabEnabled } from "@/lib/telehealth/healthcare-media-lab";
import { isHealthcareMuseAvailable } from "@/lib/telehealth/healthcare-muse";

export const metadata: Metadata = {
  title: "Healthcare practice visit",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

export default async function HealthcarePreviewPage() {
  if (process.env.MAPABLE_HEALTHCARE_PREVIEW_ENABLED !== "true") notFound();
  const requestHeaders = await headers();
  return (
    <HealthcarePreview
      mediaLab={isHealthcareMediaLabEnabled(requestHeaders.get("host"))}
      museAvailable={isHealthcareMuseAvailable(requestHeaders.get("host"))}
    />
  );
}
