import { Server, Socket } from "socket.io";
import { RoomService, SocketRoom } from "./roomsService";
import jwt from 'jsonwebtoken';
import CONFIG from "../../config/config";

declare module "socket.io" {
    interface Socket {
        userId: string;
        userName: string;
        currentRoomId: string | null;
        lastMessageAt: number;
    }
}

const secretKey = CONFIG.SECRET_KEY;

function serializeRoom(room: SocketRoom) {
    return {
        ...room,
        users: [...room.users],
        userCount: room.users.size,
    };
}

// leaves the socket's current room and cleans up state — returns the roomId left, or null
function leaveRoom(socket: Socket): string | null {
    const roomId = socket.currentRoomId;
    if (!roomId) return null;

    RoomService.leaveRoom(roomId, socket.userId);
    socket.leave(roomId);
    socket.currentRoomId = null;
    return roomId;
}

// after a room is destroyed, clear state on every socket still subscribed to it
async function clearDestroyedRoom(io: Server, roomId: string) {
    const sockets = await io.in(roomId).fetchSockets();
    sockets.forEach(s => {
        (s as unknown as Socket).currentRoomId = null;
    });
    io.in(roomId).socketsLeave(roomId);
}

export const initSocket = (io: Server) => {

    // verify JWT before allowing any socket connection
    io.use((socket, next) => {
        const token = socket.handshake.auth?.token;
        if (!token) return next(new Error("Unauthorized"));

        try {
            const decoded = jwt.verify(token, secretKey) as Record<string, any>;
            socket.userId = decoded.id;
            socket.userName = decoded.username;
            next();
        } catch {
            next(new Error("Invalid token"));
        }
    });

    io.on('connection', (socket: Socket) => {
        socket.lastMessageAt = 0;
        socket.currentRoomId = null;

        socket.on("getRooms", () => {
            socket.emit("rooms", RoomService.getRooms().map(serializeRoom));
        });

        socket.on("createRoom", (roomName: unknown) => {
            if (!roomName || typeof roomName !== "string" || roomName.trim().length === 0) {
                socket.emit("error", { status: 400, message: "Room name is required." });
                return;
            }
            if (roomName.trim().length > 50) {
                socket.emit("error", { status: 400, message: "Room name must be 50 characters or fewer." });
                return;
            }

            const prevRoomId = leaveRoom(socket);

            const result = RoomService.createRoom(roomName.trim(), socket.userId, socket.userName);
            if (!result.success || !result.data) {
                // roll back — put them back in their previous room if creation failed
                if (prevRoomId) {
                    const rejoin = RoomService.joinRoom(prevRoomId, socket.userId);
                    if (rejoin.success) {
                        socket.join(prevRoomId);
                        socket.currentRoomId = prevRoomId;
                    }
                }
                socket.emit("error", { status: 503, message: "Could not create room." });
                return;
            }

            const room = result.data;
            RoomService.joinRoom(room.id, socket.userId);
            socket.join(room.id);
            socket.currentRoomId = room.id;

            socket.emit("roomCreated", { room: serializeRoom(room), leftRoomId: prevRoomId });
        });

        socket.on("joinRoom", (roomId: unknown) => {
            if (!roomId || typeof roomId !== "string") {
                socket.emit("error", { status: 400, message: "Invalid room ID." });
                return;
            }

            // already here — if a second tab tries to join the same room, silently confirm
            if (socket.currentRoomId === roomId) {
                socket.emit("joinedRoom", { roomId });
                return;
            }

            const prevRoomId = leaveRoom(socket);

            const result = RoomService.joinRoom(roomId, socket.userId);
            if (!result.success) {
                // roll back
                if (prevRoomId) {
                    const rejoin = RoomService.joinRoom(prevRoomId, socket.userId);
                    if (rejoin.success) {
                        socket.join(prevRoomId);
                        socket.currentRoomId = prevRoomId;
                    }
                }
                socket.emit("error", { status: 400, message: result.error ?? "Could not join room." });
                return;
            }

            socket.join(roomId);
            socket.currentRoomId = roomId;
            socket.emit("joinedRoom", { roomId, leftRoomId: prevRoomId });
        });

        socket.on("leaveRoom", () => {
            const roomId = socket.currentRoomId;
            if (!roomId) {
                socket.emit("error", { status: 400, message: "You are not in a room." });
                return;
            }
            leaveRoom(socket);
            socket.emit("leftRoom", { roomId });
        });

        // only the owner can destroy a room — checked inside RoomService.destroyRoom
        socket.on("destroyRoom", async (roomId: unknown) => {
            if (!roomId || typeof roomId !== "string") {
                socket.emit("error", { status: 400, message: "Invalid room ID." });
                return;
            }

            const result = RoomService.destroyRoom(roomId, socket.userId);
            if (!result.success) {
                socket.emit("error", { status: 403, message: result.error ?? "Could not destroy room." });
                return;
            }

            io.in(roomId).emit("roomDestroyed", { roomId });
            await clearDestroyedRoom(io, roomId);
        });

        socket.on("sendMessage", (message: unknown) => {
            const roomId = socket.currentRoomId;
            if (!roomId) {
                socket.emit("error", { status: 400, message: "You are not in a room." });
                return;
            }

            if (!message || typeof message !== "string" || message.trim().length === 0) {
                socket.emit("error", { status: 400, message: "Invalid message." });
                return;
            }
            if (message.length > 500) {
                socket.emit("error", { status: 400, message: "Message too long." });
                return;
            }

            const now = Date.now();
            if (now - socket.lastMessageAt < 500) {
                socket.emit("error", { status: 429, message: "Slow down a bit." });
                return;
            }
            socket.lastMessageAt = now;

            const room = RoomService.getRoomById(roomId);
            if (!room) {
                socket.currentRoomId = null;
                socket.emit("error", { status: 404, message: "Room no longer exists." });
                return;
            }

            io.to(roomId).emit("newMessage", {
                userId: socket.userId,
                userName: socket.userName,
                message: message.trim(),
                timestamp: Date.now(),
            });
        });

        socket.on('disconnect', () => {
            if (!socket.currentRoomId) return;

            const roomId = socket.currentRoomId;
            RoomService.leaveRoom(roomId, socket.userId);
            socket.leave(roomId);
            socket.currentRoomId = null;

            io.in(roomId).emit("userLeft", { userId: socket.userId, userName: socket.userName, roomId });
            console.log(`${socket.userName} disconnected`);
        });
    });
};