import { listModerationQueue } from "@/lib/access-moderation/review-moderation-service";
import { requireAdmin } from "@/lib/auth/guards";

export default async function AdminAccessModerationPage() {
  await requireAdmin();
  const queue = await listModerationQueue("pending");

  return (
    <div className="space-y-4 p-6">
      <h1 className="text-2xl font-bold">Moderation queue</h1>
      <ul className="space-y-3">
        {queue.map((item) => (
          <li key={item.id} className="rounded-lg border p-4">
            <p className="font-medium">{item.entityType}</p>
            <p className="text-sm text-muted-foreground">{item.flagReason}</p>
            {item.review ? (
              <p className="mt-2 text-sm line-clamp-3">{item.review.reviewBody}</p>
            ) : null}
          </li>
        ))}
      </ul>
    </div>
  );
}
