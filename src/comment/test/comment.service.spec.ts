import { Test } from '@nestjs/testing';
import { CommentService } from '../comment.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { MockRepository, MockService, mockRepository } from 'test/utils';
import { CommonService } from 'src/common/common.service';
import { mockComment, mockUser } from 'test/mockData';
import { Comment } from '../entities/comment.entity';
import { ReplyService } from 'src/reply/reply.service';
import { PUB_SUB } from 'src/common/common.constants';

const mockReplyService = () => ({
  deleteRepliesByCommentId: jest.fn(),
  deleteRepliesByCommentIds: jest.fn(),
});

const mockPubSub = () => ({
  publish: jest.fn(),
});

describe('CommentService 테스트', () => {
  let commentService: CommentService;
  let commentRepository: MockRepository<Comment>;
  let replyService: MockService<ReplyService>;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [
        CommentService,
        {
          provide: getRepositoryToken(Comment),
          useValue: mockRepository(),
        },
        {
          provide: ReplyService,
          useValue: mockReplyService(),
        },
        CommonService,
        { provide: PUB_SUB, useValue: mockPubSub() },
      ],
    }).compile();

    commentService = module.get<CommentService>(CommentService);
    commentRepository = module.get(getRepositoryToken(Comment));
    replyService = module.get(ReplyService);
  });

  it('서비스 health check ', () => {
    expect(commentService).toBeDefined();
    expect(commentRepository).toBeDefined();
    expect(replyService).toBeDefined();
  });

  it('댓글 카운트 테스트', async () => {
    const input = {
      postId: '1',
    };

    commentRepository.count.mockResolvedValue(1);

    const result = await commentService.commentCount(input);

    expect(result.ok).toEqual(true);
    expect(result.error).toEqual(undefined);
    expect(result.count).toEqual(1);

    expect(commentRepository.count).toHaveBeenCalledTimes(1);
  });

  it('댓글 조회 테스트', async () => {
    const input = {
      postId: '1',
      skip: 0,
      take: 20,
    };

    commentRepository.find.mockResolvedValue([mockComment]);

    const result = await commentService.viewComments(input);

    expect(result.ok).toEqual(true);
    expect(result.error).toEqual(undefined);
    expect(result.comments).toEqual([mockComment]);

    expect(commentRepository.find).toHaveBeenCalledTimes(1);
  });

  it('댓글 생성 테스트', async () => {
    const input = {
      postId: '1',
      text: 'test',
    };

    commentRepository.create.mockReturnValue(mockComment);
    commentRepository.save.mockResolvedValue(mockComment);

    const result = await commentService.createComment(input, mockUser);

    expect(result.ok).toEqual(true);
    expect(result.error).toEqual(undefined);
    expect(result.comment).toEqual(mockComment);

    expect(commentRepository.create).toHaveBeenCalledTimes(1);
    expect(commentRepository.create).toHaveBeenCalledWith({
      ...input,
      user: mockUser,
    });
    expect(commentRepository.save).toHaveBeenCalledTimes(1);
    expect(commentRepository.save).toHaveBeenCalledWith(mockComment);
  });

  describe('댓글 수정 테스트', () => {
    const input = {
      id: '1',
      text: 'test2',
    };
    it('댓글이 없을 경우', async () => {
      commentRepository.findOne.mockResolvedValue(null);

      const result = await commentService.editComment(input, mockUser);

      expect(result.ok).toEqual(false);
      expect(typeof result.error).toBe('string');

      expect(commentRepository.findOne).toHaveBeenCalledTimes(1);
    });

    it('댓글 작성자가 아닐 경우', async () => {
      commentRepository.findOne.mockResolvedValue({
        ...mockComment,
        user: { id: '2' },
      });

      const result = await commentService.editComment(input, mockUser);

      expect(result.ok).toEqual(false);
      expect(typeof result.error).toBe('string');

      expect(commentRepository.findOne).toHaveBeenCalledTimes(1);
    });

    it('댓글 수정', async () => {
      commentRepository.findOne.mockResolvedValue(mockComment);

      const result = await commentService.editComment(input, mockUser);

      expect(result.ok).toEqual(true);
      expect(result.error).toEqual(undefined);
      expect(result.comment).toEqual(mockComment);

      expect(commentRepository.findOne).toHaveBeenCalledTimes(1);
      expect(commentRepository.save).toHaveBeenCalledTimes(1);
      expect(commentRepository.save).toHaveBeenCalledWith({
        ...mockComment,
        text: input.text,
      });
    });
  });

  describe('댓글 삭제 테스트', () => {
    const input = {
      id: '1',
    };
    it('댓글이 없을 경우', async () => {
      commentRepository.findOne.mockResolvedValue(null);

      const result = await commentService.deleteComment(input, mockUser);

      expect(result.ok).toEqual(false);
      expect(typeof result.error).toBe('string');

      expect(commentRepository.findOne).toHaveBeenCalledTimes(1);
    });

    it('댓글 작성자가 아닐 경우', async () => {
      commentRepository.findOne.mockResolvedValue({
        ...mockComment,
        user: { id: '2' },
      });

      const result = await commentService.deleteComment(input, mockUser);

      expect(result.ok).toEqual(false);
      expect(typeof result.error).toBe('string');

      expect(commentRepository.findOne).toHaveBeenCalledTimes(1);
    });

    it('댓글 삭제', async () => {
      commentRepository.findOne.mockResolvedValue(mockComment);

      const result = await commentService.deleteComment(input, mockUser);

      expect(result.ok).toEqual(true);
      expect(result.error).toEqual(undefined);

      expect(commentRepository.findOne).toHaveBeenCalledTimes(1);
      expect(commentRepository.softDelete).toHaveBeenCalledTimes(1);
      expect(commentRepository.softDelete).toHaveBeenCalledWith(input.id);

      expect(replyService.deleteRepliesByCommentId).toHaveBeenCalledTimes(1);
      expect(replyService.deleteRepliesByCommentId).toHaveBeenCalledWith(
        input.id,
      );
    });

    it('게시글 삭제로 인한 댓글 삭제', async () => {
      commentRepository.find.mockResolvedValue([mockComment]);

      const result = await commentService.deleteCommentsByPostId('xx');

      expect(result).toEqual(true);

      expect(commentRepository.find).toHaveBeenCalledTimes(1);
      expect(commentRepository.softDelete).toHaveBeenCalledTimes(1);
      expect(commentRepository.softDelete).toHaveBeenCalledWith([
        mockComment.id,
      ]);

      expect(replyService.deleteRepliesByCommentIds).toHaveBeenCalledTimes(1);
      expect(replyService.deleteRepliesByCommentIds).toHaveBeenCalledWith([
        mockComment.id,
      ]);
    });
  });
});
