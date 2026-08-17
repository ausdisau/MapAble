export function ReasonableAdjustmentDisclosurePanel() {
  return (
    <aside
      className="rounded-lg border border-border bg-muted/50 p-4 text-sm"
      aria-labelledby="adjustment-privacy-heading"
    >
      <h2 id="adjustment-privacy-heading" className="font-semibold">
        Who can see your adjustment request?
      </h2>
      <p className="mt-2">
        Reasonable adjustment details are sensitive. By default, employers only
        see that a request exists until you choose to share details. MapAble
        admins may review for safeguarding when required.
      </p>
      <p className="mt-2">
        Tick &quot;Share adjustment details with employer&quot; only if you want
        the employer to read your full request at submission.
      </p>
    </aside>
  );
}
