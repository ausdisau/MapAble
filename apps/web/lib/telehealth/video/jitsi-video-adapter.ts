import type { VideoAdapter } from "@/lib/telehealth/video/video-adapter";

export const jitsiVideoAdapter: VideoAdapter = {
  async createRoom({ roomId }) {
    const base = process.env.JITSI_BASE_URL ?? "https://meet.jit.si";
    return {
      joinUrl: `${base}/${roomId}`,
      externalRoomId: roomId,
    };
  },
  async getJoinToken({ roomId, userId }) {
    return `jitsi:${roomId}:${userId}`;
  },
};
