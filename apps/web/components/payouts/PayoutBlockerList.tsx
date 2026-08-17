type Blocker = { message: string };

export function PayoutBlockerList({ blockers }: { blockers: string[] | Blocker[] }) {
  if (!blockers.length) return null;
  return (
    <section aria-labelledby="payout-blockers-heading">
      <h2 id="payout-blockers-heading" className="text-lg font-semibold">
        Payout holds
      </h2>
      <ul className="mt-2 list-disc space-y-1 pl-5">
        {blockers.map((b, i) => (
          <li key={i}>{typeof b === "string" ? b : b.message}</li>
        ))}
      </ul>
    </section>
  );
}
