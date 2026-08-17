import { PublicInfoPage } from "@/components/marketing/PublicInfoPage";
import { canonicalAlternate } from "@/lib/config/canonical-url";

export const metadata = {
  title: "Privacy | MapAble",
  description:
    "MapAble privacy notice for public visitors and pilot participants.",
  alternates: canonicalAlternate("/privacy"),
};

export default function PrivacyPage() {
  return (
    <PublicInfoPage
      eyebrow="Privacy"
      title="Privacy notice"
      description="MapAble is being built around consent-controlled sharing, role-based access and auditability for sensitive participant information."
      ctaLabel="Contact privacy support"
      ctaHref="/contact"
      sections={[
        {
          title: "Information we may collect",
          content: (
            <p>
              Public website use may involve basic technical information such as
              browser, device and page interaction data. During pilot
              onboarding, MapAble may ask for profile, access-needs, provider or
              contact information. NDIS plan documents are optional and should
              only be shared through consent-controlled workflows when needed.
            </p>
          ),
        },
        {
          title: "Sensitive information",
          content: (
            <p>
              Disability, health, clinical, support and NDIS information is
              sensitive. MapAble is designed so this information is not stored
              inside identity-provider metadata and is only accessible through
              role and consent checks.
            </p>
          ),
        },
        {
          title: "Security approach",
          content: (
            <p>
              MapAble is planned around reasonable technical and organisational
              controls, including role-aware access, consent records, audit
              logs, data access logs and restricted document handling. Hosting,
              backups, logs and subprocessors remain under review before any
              data sovereignty claim is made.
            </p>
          ),
        },
        {
          title: "Your choices",
          content: (
            <p>
              You can contact MapAble to ask about access, correction, deletion
              or accessibility support. Some records may need to be retained
              where required for safety, legal, audit or dispute-handling
              reasons.
            </p>
          ),
        },
      ]}
    />
  );
}
