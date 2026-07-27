import Link from "next/link";
import { notFound } from "next/navigation";

import { AccreditationStatusBadge } from "@/components/quality/AccreditationStatusBadge";
import { getApplicationDetail } from "@/lib/accreditation/provider-accreditation-service";
import { requireAdmin } from "@/lib/auth/guards";
import { qualityAccreditationConfig } from "@/lib/config/quality-accreditation";

export default async function AdminAccreditationDetailPage({
  params,
}: {
  params: Promise<{ applicationId: string }>;
}) {
  await requireAdmin();
  const { applicationId } = await params;

  if (!qualityAccreditationConfig.providerAccreditationEnabled) {
    notFound();
  }

  const application = await getApplicationDetail(applicationId);
  if (!application) notFound();

  const latestAssessment = application.assessments[0];

  return (
    <div className="space-y-6 p-6">
      <header>
        <Link href="/admin/accreditation" className="text-sm underline">
          ← Accreditation queue
        </Link>
        <h1 className="mt-2 font-heading text-2xl font-bold">
          {application.organisation.name}
        </h1>
        <AccreditationStatusBadge status={application.status} />
      </header>

      <section className="rounded-lg border p-4">
        <h2 className="font-semibold">Framework</h2>
        <p>
          {application.framework.name} v{application.framework.version}
        </p>
      </section>

      {application.accessAccreditationAssessment ? (
        <section className="rounded-lg border p-4">
          <h2 className="font-semibold">Linked Access Mark assessment</h2>
          <p className="text-sm">
            {application.accessAccreditationAssessment.place.name} —{" "}
            {application.accessAccreditationAssessment.tier ?? "unrated"}
          </p>
        </section>
      ) : null}

      {latestAssessment ? (
        <section className="rounded-lg border p-4">
          <h2 className="font-semibold">Evidence index (prepared for assessor)</h2>
          <p className="text-sm text-muted-foreground">
            {Array.isArray(latestAssessment.evidenceIndex)
              ? (latestAssessment.evidenceIndex as unknown[]).length
              : 0}{" "}
            requirement rows indexed
          </p>
        </section>
      ) : (
        <p className="text-sm text-muted-foreground">
          No evidence index prepared yet. Use the API to prepare assessment evidence.
        </p>
      )}

      <section className="rounded-lg border p-4">
        <h2 className="font-semibold">Event history</h2>
        <ul className="mt-2 space-y-1 text-sm">
          {application.events.map((e) => (
            <li key={e.id}>
              {e.createdAt.toISOString()} — {e.action}
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
