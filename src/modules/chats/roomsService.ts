import { generateId } from "../../utils/utilities";

export const GENERAL_ROOM_KEY = "general_room";
export const MAX_GENERAL_ROOM_USERS = 50;
export const MAX_PRIVATE_ROOM_USERS = 20;
export const MAX_ROOMS = 25; // excludes the system general room

type RoomResult<T = undefined> =
    | { success: true; data?: T }
    | { success: false; error: string };

export interface Room {
    id: string;
    name: string;
    ownerId: string;
    ownerName: string;
    createdAt: number; // unix
    users: Set<string>;
    isPrivate: boolean;
    userCapacity: number;
}

export class SocketRoom implements Room {
    id: string;
    name: string;
    ownerId: string;
    ownerName: string;
    createdAt: number;
    users: Set<string>;
    isPrivate: boolean;
    userCapacity: number;

    constructor(id: string, name: string, ownerId: string, ownerName: string, isPrivate: boolean) {
        this.id = id;
        this.name = name;
        this.ownerId = ownerId;
        this.ownerName = ownerName;
        this.createdAt = Date.now();
        this.isPrivate = isPrivate;
        this.userCapacity = isPrivate ? MAX_PRIVATE_ROOM_USERS : MAX_GENERAL_ROOM_USERS;
        this.users = new Set();
    }

    addUser(userId: string): RoomResult {
        if (this.users.has(userId)) return { success: true };
        if (this.users.size >= this.userCapacity) return { success: false, error: "Room is full." };
        this.users.add(userId);
        return { success: true };
    }

    removeUser(userId: string): void {
        this.users.delete(userId);
    }
}

export class SocketRoomService {
    private rooms: Map<string, SocketRoom>;

    constructor() {
        this.rooms = new Map();
        this.createGeneralRoom();
    }

    private createGeneralRoom() {
        const room = new SocketRoom(GENERAL_ROOM_KEY, "General Chat Room", "system", "Admin", false);
        this.rooms.set(GENERAL_ROOM_KEY, room);
    }

    getRooms(): SocketRoom[] {
        return [...this.rooms.values()];
    }

    getRoomById(roomId: string): SocketRoom | undefined {
        return this.rooms.get(roomId);
    }

    createRoom(name: string, userId: string, userName: string): RoomResult<SocketRoom> {
        if (this.rooms.size - 1 >= MAX_ROOMS) {
            return { success: false, error: "Server is at full capacity. Try again later." };
        }
        const room = new SocketRoom(generateId(), name, userId, userName, true);
        this.rooms.set(room.id, room);
        return { success: true, data: room };
    }

    joinRoom(roomId: string, userId: string): RoomResult {
        const room = this.rooms.get(roomId);
        if (!room) return { success: false, error: "Room does not exist." };
        return room.addUser(userId);
    }

    leaveRoom(roomId: string, userId: string): void {
        this.rooms.get(roomId)?.removeUser(userId);
    }

    // only the owner can destroy their room
    destroyRoom(roomId: string, userId: string): RoomResult {
        const room = this.rooms.get(roomId);
        if (!room) return { success: false, error: "Room does not exist." };
        if (room.ownerId !== userId) return { success: false, error: "Only the room owner can destroy it." };
        this.rooms.delete(roomId);
        return { success: true };
    }
}

export const RoomService = new SocketRoomService();