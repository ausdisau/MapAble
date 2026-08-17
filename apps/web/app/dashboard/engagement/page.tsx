import Link from "next/link";
import { redirect } from "next/navigation";

import { EngagementRightsPanel } from "@/components/engagement/EngagementRightsPanel";
import { requireAuth } from "@/lib/auth/guards";
import { isEngagementPlatformEnabled } from "@/lib/config/engagement";
import { resolveEngagementParticipantId } from "@/lib/engagement/engagement-access";
import {
  countOpenSubmissions,
  listEngagementSubmissions,
} from "@/lib/engagement/engagement-submission-service";
import { prisma } from "@/lib/prisma";

export const metadata = { title: "Your voice | MapAble Core" };

export default async function EngagementHubPage({
  searchParams,
}: {
  searchParams: Promise<{ participantId?: string }>;
}) {
  if (!isEngagementPlatformEnabled()) {
    redirect("/dashboard");
  }

  const user = await requireAuth();
  const params = await searchParams;

  const resolved = await resolveEngagementParticipantId({
    userId: user.id,
    role: user.primaryRole,
    requestedParticipantId:
      params.participantId ??
      (user.primaryRole === "participant" ? user.id : undefined),
  });

  if (!resolved) {
    return (
      <div className="space-y-4">
        <h1 className="font-heading text-2xl font-bold">Your voice</h1>
        <p className="text-muted-foreground">
          You need delegate consent from a participant to view their engagement
          submissions. Ask them to grant access from their Consent page.
        </p>
        <Link href="/dashboard/consent" className="text-primary hover:underline">
          Manage consent →
        </Link>
      </div>
    );
  }

  const [submissions, openCount, participant] = await Promise.all([
    listEngagementSubmissions(resolved.participantId, { limit: 20 }),
    countOpenSubmissions(resolved.participantId),
    prisma.user.findUnique({
      where: { id: resolved.participantId },
      select: { name: true },
    }),
  ]);

  const canSubmit =
    resolved.mode === "participant" ||
    resolved.mode === "delegate_submit" ||
    resolved.mode === "admin";

  return (
    <div className="space-y-8">
      <header>
        <h1 className="font-heading text-2xl font-bold">Your voice</h1>
        <p className="mt-2 max-w-2xl text-muted-foreground">
          Share feedback, track complaints, and see how your input leads to
          improvement. MapAble facilitates provider complaints processes —
          your support provider organisation remains responsible for resolution.
        </p>
        {resolved.mode.startsWith("delegate") && participant ? (
          <p className="mt-2 rounded-lg border border-primary/30 bg-primary/5 px-3 py-2 text-sm">
            Acting for <strong>{participant.name}</strong>
            {resolved.delegateScope ? ` (${resolved.delegateScope})` : ""}
          </p>
        ) : null}
      </header>

      <EngagementRightsPanel />

      <div className="flex flex-wrap gap-3">
        {canSubmit ? (
          <Link
            href={
              resolved.participantId !== user.id
                ? `/dashboard/engagement/new?participantId=${resolved.participantId}`
                : "/dashboard/engagement/new"
            }
            className="inline-flex min-h-10 items-center rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground hover:opacity-90"
          >
            Share feedback or complaint
          </Link>
        ) : null}
        <span className="inline-flex min-h-10 items-center rounded-lg border border-border px-4 text-sm text-muted-foreground">
          {openCount} open item{openCount === 1 ? "" : "s"}
        </span>
      </div>

      <section aria-labelledby="recent-submissions">
        <h2 id="recent-submissions" className="font-semibold">
          Recent submissions
        </h2>
        {submissions.length === 0 ? (
          <p className="mt-2 text-sm text-muted-foreground">
            No submissions yet. Your feedback helps providers improve.
          </p>
        ) : (
          <ul className="mt-4 space-y-3">
            {submissions.map((s) => (
              <li key={s.id}>
                <Link
                  href={`/dashboard/engagement/${s.id}`}
                  className="block rounded-xl border border-border bg-card p-4 hover:border-primary/40"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="font-medium">
                      {s.title ?? s.type.replace(/_/g, " ")}
                    </span>
                    <span className="text-xs uppercase tracking-wide text-muted-foreground">
                      {s.status.replace(/_/g, " ")}
                    </span>
                  </div>
                  <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">
                    {s.body}
                  </p>
                  <p className="mt-2 text-xs text-muted-foreground">
                    {s.createdAt.toLocaleDateString("en-AU")}
                  </p>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
