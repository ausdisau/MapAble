import Link from "next/link";

import { requireAdmin } from "@/lib/auth/guards";
import { prisma } from "@/lib/prisma";

export default async function AdminAiMatchingPage() {
  await requireAdmin();
  const runs = await prisma.aiMatchRun.findMany({
    orderBy: { createdAt: "desc" },
    take: 30,
  });

  return (
    <div className="space-y-6">
      <h1 className="font-heading text-2xl font-bold">AI-assisted matching</h1>
      <p className="text-muted-foreground">
        Recommendations require human review and fairness checks. Not autonomous
        assignment.
      </p>
      <ul className="space-y-2">
        {runs.map((r) => (
          <li key={r.id}>
            <Link href={`/admin/ai-matching/${r.id}`} className="text-primary underline">
              {r.status} — {r.createdAt.toLocaleDateString("en-AU")}
            </Link>
          </li>
        ))}
      </ul>
      <Link href="/admin/fairness" className="text-primary underline">
        Fairness reviews
      </Link>
    </div>
  );
}
