import Link from "next/link";
import { FormHugSurveyEmbed } from "@/components/access/FormHugSurveyEmbed";

export const metadata = {
  title: "Community Accessibility Survey (Pilot) | MapAble Access",
  description: "Voluntary reports about public-place and connected-journey access, with evidence and consent controls.",
};

export default function CommunityAccessSurveyPage() {
  return (
    <main className="mx-auto max-w-5xl space-y-8 px-5 py-12 text-[#112D51] md:px-8">
      <header>
        <p className="text-sm font-bold uppercase tracking-wide text-[#005B7F]">MapAble Access · Community pilot</p>
        <h1 className="mt-3 text-4xl font-black tracking-tight">Access and Inclusion is the real AI</h1>
        <p className="mt-4 max-w-3xl text-lg leading-relaxed">
          Report what you observed at a public place, on a path or during a journey.
          Your report is not a professional assessment or an accessibility guarantee.
        </p>
      </header>
      <section className="rounded-xl border-l-4 border-[#A26714] bg-[#FFF8E9] p-5" aria-label="Pilot safeguards">
        <p className="font-bold">Evidence is not certification</p>
        <p className="mt-2">
          Community observations are unverified until reviewed. Unknown does not
          mean Green. Not Applicable, Disputed and Outdated are separate findings.
          A single access feature does not establish the status of an entire venue.
        </p>
      </section>
      <FormHugSurveyEmbed survey="community" />
      <section aria-labelledby="survey-guidance-heading">
        <h2 id="survey-guidance-heading" className="text-2xl font-bold">Your safety and privacy</h2>
        <ul className="mt-3 list-disc space-y-2 pl-6">
          <li>Do not submit private home addresses, diagnoses, identifiable bystanders or licence plates.</li>
          <li>Only upload evidence you have permission to share.</li>
          <li>Choose whether a de-identified observation may be considered for public reporting.</li>
          <li>Immediate hazards must be reported directly to the responsible authority.</li>
        </ul>
        <Link href="/access" className="mt-5 inline-block font-semibold text-[#153B72] underline">
          Back to MapAble Access
        </Link>
      </section>
    </main>
  );
}
