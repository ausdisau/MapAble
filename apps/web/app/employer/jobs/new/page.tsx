"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { formInputClass } from "@/components/forms/AccessibleFormField";
import { Button } from "@/components/ui/button";

export default function EmployerNewJobPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  return (
    <form
      className="max-w-2xl space-y-4"
      onSubmit={async (e) => {
        e.preventDefault();
        setLoading(true);
        const fd = new FormData(e.currentTarget);
        const res = await fetch("/api/jobs", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            employerOrganisationId: fd.get("employerOrganisationId"),
            title: fd.get("title"),
            description: fd.get("description"),
            employmentType: fd.get("employmentType"),
            location: fd.get("location"),
            remoteAllowed: fd.get("remote") === "on",
            flexibleHours: fd.get("flexible") === "on",
            adjustmentOpennessStatement: fd.get("adjustments"),
          }),
        });
        setLoading(false);
        if (res.ok) {
          const d = await res.json();
          router.push(`/employer/jobs/${d.job.id}`);
        }
      }}
    >
      <h1 className="font-heading text-2xl font-bold">New job listing (draft)</h1>
      <label htmlFor="employerOrganisationId" className="text-sm font-medium">Employer organisation ID</label>
      <input id="employerOrganisationId" name="employerOrganisationId" className={formInputClass} required />
      <label htmlFor="title" className="text-sm font-medium">Title</label>
      <input id="title" name="title" className={formInputClass} required />
      <label htmlFor="description" className="text-sm font-medium">Description</label>
      <textarea id="description" name="description" className={formInputClass} rows={5} required />
      <label htmlFor="employmentType" className="text-sm font-medium">Employment type</label>
      <select id="employmentType" name="employmentType" className={formInputClass}>
        <option value="part_time">Part time</option>
        <option value="full_time">Full time</option>
        <option value="casual">Casual</option>
      </select>
      <label htmlFor="location" className="text-sm font-medium">Location</label>
      <input id="location" name="location" className={formInputClass} />
      <label htmlFor="adjustments" className="text-sm font-medium">Adjustment openness</label>
      <textarea id="adjustments" name="adjustments" className={formInputClass} rows={2} />
      <label className="flex gap-2"><input type="checkbox" name="remote" /> Remote allowed</label>
      <label className="flex gap-2"><input type="checkbox" name="flexible" /> Flexible hours</label>
      <Button type="submit" variant="default" size="default" loading={loading}>Save draft</Button>
    </form>
  );
}
