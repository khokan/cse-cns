"use client";

import { io, Socket } from "socket.io-client";

let socket: Socket | null = null;

const SOCKET_URL = process.env.NEXT_PUBLIC_SOCKET_URL || "http://localhost:5000";

export const getSocket = (userId?: string): Socket => {
  if (!socket) {
    socket = io(SOCKET_URL, {
      withCredentials: true,
      transports: ["websocket", "polling"],
      autoConnect: true,
    });

    socket.on("connect", () => {
      console.log("🔌 [Socket.IO Client] Connected to server:", socket?.id);
      if (userId) {
        socket?.emit("join-room", userId);
      }
    });

    socket.on("disconnect", () => {
      console.log("🔌 [Socket.IO Client] Disconnected");
    });
  } else if (userId) {
    socket.emit("join-room", userId);
  }

  return socket;
};
