export function ChatInfoPanel({
  title,
  type,
  participantCount,
}: {
  title: string;
  type: string;
  participantCount: number;
}) {
  return (
    <div className="rounded-lg border p-4 text-sm">
      <h2 className="font-semibold">{title}</h2>
      <p className="mt-2 text-muted-foreground">Type: {type.replace(/_/g, " ")}</p>
      <p className="text-muted-foreground">{participantCount} participants</p>
      <p className="mt-4 text-xs">
        Messages are stored securely in MapAble. Report concerns via support.
      </p>
    </div>
  );
}
