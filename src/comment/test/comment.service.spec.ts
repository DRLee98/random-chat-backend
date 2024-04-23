import { Test } from '@nestjs/testing';
import { CommentService } from '../comment.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { MockRepository, mockRepository } from 'test/utils';
import { CommonService } from 'src/common/common.service';
import { mockComment, mockUser } from 'test/mockData';
import { Comment } from '../entities/comment.entity';

describe('CommentService 테스트', () => {
  let commentService: CommentService;
  let commentRepository: MockRepository<Comment>;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [
        CommentService,
        {
          provide: getRepositoryToken(Comment),
          useValue: mockRepository(),
        },
        CommonService,
      ],
    }).compile();

    commentService = module.get<CommentService>(CommentService);
    commentRepository = module.get(getRepositoryToken(Comment));
  });

  it('서비스 health check ', () => {
    expect(commentService).toBeDefined();
    expect(commentRepository).toBeDefined();
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

    it('댓글 수정 성공', async () => {
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

    it('댓글 삭제 성공', async () => {
      commentRepository.findOne.mockResolvedValue(mockComment);

      const result = await commentService.deleteComment(input, mockUser);

      expect(result.ok).toEqual(true);
      expect(result.error).toEqual(undefined);

      expect(commentRepository.findOne).toHaveBeenCalledTimes(1);
      expect(commentRepository.softDelete).toHaveBeenCalledTimes(1);
      expect(commentRepository.softDelete).toHaveBeenCalledWith(input.id);
    });
  });
});
