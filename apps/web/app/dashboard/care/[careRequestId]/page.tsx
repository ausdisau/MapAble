import { redirect } from "next/navigation";

export default async function DashboardCareRequestRedirect({
  params,
}: {
  params: Promise<{ careRequestId: string }>;
}) {
  const { careRequestId } = await params;
  const { prisma } = await import("@/lib/prisma");
  const booking = await prisma.careBooking.findUnique({
    where: { careRequestId },
  });
  if (booking) redirect(`/care/bookings/${booking.id}`);
  redirect("/care/bookings");
}
