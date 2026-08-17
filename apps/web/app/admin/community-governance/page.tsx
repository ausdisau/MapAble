import { requireAdmin } from "@/lib/auth/guards";
import { prisma } from "@/lib/prisma";

export default async function CommunityGovernancePage() {
  await requireAdmin();
  const meetings = await prisma.communityGovernanceMeeting.findMany({
    orderBy: { meetingAt: "desc" },
    take: 15,
    include: { decisions: true },
  });

  return (
    <div className="space-y-6">
      <h1 className="font-heading text-2xl font-bold">Community governance</h1>
      <p className="text-muted-foreground">
        Advisory meetings, feedback and recorded decisions.
      </p>
      <ul className="space-y-4">
        {meetings.map((m) => (
          <li key={m.id} className="rounded-lg border p-4">
            <h2 className="font-medium">{m.title}</h2>
            <p className="text-sm">{m.meetingAt.toLocaleDateString("en-AU")}</p>
            {m.decisions.length > 0 && (
              <ul className="mt-2 list-disc pl-5 text-sm">
                {m.decisions.map((d) => (
                  <li key={d.id}>{d.title}</li>
                ))}
              </ul>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
