export function TypingIndicator({ userIds }: { userIds: string[] }) {
  if (userIds.length === 0) return null;
  return (
    <p className="px-4 text-xs text-muted-foreground" role="status" aria-live="polite">
      Someone is typing…
    </p>
  );
}
