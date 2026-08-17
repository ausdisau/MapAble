import { ApiCertificationReviewForm } from "@/app/admin/api-certification/ApiCertificationReviewForm";
import { listCertificationApplications } from "@/lib/api/certification/certification-service";
import { requireAdmin } from "@/lib/auth/guards";
import { API_CERTIFICATION_DISCLAIMER, isApiCertificationV2Enabled } from "@/lib/config/y5-rights-infrastructure";

export default async function ApiCertificationPage() {
  await requireAdmin();
  const apps = await listCertificationApplications();
  return (
    <div className="space-y-6">
      <h1 className="font-heading text-2xl font-bold">API certification</h1>
      <p className="text-sm text-muted-foreground">{API_CERTIFICATION_DISCLAIMER}</p>
      {!isApiCertificationV2Enabled() ? (
        <p className="text-amber-800">API_CERTIFICATION_V2_ENABLED is false.</p>
      ) : null}
      <ApiCertificationReviewForm />
      <ul className="space-y-2">
        {apps.map((a) => (
          <li key={a.id} className="rounded border p-3 text-sm">
            <strong>{a.appName}</strong> — {a.status}
            {a.certificationTier ? ` (${a.certificationTier})` : null}
            <p className="text-xs text-muted-foreground">ID: {a.id}</p>
          </li>
        ))}
      </ul>
    </div>
  );
}
