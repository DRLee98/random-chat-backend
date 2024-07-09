import { PubSub } from 'graphql-subscriptions';
import { InviteService } from '../invite.service';
import { NotificationService } from 'src/notification/notification.service';
import { RoomService } from 'src/room/room.service';
import { UserService } from 'src/user/user.service';
import { MockRepository, MockService, mockRepository } from 'test/utils';
import { Test } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Invite, InviteStatus } from '../entities/invite.entity';
import { CommonService } from 'src/common/common.service';
import { PUB_SUB } from 'src/common/common.constants';
import {
  mockInvite,
  mockInviteRoom,
  mockMyRoom,
  mockUser,
  mockUser2,
} from 'test/mockData';

const mockUserService = () => ({
  findUserById: jest.fn(),
  findBlockedMe: jest.fn(),
  findChatEnabledUsers: jest.fn(),
  existingChatUserIds: jest.fn(),
});

const mockRoomService = () => ({
  findRoomByIds: jest.fn(),
  createRoomByInvite: jest.fn(),
  createUserRoomForAcceptedInvites: jest.fn(),
  deleteRoomOnInviteReject: jest.fn(),
});

const mockNotificationService = () => ({
  createNotification: jest.fn(),
});

const mockPubSub = () => ({
  publish: jest.fn(),
});

describe('InviteService 테스트', () => {
  let inviteService: InviteService;
  let inviteRepository: MockRepository<Invite>;
  let userService: MockService<UserService>;
  let roomService: MockService<RoomService>;
  let notificationService: MockService<NotificationService>;
  let pubSub: MockService<PubSub>;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [
        InviteService,
        {
          provide: getRepositoryToken(Invite),
          useValue: mockRepository(),
        },
        CommonService,
        {
          provide: UserService,
          useValue: mockUserService(),
        },
        {
          provide: RoomService,
          useValue: mockRoomService(),
        },
        {
          provide: NotificationService,
          useValue: mockNotificationService(),
        },
        { provide: PUB_SUB, useValue: mockPubSub() },
      ],
    }).compile();

    inviteService = module.get(InviteService);
    inviteRepository = module.get(getRepositoryToken(Invite));
    userService = module.get(UserService);
    roomService = module.get(RoomService);
    notificationService = module.get(NotificationService);
    pubSub = module.get(PUB_SUB);
  });

  it('서비스 health check ', () => {
    expect(inviteService).toBeDefined();
    expect(inviteRepository).toBeDefined();
    expect(userService).toBeDefined();
    expect(roomService).toBeDefined();
    expect(notificationService).toBeDefined();
    expect(pubSub).toBeDefined();
  });

  describe('채팅 가능한 유저 목록 조회 테스트', () => {
    it('채팅 가능한 유저가 없을 때', async () => {
      userService.findUserById.mockResolvedValue(mockUser);
      userService.findBlockedMe.mockResolvedValue([]);
      userService.existingChatUserIds.mockResolvedValue([]);
      userService.findChatEnabledUsers.mockResolvedValue([]);

      const result = await inviteService.inviteTargets({ count: 2 }, mockUser);

      expect(result.ok).toEqual(false);
      expect(typeof result.error).toBe('string');
      expect(result.targets).toEqual(undefined);

      expect(userService.findUserById).toHaveBeenCalledTimes(1);
      expect(userService.findBlockedMe).toHaveBeenCalledTimes(1);
      expect(userService.existingChatUserIds).toHaveBeenCalledTimes(1);
      expect(userService.findChatEnabledUsers).toHaveBeenCalledTimes(1);
    });

    it('채팅 가능한 유저 목록 조회', async () => {
      userService.findUserById.mockResolvedValue(mockUser);
      userService.findBlockedMe.mockResolvedValue([]);
      userService.existingChatUserIds.mockResolvedValue([]);
      userService.findChatEnabledUsers.mockResolvedValue([
        mockUser2,
        mockUser2,
        mockUser2,
        mockUser2,
      ]);

      const result = await inviteService.inviteTargets({ count: 2 }, mockUser);

      expect(result.ok).toEqual(true);
      expect(result.error).toEqual(undefined);
      expect(result.targets.length).toBe(2);

      expect(userService.findUserById).toHaveBeenCalledTimes(1);
      expect(userService.findBlockedMe).toHaveBeenCalledTimes(1);
      expect(userService.existingChatUserIds).toHaveBeenCalledTimes(1);
      expect(userService.findChatEnabledUsers).toHaveBeenCalledTimes(1);
    });
  });

  it('초대 목록 조회 테스트', async () => {
    inviteRepository.find.mockResolvedValue([mockInvite]);
    roomService.findRoomByIds.mockResolvedValue([mockInviteRoom]);

    const result = await inviteService.myInvites(mockUser);

    expect(result.ok).toEqual(true);
    expect(result.error).toEqual(undefined);
    expect(result.rooms).toEqual([mockInviteRoom]);

    expect(inviteRepository.find).toHaveBeenCalledTimes(1);
    expect(roomService.findRoomByIds).toHaveBeenCalledTimes(1);
  });

  describe('초대 생성 테스트', () => {
    it('초대 가능한 유저가 없을 경우', async () => {
      userService.findUserById.mockResolvedValue(null);

      const result = await inviteService.createInvite(
        { targetIds: ['1'] },
        mockUser,
      );

      expect(result.ok).toEqual(false);
      expect(typeof result.error).toBe('string');
      expect(result.room).toEqual(undefined);

      expect(userService.findUserById).toHaveBeenCalledTimes(1);
    });

    it('초대 생성', async () => {
      userService.findUserById.mockResolvedValue(mockUser2);
      inviteRepository.save.mockResolvedValueOnce(mockInvite);
      inviteRepository.save.mockResolvedValue({
        ...mockInvite,
        user: mockUser2,
      });
      roomService.createRoomByInvite.mockResolvedValue(mockInviteRoom);

      const result = await inviteService.createInvite(
        { targetIds: ['1', '2'] },
        mockUser,
      );

      expect(result.ok).toEqual(true);
      expect(result.error).toEqual(undefined);
      expect(result.room).toEqual({
        ...mockInviteRoom,
        invites: [
          mockInvite,
          { ...mockInvite, user: mockUser2 },
          { ...mockInvite, user: mockUser2 },
        ],
      });

      expect(userService.findUserById).toHaveBeenCalledTimes(2);
      expect(userService.findUserById).toHaveBeenCalledWith('1');
      expect(userService.findUserById).toHaveBeenCalledWith('2');

      expect(inviteRepository.save).toHaveBeenCalledTimes(3);

      expect(roomService.createRoomByInvite).toHaveBeenCalledTimes(1);
      expect(roomService.createRoomByInvite).toHaveBeenCalledWith([
        mockInvite,
        { ...mockInvite, user: mockUser2 },
        { ...mockInvite, user: mockUser2 },
      ]);

      expect(notificationService.createNotification).toHaveBeenCalledTimes(2);
    });
  });

  describe('초대 응답 테스트', () => {
    const input = {
      id: '1',
      status: InviteStatus.ACCEPT,
    };
    it('잘못된 응답인 경우', async () => {
      const result = await inviteService.updateInvite(
        { ...input, status: InviteStatus.WAIT },
        mockUser,
      );

      expect(result.ok).toEqual(false);
      expect(typeof result.error).toBe('string');
      expect(result.room).toEqual(undefined);
    });

    it('초대가 없을 경우', async () => {
      inviteRepository.findOne.mockResolvedValue(null);

      const result = await inviteService.updateInvite(input, mockUser);

      expect(result.ok).toEqual(false);
      expect(typeof result.error).toBe('string');
      expect(result.room).toEqual(undefined);

      expect(inviteRepository.findOne).toHaveBeenCalledTimes(1);
    });

    it('내가 받은 초대가 아닌 경우', async () => {
      inviteRepository.findOne.mockResolvedValue({
        ...mockInvite,
        user: mockUser2,
      });

      const result = await inviteService.updateInvite(input, mockUser);

      expect(result.ok).toEqual(false);
      expect(typeof result.error).toBe('string');
      expect(result.room).toEqual(undefined);

      expect(inviteRepository.findOne).toHaveBeenCalledTimes(1);
    });

    it('이미 응답한 초대인 경우', async () => {
      inviteRepository.findOne.mockResolvedValue({
        ...mockInvite,
        status: InviteStatus.ACCEPT,
      });

      const result = await inviteService.updateInvite(input, mockUser);

      expect(result.ok).toEqual(false);
      expect(typeof result.error).toBe('string');
      expect(result.room).toEqual(undefined);

      expect(inviteRepository.findOne).toHaveBeenCalledTimes(1);
    });

    it('초대 응답 (대기중인 초대가 있는 경우)', async () => {
      inviteRepository.findOne.mockResolvedValue(mockInvite);
      inviteRepository.find.mockResolvedValue([
        { ...mockInvite, status: InviteStatus.WAIT },
      ]);

      const result = await inviteService.updateInvite(input, mockUser);

      expect(result.ok).toEqual(true);
      expect(result.error).toEqual(undefined);
      expect(result.room).toEqual(undefined);

      expect(inviteRepository.findOne).toHaveBeenCalledTimes(1);
      expect(inviteRepository.find).toHaveBeenCalledTimes(1);
      expect(inviteRepository.update).toHaveBeenCalledTimes(1);

      expect(
        roomService.createUserRoomForAcceptedInvites,
      ).toHaveBeenCalledTimes(0);

      expect(pubSub.publish).toHaveBeenCalledTimes(1);
      expect(notificationService.createNotification).toHaveBeenCalledTimes(1);
    });

    it('초대 응답 (초대 수락이 2명 이상이 안되는 경우)', async () => {
      inviteRepository.findOne.mockResolvedValue(mockInvite);
      inviteRepository.find.mockResolvedValue([
        { ...mockInvite, status: InviteStatus.REJECT },
      ]);

      const result = await inviteService.updateInvite(input, mockUser);

      expect(result.ok).toEqual(true);
      expect(result.error).toEqual(undefined);
      expect(result.room).toEqual(undefined);

      expect(inviteRepository.findOne).toHaveBeenCalledTimes(1);
      expect(inviteRepository.find).toHaveBeenCalledTimes(1);
      expect(inviteRepository.update).toHaveBeenCalledTimes(1);

      expect(
        roomService.createUserRoomForAcceptedInvites,
      ).toHaveBeenCalledTimes(0);
      expect(roomService.deleteRoomOnInviteReject).toHaveBeenCalledTimes(1);

      expect(pubSub.publish).toHaveBeenCalledTimes(1);
      expect(notificationService.createNotification).toHaveBeenCalledTimes(1);
    });

    it('초대 응답 (채팅방 생성)', async () => {
      inviteRepository.findOne.mockResolvedValue(mockInvite);
      inviteRepository.find.mockResolvedValue([
        { ...mockInvite, status: InviteStatus.ACCEPT },
      ]);
      roomService.createUserRoomForAcceptedInvites.mockResolvedValue(
        mockMyRoom,
      );

      const result = await inviteService.updateInvite(input, mockUser);

      expect(result.ok).toEqual(true);
      expect(result.error).toEqual(undefined);
      expect(result.room).toEqual(mockMyRoom);

      expect(inviteRepository.findOne).toHaveBeenCalledTimes(1);
      expect(inviteRepository.find).toHaveBeenCalledTimes(1);
      expect(inviteRepository.update).toHaveBeenCalledTimes(1);

      expect(
        roomService.createUserRoomForAcceptedInvites,
      ).toHaveBeenCalledTimes(1);

      expect(pubSub.publish).toHaveBeenCalledTimes(1);
      expect(notificationService.createNotification).toHaveBeenCalledTimes(1);
    });
  });
});
