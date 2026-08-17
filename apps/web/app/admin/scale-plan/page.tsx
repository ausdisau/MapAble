import { requireAdmin } from "@/lib/auth/guards";
import { prisma } from "@/lib/prisma";

export default async function ScalePlanPage() {
  await requireAdmin();
  const plans = await prisma.scalePlan.findMany({
    include: { milestones: true },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="space-y-6">
      <h1 className="font-heading text-2xl font-bold">Scale plan</h1>
      <ul className="space-y-4">
        {plans.map((p) => (
          <li key={p.id} className="rounded-lg border p-4">
            <h2 className="font-medium">{p.title}</h2>
            <p className="text-sm">
              Board approved: {p.boardApproved ? "Yes" : "No"} — {p.milestones.length}{" "}
              milestones
            </p>
          </li>
        ))}
      </ul>
    </div>
  );
}
