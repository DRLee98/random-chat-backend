import { Test } from '@nestjs/testing';
import { RoomService } from '../room.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { MockRepository, MockService, mockRepository } from 'test/utils';
import { Room } from '../entites/room.entity';
import { UserRoom } from '../entites/user-room.entity';
import { CommonService } from 'src/common/common.service';
import { UserService } from 'src/user/user.service';
import { MessageService } from 'src/message/message.service';
import { PUB_SUB } from 'src/common/common.constants';
import { PubSub } from 'graphql-subscriptions';
import { DeleteRoomInput } from '../dtos/delete-room.dto';
import { Language, SocialPlatform, User } from 'src/user/entites/user.entity';
import { NEW_ROOM, UPDATE_NEW_MESSAGE } from '../room.constants';
import { RoomDetailInput } from '../dtos/room-detail.dto';
import { MyRoomsInput } from '../dtos/my-rooms.dto';
import { mockUser } from 'test/mockData';

const mockUserService = () => ({
  findUserByRoomId: jest.fn(),
  findUserById: jest.fn(),
  findBlockedMe: jest.fn(),
  findChatEnabledUsers: jest.fn(),
});

const mockMessageService = () => ({
  findLastMessage: jest.fn(),
  sendMessage: jest.fn(),
  deleteMessages: jest.fn(),
  createSystemMessage: jest.fn(),
});

const mockPubSub = () => ({
  publish: jest.fn(),
});

describe('RoomService 테스트', () => {
  let roomService: RoomService;
  let roomRepository: MockRepository<Room>;
  let userRoomRepository: MockRepository<UserRoom>;
  let userService: MockService<UserService>;
  let messageService: MockService<MessageService>;
  let pubSub: MockService<PubSub>;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [
        RoomService,
        {
          provide: getRepositoryToken(Room),
          useValue: mockRepository(),
        },
        {
          provide: getRepositoryToken(UserRoom),
          useValue: mockRepository(),
        },
        CommonService,
        {
          provide: UserService,
          useValue: mockUserService(),
        },
        {
          provide: MessageService,
          useValue: mockMessageService(),
        },
        {
          provide: PUB_SUB,
          useValue: mockPubSub(),
        },
      ],
    }).compile();

    roomService = module.get(RoomService);
    roomRepository = module.get(getRepositoryToken(Room));
    userRoomRepository = module.get(getRepositoryToken(UserRoom));
    userService = module.get(UserService);
    messageService = module.get(MessageService);
    pubSub = module.get(PUB_SUB);
  });

  it('서비스 health check ', () => {
    expect(roomService).toBeDefined();
    expect(roomRepository).toBeDefined();
    expect(userRoomRepository).toBeDefined();
    expect(userService).toBeDefined();
    expect(messageService).toBeDefined();
    expect(pubSub).toBeDefined();
  });

  describe('참여중인 방 조회 테스트', () => {
    it('참여중인 방 조회', async () => {
      const input: MyRoomsInput = {
        skip: 0,
        take: 10,
      };

      const rooms = [
        {
          id: '1',
          name: 'unPinned',
          pinnedAt: null,
          room: { updatedAt: new Date(2024, 1, 7) },
        },
        {
          id: '2',
          name: 'unPinned2',
          pinnedAt: null,
          room: { updatedAt: new Date(2024, 1, 4) },
        },
        {
          id: '3',
          name: 'pinned',
          pinnedAt: new Date(2024, 1, 1),
          room: { updatedAt: new Date(2024, 1, 4) },
        },
        {
          id: '4',
          name: 'pinned2',
          pinnedAt: new Date(2024, 1, 1),
          room: { updatedAt: new Date(2024, 1, 2) },
        },
        {
          id: '5',
          name: 'pinned3',
          pinnedAt: new Date(2024, 1, 3),
          room: { updatedAt: new Date(2024, 1, 1) },
        },
        {
          id: '6',
          name: 'unPinned3',
          pinnedAt: null,
          room: { updatedAt: new Date(2024, 1, 1) },
        },
      ];

      const resultRooms = [
        {
          id: '3',
          name: 'pinned',
          pinnedAt: new Date(2024, 1, 1),
          room: { updatedAt: new Date(2024, 1, 4) },
        },
        {
          id: '5',
          name: 'pinned3',
          pinnedAt: new Date(2024, 1, 3),
          room: { updatedAt: new Date(2024, 1, 1) },
        },
        {
          id: '4',
          name: 'pinned2',
          pinnedAt: new Date(2024, 1, 1),
          room: { updatedAt: new Date(2024, 1, 2) },
        },
        {
          id: '1',
          name: 'unPinned',
          pinnedAt: null,
          room: { updatedAt: new Date(2024, 1, 7) },
        },
        {
          id: '2',
          name: 'unPinned2',
          pinnedAt: null,
          room: { updatedAt: new Date(2024, 1, 4) },
        },
        {
          id: '6',
          name: 'unPinned3',
          pinnedAt: null,
          room: { updatedAt: new Date(2024, 1, 1) },
        },
      ].map((room) => ({
        ...room,
        lastMessage: 'last message',
        users: [mockUser],
      }));

      userRoomRepository.find.mockResolvedValue(rooms);
      messageService.findLastMessage.mockResolvedValue({
        contents: 'last message',
      });
      userService.findUserByRoomId.mockResolvedValue([mockUser]);

      const result = await roomService.myRooms(input, mockUser);

      expect(result.ok).toEqual(true);
      expect(result.error).toEqual(undefined);
      expect(result.rooms).toEqual(resultRooms);

      expect(userRoomRepository.find).toHaveBeenCalledTimes(1);
      expect(messageService.findLastMessage).toHaveBeenCalledTimes(
        rooms.length,
      );
      expect(userService.findUserByRoomId).toHaveBeenCalledTimes(rooms.length);
    });

    describe('방 상세 정보 조회 테스트', () => {
      const input: RoomDetailInput = {
        roomId: 'test',
      };

      it('존재하지 않는 방인 경우', async () => {
        userRoomRepository.findOne.mockResolvedValue(null);

        const result = await roomService.roomDetail(input, mockUser);

        expect(result.ok).toEqual(false);
        expect(typeof result.error).toBe('string');
        expect(result.room).toEqual(undefined);

        expect(userRoomRepository.findOne).toHaveBeenCalledTimes(1);
        expect(userService.findUserByRoomId).toHaveBeenCalledTimes(0);
      });

      it('방 상세 정보 조회', async () => {
        const userRoom = { id: 'user room' };
        userRoomRepository.findOne.mockResolvedValue(userRoom);
        userService.findUserByRoomId.mockResolvedValue([mockUser]);

        const result = await roomService.roomDetail(input, mockUser);

        expect(result.ok).toEqual(true);
        expect(result.error).toEqual(undefined);
        expect(result.room).toEqual({
          userRoom,
          users: [mockUser],
        });

        expect(userRoomRepository.findOne).toHaveBeenCalledTimes(1);
        expect(userService.findUserByRoomId).toHaveBeenCalledTimes(1);
      });
    });
  });

  describe('랜덤 방 생성 테스트', () => {
    const targetUser: User = {
      id: 'target',
      socialId: 'target',
      socialPlatform: SocialPlatform.NAVER,
      fcmToken: 'token',
      nickname: 'target',
      allowMessage: true,
      language: Language.ko,
      autoTranslation: false,
      blockUsers: [],
      rooms: [],
      messages: [],
      createdAt: new Date(),
      updatedAt: new Date(),
      deletedAt: null,
    };
    it('채팅 가능한 유저가 없는 경우', async () => {
      userService.findUserById.mockReturnValueOnce(mockUser);
      userService.findBlockedMe.mockReturnValueOnce([]);
      roomRepository.find.mockResolvedValue([]);
      userRoomRepository.find.mockResolvedValue([]);
      userService.findChatEnabledUsers.mockResolvedValue([]);

      const result = await roomService.createRandomRoom(mockUser);

      expect(result.ok).toEqual(false);
      expect(typeof result.error).toBe('string');
      expect(result.room).toEqual(undefined);

      expect(userService.findUserById).toHaveBeenCalledTimes(1);
      expect(userService.findBlockedMe).toHaveBeenCalledTimes(1);
      expect(roomRepository.find).toHaveBeenCalledTimes(1);
      expect(userRoomRepository.find).toHaveBeenCalledTimes(1);
      expect(userService.findChatEnabledUsers).toHaveBeenCalledTimes(1);
      expect(userRoomRepository.create).toHaveBeenCalledTimes(0);
      expect(userRoomRepository.save).toHaveBeenCalledTimes(0);
      expect(roomRepository.create).toHaveBeenCalledTimes(0);
      expect(roomRepository.save).toHaveBeenCalledTimes(0);
      expect(pubSub.publish).toHaveBeenCalledTimes(0);
    });

    it('채팅 방 생성', async () => {
      const enabledUsers = [{ id: '4' }, { id: '5' }];
      const myRoom = { id: 'my room' };
      const targetRoom = { id: 'target room' };
      const room = { id: 'room' };
      userService.findUserById.mockReturnValueOnce(mockUser);
      userService.findBlockedMe.mockReturnValueOnce([{ id: '1' }]);
      roomRepository.find.mockResolvedValue([{ id: 'xxx' }]);
      userRoomRepository.find.mockResolvedValue([{ user: { id: '3' } }]);
      userService.findChatEnabledUsers.mockResolvedValue(enabledUsers);
      userService.findUserById.mockReturnValueOnce(targetUser);
      userRoomRepository.create.mockReturnValueOnce(myRoom);
      userRoomRepository.create.mockReturnValueOnce(targetRoom);
      roomRepository.create.mockReturnValueOnce(room);

      const result = await roomService.createRandomRoom(mockUser);

      expect(result.ok).toEqual(true);
      expect(result.error).toBe(undefined);
      expect(typeof result.room).toBe('object');

      expect(userService.findUserById).toHaveBeenCalledTimes(2);
      expect(enabledUsers.map(({ id }) => id)).toContain(
        userService.findUserById.mock.lastCall[0],
      );
      expect(userService.findBlockedMe).toHaveBeenCalledTimes(1);
      expect(roomRepository.find).toHaveBeenCalledTimes(1);
      expect(userRoomRepository.find).toHaveBeenCalledTimes(1);
      expect(userService.findChatEnabledUsers).toHaveBeenCalledTimes(1);
      expect(userService.findChatEnabledUsers).toHaveBeenCalledWith(
        ['3', '1', mockUser.id],
        { select: { id: true } },
      );

      expect(userRoomRepository.create).toHaveBeenCalledTimes(2);
      expect(userRoomRepository.create).toHaveBeenNthCalledWith(1, {
        user: mockUser,
        name: targetUser.nickname,
      });
      expect(userRoomRepository.create).toHaveBeenNthCalledWith(2, {
        user: targetUser,
        name: mockUser.nickname,
      });

      expect(userRoomRepository.save).toHaveBeenCalledTimes(2);
      expect(userRoomRepository.save).toHaveBeenNthCalledWith(1, myRoom);
      expect(userRoomRepository.save).toHaveBeenNthCalledWith(2, targetRoom);

      expect(roomRepository.create).toHaveBeenCalledTimes(1);
      expect(roomRepository.create).toHaveBeenCalledWith({
        userRooms: [myRoom, targetRoom],
      });

      expect(roomRepository.save).toHaveBeenCalledTimes(1);
      expect(roomRepository.save).toHaveBeenCalledWith(room);

      expect(pubSub.publish).toHaveBeenCalledTimes(1);
      expect(pubSub.publish).toHaveBeenCalledWith(NEW_ROOM, {
        newRoom: {
          ...targetRoom,
          room,
          lastMessage: '',
          users: [targetUser, mockUser],
        },
      });
    });

    it('채팅 방 생성 (대상 제외 id가 겹치는 경우)', async () => {
      const enabledUsers = [{ id: '4' }, { id: '5' }];
      const myRoom = { id: 'my room' };
      const targetRoom = { id: 'target room' };
      const room = { id: 'room' };
      userService.findUserById.mockReturnValueOnce(mockUser);
      userService.findBlockedMe.mockReturnValueOnce([
        { id: '1' },
        { id: '2' },
        { id: '3' },
      ]);
      roomRepository.find.mockResolvedValue([{ id: 'xxx' }]);
      userRoomRepository.find.mockResolvedValue([
        { user: { id: '3' } },
        { user: { id: '2' } },
      ]);
      userService.findChatEnabledUsers.mockResolvedValue(enabledUsers);
      userService.findUserById.mockReturnValueOnce(targetUser);
      userRoomRepository.create.mockReturnValueOnce(myRoom);
      userRoomRepository.create.mockReturnValueOnce(targetRoom);
      roomRepository.create.mockReturnValueOnce(room);

      const result = await roomService.createRandomRoom(mockUser);

      expect(result.ok).toEqual(true);
      expect(result.error).toBe(undefined);
      expect(typeof result.room).toBe('object');

      expect(userService.findUserById).toHaveBeenCalledTimes(2);
      expect(enabledUsers.map(({ id }) => id)).toContain(
        userService.findUserById.mock.lastCall[0],
      );
      expect(userService.findBlockedMe).toHaveBeenCalledTimes(1);
      expect(roomRepository.find).toHaveBeenCalledTimes(1);
      expect(userRoomRepository.find).toHaveBeenCalledTimes(1);
      expect(userService.findChatEnabledUsers).toHaveBeenCalledTimes(1);
      expect(userService.findChatEnabledUsers).toHaveBeenCalledWith(
        ['3', '2', '1', mockUser.id],
        { select: { id: true } },
      );

      expect(userRoomRepository.create).toHaveBeenCalledTimes(2);
      expect(userRoomRepository.create).toHaveBeenNthCalledWith(1, {
        user: mockUser,
        name: targetUser.nickname,
      });
      expect(userRoomRepository.create).toHaveBeenNthCalledWith(2, {
        user: targetUser,
        name: mockUser.nickname,
      });

      expect(userRoomRepository.save).toHaveBeenCalledTimes(2);
      expect(userRoomRepository.save).toHaveBeenNthCalledWith(1, myRoom);
      expect(userRoomRepository.save).toHaveBeenNthCalledWith(2, targetRoom);

      expect(roomRepository.create).toHaveBeenCalledTimes(1);
      expect(roomRepository.create).toHaveBeenCalledWith({
        userRooms: [myRoom, targetRoom],
      });

      expect(roomRepository.save).toHaveBeenCalledTimes(1);
      expect(roomRepository.save).toHaveBeenCalledWith(room);

      expect(pubSub.publish).toHaveBeenCalledTimes(1);
      expect(pubSub.publish).toHaveBeenCalledWith(NEW_ROOM, {
        newRoom: {
          ...targetRoom,
          room,
          lastMessage: '',
          users: [targetUser, mockUser],
        },
      });
    });
  });

  describe('방 수정 테스트', () => {
    it('존재하지 않는 방인 경우', async () => {
      userRoomRepository.findOne.mockResolvedValue(null);

      const result = await roomService.updateRoom(
        { userRoomId: 'test' },
        mockUser,
      );

      expect(result.ok).toEqual(false);
      expect(typeof result.error).toBe('string');

      expect(userRoomRepository.findOne).toHaveBeenCalledTimes(1);
      expect(userRoomRepository.update).toHaveBeenCalledTimes(0);
    });

    it('방 수정', async () => {
      const input = { userRoomId: 'test', name: 'test edit' };

      userRoomRepository.findOne.mockResolvedValue({ id: 'test' });

      const result = await roomService.updateRoom(input, mockUser);

      expect(result.ok).toEqual(true);
      expect(result.error).toEqual(undefined);

      expect(userRoomRepository.findOne).toHaveBeenCalledTimes(1);

      const { userRoomId, ...data } = input;
      expect(userRoomRepository.update).toHaveBeenCalledTimes(1);
      expect(userRoomRepository.update).toHaveBeenCalledWith(userRoomId, data);
    });

    it('방 상단 고정', async () => {
      jest.spyOn(global, 'Date').mockReturnValue(new Date());
      const input = { userRoomId: 'test', name: 'test edit', pinned: true };

      userRoomRepository.findOne.mockResolvedValue({ id: 'test' });

      const result = await roomService.updateRoom(input, mockUser);

      expect(result.ok).toEqual(true);
      expect(result.error).toEqual(undefined);

      expect(userRoomRepository.findOne).toHaveBeenCalledTimes(1);

      const { userRoomId, pinned: _, ...data } = input;
      expect(userRoomRepository.update).toHaveBeenCalledTimes(1);
      expect(userRoomRepository.update).toHaveBeenCalledWith(userRoomId, {
        ...data,
        pinnedAt: new Date(),
      });
    });

    it('방 상단 고정 해제', async () => {
      const input = { userRoomId: 'test', name: 'test edit', pinned: false };

      userRoomRepository.findOne.mockResolvedValue({ id: 'test' });

      const result = await roomService.updateRoom(input, mockUser);

      expect(result.ok).toEqual(true);
      expect(result.error).toEqual(undefined);

      expect(userRoomRepository.findOne).toHaveBeenCalledTimes(1);

      const { userRoomId, pinned: _, ...data } = input;
      expect(userRoomRepository.update).toHaveBeenCalledTimes(1);
      expect(userRoomRepository.update).toHaveBeenCalledWith(userRoomId, {
        ...data,
        pinnedAt: null,
      });
    });
  });

  describe('방 나가기 테스트', () => {
    const input: DeleteRoomInput = {
      roomId: 'test',
    };

    it('존재하지 않는 방인 경우', async () => {
      roomRepository.findOne.mockResolvedValue(null);

      const result = await roomService.deleteRoom(input, mockUser);

      expect(result.ok).toEqual(false);
      expect(typeof result.error).toBe('string');

      expect(roomRepository.findOne).toHaveBeenCalledTimes(1);
      expect(userRoomRepository.find).toHaveBeenCalledTimes(0);
      expect(userRoomRepository.softDelete).toHaveBeenCalledTimes(0);
      expect(messageService.sendMessage).toHaveBeenCalledTimes(0);
      expect(roomRepository.softDelete).toHaveBeenCalledTimes(0);
      expect(messageService.deleteMessages).toHaveBeenCalledTimes(0);
    });

    it('참여중인 방이 아닌 경우', async () => {
      roomRepository.findOne.mockResolvedValue({ id: 'test room' });
      userRoomRepository.find.mockResolvedValue([
        { id: '1', user: { id: 'test user' } },
      ]);

      const result = await roomService.deleteRoom(input, mockUser);

      expect(result.ok).toEqual(false);
      expect(typeof result.error).toBe('string');

      expect(roomRepository.findOne).toHaveBeenCalledTimes(1);
      expect(userRoomRepository.find).toHaveBeenCalledTimes(1);
      expect(userRoomRepository.softDelete).toHaveBeenCalledTimes(0);
      expect(messageService.sendMessage).toHaveBeenCalledTimes(0);
      expect(roomRepository.softDelete).toHaveBeenCalledTimes(0);
      expect(messageService.deleteMessages).toHaveBeenCalledTimes(0);
    });

    it('방 나가기', async () => {
      roomRepository.findOne.mockResolvedValue({ id: 'test room' });
      userRoomRepository.find.mockResolvedValue([
        { id: '1', user: { id: 'test user' } },
        { id: '2', user: { id: mockUser.id } },
      ]);

      const result = await roomService.deleteRoom(input, mockUser);

      expect(result.ok).toEqual(true);
      expect(result.error).toEqual(undefined);

      expect(roomRepository.findOne).toHaveBeenCalledTimes(1);
      expect(userRoomRepository.find).toHaveBeenCalledTimes(1);

      expect(userRoomRepository.softDelete).toHaveBeenCalledTimes(1);
      expect(userRoomRepository.softDelete).toHaveBeenCalledWith('2');
      expect(messageService.createSystemMessage).toHaveBeenCalledTimes(1);
      expect(messageService.createSystemMessage).toHaveBeenCalledWith(
        input.roomId,
        `${mockUser.nickname}님이 채팅방을 나갔습니다.`,
        mockUser,
      );

      expect(roomRepository.softDelete).toHaveBeenCalledTimes(0);
      expect(messageService.deleteMessages).toHaveBeenCalledTimes(0);
    });

    it('방 나간 후 방에 남은 유저가 없는 경우', async () => {
      roomRepository.findOne.mockResolvedValue({ id: 'test room' });
      userRoomRepository.find.mockResolvedValue([
        { id: '2', user: { id: mockUser.id } },
      ]);

      const result = await roomService.deleteRoom(input, mockUser);

      expect(result.ok).toEqual(true);
      expect(result.error).toEqual(undefined);

      expect(roomRepository.findOne).toHaveBeenCalledTimes(1);
      expect(userRoomRepository.find).toHaveBeenCalledTimes(1);

      expect(userRoomRepository.softDelete).toHaveBeenCalledTimes(1);
      expect(userRoomRepository.softDelete).toHaveBeenCalledWith('2');
      expect(messageService.createSystemMessage).toHaveBeenCalledTimes(1);
      expect(messageService.createSystemMessage).toHaveBeenCalledWith(
        input.roomId,
        `${mockUser.nickname}님이 채팅방을 나갔습니다.`,
        mockUser,
      );

      expect(roomRepository.softDelete).toHaveBeenCalledTimes(1);
      expect(roomRepository.softDelete).toHaveBeenCalledWith(input.roomId);
      expect(messageService.deleteMessages).toHaveBeenCalledTimes(1);
      expect(messageService.deleteMessages).toHaveBeenCalledWith(input.roomId);
    });
  });

  describe('참여중인 방에 새 메시지 발신 테스트', () => {
    it('조건에 맞는 방이 없는 경우', async () => {
      userRoomRepository.find.mockResolvedValue([]);

      await roomService.updateNewMesssageInUserRoom('test', mockUser.id, 'msg');

      expect(userRoomRepository.find).toHaveBeenCalledTimes(1);
      expect(userRoomRepository.update).toHaveBeenCalledTimes(0);
      expect(pubSub.publish).toHaveBeenCalledTimes(0);
    });

    it('참여중인 방에 새 메시지 발신', async () => {
      const targetRooms = [
        {
          id: '1',
          newMessage: 1,
          user: { id: 'x1' },
          room: { id: 'test' },
        },
        {
          id: '2',
          newMessage: 1,
          user: { id: 'x2' },
          room: { id: 'test' },
        },
      ];
      userRoomRepository.find.mockResolvedValue(targetRooms);

      await roomService.updateNewMesssageInUserRoom('test', mockUser.id, 'msg');

      expect(userRoomRepository.find).toHaveBeenCalledTimes(1);

      expect(userRoomRepository.update).toHaveBeenCalledTimes(
        targetRooms.length,
      );
      expect(pubSub.publish).toHaveBeenCalledTimes(targetRooms.length);
      targetRooms.forEach((room, i) => {
        expect(userRoomRepository.update).toHaveBeenNthCalledWith(
          i + 1,
          room.id,
          { newMessage: room.newMessage + 1 },
        );
        expect(pubSub.publish).toHaveBeenNthCalledWith(
          i + 1,
          UPDATE_NEW_MESSAGE,
          {
            updateNewMessageInUserRoom: {
              id: room.id,
              newMessage: room.newMessage + 1,
              lastMessage: 'msg',
              roomId: 'test',
              userId: room.user.id,
            },
          },
        );
      });
    });
  });
});
