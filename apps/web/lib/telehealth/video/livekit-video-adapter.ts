import type { VideoAdapter } from "@/lib/telehealth/video/video-adapter";

export const livekitVideoAdapter: VideoAdapter = {
  async createRoom({ roomId }) {
    const url = process.env.LIVEKIT_URL ?? "";
    return {
      joinUrl: `${url}/room/${roomId}`,
      externalRoomId: roomId,
    };
  },
  async getJoinToken({ roomId, userId }) {
    void process.env.LIVEKIT_API_SECRET;
    return `livekit:${roomId}:${userId}`;
  },
};
