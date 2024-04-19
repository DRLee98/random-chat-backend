import { MockRepository, MockService, mockRepository } from 'test/utils';
import { NotificationService } from '../notification.service';
import {
  Notification,
  NotificationType,
} from '../entities/notification.entity';
import { Test } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { FcmService } from 'src/fcm/fcm.service';
import { mockUser } from 'test/mockData';
import { CommonService } from 'src/common/common.service';

const mockNotification: Notification = {
  id: '1',
  title: 'title',
  message: 'message',
  type: NotificationType.SYSTEM,
  read: false,
  user: mockUser,
  createdAt: new Date(),
  updatedAt: new Date(),
  deletedAt: null,
};

const mockFcmService = () => ({
  pushMessage: jest.fn(),
});

describe('NotificationService 테스트', () => {
  let notificationService: NotificationService;
  let notificationRepository: MockRepository<Notification>;
  let fcmService: MockService<FcmService>;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [
        NotificationService,
        {
          provide: getRepositoryToken(Notification),
          useValue: mockRepository(),
        },
        {
          provide: FcmService,
          useValue: mockFcmService(),
        },
        CommonService,
      ],
    }).compile();

    notificationService = module.get(NotificationService);
    notificationRepository = module.get(getRepositoryToken(Notification));
    fcmService = module.get(FcmService);
  });

  it('서비스 health check ', () => {
    expect(notificationService).toBeDefined();
    expect(notificationRepository).toBeDefined();
    expect(fcmService).toBeDefined();
  });

  it('알림 목록 조회 테스트', async () => {
    const notificationList = [mockNotification];
    notificationRepository.find.mockResolvedValue(notificationList);

    const result = await notificationService.viewNotifications(
      { take: 20, skip: 0 },
      mockUser,
    );

    expect(result.ok).toEqual(true);
    expect(result.error).toEqual(undefined);
    expect(result.notifications).toEqual(notificationList);

    expect(notificationRepository.find).toHaveBeenCalledTimes(1);
  });

  describe('알림 생성 테스트', () => {
    it('알림 생성 (유저가 토큰이 없는 경우)', async () => {
      const user = { ...mockUser, fcmToken: null };
      const input = {
        title: mockNotification.title,
        message: mockNotification.message,
        type: NotificationType.SYSTEM,
      };

      notificationRepository.create.mockReturnValue(mockNotification);
      notificationRepository.save.mockResolvedValue(mockNotification);

      const result = await notificationService.createNotification(input, user);

      expect(result.ok).toEqual(true);
      expect(result.error).toEqual(undefined);
      expect(result.notification).toEqual(mockNotification);

      expect(notificationRepository.create).toHaveBeenCalledTimes(1);
      expect(notificationRepository.create).toHaveBeenCalledWith({
        ...input,
        user,
      });

      expect(notificationRepository.save).toHaveBeenCalledTimes(1);
      expect(notificationRepository.save).toHaveBeenCalledWith(
        mockNotification,
      );

      expect(fcmService.pushMessage).toHaveBeenCalledTimes(0);
    });

    it('알림 생성 (유저가 토큰이 있는 경우)', async () => {
      const input = {
        title: mockNotification.title,
        message: mockNotification.message,
        type: NotificationType.SYSTEM,
        imageUrl: '',
        data: {},
      };

      notificationRepository.create.mockReturnValue(mockNotification);
      notificationRepository.save.mockResolvedValue(mockNotification);

      const result = await notificationService.createNotification(
        input,
        mockUser,
      );

      expect(result.ok).toEqual(true);
      expect(result.error).toEqual(undefined);
      expect(result.notification).toEqual(mockNotification);

      expect(notificationRepository.create).toHaveBeenCalledTimes(1);
      expect(notificationRepository.create).toHaveBeenCalledWith({
        ...input,
        user: mockUser,
      });

      expect(notificationRepository.save).toHaveBeenCalledTimes(1);
      expect(notificationRepository.save).toHaveBeenCalledWith(
        mockNotification,
      );

      expect(fcmService.pushMessage).toHaveBeenCalledTimes(1);
      expect(fcmService.pushMessage).toHaveBeenCalledWith({
        token: mockUser.fcmToken,
        title: input.title,
        message: input.message,
        imageUrl: input.imageUrl,
        data: input.data,
      });
    });
  });

  describe('알림 읽음 처리 테스트', () => {
    it('알림을 찾을 수 없는 경우', async () => {
      notificationRepository.findOne.mockResolvedValue(null);

      const result = await notificationService.readNotification(
        { id: 'xx' },
        mockUser,
      );

      expect(result.ok).toEqual(false);
      expect(typeof result.error).toBe('string');

      expect(notificationRepository.findOne).toHaveBeenCalledTimes(1);
    });

    it('알림 읽음 처리', async () => {
      notificationRepository.findOne.mockResolvedValue(mockNotification);

      const result = await notificationService.readNotification(
        { id: mockNotification.id },
        mockUser,
      );

      expect(result.ok).toEqual(true);
      expect(result.error).toEqual(undefined);

      expect(notificationRepository.findOne).toHaveBeenCalledTimes(1);
      expect(notificationRepository.update).toHaveBeenCalledTimes(1);
      expect(notificationRepository.update).toHaveBeenCalledWith(
        mockNotification.id,
        {
          read: true,
        },
      );
    });
  });

  describe('알림 삭제 테스트', () => {
    it('알림을 찾을 수 없는 경우', async () => {
      notificationRepository.findOne.mockResolvedValue(null);

      const result = await notificationService.deleteNotification(
        { id: 'xx' },
        mockUser,
      );

      expect(result.ok).toEqual(false);
      expect(typeof result.error).toBe('string');

      expect(notificationRepository.findOne).toHaveBeenCalledTimes(1);
    });

    it('알림 삭제', async () => {
      notificationRepository.findOne.mockResolvedValue(mockNotification);

      const result = await notificationService.deleteNotification(
        { id: mockNotification.id },
        mockUser,
      );

      expect(result.ok).toEqual(true);
      expect(result.error).toEqual(undefined);

      expect(notificationRepository.findOne).toHaveBeenCalledTimes(1);
      expect(notificationRepository.softDelete).toHaveBeenCalledTimes(1);
      expect(notificationRepository.softDelete).toHaveBeenCalledWith(
        mockNotification.id,
      );
    });
  });
});
