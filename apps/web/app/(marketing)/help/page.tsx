import Link from "next/link";

import { PublicInfoPage } from "@/components/marketing/PublicInfoPage";
import { canonicalAlternate } from "@/lib/config/canonical-url";

export const metadata = {
  title: "Help Centre | MapAble",
  description:
    "Get help with MapAble public pages, pilot interest and privacy requests.",
  alternates: canonicalAlternate("/help"),
};

export default function HelpPage() {
  return (
    <PublicInfoPage
      eyebrow="Help Centre"
      title="How can we help?"
      description="MapAble is preparing a controlled pilot. Use this help page for route-safe support options while the full support desk is being built."
      ctaLabel="Contact support"
      ctaHref="/contact"
      sections={[
        {
          title: "Participant help",
          content: (
            <p>
              You can explore public module pages and the provider finder
              without uploading an NDIS plan. Plan documents are optional and
              should only be shared through consent-controlled workflows when
              needed.
            </p>
          ),
        },
        {
          title: "Provider help",
          content: (
            <p>
              Providers can{" "}
              <Link
                href="/for-providers"
                className="font-medium text-primary hover:underline"
              >
                register interest
              </Link>{" "}
              in the pilot. Provider claims and credentials will need evidence
              before they are used for matching or operational decisions.
            </p>
          ),
        },
        {
          title: "Privacy and data requests",
          content: (
            <p>
              For privacy, correction or deletion requests, review{" "}
              <Link
                href="/privacy"
                className="font-medium text-primary hover:underline"
              >
                Privacy
              </Link>{" "}
              and{" "}
              <Link
                href="/data-deletion"
                className="font-medium text-primary hover:underline"
              >
                Data deletion
              </Link>
              .
            </p>
          ),
        },
      ]}
    />
  );
}
