import { ACCOUNTABILITY_TRANSPARENCY_DISCLAIMER } from "@/lib/config/y5-rights-infrastructure";
import { listPublishedCivicAudits } from "@/lib/platform/institutional-permanence/permanence-service";

export default async function AuditIndexPage() {
  const audits = await listPublishedCivicAudits();

  return (
    <div className="mx-auto max-w-3xl space-y-6 p-6">
      <h1 className="font-heading text-2xl font-bold">Civic audit index</h1>
      <p className="text-sm text-muted-foreground">{ACCOUNTABILITY_TRANSPARENCY_DISCLAIMER}</p>
      <ul className="space-y-4">
        {audits.map((a) => (
          <li key={a.id} className="rounded-lg border p-4">
            <h2 className="font-semibold">{a.title}</h2>
            <p className="text-sm">Year: {a.auditYear}</p>
            {a.overallScore != null ? (
              <p className="text-sm">Overall score: {a.overallScore}</p>
            ) : null}
          </li>
        ))}
        {audits.length === 0 ? (
          <li className="text-sm text-muted-foreground">No audits published.</li>
        ) : null}
      </ul>
    </div>
  );
}
