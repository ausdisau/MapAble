import Link from "next/link";

import { requireAdmin } from "@/lib/auth/guards";
import { prisma } from "@/lib/prisma";

export default async function AdminContractsPage() {
  await requireAdmin();
  const contracts = await prisma.smartContract.findMany({
    orderBy: { code: "asc" },
  });

  return (
    <div className="space-y-6">
      <h1 className="font-heading text-2xl font-bold">Smart contracts</h1>
      <p className="text-muted-foreground">
        Internal governance rules — not blockchain. Runs can pass, block, or
        require review.
      </p>
      <ul className="space-y-2">
        {contracts.map((c) => (
          <li key={c.id} className="rounded-lg border p-4">
            <strong>{c.code}</strong> — {c.name} ({c.status})
            <p className="text-sm text-muted-foreground">{c.description}</p>
          </li>
        ))}
      </ul>
      <Link href="/admin/contracts/runs" className="text-primary underline">
        View contract runs
      </Link>
    </div>
  );
}
