export function MessageBubble({
  body,
  senderName,
  createdAt,
  isOwn,
}: {
  body: string;
  senderName: string;
  createdAt: string | Date;
  isOwn: boolean;
}) {
  return (
    <article
      className={`max-w-[85%] rounded-xl px-4 py-3 ${
        isOwn ? "ml-auto bg-primary text-primary-foreground" : "bg-muted"
      }`}
    >
      <p className="text-xs font-medium opacity-80">{senderName}</p>
      <p className="mt-1 whitespace-pre-wrap text-sm">{body}</p>
      <time className="mt-2 block text-xs opacity-70" dateTime={new Date(createdAt).toISOString()}>
        {new Date(createdAt).toLocaleString("en-AU")}
      </time>
    </article>
  );
}
