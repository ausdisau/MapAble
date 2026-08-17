import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { DraftPrmsRecord } from "@/lib/prms/types";


type Props = {
  records: DraftPrmsRecord[];
};

function formatType(type: string): string {
  return type.replace(/_/g, " ").toLowerCase();
}

export function DraftRecordCards({ records }: Props) {
  if (records.length === 0) return null;

  return (
    <section aria-labelledby="draft-records-heading">
      <h3 id="draft-records-heading" className="mb-3 text-base font-semibold">
        Draft PRMS records
      </h3>
      <p className="mb-3 text-sm text-muted-foreground">
        These are drafts only — not yet part of your official record.
      </p>
      <ul className="grid gap-3 sm:grid-cols-2">
        {records.map((record, index) => (
          <li key={`${record.type}-${index}`}>
            <Card variant="outlined">
              <CardHeader className="pb-2">
                <CardTitle className="text-base capitalize">
                  {formatType(record.type)}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-1 text-sm">
                <p>
                  <span className="font-medium">Status:</span>{" "}
                  {record.status.replace(/_/g, " ")}
                </p>
                {record.payload.serviceType ? (
                  <p>
                    <span className="font-medium">Service:</span>{" "}
                    {String(record.payload.serviceType)}
                  </p>
                ) : null}
              </CardContent>
            </Card>
          </li>
        ))}
      </ul>
    </section>
  );
}
