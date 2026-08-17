export type VideoProvider = "jitsi" | "livekit" | "mock";

export interface VideoAdapter {
  createRoom(input: {
    roomId: string;
    appointmentId?: string;
  }): Promise<{ joinUrl: string; externalRoomId: string }>;
  getJoinToken(input: {
    roomId: string;
    userId: string;
    displayName: string;
  }): Promise<string>;
}

export function getVideoProvider(): VideoProvider {
  const v = process.env.TELEHEALTH_VIDEO_PROVIDER ?? "mock";
  if (v === "jitsi" || v === "livekit") return v;
  return "mock";
}
