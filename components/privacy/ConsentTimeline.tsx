type ReceiptRow = {
  id: string;
  scope: string;
  purpose: string;
  action: string;
  recipientType: string | null;
  createdAt: string;
};

const ACTION_LABELS: Record<string, string> = {
  granted: "Access granted",
  revoked: "Access revoked",
  used: "Access used",
  blocked: "Access blocked",
};

export function ConsentTimeline({ receipts }: { receipts: ReceiptRow[] }) {
  if (receipts.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        No consent activity recorded yet.
      </p>
    );
  }

  return (
    <ol className="relative space-y-4 border-l border-border pl-6">
      {receipts.map((receipt) => (
        <li key={receipt.id} className="relative">
          <span
            className="absolute -left-[1.625rem] top-1.5 h-3 w-3 rounded-full border-2 border-background bg-primary"
            aria-hidden="true"
          />
          <div className="rounded-lg border p-3">
            <p className="font-medium">
              {ACTION_LABELS[receipt.action] ?? receipt.action}
            </p>
            <p className="text-sm text-muted-foreground">{receipt.purpose}</p>
            <p className="text-xs text-muted-foreground">
              Scope: {receipt.scope.replace(/_/g, " ")}
              {receipt.recipientType
                ? ` · Recipient: ${receipt.recipientType.replace(/_/g, " ")}`
                : ""}
            </p>
            <time
              dateTime={receipt.createdAt}
              className="text-xs text-muted-foreground"
            >
              {new Date(receipt.createdAt).toLocaleString("en-AU")}
            </time>
          </div>
        </li>
      ))}
    </ol>
  );
}
