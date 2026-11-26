import type { Metadata } from "next";
import { headers } from "next/headers";
import { notFound } from "next/navigation";

import { MediaLab } from "@/components/telehealth/healthcare-preview/MediaLab";
import { isHealthcareMediaLabEnabled } from "@/lib/telehealth/healthcare-media-lab";

export const metadata: Metadata = {
  title: "Local media lab",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

export default async function HealthcareMediaLabPage() {
  const requestHeaders = await headers();
  if (!isHealthcareMediaLabEnabled(requestHeaders.get("host"))) notFound();
  return <MediaLab />;
}
