import type { EmploymentProfile } from "@prisma/client";

export function EmploymentProfileSummary({
  profile,
}: {
  profile: EmploymentProfile | null;
}) {
  return (
    <section aria-labelledby="employment-profile-heading" className="rounded-xl border p-4">
      <h2 id="employment-profile-heading" className="font-heading text-lg font-semibold">
        Employment profile
      </h2>
      <p className="mt-1 text-sm text-muted-foreground">
        Your profile is participant-controlled. MapAble does not compute employability scores.
      </p>
      <dl className="mt-4 grid gap-3 sm:grid-cols-2">
        <div>
          <dt className="text-sm font-medium">Skills</dt>
          <dd>{profile?.skills.join(", ") || "Not recorded"}</dd>
        </div>
        <div>
          <dt className="text-sm font-medium">Interests</dt>
          <dd>{profile?.interests.join(", ") || "Not recorded"}</dd>
        </div>
        <div>
          <dt className="text-sm font-medium">Preferred work types</dt>
          <dd>{profile?.preferredWorkTypes.join(", ") || "Not recorded"}</dd>
        </div>
        <div>
          <dt className="text-sm font-medium">Preferred hours</dt>
          <dd>{profile?.preferredHours.join(", ") || "Not recorded"}</dd>
        </div>
        <div>
          <dt className="text-sm font-medium">Preferred locations</dt>
          <dd>{profile?.preferredLocations.join(", ") || "Not recorded"}</dd>
        </div>
        <div>
          <dt className="text-sm font-medium">Remote preference</dt>
          <dd>{profile?.remotePreference || "Not recorded"}</dd>
        </div>
        <div>
          <dt className="text-sm font-medium">Transport dependency</dt>
          <dd>{profile?.transportDependency ? "Yes" : "No"}</dd>
        </div>
        <div>
          <dt className="text-sm font-medium">Support dependency</dt>
          <dd>{profile?.supportDependency ? "Yes" : "No"}</dd>
        </div>
      </dl>
    </section>
  );
}
