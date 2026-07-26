import { requireAdmin } from "@/lib/auth/guards";
import { phase9Config } from "@/lib/config/phase9";
import { listPartnerEnrollments } from "@/lib/partner/api-program/enrollment-service";

export default async function PartnerApiProgramPage() {
  await requireAdmin();
  const enrollments = await listPartnerEnrollments();
  return (
    <div className="space-y-6">
      <h1 className="font-heading text-2xl font-bold">Partner API program</h1>
      {!phase9Config.publicApiPartnerProgramEnabled ? (
        <p className="rounded border border-amber-300 bg-amber-50 p-4 text-amber-950">
          PUBLIC_API_PARTNER_PROGRAM_ENABLED is false.
        </p>
      ) : null}
      <ul className="space-y-2">
        {enrollments.map((e) => (
          <li key={e.id} className="rounded border p-3 text-sm">
            {e.organisationId.slice(0, 8)} — {e.programTier} ({e.status})
          </li>
        ))}
      </ul>
    </div>
  );
}
