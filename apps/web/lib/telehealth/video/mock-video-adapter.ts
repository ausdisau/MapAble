import type { VideoAdapter } from "@/lib/telehealth/video/video-adapter";

export const mockVideoAdapter: VideoAdapter = {
  async createRoom({ roomId }) {
    return {
      joinUrl: `/telehealth/mock/${roomId}`,
      externalRoomId: roomId,
    };
  },
  async getJoinToken({ roomId, userId }) {
    return `mock:${roomId}:${userId}`;
  },
};
