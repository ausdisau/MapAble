import { prisma } from "@/lib/prisma";

export async function requestAccreditation(params: {
  placeId: string;
  userId: string;
  notes?: string;
}) {
  return prisma.accessAccreditationRequest.create({
    data: {
      placeId: params.placeId,
      userId: params.userId,
      notes: params.notes,
      status: "submitted",
    },
  });
}
