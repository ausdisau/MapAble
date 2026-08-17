import Link from "next/link";
import { notFound, redirect } from "next/navigation";

import { CommissionEscalationPanel } from "@/components/engagement/CommissionEscalationPanel";
import { requireAuth } from "@/lib/auth/guards";
import { isEngagementPlatformEnabled } from "@/lib/config/engagement";
import { resolveEngagementContext } from "@/lib/engagement/engagement-context-resolver";
import { getEngagementSubmissionForUser } from "@/lib/engagement/engagement-submission-service";

export const metadata = { title: "Submission detail | MapAble Core" };

export default async function EngagementDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  if (!isEngagementPlatformEnabled()) redirect("/dashboard");

  const user = await requireAuth();
  const { id } = await params;

  const submission = await getEngagementSubmissionForUser(
    id,
    user.id,
    user.primaryRole
  );
  if (!submission) notFound();

  const context = await resolveEngagementContext(
    submission.contextType,
    submission.contextId
  );

  return (
    <div className="space-y-6 max-w-2xl">
      <header>
        <Link href="/dashboard/engagement" className="text-sm text-primary hover:underline">
          ← Back to Your voice
        </Link>
        <h1 className="mt-2 font-heading text-2xl font-bold">
          {submission.title ?? submission.type.replace(/_/g, " ")}
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Status: <strong className="text-foreground">{submission.status.replace(/_/g, " ")}</strong>
          {" · "}
          Submitted {submission.createdAt.toLocaleDateString("en-AU")}
        </p>
        {submission.acknowledgedAt ? (
          <p className="text-sm text-muted-foreground">
            Acknowledged {submission.acknowledgedAt.toLocaleDateString("en-AU")}
          </p>
        ) : submission.acknowledgementDueAt ? (
          <p className="text-sm text-muted-foreground">
            Acknowledgement due by{" "}
            {submission.acknowledgementDueAt.toLocaleDateString("en-AU")}
          </p>
        ) : null}
      </header>

      <section className="rounded-xl border border-border bg-card p-5">
        <h2 className="font-semibold">Your submission</h2>
        <p className="mt-2 whitespace-pre-wrap text-sm">{submission.body}</p>
        {context ? (
          <p className="mt-3 text-xs text-muted-foreground">
            Related to: {context.label}
            {context.organisationName ? ` (${context.organisationName})` : ""}
          </p>
        ) : null}
      </section>

      {submission.type === "complaint" ? (
        <CommissionEscalationPanel
          submissionId={submission.id}
          alreadyEscalated={submission.escalatedExternal}
        />
      ) : null}

      {submission.improvementActions.length > 0 ? (
        <section aria-labelledby="improvements-heading">
          <h2 id="improvements-heading" className="font-semibold">
            Improvement actions
          </h2>
          <ul className="mt-3 space-y-3">
            {submission.improvementActions.map((a) => (
              <li
                key={a.id}
                className="rounded-xl border border-border bg-muted/20 p-4 text-sm"
              >
                <p className="font-medium">{a.title}</p>
                <p className="mt-1 text-muted-foreground">{a.summary}</p>
                {a.ciReferenceCode ? (
                  <p className="mt-2 text-xs text-muted-foreground">
                    Reference: {a.ciReferenceCode}
                  </p>
                ) : null}
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {submission.events.length > 0 ? (
        <section aria-labelledby="timeline-heading">
          <h2 id="timeline-heading" className="font-semibold">
            Timeline
          </h2>
          <ol className="mt-3 space-y-2 border-l-2 border-border pl-4 text-sm">
            {submission.events.map((e) => (
              <li key={e.id}>
                <span className="font-medium">{e.eventType.replace(/_/g, " ")}</span>
                <span className="text-muted-foreground">
                  {" "}
                  · {e.createdAt.toLocaleString("en-AU")}
                </span>
                {e.note ? (
                  <p className="text-muted-foreground">{e.note}</p>
                ) : null}
              </li>
            ))}
          </ol>
        </section>
      ) : null}
    </div>
  );
}
