"use client";

import { useParams, useRouter } from "next/navigation";
import { useState } from "react";

import { formInputClass } from "@/components/forms/AccessibleFormField";
import { ReasonableAdjustmentDisclosurePanel } from "@/components/phase3/ReasonableAdjustmentDisclosurePanel";
import { Button } from "@/components/ui/button";

export default function JobApplyPage() {
  const { jobId } = useParams<{ jobId: string }>();
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  return (
    <form
      className="max-w-2xl space-y-4"
      onSubmit={async (e) => {
        e.preventDefault();
        setLoading(true);
        const fd = new FormData(e.currentTarget);
        const createRes = await fetch("/api/job-applications", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            jobId,
            applicantSummary: fd.get("summary"),
            coverLetter: fd.get("coverLetter"),
            reasonableAdjustmentRequest: fd.get("adjustments") || undefined,
            shareAdjustments: fd.get("shareAdjustments") === "on",
            shareAdjustmentsConfirmed: fd.get("shareAdjustments") === "on",
            transportSupportNeeded: fd.get("transportSupport") === "on",
            careSupportNeeded: fd.get("careSupport") === "on",
          }),
        });
        if (!createRes.ok) {
          setLoading(false);
          return;
        }
        const { application } = await createRes.json();
        await fetch(`/api/job-applications/${application.id}/submit`, {
          method: "POST",
        });
        setLoading(false);
        router.push(`/dashboard/jobs/applications/${application.id}`);
      }}
    >
      <h1 className="font-heading text-2xl font-bold">Apply for role</h1>
      <ReasonableAdjustmentDisclosurePanel />
      <label htmlFor="summary" className="text-sm font-medium">
        About you
      </label>
      <textarea id="summary" name="summary" className={formInputClass} rows={3} />
      <label htmlFor="coverLetter" className="text-sm font-medium">
        Cover letter
      </label>
      <textarea id="coverLetter" name="coverLetter" className={formInputClass} rows={4} />
      <label htmlFor="adjustments" className="text-sm font-medium">
        Reasonable adjustment request (optional)
      </label>
      <textarea id="adjustments" name="adjustments" className={formInputClass} rows={3} />
      <label className="flex min-h-11 items-center gap-2">
        <input type="checkbox" name="shareAdjustments" />
        Share adjustment details with employer
      </label>
      <label className="flex min-h-11 items-center gap-2">
        <input type="checkbox" name="transportSupport" />
        I may need transport support for interview or work
      </label>
      <label className="flex min-h-11 items-center gap-2">
        <input type="checkbox" name="careSupport" />
        I may need care support coordination
      </label>
      <Button type="submit" variant="default" size="default" loading={loading}>
        Submit application
      </Button>
    </form>
  );
}
