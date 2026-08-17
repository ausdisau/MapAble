import { analyticsResearchConfig } from "@/lib/config/analytics-research";

type ResearchGovernanceNoticeProps = {
  syntheticOnly?: boolean;
};

export function ResearchGovernanceNotice({
  syntheticOnly = true,
}: ResearchGovernanceNoticeProps) {
  if (!analyticsResearchConfig.researchGovernanceEnabled) {
    return (
      <p className="rounded-md border border-dashed p-4 text-sm text-muted-foreground" role="status">
        Research governance is disabled. Set MAPABLE_RESEARCH_GOVERNANCE_ENABLED=true
        to manage ethics approvals, consents, and governed exports.
      </p>
    );
  }

  return (
    <div className="rounded-md border bg-muted/30 p-4 text-sm space-y-2">
      <p>
        Research exports require ethics approval and participant consent. Withdrawn
        participants are excluded and pending exports are blocked.
      </p>
      {syntheticOnly ? (
        <p className="text-muted-foreground">
          This project is configured for synthetic data only until ethics approval
          permits otherwise.
        </p>
      ) : null}
      <p className="text-xs text-muted-foreground">
        Exports are pseudonymised or de-identified — never claimed anonymous without
        documented basis.
      </p>
    </div>
  );
}
