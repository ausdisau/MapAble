import Link from "next/link";

import { requireAdmin } from "@/lib/auth/guards";
import { prisma } from "@/lib/prisma";

export default async function AdminMatchingPage() {
  await requireAdmin();
  const runs = await prisma.matchRun.findMany({
    orderBy: { createdAt: "desc" },
    take: 30,
  });

  return (
    <div className="space-y-6">
      <h1 className="font-heading text-2xl font-bold">Matching runs</h1>
      <p className="text-muted-foreground">
        Explainable rule-based matching — not AI. Human confirmation required for
        assignment.
      </p>
      <ul className="space-y-2">
        {runs.map((r) => (
          <li key={r.id}>
            <Link href={`/admin/matching/${r.id}`} className="text-primary underline">
              {r.matchType} — {r.status} ({r.createdAt.toLocaleDateString("en-AU")})
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
