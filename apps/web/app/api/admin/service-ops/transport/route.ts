import { requireApiPermission } from "@/lib/api/auth-handler";
import { jsonOk } from "@/lib/api/response";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const user = await requireApiPermission("admin:service-ops");
  if (user instanceof Response) return user;
  const bookings = await prisma.transportBooking.findMany({
    where: {
      OR: [
        { status: "awaiting_operator_response" },
        {
          status: { in: ["operator_accepted", "vehicle_assigned"] },
          vehicleId: null,
        },
      ],
    },
    include: { vehicle: true, operatorOrganisation: true },
    take: 50,
  });
  return jsonOk({ bookings });
}
