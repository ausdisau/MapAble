import { createAuditEvent } from "@/lib/audit/audit-event-service";
import { prisma } from "@/lib/prisma";
import { jitsiVideoAdapter } from "@/lib/telehealth/video/jitsi-video-adapter";
import { livekitVideoAdapter } from "@/lib/telehealth/video/livekit-video-adapter";
import { mockVideoAdapter } from "@/lib/telehealth/video/mock-video-adapter";
import { getVideoProvider } from "@/lib/telehealth/video/video-adapter";

function getAdapter() {
  const p = getVideoProvider();
  if (p === "jitsi") return jitsiVideoAdapter;
  if (p === "livekit") return livekitVideoAdapter;
  return mockVideoAdapter;
}

export async function createVideoRoomForAppointment(input: {
  appointmentId: string;
  bookingId?: string;
  actorUserId: string;
}) {
  const room = await prisma.telehealthVideoRoom.create({
    data: {
      appointmentId: input.appointmentId,
      bookingId: input.bookingId,
      provider: getVideoProvider(),
      status: "scheduled",
      expiresAt: new Date(Date.now() + 2 * 60 * 60 * 1000),
    },
  });

  const adapter = getAdapter();
  const external = await adapter.createRoom({ roomId: room.id });

  await prisma.telehealthVideoRoom.update({
    where: { id: room.id },
    data: { externalRoomId: external.externalRoomId },
  });

  await prisma.telehealthRoomEvent.create({
    data: {
      roomId: room.id,
      eventType: "room_created",
      actorId: input.actorUserId,
    },
  });

  await createAuditEvent({
    actorUserId: input.actorUserId,
    action: "telehealth:room_created",
    entityType: "TelehealthVideoRoom",
    entityId: room.id,
  });

  return { room, joinUrl: external.joinUrl };
}

export async function getJoinTokenForUser(input: {
  roomId: string;
  userId: string;
  displayName: string;
  authorised: boolean;
}) {
  if (!input.authorised) throw new Error("Not authorised");
  const room = await prisma.telehealthVideoRoom.findUnique({
    where: { id: input.roomId },
    include: { participants: true },
  });
  if (!room) throw new Error("Room not found");

  const isParticipant = room.participants.some((p) => p.userId === input.userId);
  if (!isParticipant) throw new Error("Not a participant");

  return getAdapter().getJoinToken({
    roomId: input.roomId,
    userId: input.userId,
    displayName: input.displayName,
  });
}

export async function requireRecordingConsent(roomId: string, userId: string) {
  const consent = await prisma.telehealthRecordingConsent.findUnique({
    where: { roomId_userId: { roomId, userId } },
  });
  return consent?.consented === true;
}
