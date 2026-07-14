import Link from "next/link";

import { ApplicationsPanel } from "@/components/jobs/ApplicationsPanel";
import { EmploymentGoalsPanel } from "@/components/jobs/EmploymentGoalsPanel";
import { EmploymentProfileSummary } from "@/components/jobs/EmploymentProfileSummary";
import { MatchExplanationPanel } from "@/components/jobs/MatchExplanationPanel";
import { requireAuth } from "@/lib/auth/guards";
import { jobsParticipationConfig } from "@/lib/config/jobs-participation";
import { listParticipantApplications } from "@/lib/jobs/applications/participant-application-service";
import { listMatchExplanations } from "@/lib/jobs/matching/match-explanation-service";
import { getEmploymentProfile } from "@/lib/jobs/participants/employment-profile-service";

export const metadata = { title: "Jobs and work | MapAble" };

export default async function ParticipantJobsPage() {
  const user = await requireAuth();

  const enabled = jobsParticipationConfig.enabled;
  const [profile, applications, matches] = enabled
    ? await Promise.all([
        getEmploymentProfile(user.id),
        listParticipantApplications(user.id),
        jobsParticipationConfig.matchingExplanationsEnabled
          ? listMatchExplanations(user.id)
          : Promise.resolve([]),
      ])
    : [null, [], []];

  return (
    <div className="space-y-6">
      <header>
        <h1 className="font-heading text-2xl font-bold">Jobs and economic participation</h1>
        <p className="text-muted-foreground">
          Build your employment profile, review transparent match explanations, and control
          what employers see. MapAble never auto-rejects applicants or scores employability.
        </p>
      </header>

      {!enabled ? (
        <p className="rounded-lg border border-dashed p-4 text-sm" role="status">
          Jobs participation is not enabled in this environment.
        </p>
      ) : (
        <>
          <EmploymentProfileSummary profile={profile} />
          <EmploymentGoalsPanel goals={profile?.goals ?? []} />
          <ApplicationsPanel applications={applications} />

          {jobsParticipationConfig.matchingExplanationsEnabled && matches.length > 0 ? (
            <section aria-labelledby="matches-heading" className="space-y-4">
              <h2 id="matches-heading" className="font-heading text-lg font-semibold">
                Match explanations
              </h2>
              {matches.map((match) => (
                <MatchExplanationPanel key={match.id} match={match} />
              ))}
            </section>
          ) : null}

          <nav aria-label="Jobs actions" className="flex flex-wrap gap-4">
            <Link className="inline-flex min-h-11 items-center underline" href="/dashboard/jobs">
              Browse published jobs
            </Link>
            <Link
              className="inline-flex min-h-11 items-center underline"
              href="/dashboard/jobs/applications"
            >
              Application dashboard
            </Link>
          </nav>
        </>
      )}
    </div>
  );
}
