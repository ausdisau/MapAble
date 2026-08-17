import Link from "next/link";

export function DelegateConsentInfo() {
  return (
    <section className="rounded-xl border border-border bg-muted/30 p-4 text-sm">
      <h2 className="font-semibold">Family &amp; carer delegate access</h2>
      <p className="mt-2 text-muted-foreground">
        You can grant a family member permission to view or submit feedback and
        complaints on your behalf through engagement delegate scopes:
      </p>
      <ul className="mt-2 list-disc pl-5 text-muted-foreground">
        <li>
          <code className="text-xs">engagement.read_delegate</code> — view your
          submissions and improvement updates
        </li>
        <li>
          <code className="text-xs">engagement.submit_delegate</code> — submit
          feedback and complaints on your behalf
        </li>
      </ul>
      <p className="mt-3 text-muted-foreground">
        Grant these when inviting a delegate from your consent records. Delegates
        with access can open{" "}
        <Link href="/dashboard/engagement" className="text-primary hover:underline">
          Your voice
        </Link>{" "}
        while acting for you.
      </p>
    </section>
  );
}
