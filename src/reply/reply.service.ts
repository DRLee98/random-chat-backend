import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { CommonService } from 'src/common/common.service';

import { Reply } from './entities/reply.entity';
import { User } from 'src/user/entities/user.entity';

import { ReplyCountInput, ReplyCountOutput } from './dtos/reply-count.dto';
import { ViewRepliesInput, ViewRepliesOutput } from './dtos/view-replies.dto';
import { CreateReplyInput, CreateReplyOutput } from './dtos/create-reply.dto';
import { EditReplyInput, EditReplyOutput } from './dtos/edit-reply.dto';
import { DeleteReplyInput, DeleteReplyOutput } from './dtos/delete-reply.dto';

@Injectable()
export class ReplyService {
  constructor(
    @InjectRepository(Reply)
    private readonly replyRepository: Repository<Reply>,
    private readonly commonService: CommonService,
  ) {}

  async replyCount(input: ReplyCountInput): Promise<ReplyCountOutput> {
    try {
      const count = await this.replyRepository.count({
        where: {
          comment: {
            id: input.commentId,
          },
        },
      });

      return {
        ok: true,
        count,
      };
    } catch (error) {
      return this.commonService.error(error);
    }
  }

  async viewReplies({
    commentId,
    ...input
  }: ViewRepliesInput): Promise<ViewRepliesOutput> {
    try {
      const replies = await this.replyRepository.find({
        select: {
          user: {
            id: true,
            nickname: true,
            profileUrl: true,
          },
        },
        where: {
          comment: {
            id: commentId,
          },
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
        this.replyRepository,
        {
          comment: {
            id: commentId,
          },
        },
      );

      return {
        replies,
        ...output,
      };
    } catch (error) {
      return this.commonService.error(error);
    }
  }

  async createReply(
    input: CreateReplyInput,
    user: User,
  ): Promise<CreateReplyOutput> {
    try {
      const reply = this.replyRepository.create({
        ...input,
        user,
      });

      await this.replyRepository.save(reply);

      return {
        ok: true,
        reply,
      };
    } catch (error) {
      return this.commonService.error(error);
    }
  }

  async editReply(
    { id, text }: EditReplyInput,
    user: User,
  ): Promise<EditReplyOutput> {
    try {
      const reply = await this.replyRepository.findOne({
        where: {
          id,
        },
        relations: {
          user: true,
        },
      });

      if (!reply) return this.commonService.error('답글을 찾을 수 없습니다.');
      if (reply.user.id !== user.id)
        return this.commonService.error('답글을 수정할 권한이 없습니다.');

      reply.text = text;
      await this.replyRepository.save(reply);

      return {
        ok: true,
        reply,
      };
    } catch (error) {
      return this.commonService.error(error);
    }
  }

  async deleteReply(
    { id }: DeleteReplyInput,
    user: User,
  ): Promise<DeleteReplyOutput> {
    try {
      const reply = await this.replyRepository.findOne({
        where: {
          id,
        },
        relations: {
          user: true,
        },
      });

      if (!reply) return this.commonService.error('답글을 찾을 수 없습니다.');
      if (reply.user.id !== user.id)
        return this.commonService.error('답글을 수정할 권한이 없습니다.');

      await this.replyRepository.softDelete(reply.id);

      return {
        ok: true,
      };
    } catch (error) {
      return this.commonService.error(error);
    }
  }
}
