import Link from "next/link";

import { WorkerTrainingClient } from "@/components/provider/WorkerTrainingClient";
import { requireAuth, requirePermission } from "@/lib/auth/guards";
import { isEngagementPlatformEnabled } from "@/lib/config/engagement";
import { getProviderOrganisationIds } from "@/lib/engagement/engagement-access";
import {
  getWorkerComplianceStatus,
  listTrainingModules,
} from "@/lib/engagement/worker-training-service";

export const metadata = { title: "Complaints training | Provider" };

export default async function ProviderTrainingPage() {
  const user = await requireAuth();
  await requirePermission("engagement:provider:read");

  if (!isEngagementPlatformEnabled()) {
    return <p>Engagement platform is disabled.</p>;
  }

  const orgIds = await getProviderOrganisationIds(user.id);
  const orgId = orgIds[0];

  const [modules, compliance] = await Promise.all([
    listTrainingModules(orgId),
    orgId ? getWorkerComplianceStatus(orgId) : Promise.resolve([]),
  ]);

  return (
    <div className="space-y-6">
      <header>
        <Link href="/provider/engagement" className="text-sm text-primary hover:underline">
          ← Engagement
        </Link>
        <h1 className="mt-2 font-heading text-2xl font-bold">
          Worker complaints-handling training
        </h1>
        <p className="text-sm text-muted-foreground">
          NDIS Practice Standard 1.5(4) — evidence workers know complaints procedures.
        </p>
      </header>

      <WorkerTrainingClient
        modules={modules.map((m) => ({
          id: m.id,
          title: m.title,
          description: m.description,
          content: m.content,
          quizQuestions: Array.isArray(m.quizQuestions)
            ? (m.quizQuestions as {
                question: string;
                options: string[];
                correctIndex: number;
              }[])
            : [],
          passingScore: m.passingScore,
        }))}
        compliance={compliance.map((w) => ({
          userId: w.userId,
          name: w.name,
          compliant: w.compliant,
          missingModuleIds: w.missingModuleIds,
        }))}
      />
    </div>
  );
}
