import type { Metadata } from "next";

import { MapAbleCareCombinedHomepageSections } from "@/components/marketing/MapAbleCareCombinedHomepage";

export const metadata: Metadata = {
  title: "MapAble | Accessible places, supports, and journeys",
  description:
    "Find accessible places, NDIS-aware providers, accessible transport, and support journeys you can actually use. Evidence-based access information for Australia.",
  alternates: { canonical: "/" },
  openGraph: {
    url: "/",
    title: "MapAble | Accessible places, supports, and journeys",
    description:
      "MapAble connects verified accessibility information, providers, transport, and support coordination.",
  },
};

export default function Page() {
  return <MapAbleCareCombinedHomepageSections />;
}
