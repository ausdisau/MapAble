import Link from "next/link";

import { requireAdmin } from "@/lib/auth/guards";
import { prisma } from "@/lib/prisma";

export default async function AdminTransportPage() {
  await requireAdmin();
  const bookings = await prisma.transportBooking.findMany({ take: 50 });
  return (
    <div className="space-y-4">
      <h1 className="font-heading text-2xl font-bold">Transport bookings</h1>
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
