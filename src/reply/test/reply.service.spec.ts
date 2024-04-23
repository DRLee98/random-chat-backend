import { getRepositoryToken } from '@nestjs/typeorm';
import { ReplyService } from '../reply.service';
import { MockRepository, mockRepository } from 'test/utils';
import { Reply } from '../entities/reply.entity';
import { Test } from '@nestjs/testing';
import { CommonService } from 'src/common/common.service';
import { mockReply, mockUser } from 'test/mockData';
import { In } from 'typeorm';

describe('ReplyService 테스트', () => {
  let replyService: ReplyService;
  let replyRepository: MockRepository<Reply>;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [
        ReplyService,
        {
          provide: getRepositoryToken(Reply),
          useValue: mockRepository(),
        },
        CommonService,
      ],
    }).compile();

    replyService = module.get<ReplyService>(ReplyService);
    replyRepository = module.get(getRepositoryToken(Reply));
  });

  it('서비스 health check', () => {
    expect(replyService).toBeDefined();
    expect(replyRepository).toBeDefined();
  });

  it('답글 카운트 테스트', async () => {
    const input = {
      commentId: '1',
    };

    replyRepository.count.mockResolvedValue(1);

    const result = await replyService.replyCount(input);

    expect(result.ok).toEqual(true);
    expect(result.error).toEqual(undefined);
    expect(result.count).toEqual(1);

    expect(replyRepository.count).toHaveBeenCalledTimes(1);
  });

  it('답글 조회 테스트', async () => {
    const input = {
      commentId: '1',
      skip: 0,
      take: 20,
    };

    replyRepository.find.mockResolvedValue([mockReply]);

    const result = await replyService.viewReplies(input);

    expect(result.ok).toEqual(true);
    expect(result.error).toEqual(undefined);
    expect(result.replies).toEqual([mockReply]);

    expect(replyRepository.find).toHaveBeenCalledTimes(1);
  });

  it('답글 생성 테스트', async () => {
    const input = {
      commentId: '1',
      text: 'test',
    };

    replyRepository.create.mockReturnValue(mockReply);
    replyRepository.save.mockResolvedValue(mockReply);

    const result = await replyService.createReply(input, mockUser);

    expect(result.ok).toEqual(true);
    expect(result.error).toEqual(undefined);
    expect(result.reply).toEqual(mockReply);

    expect(replyRepository.create).toHaveBeenCalledTimes(1);
    expect(replyRepository.create).toHaveBeenCalledWith({
      ...input,
      user: mockUser,
    });
    expect(replyRepository.save).toHaveBeenCalledTimes(1);
    expect(replyRepository.save).toHaveBeenCalledWith(mockReply);
  });

  describe('답글 수정 테스트', () => {
    const input = {
      id: '1',
      text: 'test2',
    };

    it('답글이 없을 경우', async () => {
      replyRepository.findOne.mockResolvedValue(null);

      const result = await replyService.editReply(input, mockUser);

      expect(result.ok).toEqual(false);
      expect(typeof result.error).toBe('string');

      expect(replyRepository.findOne).toHaveBeenCalledTimes(1);
    });

    it('답글 작성자가 아닐 경우', async () => {
      replyRepository.findOne.mockResolvedValue({
        ...mockReply,
        user: { id: '2' },
      });

      const result = await replyService.editReply(input, mockUser);

      expect(result.ok).toEqual(false);
      expect(typeof result.error).toBe('string');

      expect(replyRepository.findOne).toHaveBeenCalledTimes(1);
    });

    it('답글 수정', async () => {
      replyRepository.findOne.mockResolvedValue(mockReply);

      const result = await replyService.editReply(input, mockUser);

      expect(result.ok).toEqual(true);
      expect(result.error).toEqual(undefined);
      expect(result.reply).toEqual(mockReply);

      expect(replyRepository.findOne).toHaveBeenCalledTimes(1);
      expect(replyRepository.save).toHaveBeenCalledTimes(1);
      expect(replyRepository.save).toHaveBeenCalledWith({
        ...mockReply,
        text: input.text,
      });
    });
  });

  describe('답글 삭제 테스트', () => {
    const input = {
      id: '1',
    };
    it('답글이 없을 경우', async () => {
      replyRepository.findOne.mockResolvedValue(null);

      const result = await replyService.deleteReply(input, mockUser);

      expect(result.ok).toEqual(false);
      expect(typeof result.error).toBe('string');

      expect(replyRepository.findOne).toHaveBeenCalledTimes(1);
    });

    it('답글 작성자가 아닐 경우', async () => {
      replyRepository.findOne.mockResolvedValue({
        ...mockReply,
        user: { id: '2' },
      });

      const result = await replyService.deleteReply(input, mockUser);

      expect(result.ok).toEqual(false);
      expect(typeof result.error).toBe('string');

      expect(replyRepository.findOne).toHaveBeenCalledTimes(1);
    });

    it('답글 삭제', async () => {
      replyRepository.findOne.mockResolvedValue(mockReply);

      const result = await replyService.deleteReply(input, mockUser);

      expect(result.ok).toEqual(true);
      expect(result.error).toEqual(undefined);

      expect(replyRepository.findOne).toHaveBeenCalledTimes(1);
      expect(replyRepository.softDelete).toHaveBeenCalledTimes(1);
      expect(replyRepository.softDelete).toHaveBeenCalledWith(mockReply.id);
    });

    it('댓글 삭제로 인한 답글 삭제', async () => {
      const result = await replyService.deleteRepliesByCommentId('xx');

      expect(result).toEqual(true);

      expect(replyRepository.softDelete).toHaveBeenCalledTimes(1);
      expect(replyRepository.softDelete).toHaveBeenCalledWith({
        comment: {
          id: 'xx',
        },
      });
    });

    it('댓글 삭제로 인한 답글 삭제 (여러개)', async () => {
      const result = await replyService.deleteRepliesByCommentIds(['xx']);

      expect(result).toEqual(true);

      expect(replyRepository.softDelete).toHaveBeenCalledTimes(1);
      expect(replyRepository.softDelete).toHaveBeenCalledWith({
        comment: {
          id: In(['xx']),
        },
      });
    });
  });
});
