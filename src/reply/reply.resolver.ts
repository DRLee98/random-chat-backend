import { Args, Mutation, Query, Resolver } from '@nestjs/graphql';

import { ReplyService } from './reply.service';

import { User } from 'src/user/entities/user.entity';
import { LoggedInUser } from 'src/user/user.decorator';

import { ReplyCountInput, ReplyCountOutput } from './dtos/reply-count.dto';
import { ViewRepliesInput, ViewRepliesOutput } from './dtos/view-replies.dto';
import { CreateReplyInput, CreateReplyOutput } from './dtos/create-reply.dto';
import { EditReplyInput, EditReplyOutput } from './dtos/edit-reply.dto';
import { DeleteReplyInput, DeleteReplyOutput } from './dtos/delete-reply.dto';

@Resolver()
export class ReplyResolver {
  constructor(private readonly replyService: ReplyService) {}

  @Query(() => ReplyCountOutput)
  async replyCount(
    @Args('input') input: ReplyCountInput,
  ): Promise<ReplyCountOutput> {
    return this.replyService.replyCount(input);
  }

  @Query(() => ViewRepliesOutput)
  async viewReplies(
    @Args('input') input: ViewRepliesInput,
  ): Promise<ViewRepliesOutput> {
    return this.replyService.viewReplies(input);
  }

  @Mutation(() => CreateReplyOutput)
  async createReply(
    @Args('input') input: CreateReplyInput,
    @LoggedInUser() user: User,
  ): Promise<CreateReplyOutput> {
    return this.replyService.createReply(input, user);
  }

  @Mutation(() => EditReplyOutput)
  async editReply(
    @Args('input') input: EditReplyInput,
    @LoggedInUser() user: User,
  ): Promise<EditReplyOutput> {
    return this.replyService.editReply(input, user);
  }

  @Mutation(() => DeleteReplyOutput)
  async deleteReply(
    @Args('input') input: DeleteReplyInput,
    @LoggedInUser() user: User,
  ): Promise<DeleteReplyOutput> {
    return this.replyService.deleteReply(input, user);
  }
}
