import { PublicInfoPage } from "@/components/marketing/PublicInfoPage";
import { canonicalAlternate } from "@/lib/config/canonical-url";

export const metadata = {
  title: "Terms | MapAble",
  description: "MapAble public website and pilot terms summary.",
  alternates: canonicalAlternate("/terms"),
};

export default function TermsPage() {
  return (
    <PublicInfoPage
      eyebrow="Terms"
      title="Terms of use"
      description="These interim terms explain how the public website and pilot-facing pages should be understood while MapAble is being completed."
      ctaLabel="Contact MapAble"
      ctaHref="/contact"
      sections={[
        {
          title: "Website information",
          content: (
            <p>
              Public website content describes current and planned MapAble
              modules. Coming-soon content is not a production service
              commitment and should not be relied on as legal, funding, clinical
              or professional advice.
            </p>
          ),
        },
        {
          title: "No automatic NDIS approval",
          content: (
            <p>
              MapAble does not approve NDIS funding, submit claims without human
              confirmation or guarantee that a product or service will be
              funded. Pricing arrangements and service rules must be checked
              against the applicable live NDIS rules and provider obligations.
            </p>
          ),
        },
        {
          title: "High-risk actions",
          content: (
            <p>
              Invoice approval, claim submission, high-risk assignment, incident
              closure, complaint closure, role changes, sensitive exports and
              payment changes require appropriate human confirmation and
              permission checks.
            </p>
          ),
        },
        {
          title: "Acceptable use",
          content: (
            <p>
              Do not misuse the site, attempt to access participant information
              without permission, upload harmful content or represent unverified
              credentials as verified by MapAble.
            </p>
          ),
        },
      ]}
    />
  );
}
