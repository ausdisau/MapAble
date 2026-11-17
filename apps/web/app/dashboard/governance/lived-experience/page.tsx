import { notFound } from "next/navigation";

import { getCurrentUser, userHasRole } from "@/lib/auth/current-user";
import {
  LEIL_POLICY_VERSION,
  prepareLivedExperienceBrief,
  type GovernedChange,
} from "@/lib/governance/lived-experience-loop/agent";

export const dynamic = "force-dynamic";

const PREVIEW: GovernedChange = {
  changeId: "SYNTHETIC-EXAMPLE",
  title: "Accessible Provider Finder communication flow",
  summary: "Synthetic co-design prompt for an AAC and switch-accessibility review.",
  codeDigest: "0".repeat(64),
  affectedModules: ["provider_finder"],
  affectedCohorts: ["communication_disability", "physical_disability"],
  participantFacing: true,
  affectsRights: true,
  includesAi: false,
  milestone: "prototype",
  accessibleBriefRef: "synthetic-example-only",
  feedbackDispositionRef: "not-recorded",
};

export default async function LivedExperienceGovernancePage() {
  // Governance preview is never available in production.
  if (process.env.MAPABLE_LEIL_PREVIEW_ENABLED !== "true" ||
      process.env.VERCEL_ENV === "production") notFound();

  const user = await getCurrentUser();
  if (!user || !userHasRole(user, "mapable_admin")) notFound();

  const brief = prepareLivedExperienceBrief(PREVIEW);

  return (
    <main className="mx-auto max-w-4xl space-y-6 px-4 py-8">
      <header className="space-y-2">
        <p className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          MapAble Governance · {LEIL_POLICY_VERSION}
        </p>
        <h1 className="text-3xl font-semibold">Lived Experience in the Loop</h1>
        <p className="max-w-prose text-base">
          Disability-led co-design is part of product governance. This restricted page is a
          synthetic preview, not a reviewer portal or evidence of contributor approval.
        </p>
      </header>

      <section aria-labelledby="leil-review" className="rounded-xl border p-5">
        <h2 id="leil-review" className="text-xl font-semibold">Human review status</h2>
        <p className="mt-2 font-medium">HOLD — authentic co-design evidence not recorded.</p>
        <p className="mt-2 max-w-prose text-sm">
          AI cannot authorise a release, claim to speak for disabled people, or replace paid,
          independently verified co-design. Real contributors must be recruited, supported,
          paid and empowered to disagree. Release decisions remain with authorised humans.
        </p>
        <dl className="mt-4 grid gap-3 sm:grid-cols-2">
          <div className="rounded-lg bg-muted p-3">
            <dt className="text-sm font-semibold">Stage requirements</dt>
            <dd className="text-sm">{brief.requiredStages.join(" → ")}</dd>
          </div>
          <div className="rounded-lg bg-muted p-3">
            <dt className="text-sm font-semibold">Approved endorsements</dt>
            <dd className="text-sm">None verified for this synthetic example</dd>
          </div>
        </dl>
      </section>

      <section aria-labelledby="leil-brief" className="rounded-xl border p-5">
        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Synthetic example · Draft for human facilitators
        </p>
        <h2 id="leil-brief" className="mt-2 text-xl font-semibold">{brief.title}</h2>
        <p className="mt-2 text-sm">
          Suggested review questions are not participant feedback or human testimony.
        </p>
        <ol className="mt-4 list-decimal space-y-3 pl-6">
          {brief.questions.map((question) => (
            <li key={question}>{question}</li>
          ))}
        </ol>
      </section>

      <section aria-labelledby="leil-controls" className="rounded-xl border p-5">
        <h2 id="leil-controls" className="text-xl font-semibold">Non-negotiable safeguards</h2>
        <ul className="mt-3 list-disc space-y-2 pl-6">
          {brief.safeguards.map((safeguard) => <li key={safeguard}>{safeguard}</li>)}
        </ul>
        <p className="mt-4 text-sm">
          This demonstration does not create sign-offs, accept personal stories, submit
          feedback, manage reviewer identities, or grant production release authority.
        </p>
      </section>
    </main>
  );
}
