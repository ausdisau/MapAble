import type { Metadata } from "next";
import { notFound } from "next/navigation";

import SupportBuilderClient from "./SupportBuilderClient";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Build my support | MapAble",
  description:
    "Describe your support goals, build a draft package and explore local provider records with participant control.",
  robots: { index: false, follow: false },
};

export default function SupportBuilderPage() {
  if (
    process.env.VERCEL_ENV === "production" ||
    process.env.MAPABLE_SUPPORT_BUILDER_ENABLED !== "true"
  ) {
    notFound();
  }

  return (
    <SupportBuilderClient
      aiEnabled={process.env.MAPABLE_SUPPORT_BUILDER_AI_ENABLED === "true"}
    />
  );
}
