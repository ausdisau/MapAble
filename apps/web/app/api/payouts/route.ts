import { requireApiAdminScope, requireApiSession } from "@/lib/api/auth-handler";
import { jsonOk } from "@/lib/api/response";
import { listPayoutQueue } from "@/lib/payouts/batch-service";
import { getRecipientForUser } from "@/lib/payouts/recipient-service";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const scope = url.searchParams.get("scope");

  if (scope === "admin") {
    const admin = await requireApiAdminScope("admin:billing:read");
    if (admin instanceof Response) return admin;
    const queue = await listPayoutQueue();
    return jsonOk({ queue });
  }

  const user = await requireApiSession();
  if (user instanceof Response) return user;

  const recipient = await getRecipientForUser(user.id);
  const splits = await prisma.billingPaymentSplit.findMany({
    where: {
      OR: [
        { payoutRecipientId: recipient?.id },
        { recipientId: user.id },
      ],
    },
    include: {
      payment: { include: { invoice: true } },
      payoutRecipient: true,
    },
    orderBy: { updatedAt: "desc" },
    take: 50,
  });

  return jsonOk({ recipient, splits });
}
