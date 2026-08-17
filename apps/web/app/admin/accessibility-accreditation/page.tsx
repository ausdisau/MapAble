import { requireAdmin } from "@/lib/auth/guards";
import { prisma } from "@/lib/prisma";

export default async function AccessibilityAccreditationPage() {
  await requireAdmin();
  const cases = await prisma.accessibilityAccreditationCase.findMany({
    take: 20,
    include: { scores: true },
  });

  return (
    <div className="space-y-6">
      <h1 className="font-heading text-2xl font-bold">Accessibility accreditation</h1>
      <p className="text-muted-foreground">
        Assessment types are labelled clearly — not legal certification unless
        external audit is recorded.
      </p>
      <ul className="space-y-3">
        {cases.map((c) => (
          <li key={c.id} className="rounded-lg border p-4">
            <p className="font-medium">
              {c.entityType} — {c.assessmentType.replace(/_/g, " ")}
            </p>
            <p className="text-sm italic">{c.disclaimer}</p>
          </li>
        ))}
      </ul>
    </div>
  );
}
