import { Server as HttpServer } from "http";
import { Server as SocketServer, Socket } from "socket.io";
import { envVars } from "../config/env.js";

let io: SocketServer | null = null;

export const initSocketServer = (httpServer: HttpServer): SocketServer => {
    io = new SocketServer(httpServer, {
        cors: {
            origin: [envVars.FRONTEND_URL, envVars.SOCKET_CORS_ORIGIN],
            credentials: true,
        },
        path: "/socket.io/",
    });

    io.on("connection", (socket: Socket) => {
        console.log(`🔌 [Socket.IO] Client connected: ${socket.id}`);

        // Client joins user-specific room for notifications
        socket.on("join-room", (userId: string) => {
            if (userId) {
                const room = `user:${userId}`;
                socket.join(room);
                console.log(`🔌 [Socket.IO] Socket ${socket.id} joined room ${room}`);
            }
        });

        socket.on("disconnect", () => {
            console.log(`🔌 [Socket.IO] Client disconnected: ${socket.id}`);
        });
    });

    return io;
};

export const getIO = (): SocketServer => {
    if (!io) {
        throw new Error("Socket.IO server has not been initialized!");
    }
    return io;
};

export const emitToUser = (userId: string, event: string, payload: unknown): void => {
    if (io) {
        io.to(`user:${userId}`).emit(event, payload);
    }
};
