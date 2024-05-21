import { Test } from '@nestjs/testing';
import { OpinionService } from '../opinion.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import {
  Opinion,
  OpinionCategory,
  OpinionStatus,
} from '../entities/opinion.entity';
import { MockRepository, MockService, mockRepository } from 'test/utils';
import { AwsService } from 'src/aws/aws.service';
import { CommentService } from 'src/comment/comment.service';
import { CommonService } from 'src/common/common.service';
import { mockImage, mockOpinion, mockUser } from 'test/mockData';
import { NotificationService } from 'src/notification/notification.service';
import { ConfigService } from '@nestjs/config';

const mockAwsService = () => ({
  uploadFiles: jest.fn(),
});

const mockCommentService = () => ({
  deleteCommentsByPostId: jest.fn(),
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

describe('OpinionService', () => {
  let opinionService: OpinionService;
  let opinionRepository: MockRepository<Opinion>;
  let awsService: MockService<AwsService>;
  let commentService: MockService<CommentService>;
  let notificationService: MockService<NotificationService>;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [
        OpinionService,
        {
          provide: getRepositoryToken(Opinion),
          useValue: mockRepository(),
        },
        {
          provide: AwsService,
          useValue: mockAwsService(),
        },
        {
          provide: CommentService,
          useValue: mockCommentService(),
        },
        {
          provide: NotificationService,
          useValue: mockNotificationService(),
        },
        CommonService,
        {
          provide: ConfigService,
          useValue: mockConfigService(),
        },
      ],
    }).compile();

    opinionService = module.get(OpinionService);
    opinionRepository = module.get(getRepositoryToken(Opinion));
    awsService = module.get(AwsService);
    commentService = module.get(CommentService);
    notificationService = module.get(NotificationService);
  });

  it('서비스 health check', () => {
    expect(opinionService).toBeDefined();
    expect(opinionRepository).toBeDefined();
    expect(awsService).toBeDefined();
    expect(commentService).toBeDefined();
    expect(notificationService).toBeDefined();
  });

  describe('의견 상세 조회 테스트', () => {
    const input = {
      id: mockOpinion.id,
    };

    it('의견이 존재하지 않는 경우', async () => {
      opinionRepository.findOne.mockResolvedValue(undefined);

      const result = await opinionService.opinionDetail(input, mockUser);

      expect(result.ok).toEqual(false);
      expect(typeof result.error).toBe('string');

      expect(opinionRepository.findOne).toHaveBeenCalledTimes(1);
    });

    it('의견 작성자가 아닐 경우', async () => {
      opinionRepository.findOne.mockResolvedValue({
        ...mockOpinion,
        user: { id: '2' },
      });

      const result = await opinionService.opinionDetail(input, mockUser);

      expect(result.ok).toEqual(false);
      expect(typeof result.error).toBe('string');

      expect(opinionRepository.findOne).toHaveBeenCalledTimes(1);
    });

    it('의견 상세 조회', async () => {
      opinionRepository.findOne.mockResolvedValue(mockOpinion);

      const result = await opinionService.opinionDetail(input, mockUser);

      expect(result.ok).toEqual(true);
      expect(result.error).toEqual(undefined);
      expect(result.opinion).toEqual(mockOpinion);

      expect(opinionRepository.findOne).toHaveBeenCalledTimes(1);
    });
  });

  describe('의견 생성 테스트', () => {
    const input = {
      title: mockOpinion.title,
      content: mockOpinion.content,
      category: mockOpinion.category,
    };
    it('의견 생성', async () => {
      opinionRepository.create.mockReturnValue(mockOpinion);

      const result = await opinionService.createOpinion(input, mockUser);

      expect(result.ok).toEqual(true);
      expect(result.error).toEqual(undefined);
      expect(result.opinion).toEqual(mockOpinion);

      expect(opinionRepository.create).toHaveBeenCalledTimes(1);
      expect(opinionRepository.create).toHaveBeenCalledWith({
        ...input,
        user: mockUser,
      });
      expect(opinionRepository.save).toHaveBeenCalledTimes(1);
      expect(opinionRepository.save).toHaveBeenCalledWith(mockOpinion);
    });

    it('의견 생성 이미지 포함', async () => {
      const urls = ['test'];
      awsService.uploadFiles.mockResolvedValue({
        ok: true,
        urls,
      });
      opinionRepository.create.mockReturnValue(mockOpinion);

      const result = await opinionService.createOpinion(
        { ...input, images: [mockImage] },
        mockUser,
      );

      expect(result.ok).toEqual(true);
      expect(result.error).toEqual(undefined);
      expect(result.opinion).toEqual({ ...mockOpinion, imageUrls: urls });

      expect(opinionRepository.create).toHaveBeenCalledTimes(1);
      expect(opinionRepository.create).toHaveBeenCalledWith({
        ...input,
        user: mockUser,
      });
      expect(opinionRepository.save).toHaveBeenCalledTimes(1);
      expect(opinionRepository.save).toHaveBeenCalledWith({
        ...mockOpinion,
        imageUrls: urls,
      });
    });
  });

  describe('의견 수정 테스트', () => {
    const input = {
      id: mockOpinion.id,
      title: 'title2',
      content: 'content2',
      category: OpinionCategory.BUG,
    };

    const { id: _, ...updateInput } = input;

    it('의견이 없을 경우', async () => {
      opinionRepository.findOne.mockResolvedValue(null);

      const result = await opinionService.editOpinion(input, mockUser);

      expect(result.ok).toEqual(false);
      expect(typeof result.error).toBe('string');

      expect(opinionRepository.findOne).toHaveBeenCalledTimes(1);
    });

    it('의견 작성자가 아닐 경우', async () => {
      opinionRepository.findOne.mockResolvedValue({
        ...mockOpinion,
        user: { id: '2' },
      });

      const result = await opinionService.editOpinion(input, mockUser);

      expect(result.ok).toEqual(false);
      expect(typeof result.error).toBe('string');

      expect(opinionRepository.findOne).toHaveBeenCalledTimes(1);
    });

    it('의견이 확인 중일 경우', async () => {
      opinionRepository.findOne.mockResolvedValue({
        ...mockOpinion,
        status: OpinionStatus.READ,
      });

      const result = await opinionService.editOpinion(input, mockUser);

      expect(result.ok).toEqual(false);
      expect(typeof result.error).toBe('string');

      expect(opinionRepository.findOne).toHaveBeenCalledTimes(1);
    });

    it('의견 수정', async () => {
      opinionRepository.findOne.mockResolvedValue(mockOpinion);

      const result = await opinionService.editOpinion(input, mockUser);

      expect(result.ok).toEqual(true);
      expect(result.error).toEqual(undefined);
      expect(result.opinion).toEqual({ ...mockOpinion, ...input });

      expect(opinionRepository.update).toHaveBeenCalledTimes(1);
      expect(opinionRepository.update).toHaveBeenCalledWith(input.id, {
        ...updateInput,
        imageUrls: mockOpinion.imageUrls,
      });
    });

    it('의견 수정 (기존 이미지 수정)', async () => {
      const updateUrls = ['xxx'];
      opinionRepository.findOne.mockResolvedValue(mockOpinion);

      const result = await opinionService.editOpinion(
        { ...input, imageUrls: updateUrls },
        mockUser,
      );

      expect(result.ok).toEqual(true);
      expect(result.error).toEqual(undefined);
      expect(result.opinion).toEqual({
        ...mockOpinion,
        ...updateInput,
        imageUrls: updateUrls,
      });

      expect(opinionRepository.update).toHaveBeenCalledTimes(1);
      expect(opinionRepository.update).toHaveBeenCalledWith(input.id, {
        ...updateInput,
        imageUrls: updateUrls,
      });
    });

    it('의견 수정 (이미지 추가)', async () => {
      const updateUrls = ['xxx'];
      opinionRepository.findOne.mockResolvedValue(mockOpinion);
      awsService.uploadFiles.mockResolvedValue({
        ok: true,
        urls: updateUrls,
      });

      const result = await opinionService.editOpinion(
        { ...input, images: [mockImage] },
        mockUser,
      );

      expect(result.ok).toEqual(true);
      expect(result.error).toEqual(undefined);
      expect(result.opinion).toEqual({
        ...mockOpinion,
        ...updateInput,
        imageUrls: [...mockOpinion.imageUrls, ...updateUrls],
      });

      expect(opinionRepository.update).toHaveBeenCalledTimes(1);
      expect(opinionRepository.update).toHaveBeenCalledWith(input.id, {
        ...updateInput,
        imageUrls: [...mockOpinion.imageUrls, ...updateUrls],
      });
    });

    it('의견 수정 (기존 이미지 수정 및 이미지 추가)', async () => {
      const updateUrls = ['xxx'];
      const uploadUrls = ['yyy'];
      opinionRepository.findOne.mockResolvedValue(mockOpinion);
      awsService.uploadFiles.mockResolvedValue({
        ok: true,
        urls: uploadUrls,
      });

      const result = await opinionService.editOpinion(
        { ...input, imageUrls: updateUrls, images: [mockImage] },
        mockUser,
      );

      expect(result.ok).toEqual(true);
      expect(result.error).toEqual(undefined);
      expect(result.opinion).toEqual({
        ...mockOpinion,
        ...updateInput,
        imageUrls: [...updateUrls, ...uploadUrls],
      });

      expect(opinionRepository.update).toHaveBeenCalledTimes(1);
      expect(opinionRepository.update).toHaveBeenCalledWith(input.id, {
        ...updateInput,
        imageUrls: [...updateUrls, ...uploadUrls],
      });
    });
  });

  describe('의견 삭제 테스트', () => {
    const input = {
      id: mockOpinion.id,
    };

    it('의견이 없을 경우', async () => {
      opinionRepository.findOne.mockResolvedValue(null);

      const result = await opinionService.deleteOpinion(input, mockUser);

      expect(result.ok).toEqual(false);
      expect(typeof result.error).toBe('string');

      expect(opinionRepository.findOne).toHaveBeenCalledTimes(1);
    });

    it('의견 작성자가 아닐 경우', async () => {
      opinionRepository.findOne.mockResolvedValue({
        ...mockOpinion,
        user: { id: '2' },
      });

      const result = await opinionService.deleteOpinion(input, mockUser);

      expect(result.ok).toEqual(false);
      expect(typeof result.error).toBe('string');

      expect(opinionRepository.findOne).toHaveBeenCalledTimes(1);
    });

    it('의견이 확인 중일 경우', async () => {
      opinionRepository.findOne.mockResolvedValue({
        ...mockOpinion,
        status: OpinionStatus.READ,
      });

      const result = await opinionService.deleteOpinion(input, mockUser);

      expect(result.ok).toEqual(false);
      expect(typeof result.error).toBe('string');

      expect(opinionRepository.findOne).toHaveBeenCalledTimes(1);
    });

    it('의견 삭제', async () => {
      opinionRepository.findOne.mockResolvedValue(mockOpinion);

      const result = await opinionService.deleteOpinion(input, mockUser);

      expect(result.ok).toEqual(true);
      expect(result.error).toEqual(undefined);

      expect(opinionRepository.softDelete).toHaveBeenCalledTimes(1);
      expect(opinionRepository.softDelete).toHaveBeenCalledWith(input.id);
      expect(commentService.deleteCommentsByPostId).toHaveBeenCalledTimes(1);
      expect(commentService.deleteCommentsByPostId).toHaveBeenCalledWith(
        input.id,
      );
    });
  });

  describe('의견 상태 변경 테스트', () => {
    const input = {
      id: mockOpinion.id,
      status: OpinionStatus.READ,
    };

    it('비밀번호가 공백일 경우', async () => {
      const result = await opinionService.updateOpinionStatus({
        password: '',
        ...input,
      });

      expect(result.ok).toEqual(false);
      expect(typeof result.error).toBe('string');
    });

    it('비밀번호가 틀렸을 경우', async () => {
      const result = await opinionService.updateOpinionStatus({
        password: 'xx',
        ...input,
      });

      expect(result.ok).toEqual(false);
      expect(typeof result.error).toBe('string');
    });

    it('의견이 없을 경우', async () => {
      opinionRepository.findOne.mockResolvedValue(null);

      const result = await opinionService.updateOpinionStatus({
        password: env.PASSWORD,
        ...input,
      });

      expect(result.ok).toEqual(false);
      expect(typeof result.error).toBe('string');

      expect(opinionRepository.findOne).toHaveBeenCalledTimes(1);
    });

    it('의견 상태 변경', async () => {
      opinionRepository.findOne.mockResolvedValue(mockOpinion);

      const result = await opinionService.updateOpinionStatus({
        password: env.PASSWORD,
        ...input,
      });

      expect(result.ok).toEqual(true);
      expect(result.error).toEqual(undefined);

      expect(opinionRepository.update).toHaveBeenCalledTimes(1);
      expect(opinionRepository.update).toHaveBeenCalledWith(input.id, {
        status: input.status,
      });

      expect(notificationService.createNotification).toHaveBeenCalledTimes(1);
    });
  });
});
