import Link from "next/link";

import { requireAdmin } from "@/lib/auth/guards";
import { prisma } from "@/lib/prisma";

export default async function AdminAccreditationPage() {
  await requireAdmin();
  const assessments = await prisma.accessAccreditationAssessment.findMany({
    orderBy: { updatedAt: "desc" },
    take: 30,
    include: { place: { select: { name: true, id: true } } },
  });

  return (
    <div className="p-6 space-y-4">
      <h1 className="text-2xl font-bold">Accreditation assessments</h1>
      <p className="text-sm text-muted-foreground">
        Assessor-controlled — venues cannot self-publish.
      </p>
      <ul className="space-y-2">
        {assessments.map((a) => (
          <li key={a.id}>
            <Link href={`/admin/access/accreditation/${a.id}`} className="underline">
              {a.place.name} — {a.status} {a.tier ? `(${a.tier})` : ""}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
