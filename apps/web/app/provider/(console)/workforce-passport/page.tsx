import { requireAuth } from "@/lib/auth/guards";
import { listCompetencyProposals } from "@/lib/careos/opportunities/workforce-passport-adapter";
import { careosOpportunitiesConfig } from "@/lib/config/careos-opportunities";

export const metadata = { title: "Workforce Passport | Provider" };

export default async function WorkforcePassportPage() {
  await requireAuth();
  const proposals = careosOpportunitiesConfig.workforcePassportEnabled
    ? await listCompetencyProposals()
    : [];

  return (
    <div className="space-y-6 p-4">
      <header>
        <h1 className="font-heading text-2xl font-bold">Workforce Passport</h1>
        <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
          Academy and training completions create <strong>pending</strong>{" "}
          competency evidence only. Humans must verify before evidence is
          treated as verified. Automatic worker assignment remains prohibited.
        </p>
      </header>

      <ul className="space-y-3">
        {proposals.length === 0 ? (
          <li className="text-sm text-muted-foreground">
            No proposals yet. Propose via{" "}
            <code className="text-xs">
              POST /api/provider/workforce-passport/propose
            </code>
            .
          </li>
        ) : (
          proposals.map((proposal) => (
            <li key={proposal.id} className="rounded-lg border p-4 text-sm">
              <strong>{proposal.competencyType}</strong> — {proposal.status}
              <div className="mt-1 text-muted-foreground">
                Worker profile {proposal.workerProfileId}
                {proposal.courseId ? ` · course ${proposal.courseId}` : ""}
              </div>
            </li>
          ))
        )}
      </ul>
    </div>
  );
}
