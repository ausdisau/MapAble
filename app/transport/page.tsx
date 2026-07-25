import { TransportPublicLanding } from "@/components/transport/public/TransportPublicLanding";
import { canonicalAlternate } from "@/lib/config/canonical-url";
import { TRANSPORT_PUBLIC_SUPPORTING } from "@/lib/transport/public-copy";

export const metadata = {
  title: "MapAble Transport | Accessible travel",
  description: TRANSPORT_PUBLIC_SUPPORTING,
  alternates: canonicalAlternate("/transport"),
};

export default function TransportHubPage() {
  return <TransportPublicLanding />;
}
