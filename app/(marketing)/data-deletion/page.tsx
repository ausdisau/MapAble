import { PublicInfoPage } from "@/components/marketing/PublicInfoPage";
import { canonicalAlternate } from "@/lib/config/canonical-url";

export const metadata = {
  title: "Data deletion | MapAble",
  description:
    "How to request deletion or review of personal information held by MapAble.",
  alternates: canonicalAlternate("/data-deletion"),
};

export default function DataDeletionPage() {
  return (
    <PublicInfoPage
      eyebrow="Data deletion"
      title="Request deletion or review of your data"
      description="MapAble is being designed to support privacy requests while preserving records that must be retained for safety, audit, dispute or legal reasons."
      ctaLabel="Start a data request"
      ctaHref="/contact"
      sections={[
        {
          title: "How to request deletion",
          content: (
            <p>
              Contact MapAble with the email address used for your account or
              pilot enquiry. We may need to verify your identity before acting
              on a deletion, correction or access request.
            </p>
          ),
        },
        {
          title: "What can be deleted",
          content: (
            <p>
              Public enquiry records, inactive profile details and optional
              documents can generally be reviewed for deletion when they are no
              longer needed. Some audit, safety, billing, incident or dispute
              records may need to be retained or de-identified instead.
            </p>
          ),
        },
        {
          title: "Consent changes",
          content: (
            <p>
              Withdrawal of consent should stop future sharing where possible,
              but it may not remove records already needed for safety, service
              delivery, legal obligations or dispute handling.
            </p>
          ),
        },
      ]}
    />
  );
}
