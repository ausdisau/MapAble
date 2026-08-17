import Link from "next/link";

import { requireAdmin } from "@/lib/auth/guards";
import { prisma } from "@/lib/prisma";

export default async function ServiceOpsTransportPage() {
  await requireAdmin();
  const bookings = await prisma.transportBooking.findMany({
    where: { status: "awaiting_operator_response" },
  });
  return (
    <div className="space-y-4">
      <h1 className="font-heading text-2xl font-bold">Transport ops queue</h1>
      <ul>
        {bookings.map((b) => (
          <li key={b.id}>
            <Link href={`/admin/transport/${b.id}`}>{b.pickupAddress}</Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
