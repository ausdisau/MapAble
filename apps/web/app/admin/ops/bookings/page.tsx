import { BookingsAdmin } from "@/components/admin/back-of-house/BookingsAdmin";
import { requireAdminScope } from "@/lib/auth/guards";

export const metadata = { title: "Bookings ops | MapAble Admin" };

export default async function AdminOpsBookingsPage() {
  await requireAdminScope("admin:bookings:read");
  return <BookingsAdmin />;
}
