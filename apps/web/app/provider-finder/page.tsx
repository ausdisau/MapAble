import type { Metadata } from "next";
import { Suspense } from "react";

import { canonicalAlternate } from "@/lib/config/canonical-url";
import { getInterpreterDisplayName } from "@/lib/config/search-interpreter";

import ProviderFinderClient from "./ProviderFinderClient";

export const metadata: Metadata = {
  title: "Find NDIS providers & accessible support near you",
  description:
    "Search accessible places and NDIS providers across Australia. Filter by support type, access needs, and inclusive community services with MapAble Australia.",
  alternates: canonicalAlternate("/provider-finder"),
  openGraph: {
    title: "Find NDIS providers & accessible support near you",
    description:
      "Discover NDIS providers, accessible places, and inclusive community supports near you.",
  },
};

export default function Page() {
  const modelLabel = getInterpreterDisplayName();

  return (
    <Suspense
      fallback={
        <p className="container mx-auto px-4 py-12 text-muted-foreground">
          Loading provider finder…
        </p>
      }
    >
      <ProviderFinderClient modelLabel={modelLabel} />
    </Suspense>
  );
}
