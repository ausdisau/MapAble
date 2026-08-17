const STATUS_LABELS: Record<string, string> = {
  draft: "Draft",
  submitted: "Submitted",
  triage: "Under triage",
  under_review: "Under review",
  escalated: "Escalated",
  resolved: "Resolved",
  closed: "Closed",
};

const SEVERITY_LABELS: Record<string, string> = {
  low: "Low",
  medium: "Medium",
  high: "High",
  critical: "Critical",
};

const CATEGORY_LABELS: Record<string, string> = {
  complaint: "Complaint",
  access_need_not_met: "Access need not met",
  safeguarding_concern: "Safeguarding concern",
  possible_reportable_incident: "Possible reportable incident",
  other: "Other",
};

export function incidentStatusLabel(status: string) {
  return STATUS_LABELS[status] ?? status.replace(/_/g, " ");
}

export function incidentSeverityLabel(severity: string) {
  return SEVERITY_LABELS[severity] ?? severity;
}

export function incidentCategoryLabel(category: string) {
  return CATEGORY_LABELS[category] ?? category.replace(/_/g, " ");
}
