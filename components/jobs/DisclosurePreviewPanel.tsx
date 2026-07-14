import type { ApplicationDisclosurePreview } from "@prisma/client";

function renderFieldMap(value: unknown): Array<[string, unknown]> {
  if (typeof value !== "object" || value === null) return [];
  return Object.entries(value);
}

export function DisclosurePreviewPanel({
  preview,
}: {
  preview: ApplicationDisclosurePreview;
}) {
  const employerVisible = renderFieldMap(preview.employerVisible);
  const withheld = renderFieldMap(preview.fieldsWithheld);

  return (
    <section aria-labelledby="disclosure-preview-heading" className="rounded-xl border p-4">
      <h2 id="disclosure-preview-heading" className="font-heading text-lg font-semibold">
        Disclosure preview
      </h2>
      <p className="mt-1 text-sm text-muted-foreground">
        This is what the employer will see if you submit. Disability or adjustment details are
        never shared without your explicit choices.
      </p>
      <p className="mt-2 text-xs uppercase tracking-wide text-muted-foreground">
        Status: {preview.status}
      </p>

      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <div>
          <h3 className="font-medium">Employer will see</h3>
          {employerVisible.length === 0 ? (
            <p className="text-sm text-muted-foreground">No fields selected for sharing.</p>
          ) : (
            <dl className="mt-2 space-y-2 text-sm">
              {employerVisible.map(([key, val]) => (
                <div key={key}>
                  <dt className="font-medium">{key}</dt>
                  <dd className="text-muted-foreground">{String(val)}</dd>
                </div>
              ))}
            </dl>
          )}
        </div>
        <div>
          <h3 className="font-medium">Withheld</h3>
          {withheld.length === 0 ? (
            <p className="text-sm text-muted-foreground">Nothing withheld.</p>
          ) : (
            <ul className="mt-2 space-y-1 text-sm text-muted-foreground">
              {withheld.map(([key]) => (
                <li key={key}>{key}</li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </section>
  );
}
