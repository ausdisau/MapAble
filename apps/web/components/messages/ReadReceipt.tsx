export function ReadReceipt({ read }: { read: boolean }) {
  return (
    <span className="text-xs text-muted-foreground" aria-label={read ? "Read" : "Delivered"}>
      {read ? "Read" : "Delivered"}
    </span>
  );
}
