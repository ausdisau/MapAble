import Link from "next/link";

import { ResearchGovernanceNotice } from "@/components/analytics/ResearchGovernanceNotice";
import { requireAdmin } from "@/lib/auth/guards";
import { listResearchProjects } from "@/lib/research";

export const metadata = { title: "Research governance | MapAble" };

export default async function ResearchHubPage() {
  await requireAdmin();

  const { disabled, projects } = await listResearchProjects(20);

  return (
    <div className="space-y-8">
      <header>
        <h1 className="font-heading text-2xl font-bold">Research governance</h1>
        <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
          Ethics approvals, participant consent, cohorts, and governed research exports.
        </p>
      </header>

      <ResearchGovernanceNotice />

      <nav className="flex gap-4 text-sm">
        <Link href="/admin/analytics" className="underline">
          Analytics cloud
        </Link>
        <Link href="/admin/ai-evaluation" className="underline">
          AI evaluation harness
        </Link>
        <Link href="/admin/research-safe-room" className="underline">
          Research safe room (legacy)
        </Link>
      </nav>

      <section aria-labelledby="projects-list-heading" className="space-y-3">
        <h2 id="projects-list-heading" className="font-heading text-lg font-semibold">
          Projects
        </h2>
        {disabled ? (
          <p className="text-sm text-muted-foreground" role="status">
            Research governance disabled.
          </p>
        ) : projects.length === 0 ? (
          <p className="text-sm text-muted-foreground">No research projects yet.</p>
        ) : (
          <ul className="divide-y rounded-md border">
            {projects.map((p) => (
              <li key={p.id} className="px-4 py-3 text-sm">
                <div className="flex justify-between">
                  <span className="font-medium">{p.title}</span>
                  <span className="text-muted-foreground">{p.status}</span>
                </div>
                {p.principalInvestigator ? (
                  <p className="text-xs text-muted-foreground mt-1">
                    PI: {p.principalInvestigator}
                  </p>
                ) : null}
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
