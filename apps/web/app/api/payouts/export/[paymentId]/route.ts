import { requireApiSession } from "@/lib/api/auth-handler";
import { jsonError } from "@/lib/api/response";
import { exportPaymentToCsv } from "@/lib/payouts/export-service";
import { prisma } from "@/lib/prisma";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ paymentId: string }> }
) {
  const user = await requireApiSession();
  if (user instanceof Response) return user;
  const { paymentId } = await params;

  const payment = await prisma.billingPayment.findFirst({
    where: {
      id: paymentId,
      OR: [{ userId: user.id }, { invoice: { providerId: { not: null } } }],
    },
  });
  if (!payment) return jsonError("Payment not found", 404);

  const result = await exportPaymentToCsv(paymentId);
  if (!result.ok) return jsonError(result.error, 404);

  return new Response(result.csv, {
    headers: {
      "Content-Type": "text/csv",
      "Content-Disposition": `attachment; filename="payout-${paymentId}.csv"`,
    },
  });
}
