import Link from "next/link";

export function EngagementRightsPanel() {
  return (
    <section
      aria-labelledby="engagement-rights-heading"
      className="rounded-xl border border-border bg-muted/30 p-5 text-sm"
    >
      <h2 id="engagement-rights-heading" className="font-semibold text-foreground">
        Your rights
      </h2>
      <ul className="mt-3 list-disc space-y-2 pl-5 text-muted-foreground">
        <li>
          You can give feedback or make a <strong className="text-foreground">formal complaint</strong> about
          your support provider. MapAble facilitates the process — resolution remains with your provider
          organisation.
        </li>
        <li>
          You can also complain to the{" "}
          <a
            href="https://www.ndiscommission.gov.au/complaints"
            className="text-primary hover:underline"
            target="_blank"
            rel="noopener noreferrer"
          >
            NDIS Quality and Safeguards Commission
          </a>{" "}
          at any time. You may involve an advocate or support person.
        </li>
        <li>
          Making a complaint should not affect your supports. Providers must handle complaints fairly and
          promptly (NDIS Practice Standard 1.5).
        </li>
      </ul>
      <p className="mt-4">
        <span className="font-medium text-foreground">Immediate danger?</span> Call{" "}
        <strong>000</strong>. For safeguarding concerns see{" "}
        <Link href="/dashboard/safety" className="text-primary hover:underline">
          Safety centre
        </Link>
        .
      </p>
    </section>
  );
}
