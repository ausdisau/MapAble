"use client";

import { useState } from "react";

import { PostServiceCsatPrompt } from "@/components/engagement/PostServiceCsatPrompt";

export function TimesheetApprovalPanel({
  timesheetId,
  organisationId,
}: {
  timesheetId: string;
  organisationId?: string;
}) {
  const [showCsat, setShowCsat] = useState(false);

  async function approve() {
    const res = await fetch(`/api/timesheets/${timesheetId}/approve`, { method: "POST" });
    if (res.ok) setShowCsat(true);
    else window.location.reload();
  }

  async function dispute() {
    const reason = prompt("Optional: tell us what needs review");
    await fetch(`/api/timesheets/${timesheetId}/dispute`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ reason: reason ?? "Needs review" }),
    });
    window.location.reload();
  }

  if (showCsat) {
    return (
      <PostServiceCsatPrompt
        contextType="timesheet"
        contextId={timesheetId}
        organisationId={organisationId}
        label="How was the support covered by this timesheet?"
        onSubmitted={() => window.location.reload()}
      />
    );
  }

  return (
    <div className="flex flex-col gap-3 sm:flex-row">
      <button
        type="button"
        onClick={approve}
        className="min-h-12 flex-1 rounded-md bg-primary px-4 py-3 text-primary-foreground"
      >
        Approve this record
      </button>
      <button
        type="button"
        onClick={dispute}
        className="min-h-12 flex-1 rounded-md border px-4 py-3"
      >
        Dispute — needs review
      </button>
    </div>
  );
}
