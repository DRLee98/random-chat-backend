import { Test } from '@nestjs/testing';
import { AccusationService } from '../accusation.service';
import { AccusationInfo } from '../entities/accusation-info.entity';
import { MockRepository, MockService, mockRepository } from 'test/utils';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Accusation, AccusationStatus } from '../entities/accusation.entity';
import { CommonService } from 'src/common/common.service';
import { UserService } from 'src/user/user.service';
import { NotificationService } from 'src/notification/notification.service';
import { AwsService } from 'src/aws/aws.service';
import {
  mockAccusation,
  mockAccusationInfo,
  mockImage,
  mockUser,
} from 'test/mockData';
import { ConfigService } from '@nestjs/config';
import { LIMIT_COUNT } from '../accusation.constants';

const mockAwsService = () => ({
  uploadFiles: jest.fn(),
});

const mockUserService = () => ({
  suspendUserUntilDate: jest.fn(),
});

const mockNotificationService = () => ({
  createNotification: jest.fn(),
});

const env = {
  PASSWORD: 'password',
};

const mockConfigService = () => {
  return {
    get: (key: string) => env[key],
  };
};

describe('AccusationService 테스트', () => {
  let accusationService: AccusationService;
  let accusationInfoRepository: MockRepository<AccusationInfo>;
  let accusationRepository: MockRepository<AccusationInfo>;
  let awsService: MockService<AwsService>;
  let userService: MockService<UserService>;
  let notificationService: MockService<NotificationService>;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [
        AccusationService,
        {
          provide: getRepositoryToken(AccusationInfo),
          useValue: mockRepository(),
        },
        {
          provide: getRepositoryToken(Accusation),
          useValue: mockRepository(),
        },
        CommonService,
        {
          provide: AwsService,
          useValue: mockAwsService(),
        },
        {
          provide: UserService,
          useValue: mockUserService(),
        },
        {
          provide: NotificationService,
          useValue: mockNotificationService(),
        },
        {
          provide: ConfigService,
          useValue: mockConfigService(),
        },
      ],
    }).compile();

    accusationService = module.get(AccusationService);
    accusationInfoRepository = module.get(getRepositoryToken(AccusationInfo));
    accusationRepository = module.get(getRepositoryToken(Accusation));
    awsService = module.get(AwsService);
    userService = module.get(UserService);
    notificationService = module.get(NotificationService);
  });

  it('서비스 health check', () => {
    expect(accusationService).toBeDefined();
    expect(accusationInfoRepository).toBeDefined();
    expect(accusationRepository).toBeDefined();
    expect(awsService).toBeDefined();
    expect(userService).toBeDefined();
    expect(notificationService).toBeDefined();
  });

  describe('나에 대한 신고 정보 조회 테스트', () => {
    it('나에 대한 신고 정보 조회', async () => {
      accusationInfoRepository.findOne.mockResolvedValue(mockAccusationInfo);

      const result = await accusationService.myAccusationInfo(
        mockAccusationInfo.user,
      );

      expect(result.ok).toEqual(true);
      expect(result.message).toEqual(undefined);
      expect(result.error).toEqual(undefined);

      expect(accusationInfoRepository.findOne).toHaveBeenCalledTimes(1);
    });

    it('나에 대한 신고 정보 조회 (알림을 띄울 경우)', async () => {
      accusationInfoRepository.findOne.mockResolvedValue({
        ...mockAccusationInfo,
        showAlert: true,
      });

      const result = await accusationService.myAccusationInfo(
        mockAccusationInfo.user,
      );

      expect(result.ok).toEqual(true);
      expect(typeof result.message).toBe('string');
      expect(result.error).toEqual(undefined);

      expect(accusationInfoRepository.findOne).toHaveBeenCalledTimes(1);

      expect(accusationInfoRepository.update).toHaveBeenCalledTimes(1);
      expect(accusationInfoRepository.update).toHaveBeenCalledWith(
        mockAccusationInfo.id,
        { showAlert: false },
      );
    });
  });

  describe('신고 목록 조회 테스트', () => {
    const input = {
      skip: 0,
      take: 30,
    };

    it('비밀번호가 공백일 경우', async () => {
      const result = await accusationService.viewAccusations({
        password: '',
        ...input,
      });

      expect(result.ok).toEqual(false);
      expect(typeof result.error).toBe('string');
    });

    it('비밀번호가 틀렸을 경우', async () => {
      const result = await accusationService.viewAccusations({
        password: 'xx',
        ...input,
      });

      expect(result.ok).toEqual(false);
      expect(typeof result.error).toBe('string');
    });

    it('신고 목록 조회', async () => {
      accusationRepository.find.mockResolvedValue([mockAccusationInfo]);

      const result = await accusationService.viewAccusations({
        password: env.PASSWORD,
        ...input,
      });

      expect(result.ok).toEqual(true);
      expect(result.accusations).toHaveLength(1);
      expect(result.error).toEqual(undefined);
    });
  });

  describe('신고 목록 조회 테스트', () => {
    const input = {
      id: mockAccusationInfo.id,
    };

    it('비밀번호가 공백일 경우', async () => {
      const result = await accusationService.viewAccusation({
        password: '',
        ...input,
      });

      expect(result.ok).toEqual(false);
      expect(typeof result.error).toBe('string');
    });

    it('비밀번호가 틀렸을 경우', async () => {
      const result = await accusationService.viewAccusation({
        password: 'xx',
        ...input,
      });

      expect(result.ok).toEqual(false);
      expect(typeof result.error).toBe('string');
    });

    it('신고 목록 조회', async () => {
      accusationRepository.findOne.mockResolvedValue(mockAccusationInfo);

      const result = await accusationService.viewAccusation({
        password: env.PASSWORD,
        ...input,
      });

      expect(result.ok).toEqual(true);
      expect(result.accusation).toEqual(mockAccusationInfo);
      expect(result.error).toEqual(undefined);
    });
  });

  describe('신고 작성 테스트', () => {
    const input = {
      targetUserId: '1',
      content: 'test',
    };
    it('일주일 이내에 신고한 이력이 있는 유저를 다시 신고 시도할 경우', async () => {
      accusationRepository.findOne.mockResolvedValue(mockAccusation);

      const result = await accusationService.createAccusation(input, mockUser);

      expect(result.ok).toEqual(false);
      expect(typeof result.error).toBe('string');
    });

    it('신고 작성', async () => {
      accusationRepository.findOne.mockResolvedValue(null);
      accusationInfoRepository.findOne.mockResolvedValue(mockAccusationInfo);
      accusationRepository.create.mockReturnValue(mockAccusation);

      const result = await accusationService.createAccusation(input, mockUser);

      expect(result.ok).toEqual(true);
      expect(result.error).toEqual(undefined);

      expect(accusationRepository.findOne).toHaveBeenCalledTimes(1);
      expect(accusationInfoRepository.findOne).toHaveBeenCalledTimes(1);

      expect(accusationRepository.create).toHaveBeenCalledTimes(1);
      expect(accusationRepository.save).toHaveBeenCalledTimes(1);
      expect(accusationRepository.save).toHaveBeenCalledWith(mockAccusation);

      expect(notificationService.createNotification).toHaveBeenCalledTimes(1);
    });

    it('신고 작성 (신고 대상에 대한 신고 정보가 없는 경우)', async () => {
      accusationRepository.findOne.mockResolvedValue(null);
      accusationInfoRepository.findOne.mockResolvedValue(null);
      accusationInfoRepository.save.mockResolvedValue(mockAccusationInfo);
      accusationRepository.create.mockReturnValue(mockAccusation);

      const result = await accusationService.createAccusation(input, mockUser);

      expect(result.ok).toEqual(true);
      expect(result.error).toEqual(undefined);

      expect(accusationRepository.findOne).toHaveBeenCalledTimes(1);
      expect(accusationInfoRepository.findOne).toHaveBeenCalledTimes(1);
      expect(accusationInfoRepository.save).toHaveBeenCalledTimes(1);

      expect(accusationRepository.create).toHaveBeenCalledTimes(1);
      expect(accusationRepository.save).toHaveBeenCalledTimes(1);
      expect(accusationRepository.save).toHaveBeenCalledWith(mockAccusation);

      expect(notificationService.createNotification).toHaveBeenCalledTimes(1);
    });

    it('신고 작성 (이미지 첨부)', async () => {
      const updateUrls = ['xxx'];
      accusationRepository.findOne.mockResolvedValue(null);
      accusationInfoRepository.findOne.mockResolvedValue(mockAccusationInfo);
      accusationRepository.create.mockReturnValue(mockAccusation);
      awsService.uploadFiles.mockResolvedValue({
        ok: true,
        urls: updateUrls,
      });

      const result = await accusationService.createAccusation(
        { ...input, images: [mockImage] },
        mockUser,
      );

      expect(result.ok).toEqual(true);
      expect(result.error).toEqual(undefined);

      expect(accusationRepository.findOne).toHaveBeenCalledTimes(1);
      expect(accusationInfoRepository.findOne).toHaveBeenCalledTimes(1);

      expect(accusationRepository.create).toHaveBeenCalledTimes(1);
      expect(accusationRepository.save).toHaveBeenCalledTimes(1);
      expect(accusationRepository.save).toHaveBeenCalledWith({
        ...mockAccusation,
        imageUrls: updateUrls,
      });

      expect(notificationService.createNotification).toHaveBeenCalledTimes(1);
    });
  });

  describe('신고 처리 테스트', () => {
    const input = {
      id: mockAccusation.id,
      status: AccusationStatus.ACCEPT,
      answer: 'test answer',
    };

    it('비밀번호가 공백일 경우', async () => {
      const result = await accusationService.updateAccusationStatus({
        password: '',
        ...input,
      });

      expect(result.ok).toEqual(false);
      expect(typeof result.error).toBe('string');
    });

    it('비밀번호가 틀렸을 경우', async () => {
      const result = await accusationService.updateAccusationStatus({
        password: 'xx',
        ...input,
      });

      expect(result.ok).toEqual(false);
      expect(typeof result.error).toBe('string');
    });

    it('존재하지 않는 신고일 경우', async () => {
      accusationRepository.findOne.mockResolvedValue(null);

      const result = await accusationService.updateAccusationStatus({
        password: env.PASSWORD,
        ...input,
      });

      expect(result.ok).toEqual(false);
      expect(typeof result.error).toBe('string');

      expect(accusationRepository.findOne).toHaveBeenCalledTimes(1);
    });

    it('이미 처리된 신고일 경우', async () => {
      accusationRepository.findOne.mockResolvedValue({
        ...mockAccusation,
        status: AccusationStatus.ACCEPT,
      });

      const result = await accusationService.updateAccusationStatus({
        password: env.PASSWORD,
        ...input,
      });

      expect(result.ok).toEqual(false);
      expect(typeof result.error).toBe('string');

      expect(accusationRepository.findOne).toHaveBeenCalledTimes(1);
    });

    it('처리 요청된 상태가 잘못된 경우', async () => {
      accusationRepository.findOne.mockResolvedValue(mockAccusation);

      const result = await accusationService.updateAccusationStatus({
        password: env.PASSWORD,
        ...input,
        status: AccusationStatus.WAIT,
      });

      expect(result.ok).toEqual(false);
      expect(typeof result.error).toBe('string');

      expect(accusationRepository.findOne).toHaveBeenCalledTimes(1);
    });

    it('신고 처리 (거절 상태로 변경)', async () => {
      accusationRepository.findOne.mockResolvedValue(mockAccusation);

      const result = await accusationService.updateAccusationStatus({
        password: env.PASSWORD,
        ...input,
        status: AccusationStatus.REJECT,
      });

      expect(result.ok).toEqual(true);
      expect(result.error).toEqual(undefined);

      expect(accusationRepository.findOne).toHaveBeenCalledTimes(1);
      expect(accusationRepository.update).toHaveBeenCalledTimes(1);
      expect(accusationRepository.update).toHaveBeenCalledWith(
        mockAccusation.id,
        {
          status: AccusationStatus.REJECT,
          answer: input.answer,
        },
      );
    });

    it('신고 처리 (수락 상태로 변경)', async () => {
      accusationRepository.findOne.mockResolvedValue({
        ...mockAccusation,
        info: mockAccusationInfo,
      });

      const result = await accusationService.updateAccusationStatus({
        password: env.PASSWORD,
        ...input,
      });

      expect(result.ok).toEqual(true);
      expect(result.error).toEqual(undefined);

      expect(accusationRepository.findOne).toHaveBeenCalledTimes(1);
      expect(accusationRepository.update).toHaveBeenCalledTimes(1);
      expect(accusationRepository.update).toHaveBeenCalledWith(
        mockAccusation.id,
        {
          status: input.status,
          answer: input.answer,
        },
      );

      expect(accusationInfoRepository.update).toHaveBeenCalledTimes(1);
      expect(accusationInfoRepository.update).toHaveBeenCalledWith(
        mockAccusationInfo.id,
        {
          count: mockAccusationInfo.count + 1,
          showAlert: true,
        },
      );

      expect(notificationService.createNotification).toHaveBeenCalledTimes(1);
    });

    it('신고 처리 (수락 상태로 변경 및 대상 유저 정지)', async () => {
      accusationRepository.findOne.mockResolvedValue({
        ...mockAccusation,
        info: { ...mockAccusationInfo, count: LIMIT_COUNT - 1 },
      });

      const result = await accusationService.updateAccusationStatus({
        password: env.PASSWORD,
        ...input,
      });

      expect(result.ok).toEqual(true);
      expect(result.error).toEqual(undefined);

      expect(accusationRepository.findOne).toHaveBeenCalledTimes(1);
      expect(accusationRepository.update).toHaveBeenCalledTimes(1);
      expect(accusationRepository.update).toHaveBeenCalledWith(
        mockAccusation.id,
        {
          status: input.status,
          answer: input.answer,
        },
      );

      expect(accusationInfoRepository.update).toHaveBeenCalledTimes(1);
      expect(accusationInfoRepository.update).toHaveBeenCalledWith(
        mockAccusationInfo.id,
        {
          count: 0,
          showAlert: false,
        },
      );

      expect(notificationService.createNotification).toHaveBeenCalledTimes(1);
      expect(userService.suspendUserUntilDate).toHaveBeenCalledTimes(1);
    });
  });
});
