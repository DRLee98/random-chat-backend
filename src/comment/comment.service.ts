import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { CommonService } from 'src/common/common.service';

import { Comment } from './entities/comment.entity';
import { User } from 'src/user/entities/user.entity';

import {
  ViewCommentsInput,
  ViewCommentsOutput,
} from './dtos/view-comments.dto';
import {
  CreateCommentInput,
  CreateCommentOutput,
} from './dtos/create-comment.dto';
import { EditCommentInput, EditCommentOutput } from './dtos/edit-comment.dto';
import {
  DeleteCommentInput,
  DeleteCommentOutput,
} from './dtos/delete-comment.dto';

@Injectable()
export class CommentService {
  constructor(
    @InjectRepository(Comment)
    private readonly commentRepository: Repository<Comment>,
    private readonly commonService: CommonService,
  ) {}

  async viewComments({
    postId,
    ...input
  }: ViewCommentsInput): Promise<ViewCommentsOutput> {
    try {
      const comments = await this.commentRepository.find({
        select: {
          user: {
            id: true,
            nickname: true,
            profileUrl: true,
          },
        },
        where: {
          postId,
        },
        relations: {
          user: true,
        },
        order: {
          createdAt: 'DESC',
        },
        ...this.commonService.paginationOption(input),
      });

      const output = await this.commonService.paginationOutput(
        input,
        this.commentRepository,
        {
          postId,
        },
      );

      return {
        comments,
        ...output,
      };
    } catch (error) {
      return this.commonService.error(error);
    }
  }

  async createComment(
    input: CreateCommentInput,
    user: User,
  ): Promise<CreateCommentOutput> {
    try {
      const comment = this.commentRepository.create({
        ...input,
        user,
      });

      await this.commentRepository.save(comment);

      return {
        ok: true,
        comment,
      };
    } catch (error) {
      return this.commonService.error(error);
    }
  }

  async editComment(
    { id, text }: EditCommentInput,
    user: User,
  ): Promise<EditCommentOutput> {
    try {
      const comment = await this.commentRepository.findOne({
        where: {
          id,
        },
        relations: {
          user: true,
        },
      });

      if (!comment) return this.commonService.error('댓글을 찾을 수 없습니다.');

      if (comment.user.id !== user.id)
        return this.commonService.error('댓글을 수정할 권한이 없습니다.');

      comment.text = text;
      await this.commentRepository.save(comment);

      return {
        ok: true,
        comment,
      };
    } catch (error) {
      return this.commonService.error(error);
    }
  }

  async deleteComment(
    { id }: DeleteCommentInput,
    user: User,
  ): Promise<DeleteCommentOutput> {
    try {
      const comment = await this.commentRepository.findOne({
        where: {
          id,
        },
        relations: {
          user: true,
        },
      });

      if (!comment) return this.commonService.error('댓글을 찾을 수 없습니다.');

      if (comment.user.id !== user.id)
        return this.commonService.error('댓글을 수정할 권한이 없습니다.');

      await this.commentRepository.softDelete(id);

      return {
        ok: true,
      };
    } catch (error) {
      return this.commonService.error(error);
    }
  }
}
