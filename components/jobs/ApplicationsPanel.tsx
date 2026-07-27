import type { JobApplication, JobApplicationStatus } from "@prisma/client";

const STATUS_LABELS: Record<JobApplicationStatus, string> = {
  draft: "Draft",
  submitted: "Submitted",
  under_review: "Under review",
  interview_requested: "Interview requested",
  successful: "Successful",
  unsuccessful: "Unsuccessful",
  withdrawn: "Withdrawn",
};

type ApplicationRow = JobApplication & {
  job: {
    id: string;
    title: string;
    employmentType: string;
    status: string;
    employerOrganisation: { name: string };
  };
  disclosurePreview?: { status: string } | null;
};

export function ApplicationsPanel({
  applications,
}: {
  applications: ApplicationRow[];
}) {
  if (applications.length === 0) {
    return (
      <section aria-labelledby="applications-heading" className="rounded-xl border p-4">
        <h2 id="applications-heading" className="font-heading text-lg font-semibold">
          Your applications
        </h2>
        <p className="mt-2 text-sm text-muted-foreground">No applications yet.</p>
      </section>
    );
  }

  return (
    <section aria-labelledby="applications-heading" className="rounded-xl border p-4">
      <h2 id="applications-heading" className="font-heading text-lg font-semibold">
        Your applications
      </h2>
      <ul className="mt-4 space-y-2">
        {applications.map((app) => (
          <li
            key={app.id}
            className="flex flex-wrap items-center justify-between gap-2 rounded-lg bg-muted/40 px-3 py-2"
          >
            <div>
              <p className="font-medium">{app.job.title}</p>
              <p className="text-sm text-muted-foreground">
                {app.job.employerOrganisation.name}
              </p>
            </div>
            <div className="text-right text-sm">
              <p>{STATUS_LABELS[app.status]}</p>
              {app.disclosurePreview ? (
                <p className="text-xs text-muted-foreground">
                  Disclosure: {app.disclosurePreview.status}
                </p>
              ) : null}
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
