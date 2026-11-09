import Link from "next/link";
import { FormHugSurveyEmbed } from "@/components/access/FormHugSurveyEmbed";
import { MapAbleCareMarketingShell } from "@/components/marketing/MapAbleCareMarketingShell";
import { isTrustRecruitmentApproved } from "@/lib/access/formhug-surveys";

export const metadata = {
  title: "Trust and Inclusion Index | Research Draft | MapAble",
  description: "NDIS trust and service-quality research, gated until consent and accessibility review.",
};

export default function TrustInclusionPage() {
  const approved = isTrustRecruitmentApproved(process.env.MAPABLE_TRUST_INDEX_RECRUITMENT_APPROVED);
  return (
    <MapAbleCareMarketingShell>
      <main className="mx-auto max-w-5xl space-y-8 px-5 py-12 text-[#112D51] md:px-8">
        <header>
          <p className="text-sm font-bold uppercase tracking-wide text-[#005B7F]">Disability-led research · Draft</p>
          <h1 className="mt-3 text-4xl font-black">Trust in Disability Services and Inclusion Index</h1>
          <p className="mt-4 max-w-3xl text-lg">
            A proposed research study of service continuity, participant voice,
            accessibility and trust in NDIS policy. Not an official complaints or review process.
          </p>
        </header>
        {approved ? (
          <FormHugSurveyEmbed survey="trust" />
        ) : (
          <section role="status" className="rounded-xl border-l-4 border-[#A26714] bg-[#FFF8E9] p-6">
            <h2 className="text-xl font-bold">Research recruitment is not open</h2>
            <p className="mt-3">
              The submitted FormHug embed is a research draft. Recruitment is closed
              pending human approval of consent, privacy, withdrawal, research
              governance and assistive-technology testing. No answers are requested here.
            </p>
          </section>
        )}
        <Link href="/access-inclusion" className="font-semibold text-[#153B72] underline">
          Back to Access and Inclusion
        </Link>
      </main>
    </MapAbleCareMarketingShell>
  );
}
