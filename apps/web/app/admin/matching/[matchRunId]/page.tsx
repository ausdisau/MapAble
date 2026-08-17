import Link from "next/link";
import { notFound } from "next/navigation";

import { MatchCandidateCard } from "@/components/matching/MatchCandidateCard";
import { requireAdmin } from "@/lib/auth/guards";
import { prisma } from "@/lib/prisma";

export default async function MatchRunDetailPage({
  params,
}: {
  params: Promise<{ matchRunId: string }>;
}) {
  await requireAdmin();
  const { matchRunId } = await params;
  const run = await prisma.matchRun.findUnique({
    where: { id: matchRunId },
    include: {
      candidates: { include: { factors: true }, orderBy: { score: "desc" } },
    },
  });
  if (!run) notFound();

  return (
    <div className="space-y-6">
      <Link href="/admin/matching" className="text-sm text-primary underline">
        Back to matching
      </Link>
      <header>
        <h1 className="font-heading text-2xl font-bold">Match run</h1>
        <p className="text-muted-foreground">
          {run.matchType} — {run.status}. Scores are explainable; selection
          requires human confirmation.
        </p>
      </header>
      <ul className="space-y-4">
        {run.candidates.map((c) => (
          <li key={c.id}>
            <MatchCandidateCard candidate={c} matchRunId={run.id} />
          </li>
        ))}
      </ul>
    </div>
  );
}
