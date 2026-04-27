import {
  SocketRoom,
  SocketRoomService,
  GENERAL_ROOM_KEY,
  MAX_GENERAL_ROOM_USERS,
  MAX_PRIVATE_ROOM_USERS,
  MAX_ROOMS,
} from '../../src/modules/chats/roomsService';
import * as utilities from '../../src/utils/utilities';

jest.mock('../../src/utils/utilities', () => {
  const actual = jest.requireActual('../../src/utils/utilities');
  return {
    ...actual,
    generateId: jest.fn(),
  };
});

describe('SocketRoom', () => {

  describe('constructor', () => {
    it('should set all properties for a private room', () => {
      const room = new SocketRoom('room-1', 'My Room', 'user-1', 'Alice', true);

      expect(room.id).toBe('room-1');
      expect(room.name).toBe('My Room');
      expect(room.ownerId).toBe('user-1');
      expect(room.ownerName).toBe('Alice');
      expect(room.isPrivate).toBe(true);
      expect(room.userCapacity).toBe(MAX_PRIVATE_ROOM_USERS);
      expect(room.users).toEqual(new Set());
      expect(typeof room.createdAt).toBe('number');
    });

    it('should use general capacity for non-private rooms', () => {
      const room = new SocketRoom('room-1', 'Public', 'user-1', 'Alice', false);
      expect(room.userCapacity).toBe(MAX_GENERAL_ROOM_USERS);
    });
  });

  describe('addUser', () => {
    it('should add a new user successfully', () => {
      const room = new SocketRoom('r1', 'Test', 'owner', 'Owner', true);
      const result = room.addUser('user-1');

      expect(result).toEqual({ success: true });
      expect(room.users.has('user-1')).toBe(true);
    });

    it('should return success without re-adding when user is already in room', () => {
      const room = new SocketRoom('r1', 'Test', 'owner', 'Owner', true);
      room.addUser('user-1');

      const result = room.addUser('user-1');

      expect(result).toEqual({ success: true });
      expect(room.users.size).toBe(1);
    });

    it('should reject when room is at capacity', () => {
      const room = new SocketRoom('r1', 'Test', 'owner', 'Owner', true);
      // Fill to capacity
      for (let i = 0; i < MAX_PRIVATE_ROOM_USERS; i++) {
        room.addUser(`user-${i}`);
      }

      const result = room.addUser('overflow-user');

      expect(result).toEqual({ success: false, error: 'Room is full.' });
      expect(room.users.has('overflow-user')).toBe(false);
      expect(room.users.size).toBe(MAX_PRIVATE_ROOM_USERS);
    });
  });

  describe('removeUser', () => {
    it('should remove an existing user', () => {
      const room = new SocketRoom('r1', 'Test', 'owner', 'Owner', true);
      room.addUser('user-1');

      room.removeUser('user-1');

      expect(room.users.has('user-1')).toBe(false);
    });

    it('should not throw when removing a user not in the room', () => {
      const room = new SocketRoom('r1', 'Test', 'owner', 'Owner', true);
      expect(() => room.removeUser('ghost')).not.toThrow();
    });
  });
});

describe('SocketRoomService', () => {

  let service: SocketRoomService;

  beforeEach(() => {
    (utilities.generateId as jest.Mock).mockReturnValue('generated-id');
    service = new SocketRoomService();
  });

  describe('constructor', () => {
    it('should auto-create the general room on instantiation', () => {
      const generalRoom = service.getRoomById(GENERAL_ROOM_KEY);

      expect(generalRoom).toBeDefined();
      expect(generalRoom?.id).toBe(GENERAL_ROOM_KEY);
      expect(generalRoom?.ownerId).toBe('system');
      expect(generalRoom?.isPrivate).toBe(false);
    });
  });

  describe('getRooms', () => {
    it('should return all rooms including the general room', () => {
      const rooms = service.getRooms();
      expect(rooms).toHaveLength(1);
      expect(rooms[0].id).toBe(GENERAL_ROOM_KEY);
    });

    it('should include user-created rooms', () => {
      service.createRoom('Custom Room', 'user-1', 'Alice');

      const rooms = service.getRooms();
      expect(rooms).toHaveLength(2);
    });
  });

  describe('getRoomById', () => {
    it('should return the room when it exists', () => {
      const room = service.getRoomById(GENERAL_ROOM_KEY);
      expect(room).toBeDefined();
      expect(room?.id).toBe(GENERAL_ROOM_KEY);
    });

    it('should return undefined when room does not exist', () => {
      expect(service.getRoomById('nonexistent')).toBeUndefined();
    });
  });

  describe('createRoom', () => {
    it('should create a new private room', () => {
      const result = service.createRoom('My Room', 'user-1', 'Alice');

      expect(result.success).toBe(true);
      expect(result).toMatchObject({
        success: true,
        data: expect.objectContaining({
          id: 'generated-id',
          name: 'My Room',
          ownerId: 'user-1',
          ownerName: 'Alice',
          isPrivate: true,
        }),
      });
    });

    it('should add the created room to the rooms map', () => {
      service.createRoom('My Room', 'user-1', 'Alice');

      const room = service.getRoomById('generated-id');
      expect(room).toBeDefined();
      expect(room?.name).toBe('My Room');
    });

    it('should reject when at MAX_ROOMS capacity', () => {
      // Fill up to MAX_ROOMS (general room is excluded from the count)
      for (let i = 0; i < MAX_ROOMS; i++) {
        (utilities.generateId as jest.Mock).mockReturnValueOnce(`room-${i}`);
        service.createRoom(`Room ${i}`, 'user', 'Name');
      }

      const result = service.createRoom('Overflow', 'user', 'Name');

      expect(result).toEqual({
        success: false,
        error: 'Server is at full capacity. Try again later.',
      });
    });

    it('should allow exactly MAX_ROOMS user rooms (general excluded from limit)', () => {
      for (let i = 0; i < MAX_ROOMS; i++) {
        (utilities.generateId as jest.Mock).mockReturnValueOnce(`room-${i}`);
        const result = service.createRoom(`Room ${i}`, 'user', 'Name');
        expect(result.success).toBe(true);
      }

      // Should now have MAX_ROOMS user rooms + 1 general = MAX_ROOMS + 1 total
      expect(service.getRooms()).toHaveLength(MAX_ROOMS + 1);
    });
  });

  describe('joinRoom', () => {
    it('should add user to existing room', () => {
      service.createRoom('My Room', 'owner', 'Owner');

      const result = service.joinRoom('generated-id', 'user-1');

      expect(result).toEqual({ success: true });
      const room = service.getRoomById('generated-id');
      expect(room?.users.has('user-1')).toBe(true);
    });

    it('should join the general room', () => {
      const result = service.joinRoom(GENERAL_ROOM_KEY, 'user-1');

      expect(result).toEqual({ success: true });
      expect(service.getRoomById(GENERAL_ROOM_KEY)?.users.has('user-1')).toBe(true);
    });

    it('should reject when room does not exist', () => {
      const result = service.joinRoom('nonexistent', 'user-1');

      expect(result).toEqual({ success: false, error: 'Room does not exist.' });
    });

    it('should reject when room is full', () => {
      service.createRoom('My Room', 'owner', 'Owner');

      // Fill up the room to private capacity
      for (let i = 0; i < MAX_PRIVATE_ROOM_USERS; i++) {
        service.joinRoom('generated-id', `user-${i}`);
      }

      const result = service.joinRoom('generated-id', 'overflow');
      expect(result).toEqual({ success: false, error: 'Room is full.' });
    });
  });

  describe('leaveRoom', () => {
    it('should remove user from the room', () => {
      service.createRoom('My Room', 'owner', 'Owner');
      service.joinRoom('generated-id', 'user-1');

      service.leaveRoom('generated-id', 'user-1');

      expect(service.getRoomById('generated-id')?.users.has('user-1')).toBe(false);
    });

    it('should silently do nothing when room does not exist', () => {
      expect(() => service.leaveRoom('nonexistent', 'user-1')).not.toThrow();
    });

    it('should silently do nothing when user is not in the room', () => {
      service.createRoom('My Room', 'owner', 'Owner');
      expect(() => service.leaveRoom('generated-id', 'ghost')).not.toThrow();
    });
  });

  describe('destroyRoom', () => {
    it('should destroy the room when called by the owner', () => {
      service.createRoom('My Room', 'owner-1', 'Owner');

      const result = service.destroyRoom('generated-id', 'owner-1');

      expect(result).toEqual({ success: true });
      expect(service.getRoomById('generated-id')).toBeUndefined();
    });

    it('should reject when room does not exist', () => {
      const result = service.destroyRoom('nonexistent', 'user-1');

      expect(result).toEqual({ success: false, error: 'Room does not exist.' });
    });

    it('should reject when caller is not the owner', () => {
      service.createRoom('My Room', 'owner-1', 'Owner');

      const result = service.destroyRoom('generated-id', 'other-user');

      expect(result).toEqual({
        success: false,
        error: 'Only the room owner can destroy it.',
      });
      expect(service.getRoomById('generated-id')).toBeDefined();
    });

    it('should reject destruction of general room by non-system user', () => {
      const result = service.destroyRoom(GENERAL_ROOM_KEY, 'user-1');

      expect(result).toEqual({
        success: false,
        error: 'Only the room owner can destroy it.',
      });
      expect(service.getRoomById(GENERAL_ROOM_KEY)).toBeDefined();
    });
  });
});