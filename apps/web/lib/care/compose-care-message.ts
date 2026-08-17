import type { CareRequestTypeValue } from "@/components/care/SupportTypeChips";
import { supportTypeLabel } from "@/components/care/SupportTypeChips";

export type CareIntakeTaskRow = {
  name: string;
  intensity: "standard" | "high";
};

export function composeCareSupportMessage(params: {
  requestType: CareRequestTypeValue;
  title: string;
  description: string;
  tasks: CareIntakeTaskRow[];
  address?: string;
  linkedTransportRequired: boolean;
  shareAccessibility: boolean;
  accessRequirementsSummary?: string;
}): string {
  const parts = [
    `Support type: ${supportTypeLabel(params.requestType)}.`,
    `Title: ${params.title}.`,
    params.description,
  ];

  if (params.tasks.length > 0) {
    const taskLines = params.tasks
      .map(
        (t) =>
          `- ${t.name} (${t.intensity === "high" ? "higher intensity" : "standard"})`
      )
      .join("\n");
    parts.push(`Tasks:\n${taskLines}`);
  }

  if (params.address?.trim()) {
    parts.push(`Location: ${params.address.trim()}.`);
  }

  if (params.linkedTransportRequired) {
    parts.push("Also need transport linked to this support.");
  }

  if (params.shareAccessibility && params.accessRequirementsSummary?.trim()) {
    parts.push(
      `Access notes (share when confirmed): ${params.accessRequirementsSummary.trim()}`
    );
  }

  return parts.join("\n\n");
}
