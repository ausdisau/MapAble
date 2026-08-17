import { requireAdmin } from "@/lib/auth/guards";
import { prisma } from "@/lib/prisma";

export default async function AdminFairnessPage() {
  await requireAdmin();
  const checks = await prisma.fairnessCheck.findMany({
    orderBy: { createdAt: "desc" },
    take: 30,
    include: { aiMatchRun: true },
  });

  return (
    <div className="space-y-6">
      <h1 className="font-heading text-2xl font-bold">Fairness reviews</h1>
      <table className="w-full text-sm">
        <caption className="sr-only">Fairness checks</caption>
        <thead>
          <tr>
            <th scope="col">Status</th>
            <th scope="col">Summary</th>
            <th scope="col">Run</th>
          </tr>
        </thead>
        <tbody>
          {checks.map((c) => (
            <tr key={c.id} className="border-t">
              <td>{c.status}</td>
              <td>{c.summary}</td>
              <td>{c.aiMatchRunId.slice(0, 8)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
