export interface EnquirySummary {
  id: string;
  providerName: string;
  status: string;
  disclosurePreview: string;
  responseDeadline: string | null;
}

interface EnquiryPanelProps {
  enquiries: EnquirySummary[];
  enabled: boolean;
}

const STATUS_LABEL: Record<string, string> = {
  draft: "Draft",
  sent: "Sent",
  responded: "Responded",
  withdrawn: "Withdrawn",
  expired: "Expired",
};

export function EnquiryPanel({ enquiries, enabled }: EnquiryPanelProps) {
  if (!enabled) {
    return (
      <section aria-labelledby="enquiries-heading" className="rounded-lg border p-4">
        <h2 id="enquiries-heading" className="font-heading text-lg font-semibold">
          Provider enquiries
        </h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Provider enquiries are not enabled. Coordinators choose providers —
          the platform never forces a selection.
        </p>
      </section>
    );
  }

  return (
    <section aria-labelledby="enquiries-heading" className="space-y-4">
      <h2 id="enquiries-heading" className="font-heading text-lg font-semibold">
        Provider enquiries
      </h2>
      <p className="text-sm text-muted-foreground">
        Enquiries show a disclosure preview before sending. You remain in control
        of provider choice.
      </p>
      {enquiries.length === 0 ? (
        <p className="text-sm text-muted-foreground">No enquiries yet.</p>
      ) : (
        <ul className="space-y-3">
          {enquiries.map((enquiry) => (
            <li
              key={enquiry.id}
              className="rounded-lg border p-4 text-sm"
              aria-label={`Enquiry to ${enquiry.providerName}`}
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h3 className="font-medium">{enquiry.providerName}</h3>
                <span className="rounded-full bg-muted px-2 py-0.5 text-xs">
                  {STATUS_LABEL[enquiry.status] ?? enquiry.status}
                </span>
              </div>
              <p className="mt-2 line-clamp-2 text-muted-foreground">
                {enquiry.disclosurePreview}
              </p>
              {enquiry.responseDeadline ? (
                <p className="mt-1 text-muted-foreground">
                  Response by:{" "}
                  {new Date(enquiry.responseDeadline).toLocaleDateString("en-AU")}
                </p>
              ) : null}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
