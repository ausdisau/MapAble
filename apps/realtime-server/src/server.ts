import { createServer } from "http";
import { Server, type Socket } from "socket.io";

import {
  resolveSocketIdentity,
  type SocketIdentity,
} from "./auth/socket-auth";
import {
  assertCanJoinRoomOrThrow,
  RoomAuthorizationError,
} from "./rooms/room-policy";

const port = Number(process.env.PORT ?? 4010);
const httpServer = createServer();
const io = new Server(httpServer, {
  cors: { origin: process.env.SOCKETIO_CORS_ORIGIN ?? "*" },
});

type SocketData = {
  identity?: SocketIdentity;
};

io.use((socket, next) => {
  const identity = resolveSocketIdentity(socket.handshake.auth);
  if (!identity) {
    return next(new Error("Unauthorized"));
  }
  (socket.data as SocketData).identity = identity;
  next();
});

io.on("connection", (socket: Socket) => {
  socket.on("join", (room: string) => {
    void (async () => {
      const identity = (socket.data as SocketData).identity;
      try {
        const parsed = await assertCanJoinRoomOrThrow(identity, room);
        await socket.join(parsed.raw);
        socket.emit("room:joined", { room: parsed.raw });
      } catch (err) {
        const message =
          err instanceof RoomAuthorizationError
            ? err.message
            : "Room join failed";
        socket.emit("room:error", { error: message, room });
        // Hard-fail unauthorized joins — prevent IDOR probing sessions.
        socket.disconnect(true);
      }
    })();
  });

  socket.on("message:ack", (payload: { messageId: string }) => {
    socket.emit("message:acked", payload);
  });
});

httpServer.listen(port, () => {
  console.log(`MapAble realtime server on :${port}`);
});
