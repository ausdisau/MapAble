import { randomUUID } from "crypto";

import { createAuditEvent } from "@/lib/audit/audit-event-service";
import { isVirtualCareHubEnabled } from "@/lib/config/strategic-2026";
import { jitsiVideoAdapter } from "@/lib/telehealth/video/jitsi-video-adapter";
import { livekitVideoAdapter } from "@/lib/telehealth/video/livekit-video-adapter";
import { mockVideoAdapter } from "@/lib/telehealth/video/mock-video-adapter";
import { getVideoProvider } from "@/lib/telehealth/video/video-adapter";
import { createVideoRoomForAppointment } from "@/lib/telehealth/video/video-room-service";

function getAdapter() {
  const p = getVideoProvider();
  if (p === "jitsi") return jitsiVideoAdapter;
  if (p === "livekit") return livekitVideoAdapter;
  return mockVideoAdapter;
}

export type ClinicalSessionResult = {
  sessionId: string;
  joinUrl: string;
  supportItemCode: string;
  mode: "scaffold";
  notice: string;
};

/**
 * Create a Virtual Care Hub clinical session.
 * Prefer existing video-room-service when appointmentId is provided;
 * otherwise adapter-only scaffold (no Prisma appointment FK required).
 */
export async function createClinicalSession(input: {
  participantId: string;
  supportItemCode: string;
  actorUserId: string;
  workerId?: string;
  bookingId?: string;
  appointmentId?: string;
}): Promise<ClinicalSessionResult> {
  if (!isVirtualCareHubEnabled()) {
    throw new Error("VIRTUAL_CARE_HUB_DISABLED");
  }

  let sessionId: string;
  let joinUrl: string;

  if (input.appointmentId) {
    try {
      const { room, joinUrl: url } = await createVideoRoomForAppointment({
        appointmentId: input.appointmentId,
        bookingId: input.bookingId,
        actorUserId: input.actorUserId,
      });
      sessionId = room.id;
      joinUrl = url;
    } catch {
      // Fall through to adapter scaffold when appointment FK is missing.
      sessionId = randomUUID();
      const external = await getAdapter().createRoom({ roomId: sessionId });
      joinUrl = external.joinUrl;
    }
  } else {
    sessionId = randomUUID();
    const external = await getAdapter().createRoom({ roomId: sessionId });
    joinUrl = external.joinUrl;
  }

  await createAuditEvent({
    actorUserId: input.actorUserId,
    action: "telehealth.clinical_session.created",
    entityType: "TelehealthVideoRoom",
    entityId: sessionId,
    participantId: input.participantId,
    metadata: {
      supportItemCode: input.supportItemCode,
      workerId: input.workerId ?? null,
      bookingId: input.bookingId ?? null,
      mode: "scaffold",
      provider: getVideoProvider(),
    },
  });

  return {
    sessionId,
    joinUrl,
    supportItemCode: input.supportItemCode,
    mode: "scaffold",
    notice:
      "Virtual Care Hub scaffold — uses existing video adapters. Not a clinical monitoring device.",
  };
}
