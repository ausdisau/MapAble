import { PublicInfoPage } from "@/components/marketing/PublicInfoPage";

export const metadata = {
  title: "Pricing | MapAble",
  description:
    "MapAble pricing and billing model status for participants and providers.",
};

export default function PricingPage() {
  return (
    <PublicInfoPage
      eyebrow="Pricing"
      title="Pricing model under review for pilot partners."
      description="MapAble pricing, provider fees and payment workflows will be published only after the commercial model, safeguards and billing rules are confirmed."
      ctaLabel="Ask about pilot pricing"
      ctaHref="/contact"
      sections={[
        {
          title: "Available now",
          content: (
            <p>
              Pricing is not yet published as a production offer. Pilot partners
              can contact MapAble to discuss scope, support needs and what parts
              of the platform are available for evaluation.
            </p>
          ),
        },
        {
          title: "Billing principles",
          content: (
            <ul className="list-disc space-y-2 pl-5">
              <li>Invoices require evidence and server-side validation.</li>
              <li>
                Participants or nominees can approve or dispute where
                configured.
              </li>
              <li>Plan manager access requires consent or an agreed link.</li>
              <li>
                MapAble will not claim NDIS funding approval for a service.
              </li>
            </ul>
          ),
        },
        {
          title: "Coming soon",
          content: (
            <p>
              Provider plans, transaction fees and any paid placement options
              will be documented with safety controls before being made
              available.
            </p>
          ),
        },
      ]}
    />
  );
}
